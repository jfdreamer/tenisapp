"use client"

import { useState, useEffect } from "react"
import { CourtCalendar } from "@/components/court-calendar"
import { AdminPanel } from "@/components/admin-panel"
import { AdminLogin } from "@/components/admin-login"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown } from "lucide-react"
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
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = () => {
    const adminStatus = localStorage.getItem("isClubAdmin")
    setIsAdmin(adminStatus === "true")
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

  const handleAdminLogout = () => {
    setIsAdmin(false)
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
            <Button variant="outline" onClick={() => setShowAdminLogin(true)}>
              <Crown className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Reserva tu Cancha</h2>
          <p className="text-gray-600 mb-6">
            Selecciona una cancha para ver disponibilidad y hacer tu reserva inmediata
          </p>

          {/* Precios */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle className="text-lg">💰 Precios por Jugador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">${pricing.singles_price.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Singles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">${pricing.doubles_price.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Dobles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canchas */}
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

        {/* Información adicional */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">⏰ Horarios</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Turnos de 1 hora y 30 minutos</li>
                <li>• Desde las 7:00 hasta las 22:00</li>
                <li>• Canchas 1, 2, 3: hasta 20:00</li>
                <li>• Canchas 4, 5: hasta 22:00 (con luz)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">📋 Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Reserva inmediata y confirmada</li>
                <li>• Indica si es Singles o Dobles</li>
                <li>• Proporciona apellidos de jugadores</li>
                <li>• Pago en efectivo al llegar</li>
                <li>• Notificación automática al club</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">📞 Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Teléfono: (011) 4567-8900</li>
                <li>• WhatsApp: +54 9 11 1234-5678</li>
                <li>• Email: reservas@belgranotennis.com</li>
                <li>• Dirección: Av. Belgrano 1234</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
