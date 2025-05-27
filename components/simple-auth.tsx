"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SimpleAuthProps {
  onLogin: (player: any) => void
}

export function SimpleAuth({ onLogin }: SimpleAuthProps) {
  const [name, setName] = useState("")
  const [position, setPosition] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && position) {
      const player = {
        id: Math.random().toString(),
        first_name: name.split(" ")[0] || name,
        last_name: name.split(" ")[1] || "",
        ranking_position: Number.parseInt(position),
        email: `${name.toLowerCase().replace(" ", "")}@club.com`,
      }
      onLogin(player)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-700">🎾 Club de Tenis</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input placeholder="Tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Tu posición en el ranking"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                min="1"
                max="200"
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar al Club
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
