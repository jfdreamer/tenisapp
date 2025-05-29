"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, BarChart3 } from "lucide-react"
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
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-600">Desafíos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
