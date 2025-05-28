"use client"

import { useState, useEffect } from "react"
import type { Player } from "@/types/tennis"
import { AuthForm } from "@/components/auth-form"
import { Dashboard } from "@/components/dashboard"
import { ChallengeSystem } from "@/components/challenge-system"
import { Button } from "@/components/ui/button"
import { LogOut, FileText, Crown } from "lucide-react"
import { ChallengeManagement } from "@/components/challenge-management"
import { ProfileEditor } from "@/components/profile-editor"
import { Regulations } from "@/components/regulations"
import { AdminPanel } from "@/components/admin-panel"
import { supabase } from "@/lib/supabase"

export default function TennisClubApp() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [currentSection, setCurrentSection] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkUser()
    checkAdminStatus()
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

  const checkAdminStatus = () => {
    const adminStatus = localStorage.getItem("isAdmin")
    setIsAdmin(adminStatus === "true")
  }

  const handleLogin = (player: Player) => {
    setCurrentPlayer(player)
  }

  const handleAdminLogin = () => {
    setIsAdmin(true)
    setCurrentPlayer({
      id: "admin",
      email: "admin@btc.com",
      first_name: "Administrador",
      last_name: "BTC",
      ranking_position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_admin: true,
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("isAdmin")
    setCurrentPlayer(null)
    setIsAdmin(false)
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
    return <AuthForm onAuthSuccess={handleLogin} onAdminLogin={handleAdminLogin} />
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
                {!isAdmin && (
                  <>
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
                      variant={currentSection === "profile" ? "default" : "ghost"}
                      onClick={() => setCurrentSection("profile")}
                    >
                      Mi Perfil
                    </Button>
                  </>
                )}
                <Button
                  variant={currentSection === "regulations" ? "default" : "ghost"}
                  onClick={() => setCurrentSection("regulations")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Reglamento
                </Button>
                {isAdmin && (
                  <Button
                    variant={currentSection === "admin" ? "default" : "ghost"}
                    onClick={() => setCurrentSection("admin")}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Panel Admin
                  </Button>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {isAdmin ? (
                  <span className="flex items-center gap-1">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Administrador
                  </span>
                ) : (
                  `${currentPlayer.first_name} #${currentPlayer.ranking_position}`
                )}
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
        {currentSection === "challenge" && !isAdmin && (
          <ChallengeSystem currentPlayer={currentPlayer} onBack={() => setCurrentSection("dashboard")} />
        )}
        {currentSection === "manage" && !isAdmin && (
          <ChallengeManagement currentPlayer={currentPlayer} onBack={() => setCurrentSection("dashboard")} />
        )}
        {currentSection === "regulations" && <Regulations onBack={() => setCurrentSection("dashboard")} />}
        {currentSection === "profile" && !isAdmin && (
          <ProfileEditor
            currentPlayer={currentPlayer}
            onBack={() => setCurrentSection("dashboard")}
            onPlayerUpdate={setCurrentPlayer}
          />
        )}
        {currentSection === "admin" && isAdmin && (
          <AdminPanel currentPlayer={currentPlayer} onBack={() => setCurrentSection("dashboard")} />
        )}
      </main>
    </div>
  )
}
