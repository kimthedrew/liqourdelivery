import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `POS-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      customerName = 'Walk-in Customer',
      customerPhone = '0000000000',
      customerEmail,
      items,
      paymentMethod = 'cash',
      mpesaReceiptNo,
      discount = 0,
    } = body

    if (!items?.length) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    let subtotal = 0
    const orderItems: { productId: string; quantity: number; price: number }[] = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } })

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
      }
      if (!product.inStock) {
        return NextResponse.json({ error: `Out of stock: ${product.name}` }, { status: 400 })
      }
      if (product.quantity > 0 && product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for: ${product.name} (available: ${product.quantity})` },
          { status: 400 }
        )
      }

      subtotal += product.price * item.quantity
      orderItems.push({ productId: product.id, quantity: item.quantity, price: product.price })
    }

    const totalAmount = Math.max(0, subtotal - discount)

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          customerName,
          customerPhone,
          customerEmail,
          customerAddress: 'Walk-in / In-Store',
          totalAmount,
          paymentMethod,
          paymentStatus: paymentMethod === 'cash' || mpesaReceiptNo ? 'paid' : 'pending',
          status: 'delivered',
          mpesaReceiptNo: mpesaReceiptNo || null,
          items: { create: orderItems },
        },
        include: {
          items: { include: { product: true } },
        },
      })

      // Decrement inventory
      for (const item of orderItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (product && product.quantity > 0) {
          const newQty = Math.max(0, product.quantity - item.quantity)
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: newQty, inStock: newQty > 0 },
          })
        }
      }

      return newOrder
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('POS order error:', error)
    return NextResponse.json({ error: 'Failed to create POS order' }, { status: 500 })
  }
}
