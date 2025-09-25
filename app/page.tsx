"use client"

import { useState, useEffect } from "react"
import { CourtCalendar } from "@/components/court-calendar"
import { AdminPanel } from "@/components/admin-panel"
import { AdminLogin } from "@/components/admin-login"
import { MemberLogin } from "@/components/member-login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Court {
  id: number
  name: string
  has_lights: boolean
  is_active: boolean
}

interface Pricing {
  singles_price: number
  doubles_price: number
  admin_email?: string
}

export default function ClubBelgranoTennis() {
  const [courts, setCourts] = useState<Court[]>([])
  const [pricing, setPricing] = useState<Pricing>({ singles_price: 0, doubles_price: 0 })
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
    loadInitialData()
  }, [])

  const checkAuthStatus = () => {
    const adminStatus = localStorage.getItem("isClubAdmin")
    const memberStatus = localStorage.getItem("isMember")
    setIsAdmin(adminStatus === "true")
    setIsMember(memberStatus === "true")
  }

  const loadInitialData = async () => {
    try {
      // Cargar canchas
      const { data: courtsData } = await supabase.from("courts").select("*").eq("is_active", true).order("id")

      // Cargar precios
      const { data: pricingData } = await supabase
        .from("pricing")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .single()

      setCourts(courtsData || [])
      setPricing(pricingData || { singles_price: 0, doubles_price: 0 })
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = () => {
    setIsAdmin(true)
    setShowAdminLogin(false)
    localStorage.setItem("isClubAdmin", "true")
  }

  const handleMemberLogin = () => {
    setIsMember(true)
  }

  const handleAdminLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem("isClubAdmin")
    setSelectedCourt(null)
  }

  const handleMemberLogout = () => {
    setIsMember(false)
    setIsAdmin(false)
    localStorage.removeItem("isMember")
    localStorage.removeItem("isClubAdmin")
    setSelectedCourt(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isMember) {
    return <MemberLogin onMemberLogin={handleMemberLogin} />
  }

  if (showAdminLogin) {
    return <AdminLogin onAdminLogin={handleAdminLogin} onBack={() => setShowAdminLogin(false)} />
  }

  if (isAdmin) {
    return <AdminPanel onBack={handleAdminLogout} courts={courts} pricing={pricing} onPricingUpdate={setPricing} />
  }

  if (selectedCourt) {
    return <CourtCalendar court={selectedCourt} pricing={pricing} onBack={() => setSelectedCourt(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-green-700">🎾</div>
              <h1 className="text-xl font-bold text-gray-900">Club Belgrano Tennis</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowAdminLogin(true)}>
                <Crown className="h-4 w-4 mr-2" />
                Admin
              </Button>
              <Button variant="outline" onClick={handleMemberLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Reserva tu Cancha</h2>
          <p className="text-gray-600 mb-6">
            Selecciona una cancha para ver disponibilidad y hacer tu reserva inmediata
          </p>

          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-lg">📋 Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {pricing.admin_email || "Consulta precios y promociones en recepción"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {courts.map((court) => (
            <Card
              key={court.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105"
              onClick={() => setSelectedCourt(court)}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{court.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl mb-4">🎾</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {court.has_lights ? (
                      <>
                        <span className="text-2xl">💡</span>
                        <span className="text-sm text-green-600 font-medium">Con Luz</span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🌅</span>
                        <span className="text-sm text-orange-600 font-medium">Sin Luz</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Horarios: 7:00 - {court.has_lights ? "22:00" : "20:00"}</p>
                  <p className="text-xs text-gray-500">Turnos de 1.5 horas</p>
                </div>
                <Button className="w-full mt-4 bg-transparent" variant="outline">
                  Ver Disponibilidad
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">⏰ Horarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                Días de semana: • Singles: 1h 30min • Dobles: 2h Fines de semana: • Singles: 1h • Dobles: 1h 30min
                Horarios: 7:00 - 22:00 Turnos cada 30 minutos
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">📋 Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                • Reserva inmediata y confirmada • Indica si es Singles o Dobles • Proporciona apellidos de jugadores •
                Pago en efectivo al llegar • Llega 10 minutos antes • Notificación automática al club
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">📞 Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                • Teléfono: (011) 4567-8900 • WhatsApp: +54 9 11 1234-5678 • Email: reservas@belgranotennis.com •
                Dirección: Av. Belgrano 1234
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
