"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Clock, Users, DollarSign, CheckCircle, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Court {
  id: number
  name: string
  has_lights: boolean
  is_active: boolean
}

interface Pricing {
  singles_price: number
  doubles_price: number
  admin_email?: string
}

interface Reservation {
  id: string
  start_time: string
  end_time: string
  game_type: string
  player_names: string[]
  total_cost: number
}

interface CourtCalendarProps {
  court: Court
  pricing: Pricing
  onBack: () => void
}

export function CourtCalendar({ court, pricing, onBack }: CourtCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [reservationForm, setReservationForm] = useState({
    gameType: "",
    playerNames: ["", "", "", ""],
    contactInfo: "",
  })

  const loadReservations = async () => {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .eq("court_id", court.id)
      .eq("reservation_date", selectedDate)

    if (error) {
      console.error("Error loading reservations:", error)
    } else {
      setReservations(data || [])
    }
  }

  useEffect(() => {
    loadReservations()
  }, [selectedDate, court.id])

  useEffect(() => {
    generateAvailableSlots()
  }, [reservations, court])

  const generateTimeSlots = () => {
    const slots = []
    const startHour = 7
    const endHour = court.has_lights ? 22 : 20

    const selectedDateObj = new Date(selectedDate + "T00:00:00")
    const dayOfWeek = selectedDateObj.getDay() // 0 = domingo, 6 = sábado
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Generar slots cada 30 minutos
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const currentTime = hour + minutes / 60

        // Días de semana: Singles 1.5h, Dobles 2h
        // Fines de semana: Singles 1h, Dobles 1.5h
        const singlesDuration = isWeekend ? 1 : 1.5
        const doublesDuration = isWeekend ? 1.5 : 2

        // Para mostrar slots, usamos la duración máxima posible
        const maxDuration = Math.max(singlesDuration, doublesDuration)
        const endTime = currentTime + maxDuration

        // Verificar que el turno termine antes del horario límite
        if (endTime <= (court.has_lights ? 22 : 20)) {
          const startTimeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

          const endHourCalc = Math.floor(endTime)
          const endMinutesCalc = (endTime % 1) * 60
          const endTimeStr = `${endHourCalc.toString().padStart(2, "0")}:${endMinutesCalc.toString().padStart(2, "0")}`

          slots.push(`${startTimeStr}-${endTimeStr}`)
        }
      }
    }

    return slots
  }

  const generateAvailableSlots = () => {
    const allSlots = generateTimeSlots()

    const available = allSlots.filter((slot) => {
      const [startTime] = slot.split("-")
      const slotStart = timeToMinutes(startTime)

      const selectedDateObj = new Date(selectedDate + "T00:00:00")
      const dayOfWeek = selectedDateObj.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      const singlesDuration = isWeekend ? 60 : 90 // en minutos
      const doublesDuration = isWeekend ? 90 : 120 // en minutos

      const singlesEnd = slotStart + singlesDuration
      const doublesEnd = slotStart + doublesDuration

      // Verificar conflictos con reservas existentes para ambos tipos
      for (const reservation of reservations) {
        const reservationStart = timeToMinutes(reservation.start_time)
        const reservationEnd = timeToMinutes(reservation.end_time)

        // Verificar solapamiento para singles
        if (slotStart < reservationEnd && singlesEnd > reservationStart) {
          // Si hay conflicto con singles, verificar si al menos dobles puede funcionar
          if (slotStart < reservationEnd && doublesEnd > reservationStart) {
            return false // Ambos tipos tienen conflicto
          }
        }
      }

      return true
    })

    setAvailableSlots(available)
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  const sendNotificationEmail = async (reservationData: any) => {
    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservation: reservationData,
          court: court,
          adminEmail: pricing.admin_email || "admin@belgranotennis.com",
        }),
      })

      if (!response.ok) {
        console.error("Error sending notification email")
      }
    } catch (error) {
      console.error("Error sending notification:", error)
    }
  }

  const handleReservation = async () => {
    try {
      setLoading(true)
      setError("")
      setMessage("")

      if (!selectedSlot || !reservationForm.gameType || !reservationForm.contactInfo) {
        setError("Todos los campos son obligatorios")
        return
      }

      const playerCount = reservationForm.gameType === "singles" ? 2 : 4
      const validPlayers = reservationForm.playerNames.slice(0, playerCount).filter((name) => name.trim())

      if (validPlayers.length !== playerCount) {
        setError(`Debes ingresar ${playerCount} ${playerCount === 1 ? "apellido" : "apellidos"}`)
        return
      }

      const [startTime] = selectedSlot.split("-")

      const selectedDateObj = new Date(selectedDate + "T00:00:00")
      const dayOfWeek = selectedDateObj.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      const duration =
        reservationForm.gameType === "singles"
          ? isWeekend
            ? 1
            : 1.5 // Singles: 1h fines de semana, 1.5h días de semana
          : isWeekend
            ? 1.5
            : 2 // Dobles: 1.5h fines de semana, 2h días de semana

      const startMinutes = timeToMinutes(startTime)
      const endMinutes = startMinutes + duration * 60
      const endHour = Math.floor(endMinutes / 60)
      const endMin = endMinutes % 60
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`

      const totalCost = reservationForm.gameType === "singles" ? 10000 : 12000

      const reservationData = {
        court_id: court.id,
        reservation_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        game_type: reservationForm.gameType,
        player_names: validPlayers,
        total_cost: totalCost,
        contact_info: reservationForm.contactInfo,
      }

      const { error: insertError } = await supabase.from("reservations").insert([reservationData])

      if (insertError) throw insertError

      // Enviar notificación por email al admin
      await sendNotificationEmail(reservationData)

      setMessage("¡Reserva confirmada exitosamente! Se ha enviado una notificación al club.")
      setShowReservationForm(false)
      setSelectedSlot("")
      setReservationForm({
        gameType: "",
        playerNames: ["", "", "", ""],
        contactInfo: "",
      })
      loadReservations()
    } catch (error: any) {
      console.error("Error creating reservation:", error)
      setError(error.message || "Error al crear la reserva")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isSlotOccupied = (slot: string) => {
    return reservations.some((r) => `${r.start_time}-${r.end_time}` === slot)
  }

  const getReservationForSlot = (slot: string) => {
    return reservations.find((r) => `${r.start_time}-${r.end_time}` === slot)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="outline" onClick={onBack} className="mr-4 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{court.name}</h1>
              <p className="text-sm text-gray-600">
                {court.has_lights ? "Con iluminación" : "Sin iluminación"} • Horarios: 7:00 -{" "}
                {court.has_lights ? "22:00" : "20:00"} • Turnos cada 30 min
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendario */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Disponibilidad - Turnos cada 30 minutos
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Label htmlFor="date">Fecha:</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-auto"
                  />
                </div>
                <p className="text-sm text-gray-600">{formatDate(selectedDate)}</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {generateTimeSlots().map((slot) => {
                        const isAvailable = availableSlots.includes(slot)
                        const isOccupied = isSlotOccupied(slot)
                        const reservation = getReservationForSlot(slot)

                        return (
                          <div key={slot} className="relative">
                            <Button
                              variant={isAvailable ? "outline" : "secondary"}
                              className={`w-full h-auto p-3 ${
                                isAvailable ? "hover:bg-green-50 border-green-200" : "bg-gray-100 cursor-not-allowed"
                              }`}
                              disabled={!isAvailable}
                              onClick={() => {
                                setSelectedSlot(slot)
                                setShowReservationForm(true)
                              }}
                            >
                              <div className="text-center">
                                <div className="font-medium">{slot}</div>
                                {isOccupied && reservation && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {reservation.game_type === "singles" ? "Singles" : "Dobles"} -
                                    {reservation.player_names.join(", ")}
                                  </div>
                                )}
                                {isAvailable && <div className="text-xs text-green-600 mt-1">Disponible</div>}
                              </div>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">
                  {pricing.admin_email || "Consulta precios y promociones en recepción"}
                </div>
              </CardContent>
            </Card>

            {/* Información de turnos actualizada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Duración de Turnos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>
                    • <strong>Días de semana:</strong>
                  </li>
                  <li className="ml-4">- Singles: 1h 30min</li>
                  <li className="ml-4">- Dobles: 2h</li>
                  <li>
                    • <strong>Fines de semana:</strong>
                  </li>
                  <li className="ml-4">- Singles: 1h</li>
                  <li className="ml-4">- Dobles: 1h 30min</li>
                  <li>• Turnos cada 30 minutos</li>
                  <li>• Reserva inmediata y confirmada</li>
                  <li>• Llega 10 minutos antes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Formulario de reserva */}
        {showReservationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Reservar {selectedSlot}</CardTitle>
                <p className="text-sm text-gray-600">
                  {court.name} - {formatDate(selectedDate)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gameType">Tipo de Juego</Label>
                  <Select
                    value={reservationForm.gameType}
                    onValueChange={(value) => setReservationForm({ ...reservationForm, gameType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo de juego" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="singles">Singles (2 jugadores)</SelectItem>
                      <SelectItem value="doubles">Dobles (4 jugadores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reservationForm.gameType && (
                  <>
                    <div>
                      <Label>Apellidos de Jugadores</Label>
                      {(reservationForm.gameType === "singles" ? [0, 1] : [0, 1, 2, 3]).map((index) => (
                        <Input
                          key={index}
                          placeholder={`Apellido jugador ${index + 1}`}
                          value={reservationForm.playerNames[index] || ""}
                          onChange={(e) => {
                            const newNames = [...reservationForm.playerNames]
                            newNames[index] = e.target.value
                            setReservationForm({ ...reservationForm, playerNames: newNames })
                          }}
                          className="mt-2"
                        />
                      ))}
                    </div>

                    <div>
                      <Label htmlFor="contact">Teléfono de Contacto</Label>
                      <Input
                        id="contact"
                        placeholder="Ej: +54 9 11 1234-5678"
                        value={reservationForm.contactInfo}
                        onChange={(e) => setReservationForm({ ...reservationForm, contactInfo: e.target.value })}
                      />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>Duración:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {(() => {
                            const selectedDateObj = new Date(selectedDate + "T00:00:00")
                            const dayOfWeek = selectedDateObj.getDay()
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                            if (reservationForm.gameType === "singles") {
                              return isWeekend ? "1 hora" : "1h 30min"
                            } else {
                              return isWeekend ? "1h 30min" : "2 horas"
                            }
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Consulta precios en recepción</p>
                    </div>

                    <Alert className="border-blue-200 bg-blue-50">
                      <Mail className="h-4 w-4" />
                      <AlertDescription className="text-blue-800">
                        Tu reserva será confirmada inmediatamente y se enviará una notificación automática al club.
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReservationForm(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReservation}
                    disabled={loading || !reservationForm.gameType || !reservationForm.contactInfo}
                    className="flex-1"
                  >
                    {loading ? "Reservando..." : "Confirmar Reserva"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
