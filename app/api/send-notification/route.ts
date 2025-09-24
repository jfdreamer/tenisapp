import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reservation, court, adminEmail } = body

    // Aquí puedes integrar con servicios como Resend, SendGrid, etc.
    // Por ahora, solo logueamos la información
    console.log("Nueva reserva:", {
      court: court.name,
      date: reservation.reservation_date,
      time: `${reservation.start_time} - ${reservation.end_time}`,
      gameType: reservation.game_type,
      players: reservation.player_names.join(", "),
      contact: reservation.contact_info,
      cost: reservation.total_cost,
      adminEmail,
    })

    // Simular envío de email exitoso
    // En producción, aquí irían las llamadas a tu servicio de email preferido

    return NextResponse.json({ success: true, message: "Notificación enviada" })
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ success: false, error: "Error al enviar notificación" }, { status: 500 })
  }
}
