"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Trophy, Users } from "lucide-react"
import type { Player } from "@/types/tennis"
import { supabase } from "@/lib/supabase"

interface ChallengeSystemProps {
  currentPlayer: Player
  onBack: () => void
}

export function ChallengeSystem({ currentPlayer, onBack }: ChallengeSystemProps) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState("")
  const [challengeDate, setChallengeDate] = useState("")
  const [challengeTime, setChallengeTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadAvailablePlayers()
  }, [currentPlayer])

  const loadAvailablePlayers = async () => {
    try {
      // Cargar jugadores que están hasta 5 posiciones arriba (excluir admin)
      const maxPosition = Math.max(1, currentPlayer.ranking_position - 5)
      const { data: players, error } = await supabase
        .from("players")
        .select("*")
        .gte("ranking_position", maxPosition)
        .lt("ranking_position", currentPlayer.ranking_position)
        .neq("is_admin", true)
        .gt("ranking_position", 0)
        .order("ranking_position", { ascending: true })

      if (error) {
        console.error("Error loading players:", error)
        return
      }

      setAvailablePlayers(players || [])
    } catch (error) {
      console.error("Error loading players:", error)
    }
  }

  const handleSubmitChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      if (!selectedPlayer) {
        throw new Error("Debes seleccionar un oponente")
      }

      if (!challengeDate) {
        throw new Error("Debes seleccionar una fecha")
      }

      if (!challengeTime) {
        throw new Error("Debes seleccionar un horario")
      }

      const { error: insertError } = await supabase.from("challenges").insert([
        {
          challenger_id: currentPlayer.id,
          challenged_id: selectedPlayer,
          challenge_date: challengeDate,
          challenge_time: challengeTime,
          status: "pending",
        },
      ])

      if (insertError) {
        console.error("Error creating challenge:", insertError)
        throw new Error(`Error al crear desafío: ${insertError.message}`)
      }

      setMessage("¡Desafío enviado exitosamente!")
      setSelectedPlayer("")
      setChallengeDate("")
      setChallengeTime("")
    } catch (error: any) {
      console.error("Error creating challenge:", error)
      setError(error.message || "Error al enviar el desafío")
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
          <h1 className="text-2xl font-bold text-gray-900">🏆 Hacer un Desafío</h1>
          <p className="text-gray-600">Desafía a otros jugadores para mejorar tu ranking</p>
        </div>
      </div>

      {/* Reglas del Desafío */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Reglas del Desafío
          </CardTitle>
          <p className="text-sm text-gray-600">Recuerda las reglas antes de desafiar</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">• Solo puedes desafiar hasta 5 puestos hacia arriba en el ranking</p>
          <p className="text-sm">• El ganador se queda con la posición más alta</p>
          <p className="text-sm">• Si el desafiado no acepta, intercambian posiciones</p>
          <p className="text-sm">• Si el desafiado no llega a jugar, pierde 2 posiciones</p>
        </CardContent>
      </Card>

      {/* Crear Nuevo Desafío */}
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Desafío</CardTitle>
          <p className="text-sm text-gray-600">Tu posición actual: #{currentPlayer.ranking_position}</p>
        </CardHeader>
        <CardContent>
          {availablePlayers.length === 0 ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>No hay oponentes disponibles para desafiar en este momento.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmitChallenge} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="opponent">Oponente</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un oponente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        #{player.ranking_position} - {player.first_name} {player.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha del Partido</Label>
                <Input
                  id="date"
                  type="date"
                  value={challengeDate}
                  onChange={(e) => setChallengeDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Horario</Label>
                <Select value={challengeTime} onValueChange={setChallengeTime} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un horario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">08:00</SelectItem>
                    <SelectItem value="09:00">09:00</SelectItem>
                    <SelectItem value="10:00">10:00</SelectItem>
                    <SelectItem value="11:00">11:00</SelectItem>
                    <SelectItem value="14:00">14:00</SelectItem>
                    <SelectItem value="15:00">15:00</SelectItem>
                    <SelectItem value="16:00">16:00</SelectItem>
                    <SelectItem value="17:00">17:00</SelectItem>
                    <SelectItem value="18:00">18:00</SelectItem>
                    <SelectItem value="19:00">19:00</SelectItem>
                    <SelectItem value="20:00">20:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando Desafío..." : "Enviar Desafío"}
              </Button>
            </form>
          )}

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
    </div>
  )
}
