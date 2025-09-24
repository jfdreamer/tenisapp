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
    playerNames: ["", ""],
    contactInfo: "",
  })

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

    for (let hour = startHour; hour < endHour; hour += 1.5) {
      const wholeHour = Math.floor(hour)
      const minutes = (hour % 1) * 60
      const startTime = `${wholeHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      const endHourCalc = hour + 1.5
      const endWholeHour = Math.floor(endHourCalc)
      const endMinutes = (endHourCalc % 1) * 60
      const endTime = `${endWholeHour.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`

      if (endHourCalc <= (court.has_lights ? 22 : 20)) {
        slots.push(`${startTime}-${endTime}`)
      }
    }

    return slots
  }

  const loadReservations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("court_id", court.id)
        .eq("reservation_date", selectedDate)
        .order("start_time")

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error("Error loading reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateAvailableSlots = () => {
    const allSlots = generateTimeSlots()
    const occupiedSlots = reservations.map((r) => `${r.start_time}-${r.end_time}`)

    const available = allSlots.filter((slot) => {
      const [startTime] = slot.split("-")

      // Verificar si el slot está ocupado
      if (occupiedSlots.includes(slot)) return false

      // Verificar solapamientos con reservas existentes
      const slotStart = timeToMinutes(startTime)
      const slotEnd = slotStart + 90 // 1.5 horas

      for (const reservation of reservations) {
        const reservationStart = timeToMinutes(reservation.start_time)
        const reservationEnd = timeToMinutes(reservation.end_time)

        // Verificar solapamiento
        if (slotStart < reservationEnd && slotEnd > reservationStart) {
          return false
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

      const playerCount = reservationForm.gameType === "singles" ? 1 : 2
      const validPlayers = reservationForm.playerNames.slice(0, playerCount).filter((name) => name.trim())

      if (validPlayers.length !== playerCount) {
        setError(`Debes ingresar ${playerCount} ${playerCount === 1 ? "apellido" : "apellidos"}`)
        return
      }

      const [startTime, endTime] = selectedSlot.split("-")
      const pricePerPlayer = reservationForm.gameType === "singles" ? pricing.singles_price : pricing.doubles_price
      const totalCost = pricePerPlayer * playerCount

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
        playerNames: ["", ""],
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
                {court.has_lights ? "22:00" : "20:00"}
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
                  Disponibilidad
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
                        const isOccupied = reservations.some((r) => `${r.start_time}-${r.end_time}` === slot)
                        const reservation = reservations.find((r) => `${r.start_time}-${r.end_time}` === slot)

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
            {/* Precios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Precios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Singles (1 jugador):</span>
                    <span className="font-bold">${pricing.singles_price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dobles (2 jugadores):</span>
                    <span className="font-bold">${pricing.doubles_price.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Turnos de 1 hora y 30 minutos</li>
                  <li>• Reserva inmediata y confirmada</li>
                  <li>• Pago en efectivo al llegar</li>
                  <li>• Llega 10 minutos antes</li>
                  <li>• Notificación automática al club</li>
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
                      <SelectItem value="singles">Singles (1 jugador)</SelectItem>
                      <SelectItem value="doubles">Dobles (2 jugadores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reservationForm.gameType && (
                  <>
                    <div>
                      <Label>Apellidos de Jugadores</Label>
                      {(reservationForm.gameType === "singles" ? [0] : [0, 1]).map((index) => (
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
                        <span>Costo Total:</span>
                        <span className="text-xl font-bold text-green-600">
                          $
                          {(reservationForm.gameType === "singles"
                            ? pricing.singles_price
                            : pricing.doubles_price * 2
                          ).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Pago en efectivo al llegar</p>
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
