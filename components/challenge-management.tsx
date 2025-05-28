"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, Send, Trophy, CheckCircle, XCircle } from "lucide-react"
import type { Player, Challenge } from "@/types/tennis"
import { supabase } from "@/lib/supabase"

interface ChallengeManagementProps {
  currentPlayer: Player
  onBack: () => void
}

export function ChallengeManagement({ currentPlayer, onBack }: ChallengeManagementProps) {
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([])
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([])
  const [completedMatches, setCompletedMatches] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadChallenges()
  }, [currentPlayer])

  const loadChallenges = async () => {
    try {
      // Cargar desafíos recibidos
      const { data: received } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:challenger_id(first_name, last_name, ranking_position)
        `)
        .eq("challenged_id", currentPlayer.id)
        .order("created_at", { ascending: false })

      // Cargar desafíos enviados
      const { data: sent } = await supabase
        .from("challenges")
        .select(`
          *,
          challenged:challenged_id(first_name, last_name, ranking_position)
        `)
        .eq("challenger_id", currentPlayer.id)
        .order("created_at", { ascending: false })

      // Cargar partidos completados
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
        .order("updated_at", { ascending: false })

      setReceivedChallenges(received || [])
      setSentChallenges(sent || [])
      setCompletedMatches(completed || [])
    } catch (error) {
      console.error("Error loading challenges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChallengeResponse = async (challengeId: string, action: "accept" | "decline") => {
    try {
      const updateData: any = {
        status: action === "accept" ? "accepted" : "declined",
      }

      const { error } = await supabase.from("challenges").update(updateData).eq("id", challengeId)

      if (error) throw error

      setMessage(`Desafío ${action === "accept" ? "aceptado" : "rechazado"} correctamente`)
      loadChallenges()
    } catch (error) {
      console.error("Error updating challenge:", error)
      setMessage("Error al actualizar desafío")
    }
  }

  const handleReportResult = async (challengeId: string, winnerId: string, score: string) => {
    try {
      const { error } = await supabase
        .from("challenges")
        .update({
          status: "completed",
          winner_id: winnerId,
          score: score,
        })
        .eq("id", challengeId)

      if (error) throw error

      setMessage("Resultado reportado correctamente")
      loadChallenges()
    } catch (error) {
      console.error("Error reporting result:", error)
      setMessage("Error al reportar resultado")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚔️ Gestión de Desafíos</h1>
          <p className="text-gray-600">Administra tus desafíos enviados y recibidos</p>
        </div>
      </div>

      {message && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received">
            <Clock className="h-4 w-4 mr-2" />
            Desafíos Recibidos ({receivedChallenges.filter((c) => c.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="h-4 w-4 mr-2" />
            Desafíos Enviados ({sentChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Trophy className="h-4 w-4 mr-2" />
            Historial de Partidos ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desafíos Recibidos</CardTitle>
              <p className="text-sm text-gray-600">Desafíos que otros jugadores te han enviado</p>
            </CardHeader>
            <CardContent>
              {receivedChallenges.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No tienes desafíos pendientes</p>
              ) : (
                <div className="space-y-4">
                  {receivedChallenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {challenge.challenger?.first_name} {challenge.challenger?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">Ranking #{challenge.challenger?.ranking_position}</p>
                        <p className="text-sm text-gray-600">
                          {challenge.challenge_date} a las {challenge.challenge_time}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            challenge.status === "pending"
                              ? "secondary"
                              : challenge.status === "accepted"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {challenge.status}
                        </Badge>

                        {challenge.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleChallengeResponse(challenge.id, "accept")}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChallengeResponse(challenge.id, "decline")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desafíos Enviados</CardTitle>
              <p className="text-sm text-gray-600">Desafíos que has enviado a otros jugadores</p>
            </CardHeader>
            <CardContent>
              {sentChallenges.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No has enviado desafíos</p>
              ) : (
                <div className="space-y-4">
                  {sentChallenges.map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {challenge.challenged?.first_name} {challenge.challenged?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">Ranking #{challenge.challenged?.ranking_position}</p>
                        <p className="text-sm text-gray-600">
                          {challenge.challenge_date} a las {challenge.challenge_time}
                        </p>
                      </div>

                      <Badge
                        variant={
                          challenge.status === "pending"
                            ? "secondary"
                            : challenge.status === "accepted"
                              ? "default"
                              : challenge.status === "completed"
                                ? "default"
                                : "destructive"
                        }
                      >
                        {challenge.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Partidos</CardTitle>
              <p className="text-sm text-gray-600">Últimos partidos completados</p>
            </CardHeader>
            <CardContent>
              {completedMatches.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay partidos completados</p>
              ) : (
                <div className="space-y-4">
                  {completedMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {match.challenger?.first_name} {match.challenger?.last_name} vs {match.challenged?.first_name}{" "}
                          {match.challenged?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {match.challenge_date} - {match.score}
                        </p>
                        {match.winner && (
                          <p className="text-sm text-green-600">
                            Ganador: {match.winner.first_name} {match.winner.last_name}
                          </p>
                        )}
                      </div>

                      <Badge variant="default">Completado</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
