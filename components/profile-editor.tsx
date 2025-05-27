"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/types/tennis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock } from "lucide-react"

interface ProfileEditorProps {
  currentPlayer: Player
  onBack: () => void
  onPlayerUpdate: (player: Player) => void
}

export function ProfileEditor({ currentPlayer, onBack, onPlayerUpdate }: ProfileEditorProps) {
  const [firstName, setFirstName] = useState(currentPlayer.first_name)
  const [lastName, setLastName] = useState(currentPlayer.last_name)
  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState<any[]>([])
  const [loadingAvailability, setLoadingAvailability] = useState(true)
  const { toast } = useToast()

  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

  useEffect(() => {
    loadAvailability()
  }, [currentPlayer])

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase.from("availability").select("*").eq("player_id", currentPlayer.id)

      if (error) throw error

      if (data) {
        // Agrupar por día
        const groupedByDay = data.reduce(
          (acc, slot) => {
            const dayName = days[slot.day_of_week]
            if (!acc[dayName]) acc[dayName] = []
            acc[dayName].push({
              start: slot.start_time.substring(0, 5),
              end: slot.end_time.substring(0, 5),
            })
            return acc
          },
          {} as Record<string, any[]>,
        )

        setAvailability(Object.entries(groupedByDay))
      }
    } catch (error) {
      console.error("Error loading availability:", error)
    } finally {
      setLoadingAvailability(false)
    }
  }

  const saveProfile = async () => {
    setLoading(true)

    try {
      const { data: updatedPlayer, error } = await supabase
        .from("players")
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentPlayer.id)
        .select()
        .single()

      if (error) throw error

      onPlayerUpdate(updatedPlayer)

      toast({
        title: "¡Perfil actualizado!",
        description: "Tu información ha sido guardada correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-green-700">👤 Mi Perfil</h2>
        <Button variant="outline" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Actualiza tu información básica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={currentPlayer.email} disabled className="bg-gray-100" />
            <p className="text-xs text-gray-500">El email no se puede cambiar</p>
          </div>
          <div className="space-y-2">
            <Label>Posición en Ranking</Label>
            <Input value={`#${currentPlayer.ranking_position}`} disabled className="bg-gray-100" />
            <p className="text-xs text-gray-500">La posición se actualiza automáticamente con los desafíos</p>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de Disponibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mi Disponibilidad
          </CardTitle>
          <CardDescription>Tus horarios disponibles para jugar</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAvailability ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : availability.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No has configurado tu disponibilidad</p>
              <Button variant="outline" onClick={() => (window.location.hash = "availability")}>
                Configurar Horarios
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {availability.map(([day, slots]) => (
                <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-700">{day}</div>
                  <div className="flex flex-wrap gap-1">
                    {slots.map((slot: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {slot.start}-{slot.end}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center pt-3">
                <Button variant="outline" size="sm" onClick={() => (window.location.hash = "availability")}>
                  Editar Horarios
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">#{currentPlayer.ranking_position}</div>
              <div className="text-sm text-gray-600">Ranking</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Partidos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-600">Victorias</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{availability.length}</div>
              <div className="text-sm text-gray-600">Días disponibles</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={loading} size="lg">
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  )
}
