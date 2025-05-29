"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Users,
  Trophy,
  Settings,
  Edit,
  Save,
  X,
  Crown,
  CheckCircle,
  XCircle,
  Plus,
  Calendar,
  Award,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  const [error, setError] = useState("")

  // Estados para crear desafío
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    challenger_id: "",
    challenged_id: "",
    challenge_date: "",
    challenge_time: "",
  })

  // Estados para reportar resultado
  const [showReportResult, setShowReportResult] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [resultForm, setResultForm] = useState({
    winner_id: "",
    score: "",
  })

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      // Cargar todos los jugadores
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .order("ranking_position", { ascending: true })

      // Cargar todos los desafíos
      const { data: challengesData } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:challenger_id(first_name, last_name, ranking_position),
          challenged:challenged_id(first_name, last_name, ranking_position),
          winner:winner_id(first_name, last_name)
        `)
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
    } catch (error: any) {
      console.error("Error updating player:", error)
      setError(error.message || "Error al actualizar jugador")
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
    } catch (error: any) {
      console.error("Error updating challenge:", error)
      setError(error.message || "Error al actualizar desafío")
    }
  }

  // Función para crear un nuevo desafío
  const handleCreateChallenge = async () => {
    try {
      if (
        !newChallenge.challenger_id ||
        !newChallenge.challenged_id ||
        !newChallenge.challenge_date ||
        !newChallenge.challenge_time
      ) {
        setError("Todos los campos son obligatorios")
        return
      }

      const { error } = await supabase.from("challenges").insert([
        {
          challenger_id: newChallenge.challenger_id,
          challenged_id: newChallenge.challenged_id,
          challenge_date: newChallenge.challenge_date,
          challenge_time: newChallenge.challenge_time,
          status: "accepted", // Los desafíos creados por admin están automáticamente aceptados
        },
      ])

      if (error) throw error

      setMessage("Desafío creado correctamente")
      setShowCreateChallenge(false)
      setNewChallenge({
        challenger_id: "",
        challenged_id: "",
        challenge_date: "",
        challenge_time: "",
      })
      loadAdminData()
    } catch (error: any) {
      console.error("Error creating challenge:", error)
      setError(error.message || "Error al crear desafío")
    }
  }

  // Función para abrir el diálogo de reportar resultado
  const openReportResult = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setResultForm({
      winner_id: "",
      score: "",
    })
    setShowReportResult(true)
  }

  // Función para reportar resultado de un desafío
  const handleReportResult = async () => {
    try {
      if (!selectedChallenge) return
      if (!resultForm.winner_id || !resultForm.score) {
        setError("Todos los campos son obligatorios")
        return
      }

      const { error } = await supabase
        .from("challenges")
        .update({
          status: "completed",
          winner_id: resultForm.winner_id,
          score: resultForm.score,
        })
        .eq("id", selectedChallenge.id)

      if (error) throw error

      // Si el ganador es el desafiador y está por debajo en el ranking, intercambiar posiciones
      if (
        resultForm.winner_id === selectedChallenge.challenger_id &&
        selectedChallenge.challenger?.ranking_position > selectedChallenge.challenged?.ranking_position
      ) {
        // Obtener las posiciones actuales
        const challengerPos = selectedChallenge.challenger?.ranking_position
        const challengedPos = selectedChallenge.challenged?.ranking_position

        // Intercambiar posiciones
        await supabase
          .from("players")
          .update({ ranking_position: challengedPos })
          .eq("id", selectedChallenge.challenger_id)

        await supabase
          .from("players")
          .update({ ranking_position: challengerPos })
          .eq("id", selectedChallenge.challenged_id)
      }

      setMessage("Resultado reportado correctamente")
      setShowReportResult(false)
      loadAdminData()
    } catch (error: any) {
      console.error("Error reporting result:", error)
      setError(error.message || "Error al reportar resultado")
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

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="players">
            <Users className="h-4 w-4 mr-2" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger value="challenges">
            <Trophy className="h-4 w-4 mr-2" />
            Desafíos
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Gestión de Desafíos</h3>
            <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Desafío
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Desafío</DialogTitle>
                  <DialogDescription>Programa un desafío entre dos jugadores.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenger">Desafiador</Label>
                    <Select
                      value={newChallenge.challenger_id}
                      onValueChange={(value) => setNewChallenge({ ...newChallenge, challenger_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un jugador" />
                      </SelectTrigger>
                      <SelectContent>
                        {players
                          .filter((p) => !p.is_admin && p.ranking_position > 0)
                          .map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              #{player.ranking_position} - {player.first_name} {player.last_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challenged">Desafiado</Label>
                    <Select
                      value={newChallenge.challenged_id}
                      onValueChange={(value) => setNewChallenge({ ...newChallenge, challenged_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un jugador" />
                      </SelectTrigger>
                      <SelectContent>
                        {players
                          .filter((p) => !p.is_admin && p.ranking_position > 0 && p.id !== newChallenge.challenger_id)
                          .map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              #{player.ranking_position} - {player.first_name} {player.last_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newChallenge.challenge_date}
                      onChange={(e) => setNewChallenge({ ...newChallenge, challenge_date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Select
                      value={newChallenge.challenge_time}
                      onValueChange={(value) => setNewChallenge({ ...newChallenge, challenge_time: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "08:00",
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "14:00",
                          "15:00",
                          "16:00",
                          "17:00",
                          "18:00",
                          "19:00",
                          "20:00",
                          "21:00",
                        ].map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateChallenge(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateChallenge}>Crear Desafío</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {challenges.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No hay desafíos registrados</p>
                ) : (
                  challenges.slice(0, 20).map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {challenge.challenger?.first_name} {challenge.challenger?.last_name}
                          </p>
                          <span className="text-gray-500">vs</span>
                          <p className="font-medium">
                            {challenge.challenged?.first_name} {challenge.challenged?.last_name}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {challenge.challenge_date} a las {challenge.challenge_time}
                        </p>
                        {challenge.status === "completed" && challenge.winner && (
                          <p className="text-sm text-green-600">
                            Ganador: {challenge.winner.first_name} {challenge.winner.last_name} - {challenge.score}
                          </p>
                        )}
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

                        {challenge.status === "accepted" && (
                          <Button size="sm" variant="outline" onClick={() => openReportResult(challenge)}>
                            <Trophy className="h-4 w-4 mr-1" />
                            Resultado
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Diálogo para reportar resultado */}
          <Dialog open={showReportResult} onOpenChange={setShowReportResult}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reportar Resultado</DialogTitle>
                <DialogDescription>
                  Ingresa el resultado del desafío entre {selectedChallenge?.challenger?.first_name}{" "}
                  {selectedChallenge?.challenger?.last_name} y {selectedChallenge?.challenged?.first_name}{" "}
                  {selectedChallenge?.challenged?.last_name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="winner">Ganador</Label>
                  <Select
                    value={resultForm.winner_id}
                    onValueChange={(value) => setResultForm({ ...resultForm, winner_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona al ganador" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedChallenge && (
                        <>
                          <SelectItem value={selectedChallenge.challenger_id}>
                            {selectedChallenge.challenger?.first_name} {selectedChallenge.challenger?.last_name}
                          </SelectItem>
                          <SelectItem value={selectedChallenge.challenged_id}>
                            {selectedChallenge.challenged?.first_name} {selectedChallenge.challenged?.last_name}
                          </SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Resultado</Label>
                  <Input
                    id="score"
                    placeholder="Ej: 6-4, 7-5"
                    value={resultForm.score}
                    onChange={(e) => setResultForm({ ...resultForm, score: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Formato: set1, set2, [super tie-break]</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReportResult(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleReportResult}>Guardar Resultado</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendario de Desafíos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Agrupar desafíos por fecha */}
              {challenges.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No hay desafíos programados</p>
              ) : (
                <div className="space-y-6">
                  {/* Agrupar por fecha y ordenar */}
                  {Array.from(new Set(challenges.filter((c) => c.status !== "cancelled").map((c) => c.challenge_date)))
                    .sort()
                    .map((date) => (
                      <div key={date} className="space-y-2">
                        <h3 className="font-medium text-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <div className="space-y-2">
                          {challenges
                            .filter((c) => c.challenge_date === date && c.status !== "cancelled")
                            .sort((a, b) => a.challenge_time.localeCompare(b.challenge_time))
                            .map((challenge) => (
                              <div
                                key={challenge.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-100 text-blue-800 rounded-md px-2 py-1 text-sm font-medium">
                                    {challenge.challenge_time}
                                  </div>
                                  <div>
                                    <p>
                                      <span className="font-medium">
                                        {challenge.challenger?.first_name} {challenge.challenger?.last_name}
                                      </span>
                                      <span className="text-gray-500 mx-2">vs</span>
                                      <span className="font-medium">
                                        {challenge.challenged?.first_name} {challenge.challenged?.last_name}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    challenge.status === "completed"
                                      ? "default"
                                      : challenge.status === "pending"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {challenge.status}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {players.filter((p) => !p.is_admin && p.ranking_position > 0).length}
                  </p>
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

          {/* Top jugadores con más victorias */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Jugadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-medium">Jugadores con más victorias</h3>
                {/* Calcular victorias por jugador */}
                {(() => {
                  const victories: Record<string, { player: Player; count: number }> = {}

                  challenges
                    .filter((c) => c.status === "completed" && c.winner_id)
                    .forEach((c) => {
                      const winnerId = c.winner_id as string
                      const winner = players.find((p) => p.id === winnerId)

                      if (winner) {
                        if (!victories[winnerId]) {
                          victories[winnerId] = { player: winner, count: 0 }
                        }
                        victories[winnerId].count++
                      }
                    })

                  // Convertir a array y ordenar
                  const topPlayers = Object.values(victories)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)

                  if (topPlayers.length === 0) {
                    return <p className="text-center text-gray-500 py-4">No hay partidos completados aún</p>
                  }

                  return (
                    <div className="space-y-2">
                      {topPlayers.map(({ player, count }, index) => (
                        <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">
                                {player.first_name} {player.last_name}
                              </p>
                              <p className="text-sm text-gray-600">Ranking #{player.ranking_position}</p>
                            </div>
                          </div>
                          <div className="bg-green-100 text-green-800 rounded-md px-3 py-1">
                            {count} {count === 1 ? "victoria" : "victorias"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
