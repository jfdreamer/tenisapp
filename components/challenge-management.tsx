"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/types/tennis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, Trophy, Clock } from "lucide-react"

interface ChallengeManagementProps {
  currentPlayer: Player
  onBack: () => void
}

export function ChallengeManagement({ currentPlayer, onBack }: ChallengeManagementProps) {
  const [receivedChallenges, setReceivedChallenges] = useState<any[]>([])
  const [sentChallenges, setSentChallenges] = useState<any[]>([])
  const [completedChallenges, setCompletedChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadChallenges()
  }, [currentPlayer])

  const loadChallenges = async () => {
    try {
      // Desafíos recibidos
      const { data: received } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:challenger_id(first_name, last_name, ranking_position),
          challenged:challenged_id(first_name, last_name, ranking_position)
        `)
        .eq("challenged_id", currentPlayer.id)
        .eq("status", "pending")

      // Desafíos enviados
      const { data: sent } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:challenger_id(first_name, last_name, ranking_position),
          challenged:challenged_id(first_name, last_name, ranking_position)
        `)
        .eq("challenger_id", currentPlayer.id)
        .in("status", ["pending", "accepted"])

      // Desafíos completados
      const { data: completed } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:challenger_id(first_name, last_name, ranking_position),
          challenged:challenged_id(first_name, last_name, ranking_position),
          winner:winner_id(first_name, last_name)
        `)
        .or(`challenger_id.eq.${currentPlayer.id},challenged_id.eq.${currentPlayer.id}`)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10)

      setReceivedChallenges(received || [])
      setSentChallenges(sent || [])
      setCompletedChallenges(completed || [])
    } catch (error) {
      console.error("Error loading challenges:", error)
    } finally {
      setLoading(false)
    }
  }

  const respondToChallenge = async (challengeId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase.from("challenges").update({ status: "accepted" }).eq("id", challengeId)

        if (error) throw error

        toast({
          title: "Desafío aceptado",
          description: "Has aceptado el desafío. ¡A jugar!",
        })
      } else {
        const { error } = await supabase.from("challenges").update({ status: "rejected" }).eq("id", challengeId)

        if (error) throw error

        toast({
          title: "Desafío rechazado",
          description: "Has rechazado el desafío.",
        })
      }

      loadChallenges()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const reportResult = async (challengeId: string, winnerId: string) => {
    try {
      const { error } = await supabase
        .from("challenges")
        .update({
          status: "completed",
          winner_id: winnerId,
          completed_at: new Date().toISOString(),
        })
        .eq("id", challengeId)

      if (error) throw error

      toast({
        title: "Resultado reportado",
        description: "El resultado ha sido registrado exitosamente",
      })

      loadChallenges()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Cargando desafíos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-700">⚔️ Gestión de Desafíos</h2>
        <Button variant="outline" onClick={onBack}>
          ← Volver
        </Button>
      </div>

      {/* Desafíos Recibidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Desafíos Recibidos ({receivedChallenges.length})
          </CardTitle>
          <CardDescription>Desafíos que otros jugadores te han enviado</CardDescription>
        </CardHeader>
        <CardContent>
          {receivedChallenges.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tienes desafíos pendientes</p>
          ) : (
            <div className="space-y-4">
              {receivedChallenges.map((challenge) => (
                <div key={challenge.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">
                        {challenge.challenger?.first_name} {challenge.challenger?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Posición #{challenge.challenger?.ranking_position} te desafía
                      </p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(challenge.challenge_date).toLocaleDateString()} - {challenge.challenge_time}
                      </p>
                    </div>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => respondToChallenge(challenge.id, true)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => respondToChallenge(challenge.id, false)}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desafíos Enviados */}
      <Card>
        <CardHeader>
          <CardTitle>📤 Desafíos Enviados ({sentChallenges.length})</CardTitle>
          <CardDescription>Desafíos que has enviado a otros jugadores</CardDescription>
        </CardHeader>
        <CardContent>
          {sentChallenges.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No has enviado desafíos</p>
          ) : (
            <div className="space-y-4">
              {sentChallenges.map((challenge) => (
                <div key={challenge.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">
                        Desafiaste a {challenge.challenged?.first_name} {challenge.challenged?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">Posición #{challenge.challenged?.ranking_position}</p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(challenge.challenge_date).toLocaleDateString()} - {challenge.challenge_time}
                      </p>
                    </div>
                    <Badge variant={challenge.status === "accepted" ? "default" : "secondary"}>
                      {challenge.status === "accepted" ? "Aceptado" : "Pendiente"}
                    </Badge>
                  </div>
                  {challenge.status === "accepted" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reportResult(challenge.id, currentPlayer.id)} variant="default">
                        Gané yo
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => reportResult(challenge.id, challenge.challenged_id)}
                        variant="outline"
                      >
                        Ganó {challenge.challenged?.first_name}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Partidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Historial de Partidos
          </CardTitle>
          <CardDescription>Últimos partidos completados</CardDescription>
        </CardHeader>
        <CardContent>
          {completedChallenges.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay partidos completados</p>
          ) : (
            <div className="space-y-3">
              {completedChallenges.map((challenge) => {
                const isWinner = challenge.winner_id === currentPlayer.id
                const opponent =
                  challenge.challenger_id === currentPlayer.id ? challenge.challenged : challenge.challenger

                return (
                  <div key={challenge.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          vs {opponent?.first_name} {opponent?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(challenge.challenge_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={isWinner ? "default" : "secondary"}>{isWinner ? "Victoria" : "Derrota"}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
