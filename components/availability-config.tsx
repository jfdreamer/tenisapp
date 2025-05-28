"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Info } from "lucide-react"
import type { Player } from "@/types/tennis"
import { supabase } from "@/lib/supabase"

interface AvailabilityConfigProps {
  currentPlayer: Player
  onBack: () => void
}

export function AvailabilityConfig({ currentPlayer, onBack }: AvailabilityConfigProps) {
  const [availability, setAvailability] = useState<{ [key: string]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

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
    setLoading(true)
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
    } catch (error: any) {
      console.error("Error saving availability:", error)
      setError(error.message || "Error al guardar disponibilidad")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 Configurar Disponibilidad</h1>
          <p className="text-gray-600">Marca los días y horarios en los que puedes jugar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tu Disponibilidad Semanal
          </CardTitle>
          <p className="text-sm text-gray-600">Marca las casillas donde puedas jugar</p>
        </CardHeader>
        <CardContent>
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

          <div className="mt-6">
            <Button onClick={handleSaveAvailability} disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Guardar Disponibilidad"}
            </Button>
          </div>

          {message && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Marca todas las casillas donde puedas jugar</p>
              <p>• Esta información se usará para encontrar horarios compatibles</p>
              <p>• Puedes actualizar tu disponibilidad cuando quieras</p>
              <p>• Los otros jugadores verán solo los horarios donde ambos están disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
