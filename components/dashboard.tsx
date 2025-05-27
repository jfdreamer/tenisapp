"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/types/tennis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Users, Calendar, History } from "lucide-react"

interface DashboardProps {
  currentPlayer: Player
  onNavigate: (section: string) => void
}

export function Dashboard({ currentPlayer, onNavigate }: DashboardProps) {
  const [ranking, setRanking] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRanking()
  }, [])

  const loadRanking = async () => {
    try {
      const { data, error } = await supabase.from("players").select("*").order("ranking_position", { ascending: true })

      if (error) throw error

      setRanking(data || [])
    } catch (error) {
      console.error("Error loading ranking:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <img src="/images/btc-logo.png" alt="BTC Logo" className="h-20 w-auto" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Bienvenido, {currentPlayer.first_name}!</h1>
        <p className="text-gray-600 mt-2">
          Tu posición actual: <span className="font-bold text-blue-600">#{currentPlayer.ranking_position}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">#{currentPlayer.ranking_position}</div>
            <div className="text-sm text-gray-600">Tu Ranking</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{ranking.length}</div>
            <div className="text-sm text-gray-600">Jugadores</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-gray-600">Desafíos Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <History className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-gray-600">Partidos Jugados</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => onNavigate("challenge")} className="w-full" variant="default">
              🏆 Hacer un Desafío
            </Button>
            <Button onClick={() => onNavigate("availability")} className="w-full" variant="outline">
              📅 Configurar Disponibilidad
            </Button>
            <Button onClick={() => onNavigate("manage")} className="w-full" variant="outline">
              📊 Ver Mis Desafíos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Desafíos Pendientes</CardTitle>
            <CardDescription>Desafíos que requieren tu atención</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-4">No tienes desafíos pendientes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🏆 Ranking BTC</CardTitle>
          <CardDescription>Los mejores jugadores del Belgrano Tennis Challenge</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : ranking.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay jugadores registrados</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded ${
                    player.id === currentPlayer.id ? "bg-blue-50 border-blue-200 border" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                            ? "bg-gray-400"
                            : index === 2
                              ? "bg-orange-500"
                              : "bg-blue-500"
                      }`}
                    >
                      {player.ranking_position}
                    </div>
                    <div>
                      <p className="font-medium">
                        {player.first_name} {player.last_name}
                      </p>
                      {player.id === currentPlayer.id && (
                        <Badge variant="secondary" className="text-xs">
                          Tú
                        </Badge>
                      )}
                    </div>
                  </div>
                  {player.ranking_position <= currentPlayer.ranking_position + 5 &&
                    player.ranking_position > currentPlayer.ranking_position && (
                      <Button size="sm" onClick={() => onNavigate("challenge")} variant="outline">
                        Desafiar
                      </Button>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
