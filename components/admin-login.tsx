"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Crown, ArrowLeft } from "lucide-react"

interface AdminLoginProps {
  onAdminLogin: () => void
  onBack: () => void
}

export function AdminLogin({ onAdminLogin, onBack }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Credenciales fijas para admin
    if (credentials.username === "admin" && credentials.password === "123456") {
      // Guardar en localStorage que es admin
      localStorage.setItem("isAdmin", "true")
      onAdminLogin()
    } else {
      setError("Usuario o contraseña incorrectos")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Acceso de Administrador</CardTitle>
            <p className="text-gray-600">Panel de gestión del Belgrano Tennis Challenge</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Ingresar como Admin"}
              </Button>
            </form>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Login Normal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
