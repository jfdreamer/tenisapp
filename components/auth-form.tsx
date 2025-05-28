"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown } from "lucide-react"
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

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    rankingPosition: "",
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      if (data.user) {
        // Obtener datos del jugador
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("*")
          .eq("email", data.user.email)
          .single()

        if (playerError) throw playerError

        onAuthSuccess(playerData)
      }
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Registrar usuario en Supabase Auth sin confirmación de email
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: undefined, // Esto evita el redirect de confirmación
        },
      })

      if (error) throw error

      if (data.user) {
        // Crear perfil de jugador inmediatamente
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .insert([
            {
              email: registerData.email,
              first_name: registerData.firstName,
              last_name: registerData.lastName,
              ranking_position: Number.parseInt(registerData.rankingPosition),
            },
          ])
          .select()
          .single()

        if (playerError) {
          console.error("Error creando perfil:", playerError)
          throw new Error("Error al crear el perfil de jugador")
        }

        setSuccess("¡Registro exitoso! Ingresando al sistema...")

        // Login automático inmediato
        setTimeout(() => {
          onAuthSuccess(playerData)
        }, 1000)
      }
    } catch (error: any) {
      console.error("Error completo:", error)
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
            <CardDescription>Inicia sesión o regístrate para participar en los desafíos</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail">Email</Label>
                    <Input
                      id="registerEmail"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">Contraseña</Label>
                    <Input
                      id="registerPassword"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
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
