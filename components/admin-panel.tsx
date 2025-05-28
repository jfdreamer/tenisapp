"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Users, Trophy, Settings, Edit, Save, X, Crown, CheckCircle, XCircle } from "lucide-react"
import type { Player, Challenge } from "@/types/tennis"
import { supabase } from "@/lib/supabase"

interface AdminPanelProps {
  currentPlayer: Player
  onBack: () => void
}

export function AdminPanel({ currentPlayer, onBack }: AdminPanelProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ranking_position: 0 })
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      // Cargar todos los jugadores
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .order("ranking_position", { ascending: true })

      // Cargar todos los desafíos
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false })

      setPlayers(playersData || [])
      setChallenges(challengesData || [])
    } catch (error) {
      console.error("Error loading admin data:", error)
      setMessage("Error al cargar datos de administración")
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player.id)
    setEditForm({
      ranking_position: player.ranking_position,
    })
  }

  const handleSavePlayer = async (playerId: string) => {
    try {
      const { error } = await supabase
        .from("players")
        .update({
          ranking_position: editForm.ranking_position,
        })
        .eq("id", playerId)

      if (error) throw error

      setMessage("Jugador actualizado correctamente")
      setEditingPlayer(null)
      loadAdminData()
    } catch (error) {
      console.error("Error updating player:", error)
      setMessage("Error al actualizar jugador")
    }
  }

  const handleChallengeAction = async (challengeId: string, action: string) => {
    try {
      const updateData: any = {}

      if (action === "approve") {
        updateData.status = "accepted"
      } else if (action === "cancel") {
        updateData.status = "cancelled"
      }

      const { error } = await supabase.from("challenges").update(updateData).eq("id", challengeId)

      if (error) throw error

      setMessage(`Desafío ${action === "approve" ? "aprobado" : "cancelado"} correctamente`)
      loadAdminData()
    } catch (error) {
      console.error("Error updating challenge:", error)
      setMessage("Error al actualizar desafío")
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            Panel de Administrador
          </h1>
          <p className="text-gray-600">Gestión del Belgrano Tennis Challenge</p>
        </div>
      </div>

      {message && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">
            <Users className="h-4 w-4 mr-2" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Trophy className="h-4 w-4 mr-2" />
            Desafíos
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Settings className="h-4 w-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                        #{player.ranking_position}
                      </div>
                      <div>
                        <p className="font-medium">
                          {player.first_name} {player.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{player.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingPlayer === player.id ? (
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="ranking" className="text-xs">
                              Ranking
                            </Label>
                            <Input
                              id="ranking"
                              type="number"
                              value={editForm.ranking_position}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  ranking_position: Number.parseInt(e.target.value),
                                })
                              }
                              className="w-20 h-8"
                            />
                          </div>
                          <Button size="sm" onClick={() => handleSavePlayer(player.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingPlayer(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditPlayer(player)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Desafíos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {challenges.slice(0, 20).map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Desafío #{challenge.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        {challenge.challenge_date} - {challenge.challenge_time}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          challenge.status === "completed"
                            ? "default"
                            : challenge.status === "pending"
                              ? "secondary"
                              : challenge.status === "cancelled"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {challenge.status}
                      </Badge>

                      {challenge.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChallengeAction(challenge.id, "approve")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChallengeAction(challenge.id, "cancel")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{players.length}</p>
                  <p className="text-gray-600 text-sm">Total Jugadores</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Trophy className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{challenges.filter((c) => c.status === "pending").length}</p>
                  <p className="text-gray-600 text-sm">Desafíos Pendientes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <CheckCircle className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{challenges.filter((c) => c.status === "completed").length}</p>
                  <p className="text-gray-600 text-sm">Partidos Completados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
