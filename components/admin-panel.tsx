"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, DollarSign, BarChart3, Settings, Trash2, Edit, Save, X, Mail } from "lucide-react"
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

interface Reservation {
  id: string
  court_id: number
  reservation_date: string
  start_time: string
  end_time: string
  game_type: string
  player_names: string[]
  total_cost: number
  contact_info: string
  created_at: string
  court?: { name: string }
}

interface AdminPanelProps {
  onBack: () => void
  courts: Court[]
  pricing: Pricing
  onPricingUpdate: (pricing: Pricing) => void
}

export function AdminPanel({ onBack, courts, pricing, onPricingUpdate }: AdminPanelProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [editingPrices, setEditingPrices] = useState(false)
  const [newPricing, setNewPricing] = useState(pricing)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    loadReservations()
  }, [selectedMonth])

  useEffect(() => {
    setNewPricing(pricing)
  }, [pricing])

  const loadReservations = async () => {
    try {
      setLoading(true)

      // Calcular el primer y último día del mes correctamente
      const year = Number.parseInt(selectedMonth.split("-")[0])
      const month = Number.parseInt(selectedMonth.split("-")[1])

      const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]
      const endDate = new Date(year, month, 0).toISOString().split("T")[0] // Último día del mes

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          court:courts(name)
        `)
        .gte("reservation_date", startDate)
        .lte("reservation_date", endDate)
        .order("reservation_date", { ascending: false })
        .order("start_time", { ascending: true })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error("Error loading reservations:", error)
      setError("Error al cargar reservas")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta reserva?")) return

    try {
      const { error } = await supabase.from("reservations").delete().eq("id", reservationId)

      if (error) throw error

      setMessage("Reserva eliminada correctamente")
      loadReservations()
    } catch (error: any) {
      console.error("Error deleting reservation:", error)
      setError(error.message || "Error al eliminar reserva")
    }
  }

  const handleUpdatePricing = async () => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from("pricing")
        .update({
          singles_price: newPricing.singles_price,
          doubles_price: newPricing.doubles_price,
          admin_email: newPricing.admin_email || "admin@belgranotennis.com",
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      if (error) throw error

      onPricingUpdate(newPricing)
      setEditingPrices(false)
      setMessage("Configuración actualizada correctamente")
    } catch (error: any) {
      console.error("Error updating pricing:", error)
      setError(error.message || "Error al actualizar configuración")
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyStats = () => {
    const stats = {
      totalReservations: reservations.length,
      totalRevenue: reservations.reduce((sum, r) => sum + r.total_cost, 0),
      singlesCount: reservations.filter((r) => r.game_type === "singles").length,
      doublesCount: reservations.filter((r) => r.game_type === "doubles").length,
      courtUsage: {} as Record<string, number>,
    }

    // Calcular uso por cancha
    reservations.forEach((r) => {
      const courtName = r.court?.name || `Cancha ${r.court_id}`
      stats.courtUsage[courtName] = (stats.courtUsage[courtName] || 0) + 1
    })

    return stats
  }

  const stats = getMonthlyStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="outline" onClick={onBack} className="mr-4 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Salir
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-sm text-gray-600">Club Belgrano Tennis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reservations">
              <Calendar className="h-4 w-4 mr-2" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Mail className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestión de Reservas</h2>
              <div className="flex items-center gap-4">
                <Label htmlFor="month">Mes:</Label>
                <Input
                  id="month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  </div>
                ) : reservations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay reservas para este mes</p>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div key={reservation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">
                                {reservation.court?.name || `Cancha ${reservation.court_id}`}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(reservation.reservation_date + "T00:00:00").toLocaleDateString("es-ES")} •
                                {reservation.start_time} - {reservation.end_time}
                              </p>
                            </div>
                            <div>
                              <Badge variant={reservation.game_type === "singles" ? "default" : "secondary"}>
                                {reservation.game_type === "singles" ? "Singles" : "Dobles"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{reservation.player_names.join(", ")}</p>
                              <p className="text-xs text-gray-600">{reservation.contact_info}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">${reservation.total_cost.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(reservation.created_at).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteReservation(reservation.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración General
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingPrices ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="infoText">Información General</Label>
                      <textarea
                        id="infoText"
                        className="w-full min-h-[120px] p-3 border rounded-md resize-vertical"
                        placeholder="Escribe aquí la información que quieras mostrar a los usuarios (precios, promociones, horarios especiales, etc.)"
                        value={newPricing.admin_email || ""}
                        onChange={(e) =>
                          setNewPricing({
                            ...newPricing,
                            admin_email: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Esta información se mostrará en lugar de los precios fijos
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdatePricing} disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPrices(false)
                          setNewPricing(pricing)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Información Actual:</h4>
                      <div className="whitespace-pre-wrap text-sm">
                        {pricing.admin_email || "No hay información configurada"}
                      </div>
                    </div>
                    <Button onClick={() => setEditingPrices(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modificar Información
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats.totalReservations}</p>
                    <p className="text-gray-600 text-sm">Total Reservas</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-gray-600 text-sm">Ingresos del Mes</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <Settings className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats.singlesCount}</p>
                    <p className="text-gray-600 text-sm">Partidos Singles</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <Settings className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{stats.doublesCount}</p>
                    <p className="text-gray-600 text-sm">Partidos Dobles</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Uso por Cancha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.courtUsage).map(([courtName, count]) => (
                    <div key={courtName} className="flex items-center justify-between">
                      <span>{courtName}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(stats.courtUsage))) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-bold">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Sistema de Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="text-blue-800">
                      <strong>Email configurado:</strong> {pricing.admin_email || "No configurado"}
                      <br />
                      Las notificaciones se envían automáticamente cuando se realiza una nueva reserva.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Información incluida en las notificaciones:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Cancha reservada</li>
                      <li>• Fecha y horario</li>
                      <li>• Tipo de juego (Singles/Dobles)</li>
                      <li>• Apellidos de los jugadores</li>
                      <li>• Teléfono de contacto</li>
                      <li>• Costo total</li>
                    </ul>
                  </div>

                  <p className="text-sm text-gray-600">
                    Para configurar el email de notificaciones, ve a la pestaña "Configuración" y modifica el campo
                    correspondiente.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
