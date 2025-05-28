"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Calendar, BarChart3 } from "lucide-react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

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
    } catch (error) {
      console.error("Error updating profile:", error)
      setMessage("Error al actualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  const availabilityDays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

  // Datos de ejemplo para la disponibilidad (en una app real vendrían de la base de datos)
  const mockAvailability = [
    {
      day: "Domingo",
      slots: ["10:00-12:00", "08:30-10:30", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00", "20:00-22:00"],
    },
    { day: "Lunes", slots: ["08:00-10:00", "20:00-22:00", "18:00-20:00"] },
    {
      day: "Sábado",
      slots: ["08:00-10:00", "10:00-12:00", "12:00-14:00", "20:00-22:00", "18:00-20:00", "16:00-18:00", "14:00-16:00"],
    },
    { day: "Miércoles", slots: ["08:00-10:00", "18:00-20:00", "20:00-22:00"] },
    { day: "Viernes", slots: ["08:00-10:00", "18:00-20:00", "20:00-22:00"] },
  ]

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

          {message && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">{message}</AlertDescription>
            </Alert>
          )}
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
          <div className="space-y-4">
            {mockAvailability.map((dayAvailability) => (
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
          <Button variant="outline" className="mt-4" onClick={() => {}}>
            Editar Horarios
          </Button>
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
              <p className="text-2xl font-bold text-purple-600">5</p>
              <p className="text-sm text-gray-600">Días disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
