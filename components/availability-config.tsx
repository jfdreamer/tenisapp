"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/types/tennis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface AvailabilityConfigProps {
  currentPlayer: Player
  onBack: () => void
}

export function AvailabilityConfig({ currentPlayer, onBack }: AvailabilityConfigProps) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const { toast } = useToast()

  const days = [
    { id: 1, name: "Lunes" },
    { id: 2, name: "Martes" },
    { id: 3, name: "Miércoles" },
    { id: 4, name: "Jueves" },
    { id: 5, name: "Viernes" },
    { id: 6, name: "Sábado" },
    { id: 0, name: "Domingo" },
  ]

  const timeSlots = [
    "08:00-10:00",
    "10:00-12:00",
    "12:00-14:00",
    "14:00-16:00",
    "16:00-18:00",
    "18:00-20:00",
    "20:00-22:00",
  ]

  useEffect(() => {
    loadCurrentAvailability()
  }, [currentPlayer])

  const loadCurrentAvailability = async () => {
    try {
      setLoadingData(true)
      console.log("Cargando disponibilidad para jugador:", currentPlayer.id)

      const { data, error } = await supabase.from("availability").select("*").eq("player_id", currentPlayer.id)

      if (error) {
        console.error("Error loading availability:", error)
        throw error
      }

      console.log("Datos de disponibilidad cargados:", data)

      if (data) {
        const availabilityMap: Record<string, boolean> = {}
        data.forEach((slot) => {
          // Convertir formato de tiempo de "HH:MM:SS" a "HH:MM"
          const startTime = slot.start_time.substring(0, 5) // "10:00:00" -> "10:00"
          const endTime = slot.end_time.substring(0, 5) // "12:00:00" -> "12:00"
          const key = `${slot.day_of_week}-${startTime}-${endTime}`
          availabilityMap[key] = true
          console.log("Marcando disponible:", key)
        })
        setAvailability(availabilityMap)
      }
    } catch (error: any) {
      console.error("Error loading availability:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la disponibilidad",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const toggleAvailability = (day: number, timeSlot: string) => {
    const [startTime, endTime] = timeSlot.split("-")
    const key = `${day}-${startTime}-${endTime}`

    setAvailability((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const saveAvailability = async () => {
    setLoading(true)
    try {
      console.log("Guardando disponibilidad para jugador:", currentPlayer.id)

      // Eliminar disponibilidad actual
      const { error: deleteError } = await supabase.from("availability").delete().eq("player_id", currentPlayer.id)

      if (deleteError) {
        console.error("Error eliminando disponibilidad:", deleteError)
        throw deleteError
      }

      // Insertar nueva disponibilidad
      const newAvailability = Object.entries(availability)
        .filter(([_, isAvailable]) => isAvailable)
        .map(([key, _]) => {
          const [day, startTime, endTime] = key.split("-")
          return {
            player_id: currentPlayer.id,
            day_of_week: Number.parseInt(day),
            start_time: startTime,
            end_time: endTime,
          }
        })

      console.log("Insertando nueva disponibilidad:", newAvailability)

      if (newAvailability.length > 0) {
        const { error: insertError } = await supabase.from("availability").insert(newAvailability)

        if (insertError) {
          console.error("Error insertando disponibilidad:", insertError)
          throw insertError
        }
      }

      toast({
        title: "¡Disponibilidad guardada!",
        description: "Tu disponibilidad ha sido actualizada correctamente",
      })
    } catch (error: any) {
      console.error("Error saving availability:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando disponibilidad...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-700">📅 Configurar Disponibilidad</h2>
        <Button variant="outline" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu Disponibilidad Semanal</CardTitle>
          <CardDescription>Marca los días y horarios en los que puedes jugar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Día</th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className="text-center p-2 border-b text-xs">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.id}>
                    <td className="p-2 border-b font-medium">{day.name}</td>
                    {timeSlots.map((slot) => {
                      const [startTime, endTime] = slot.split("-")
                      const key = `${day.id}-${startTime}-${endTime}`
                      return (
                        <td key={slot} className="p-2 border-b text-center">
                          <Checkbox
                            checked={availability[key] || false}
                            onCheckedChange={() => toggleAvailability(day.id, slot)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={saveAvailability} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Disponibilidad"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Marca todas las casillas donde puedas jugar</p>
            <p>• Esta información se usará para encontrar horarios compatibles</p>
            <p>• Puedes actualizar tu disponibilidad cuando quieras</p>
            <p>• Los otros jugadores verán solo los horarios donde ambos están disponibles</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
