"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Users, Trophy, Clock, Shield, UserPlus, DollarSign, Calendar, Target } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface RegulationsProps {
  onBack: () => void
}

export function Regulations({ onBack }: RegulationsProps) {
  const regulations = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "1. Participación",
      content: "La participación en el torneo está exclusivamente reservada para socios del club.",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: "2. Modalidad de juego",
      content: [
        "Los encuentros se disputarán de 2 sets y un super tie-break (a 10 puntos con diferencia de 2).",
        "Se jugará con sistema de ventajas.",
      ],
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "3. Sistema de desafíos y posicionamiento",
      content: [
        "Cada jugador podrá desafiar a rivales que se encuentren hasta 5 posiciones por encima en el ranking de desafíos.",
        "Si el desafiador gana el encuentro, intercambiará posición con el jugador derrotado.",
        "En caso de perder, el desafiador mantendrá su ubicación actual en el ranking.",
      ],
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "4. Plazos para la realización del desafío",
      content: [
        "Una vez emitido el desafío, habrá un plazo de 7 días corridos para concretar el partido.",
        "En caso de que el desafiador no pueda disputar el encuentro dentro de ese plazo, perderá 2 posiciones en el ranking.",
        "Si quien recibe el desafío no puede jugar dentro de los 7 días, se considerará victoria del desafiador y se intercambiarán las posiciones en el ranking.",
      ],
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "5. Ranking protegido",
      content: [
        "En caso de que un jugador no pueda disputar su desafío por razones personales justificadas, podrá solicitar ranking protegido.",
        "Esta protección será evaluada por los organizadores y solo se otorgará cuando existan causas reales, evitando su uso con fines especulativos o para eludir desafíos estratégicos.",
      ],
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "6. Inactividad",
      content:
        "Los jugadores que no hayan generado ni aceptado desafíos durante un período de 30 días serán reubicados automáticamente al final de su categoría.",
    },
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "7. Nuevos ingresos al ranking",
      content: [
        "Cualquier jugador que no se encuentre en el ranking y desee ingresar deberá enviar su solicitud a alguno de los organizadores.",
        "El ingreso será evaluado en función de su nivel de juego, y la posición inicial será determinada por la organización.",
        "El jugador será ubicado en el último puesto de la categoría que la organización considere adecuada según su nivel.",
      ],
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      title: "8. Costos",
      content: [
        "El costo de cada desafío será de $7.000 ($3.500 por jugador).",
        "En caso de requerir pelotas, el valor del desafío será de $8.000 ($4.000 por jugador).",
      ],
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "9. Uso de canchas",
      content:
        "Al finalizar el encuentro, será responsabilidad del ganador del desafío dejar la cancha cepillada y en condiciones para el siguiente turno.",
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "10. Coordinación de los desafíos",
      content: [
        "Los desafíos podrán ser coordinados directamente entre los jugadores o, si lo prefieren, a través de la organización del torneo.",
        "Además, la organización podrá proponer y organizar desafíos de manera proactiva entre jugadores, con el objetivo de fomentar la participación y mantener la continuidad del ranking.",
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Reglamento Oficial</h1>
          <p className="text-gray-600">Belgrano Tennis Challenge</p>
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/images/btc-logo.png" alt="Belgrano Tennis Challenge" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-xl text-blue-600">REGLAMENTO OFICIAL | BELGRANO TENNIS CHALLENGE</CardTitle>
          <div className="flex justify-center gap-4 text-blue-500">
            <span>🎾</span>
            <span>🎾</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {regulations.map((regulation, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">{regulation.icon}</div>
                <h3 className="font-semibold text-gray-900">{regulation.title}</h3>
              </div>
              <div className="ml-8">
                {Array.isArray(regulation.content) ? (
                  <ul className="space-y-2">
                    {regulation.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700 text-sm leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 text-sm leading-relaxed">• {regulation.content}</p>
                )}
              </div>
              {index < regulations.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
