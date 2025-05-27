"use client"

import { useState, useEffect } from "react"
import type { Player } from "@/types/tennis"
import { AuthForm } from "@/components/auth-form"
import { Dashboard } from "@/components/dashboard"
import { ChallengeSystem } from "@/components/challenge-system"
import { AvailabilityConfig } from "@/components/availability-config"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ChallengeManagement } from "@/components/challenge-management"
import { ProfileEditor } from "@/components/profile-editor"
import { supabase } from "@/lib/supabase"

export default function TennisClubApp() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Usuario logueado, obtener datos del jugador
        const { data: playerData } = await supabase.from("players").select("*").eq("email", session.user.email).single()

        if (playerData) {
          setCurrentPlayer(playerData)
        }
      }
    } catch (error) {
      console.error("Error checking user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (player: Player) => {
    setCurrentPlayer(player)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentPlayer(null)
    setCurrentSection("dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!currentPlayer) {
    return <AuthForm onAuthSuccess={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="/images/btc-logo.png" alt="BTC Logo" className="h-10 w-auto" />
              <nav className="hidden md:flex space-x-4">
                <Button
                  variant={currentSection === "dashboard" ? "default" : "ghost"}
                  onClick={() => setCurrentSection("dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant={currentSection === "challenge" ? "default" : "ghost"}
                  onClick={() => setCurrentSection("challenge")}
                >
                  Desafiar
                </Button>
                <Button
                  variant={currentSection === "manage" ? "default" : "ghost"}
                  onClick={() => setCurrentSection("manage")}
                >
                  Mis Desafíos
                </Button>
                <Button
                  variant={currentSection === "availability" ? "default" : "ghost"}
                  onClick={() => setCurrentSection("availability")}
                >
                  Horarios
                </Button>
                <Button
                  variant={currentSection === "profile" ? "default" : "ghost"}
                  onClick={() => setCurrentSection("profile")}
                >
                  Mi Perfil
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentPlayer.first_name} #{currentPlayer.ranking_position}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentSection === "dashboard" && <Dashboard currentPlayer={currentPlayer} onNavigate={setCurrentSection} />}
        {currentSection === "challenge" && (
          <ChallengeSystem currentPlayer={currentPlayer} onBack={() => setCurrentSection("dashboard")} />
        )}
        {currentSection === "availability" && (
          <AvailabilityConfig currentPlayer={currentPlayer} onBack={() => setCurrentSection("dashboard")} />
        )}
        {currentSection === "manage" && (
          <ChallengeManagement currentPlayer={currentPlayer} onBack={() => setCurrentSection("dashboard")} />
        )}
        {currentSection === "profile" && (
          <ProfileEditor
            currentPlayer={currentPlayer}
            onBack={() => setCurrentSection("dashboard")}
            onPlayerUpdate={setCurrentPlayer}
          />
        )}
      </main>
    </div>
  )
}
