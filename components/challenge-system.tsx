"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/types/tennis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ChallengeSystemProps {
  currentPlayer: Player
  onBack: () => void
}

export function ChallengeSystem({ currentPlayer, onBack }: ChallengeSystemProps) {
  const [availableOpponents, setAvailableOpponents] = useState<Player[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState<string>("")
  const [challengeDate, setChallengeDate] = useState("")
  const [challengeTime, setChallengeTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingOpponents, setLoadingOpponents] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAvailableOpponents()
  }, [currentPlayer])

  const loadAvailableOpponents = async () => {
    try {
      setLoadingOpponents(true)

      // Solo puede desafiar hasta 5 puestos hacia arriba (diferencia máxima de 5)
      const maxPosition = Math.max(1, currentPlayer.ranking_position - 5)
      const minPosition = currentPlayer.ranking_position - 1

      const { data, error } = await supabase
        .from("players")
        .select("*")
        .gte("ranking_position", maxPosition)
        .lte("ranking_position", minPosition)
        .order("ranking_position", { ascending: true })

      if (error) throw error

      setAvailableOpponents(data || [])
    } catch (error) {
      console.error("Error loading opponents:", error)
    } finally {
      setLoadingOpponents(false)
    }
  }

  const timeSlots = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]

  const createChallenge = async () => {
    if (!selectedOpponent || !challengeDate || !challengeTime) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("challenges").insert({
        challenger_id: currentPlayer.id,
        challenged_id: selectedOpponent,
        challenge_date: challengeDate,
        challenge_time: challengeTime,
        status: "pending",
      })

      if (error) throw error

      toast({
        title: "¡Desafío enviado!",
        description: "Tu desafío ha sido enviado exitosamente",
      })

      // Reset form
      setSelectedOpponent("")
      setChallengeDate("")
      setChallengeTime("")
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
        <h2 className="text-2xl font-bold text-blue-700">🏆 Hacer un Desafío</h2>
        <Button variant="outline" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas del Desafío</CardTitle>
          <CardDescription>Recuerda las reglas antes de desafiar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• Solo puedes desafiar hasta 5 puestos hacia arriba en el ranking</p>
            <p>• El ganador se queda con la posición más alta</p>
            <p>• Si el desafiado no acepta, intercambian posiciones</p>
            <p>• Si el desafiado no llega a jugar, pierde 2 posiciones</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Desafío</CardTitle>
          <CardDescription>Tu posición actual: #{currentPlayer.ranking_position}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opponent">Oponente</Label>
            {loadingOpponents ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un oponente" />
                </SelectTrigger>
                <SelectContent>
                  {availableOpponents.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">#{player.ranking_position}</span>
                        <span>
                          {player.first_name} {player.last_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!loadingOpponents && availableOpponents.length === 0 && (
              <p className="text-sm text-gray-500">No hay oponentes disponibles para desafiar en este momento</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha del Partido</Label>
            <Input
              id="date"
              type="date"
              value={challengeDate}
              onChange={(e) => setChallengeDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Horario</Label>
            <Select value={challengeTime} onValueChange={setChallengeTime}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un horario" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={createChallenge}
            disabled={loading || !selectedOpponent || !challengeDate || !challengeTime || loadingOpponents}
            className="w-full"
          >
            {loading ? "Enviando..." : "Enviar Desafío"}
          </Button>
        </CardContent>
      </Card>

      {!loadingOpponents && availableOpponents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Oponentes Disponibles</CardTitle>
            <CardDescription>Jugadores que puedes desafiar (hasta 5 puestos arriba)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableOpponents.map((player) => (
                <div key={player.id} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {player.ranking_position}
                    </div>
                    <div>
                      <p className="font-medium">
                        {player.first_name} {player.last_name}
                      </p>
                      <p className="text-sm text-gray-600">Posición #{player.ranking_position}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setSelectedOpponent(player.id)}
                    variant={selectedOpponent === player.id ? "default" : "outline"}
                  >
                    {selectedOpponent === player.id ? "Seleccionado" : "Seleccionar"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
