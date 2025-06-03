"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar, Clock, Star, Target, User, TrendingUp } from "lucide-react"
import type { Player } from "@/types/tennis"
import { supabase } from "@/lib/supabase"

interface DashboardProps {
  currentPlayer: Player
  onNavigate: (section: string) => void
}

export function Dashboard({ currentPlayer, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    pendingChallenges: 0,
    completedMatches: 0,
  })
  const [topPlayers, setTopPlayers] = useState<Player[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Cargar todos los jugadores (excluir admin del conteo)
      const { data: players } = await supabase
        .from("players")
        .select("*")
        .neq("is_admin", true)
        .gt("ranking_position", 0)
        .order("ranking_position", { ascending: true })

      const { data: challenges } = await supabase
        .from("challenges")
        .select("*")
        .or(`challenger_id.eq.${currentPlayer.id},challenged_id.eq.${currentPlayer.id}`)

      const pendingChallenges = challenges?.filter((c) => c.status === "pending").length || 0
      const completedMatches = challenges?.filter((c) => c.status === "completed").length || 0

      setStats({
        totalPlayers: players?.length || 0,
        pendingChallenges,
        completedMatches,
      })

      // Guardar todos los jugadores para el ranking completo
      setAllPlayers(players || [])

      // Cargar top 10 jugadores para la vista resumida
      setTopPlayers(players?.slice(0, 10) || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
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
      {/* Bienvenida */}
      <div className="text-center">
        <img src="/images/btc-logo.png" alt="Belgrano Tennis Challenge" className="mx-auto h-16 w-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">¡Bienvenido, {currentPlayer.first_name}!</h1>
        {currentPlayer.ranking_position > 0 && (
          <p className="text-gray-600">
            Tu posición actual: <span className="font-semibold text-blue-600">#{currentPlayer.ranking_position}</span>
            <span className="text-gray-500 ml-2">de {stats.totalPlayers} jugadores</span>
          </p>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {currentPlayer.ranking_position > 0 && (
          <Card>
            <CardContent className="flex items-center p-6">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">#{currentPlayer.ranking_position}</p>
                <p className="text-gray-600 text-sm">Tu Ranking</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{stats.totalPlayers}</p>
              <p className="text-gray-600 text-sm">Total Jugadores</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{stats.pendingChallenges}</p>
              <p className="text-gray-600 text-sm">Desafíos Pendientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{stats.completedMatches}</p>
              <p className="text-gray-600 text-sm">Partidos Jugados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas - Solo para usuarios no admin */}
      {currentPlayer.ranking_position > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => onNavigate("challenge")} className="w-full justify-start" size="lg">
              <Star className="h-4 w-4 mr-2" />
              Hacer un Desafío
            </Button>
            <Button onClick={() => onNavigate("profile")} variant="outline" className="w-full justify-start" size="lg">
              <User className="h-4 w-4 mr-2" />
              Mi Perfil
            </Button>
            <Button onClick={() => onNavigate("manage")} variant="outline" className="w-full justify-start" size="lg">
              <Target className="h-4 w-4 mr-2" />
              Ver Mis Desafíos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ranking BTC Completo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking Completo BTC
          </CardTitle>
          <p className="text-sm text-gray-600">
            Todos los jugadores del Belgrano Tennis Challenge ({stats.totalPlayers} jugadores)
          </p>
        </CardHeader>
        <CardContent>
          {allPlayers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay jugadores registrados aún</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    player.id === currentPlayer.id
                      ? "bg-blue-50 border-2 border-blue-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                              ? "bg-amber-600 text-white"
                              : player.id === currentPlayer.id
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {player.ranking_position}
                    </div>
                    <div>
                      <p className="font-medium">
                        {player.first_name} {player.last_name}
                        {player.id === currentPlayer.id && (
                          <span className="text-blue-600 ml-2 font-semibold">(Tú)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Indicadores especiales */}
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <div className="flex items-center gap-1">
                        <Trophy
                          className={`h-4 w-4 ${
                            index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"
                          }`}
                        />
                      </div>
                    )}
                    {player.id === currentPlayer.id && <TrendingUp className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
