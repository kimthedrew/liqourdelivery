import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { sendSMS, orderStatusSMS } from '@/lib/sms'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, paymentStatus, mpesaReceiptNo } = body

    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (mpesaReceiptNo !== undefined) updateData.mpesaReceiptNo = mpesaReceiptNo

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    // Notify customer on meaningful status changes
    if (status && ['confirmed', 'preparing', 'delivered', 'cancelled'].includes(status)) {
      const settings = await prisma.settings.findUnique({ where: { id: 'settings' } })
      sendSMS(
        order.customerPhone,
        orderStatusSMS(order.orderNumber, status, settings?.storeName || 'Liquor Store')
      ).catch(() => {})
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
