"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Calendar, BarChart3, Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Player } from "@/types/tennis"
import { supabase } from "@/lib/supabase"

interface ProfileEditorProps {
  currentPlayer: Player
  onBack: () => void
  onPlayerUpdate: (player: Player) => void
}

export function ProfileEditor({ currentPlayer, onBack, onPlayerUpdate }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    first_name: currentPlayer.first_name,
    last_name: currentPlayer.last_name,
    email: currentPlayer.email,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [editingAvailability, setEditingAvailability] = useState(false)
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  const timeSlots = [
    { label: "08:00-10:00", start: "08:00:00", end: "10:00:00" },
    { label: "10:00-12:00", start: "10:00:00", end: "12:00:00" },
    { label: "12:00-14:00", start: "12:00:00", end: "14:00:00" },
    { label: "14:00-16:00", start: "14:00:00", end: "16:00:00" },
    { label: "16:00-18:00", start: "16:00:00", end: "18:00:00" },
    { label: "18:00-20:00", start: "18:00:00", end: "20:00:00" },
    { label: "20:00-22:00", start: "20:00:00", end: "22:00:00" },
  ]

  const days = [
    { name: "Lunes", index: 1 },
    { name: "Martes", index: 2 },
    { name: "Miércoles", index: 3 },
    { name: "Jueves", index: 4 },
    { name: "Viernes", index: 5 },
    { name: "Sábado", index: 6 },
    { name: "Domingo", index: 0 },
  ]

  useEffect(() => {
    loadAvailability()
  }, [currentPlayer])

  const loadAvailability = async () => {
    try {
      setLoadingAvailability(true)
      const { data, error } = await supabase.from("availability").select("*").eq("player_id", currentPlayer.id)

      if (error) {
        console.error("Error loading availability:", error)
        return
      }

      if (data) {
        const availabilityMap: { [key: string]: boolean } = {}
        data.forEach((slot) => {
          // Crear clave usando day_of_week y los tiempos
          const key = `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`
          availabilityMap[key] = true
        })
        setAvailability(availabilityMap)
      }
    } catch (error) {
      console.error("Error loading availability:", error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const { data, error } = await supabase
        .from("players")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
        })
        .eq("id", currentPlayer.id)
        .select()
        .single()

      if (error) throw error

      onPlayerUpdate(data)
      setMessage("Perfil actualizado correctamente")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message || "Error al actualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  const handleAvailabilityChange = (dayIndex: number, timeSlot: any, checked: boolean) => {
    const key = `${dayIndex}-${timeSlot.start}-${timeSlot.end}`
    setAvailability((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleSaveAvailability = async () => {
    setLoadingAvailability(true)
    setMessage("")
    setError("")

    try {
      // Primero eliminar disponibilidad existente
      const { error: deleteError } = await supabase.from("availability").delete().eq("player_id", currentPlayer.id)

      if (deleteError) {
        console.error("Error deleting availability:", deleteError)
        throw new Error(`Error al eliminar disponibilidad: ${deleteError.message}`)
      }

      // Preparar datos para insertar
      const availabilityData = Object.entries(availability)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([key, _]) => {
          const [dayIndex, startTime, endTime] = key.split("-")

          // Validar que los datos estén completos
          if (!dayIndex || !startTime || !endTime) {
            throw new Error("Datos de disponibilidad incompletos")
          }

          return {
            player_id: currentPlayer.id,
            day_of_week: Number.parseInt(dayIndex),
            start_time: startTime,
            end_time: endTime,
          }
        })

      console.log("Datos a insertar:", availabilityData)

      if (availabilityData.length > 0) {
        const { error: insertError } = await supabase.from("availability").insert(availabilityData)

        if (insertError) {
          console.error("Error inserting availability:", insertError)
          throw new Error(`Error al guardar disponibilidad: ${insertError.message}`)
        }
      }

      setMessage("Disponibilidad guardada correctamente")
      setEditingAvailability(false)
    } catch (error: any) {
      console.error("Error saving availability:", error)
      setError(error.message || "Error al guardar disponibilidad")
    } finally {
      setLoadingAvailability(false)
    }
  }

  // Agrupar disponibilidad por día para mostrarla
  const availabilityByDay = days.reduce(
    (acc, day) => {
      const slots = timeSlots.filter((slot) => {
        const key = `${day.index}-${slot.start}-${slot.end}`
        return availability[key]
      })

      if (slots.length > 0) {
        acc.push({
          day: day.name,
          slots: slots.map((s) => s.label),
        })
      }

      return acc
    },
    [] as { day: string; slots: string[] }[],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👤 Mi Perfil</h1>
          <p className="text-gray-600">Gestiona tu información personal</p>
        </div>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <p className="text-sm text-gray-600">Actualiza tu información básica</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">El email no se puede cambiar</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ranking">Posición en Ranking</Label>
              <Input id="ranking" value={`#${currentPlayer.ranking_position}`} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">La posición se actualiza automáticamente con los desafíos</p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mi Disponibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mi Disponibilidad
          </CardTitle>
          <p className="text-sm text-gray-600">Tus horarios disponibles para jugar</p>
        </CardHeader>
        <CardContent>
          {!editingAvailability ? (
            <>
              {availabilityByDay.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No has configurado tu disponibilidad aún</p>
              ) : (
                <div className="space-y-4">
                  {availabilityByDay.map((dayAvailability) => (
                    <div key={dayAvailability.day}>
                      <h4 className="font-medium text-gray-900 mb-2">{dayAvailability.day}</h4>
                      <div className="flex flex-wrap gap-2">
                        {dayAvailability.slots.map((slot) => (
                          <span key={slot} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="mt-4" onClick={() => setEditingAvailability(true)}>
                Editar Horarios
              </Button>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-2 border-b">Día</th>
                      {timeSlots.map((slot) => (
                        <th key={slot.label} className="text-center p-2 border-b text-xs">
                          {slot.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map((day) => (
                      <tr key={day.name}>
                        <td className="p-2 border-b font-medium">{day.name}</td>
                        {timeSlots.map((timeSlot) => {
                          const key = `${day.index}-${timeSlot.start}-${timeSlot.end}`
                          return (
                            <td key={timeSlot.label} className="text-center p-2 border-b">
                              <Checkbox
                                checked={availability[key] || false}
                                onCheckedChange={(checked) =>
                                  handleAvailabilityChange(day.index, timeSlot, checked as boolean)
                                }
                              />
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={handleSaveAvailability} disabled={loadingAvailability} className="flex-1">
                  {loadingAvailability ? "Guardando..." : "Guardar Disponibilidad"}
                </Button>
                <Button variant="outline" onClick={() => setEditingAvailability(false)}>
                  Cancelar
                </Button>
              </div>

              <Card className="bg-blue-50 border-blue-200 mt-4">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>• Marca todas las casillas donde puedas jugar</p>
                      <p>• Esta información se usará para encontrar horarios compatibles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">#{currentPlayer.ranking_position}</p>
              <p className="text-sm text-gray-600">Ranking</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600">Partidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">0</p>
              <p className="text-sm text-gray-600">Victorias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{availabilityByDay.length}</p>
              <p className="text-sm text-gray-600">Días disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
