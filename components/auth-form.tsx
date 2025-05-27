"use client"

import type React from "react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AuthFormProps {
  onAuthSuccess: (player: any) => void
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("juanfras@gmail.com")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [rankingPosition, setRankingPosition] = useState("15")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        console.log("Intentando login con:", email)

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          console.error("Error de login:", authError)
          throw new Error(`Error de login: ${authError.message}`)
        }

        console.log("Login exitoso:", authData.user?.id)

        // Obtener datos del jugador
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .select("*")
          .eq("email", email)
          .single()

        if (playerError) {
          console.error("Error obteniendo jugador:", playerError)
          throw new Error("No se encontró el perfil del jugador")
        }

        console.log("Jugador encontrado:", playerData)
        toast({ title: "¡Bienvenido de vuelta!" })
        onAuthSuccess(playerData)
      } else {
        // Registro
        console.log("Intentando registro con:", { email, firstName, lastName, rankingPosition })

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) {
          console.error("Error de registro auth:", authError)
          throw new Error(`Error de registro: ${authError.message}`)
        }

        console.log("Usuario auth creado:", authData.user?.id)

        // Crear perfil del jugador
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .insert({
            email,
            first_name: firstName,
            last_name: lastName,
            ranking_position: Number.parseInt(rankingPosition),
          })
          .select()
          .single()

        if (playerError) {
          console.error("Error creando perfil:", playerError)
          throw new Error(`Error creando perfil: ${playerError.message}`)
        }

        console.log("Perfil creado:", playerData)
        toast({ title: "¡Cuenta creada exitosamente!" })
        onAuthSuccess(playerData)
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/images/btc-logo.png" alt="BTC Logo" className="h-24 w-auto" />
          </div>
          <CardDescription>{isLogin ? "Inicia sesión" : "Crear cuenta nueva"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Tu apellido"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Posición Ranking</Label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    value={rankingPosition}
                    onChange={(e) => setRankingPosition(e.target.value)}
                    placeholder="Tu posición inicial"
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Procesando..." : isLogin ? "Entrar" : "Crear Cuenta"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "¿No tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
            </Button>
          </div>

          {/* Información de ayuda */}
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium text-blue-800">Usuario existente:</p>
            <p className="text-blue-700">Email: juanfras@gmail.com</p>
            <p className="text-blue-700">Usa tu contraseña</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
