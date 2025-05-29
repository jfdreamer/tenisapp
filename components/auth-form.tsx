"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Player } from "@/types/tennis"
import { AdminLogin } from "./admin-login"

interface AuthFormProps {
  onAuthSuccess: (player: Player) => void
  onAdminLogin: () => void
}

export function AuthForm({ onAuthSuccess, onAdminLogin }: AuthFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [searchResults, setSearchResults] = useState<Player[]>([])

  const [loginData, setLoginData] = useState({
    firstName: "",
    lastName: "",
  })

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    rankingPosition: "",
  })

  const handleSearch = async () => {
    if (!loginData.firstName.trim() && !loginData.lastName.trim()) {
      setError("Ingresa al menos el nombre o apellido")
      return
    }

    setLoading(true)
    setError("")
    setSearchResults([])

    try {
      let query = supabase.from("players").select("*").neq("is_admin", true)

      // Buscar por nombre y/o apellido (case insensitive)
      if (loginData.firstName.trim() && loginData.lastName.trim()) {
        query = query
          .ilike("first_name", `%${loginData.firstName.trim()}%`)
          .ilike("last_name", `%${loginData.lastName.trim()}%`)
      } else if (loginData.firstName.trim()) {
        query = query.ilike("first_name", `%${loginData.firstName.trim()}%`)
      } else if (loginData.lastName.trim()) {
        query = query.ilike("last_name", `%${loginData.lastName.trim()}%`)
      }

      const { data, error } = await query.order("ranking_position", { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        setError("No se encontró ningún jugador con ese nombre")
        return
      }

      setSearchResults(data)
    } catch (error: any) {
      console.error("Error searching player:", error)
      setError(error.message || "Error al buscar jugador")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlayer = (player: Player) => {
    onAuthSuccess(player)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validar datos antes de enviar
      if (!registerData.firstName || !registerData.lastName || !registerData.rankingPosition) {
        throw new Error("Todos los campos son obligatorios")
      }

      const rankingPos = Number.parseInt(registerData.rankingPosition)
      if (isNaN(rankingPos) || rankingPos < 1 || rankingPos > 200) {
        throw new Error("La posición del ranking debe ser un número entre 1 y 200")
      }

      // Verificar si ya existe un jugador con el mismo nombre
      const { data: existingPlayer } = await supabase
        .from("players")
        .select("*")
        .ilike("first_name", registerData.firstName.trim())
        .ilike("last_name", registerData.lastName.trim())
        .single()

      if (existingPlayer) {
        throw new Error("Ya existe un jugador con ese nombre y apellido")
      }

      // Crear perfil de jugador directamente
      const playerData = {
        email: `${registerData.firstName.toLowerCase()}.${registerData.lastName.toLowerCase()}@btc.local`,
        first_name: registerData.firstName.trim(),
        last_name: registerData.lastName.trim(),
        ranking_position: rankingPos,
        is_admin: false,
      }

      console.log("Insertando jugador:", playerData)

      const { data: newPlayer, error: playerError } = await supabase
        .from("players")
        .insert([playerData])
        .select()
        .single()

      if (playerError) {
        console.error("Error creando perfil:", playerError)
        throw new Error(`Error al crear el perfil: ${playerError.message}`)
      }

      if (!newPlayer) {
        throw new Error("No se pudo crear el perfil del jugador")
      }

      setSuccess("¡Registro exitoso! Ingresando al sistema...")

      // Login automático
      setTimeout(() => {
        onAuthSuccess(newPlayer)
      }, 1500)
    } catch (error: any) {
      console.error("Error completo en registro:", error)
      setError(error.message || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  if (showAdminLogin) {
    return <AdminLogin onAdminLogin={onAdminLogin} onBack={() => setShowAdminLogin(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/images/btc-logo.png" alt="Belgrano Tennis Challenge" className="mx-auto h-20 w-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Belgrano Tennis Challenge</h2>
          <p className="mt-2 text-sm text-gray-600">Sistema de Desafíos de Tenis</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acceso al Sistema</CardTitle>
            <CardDescription>Busca tu nombre o regístrate para participar en los desafíos</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Buscar mi Nombre</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={loginData.firstName}
                      onChange={(e) => setLoginData({ ...loginData, firstName: e.target.value })}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={loginData.lastName}
                      onChange={(e) => setLoginData({ ...loginData, lastName: e.target.value })}
                      placeholder="Tu apellido"
                    />
                  </div>
                  <Button onClick={handleSearch} className="w-full" disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    {loading ? "Buscando..." : "Buscar mi Nombre"}
                  </Button>
                </div>

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selecciona tu perfil:</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults.map((player) => (
                        <Button
                          key={player.id}
                          variant="outline"
                          className="w-full justify-between h-auto p-3"
                          onClick={() => handleSelectPlayer(player)}
                        >
                          <div className="text-left">
                            <p className="font-medium">
                              {player.first_name} {player.last_name}
                            </p>
                            <p className="text-sm text-gray-600">Ranking #{player.ranking_position}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registerFirstName">Nombre</Label>
                      <Input
                        id="registerFirstName"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerLastName">Apellido</Label>
                      <Input
                        id="registerLastName"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rankingPosition">Posición en Ranking Actual</Label>
                    <Input
                      id="rankingPosition"
                      type="number"
                      min="1"
                      max="200"
                      value={registerData.rankingPosition}
                      onChange={(e) => setRegisterData({ ...registerData, rankingPosition: e.target.value })}
                      placeholder="Ej: 15"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Ingresa tu posición actual aproximada en el ranking del club
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registrando..." : "Registrarse"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAdminLogin(true)} className="w-full">
                <Crown className="h-4 w-4 mr-2" />
                Acceso de Administrador
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
