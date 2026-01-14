import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items,
      paymentMethod = 'manual',
    } = body

    if (!customerName || !customerPhone || !customerAddress || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate products and calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.id}` },
          { status: 400 }
        )
      }

      if (!product.inStock) {
        return NextResponse.json(
          { error: `Product out of stock: ${product.name}` },
          { status: 400 }
        )
      }

      totalAmount += product.price * item.quantity
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      })
    }

    // Get delivery fee from settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    })
    const deliveryFee = settings?.deliveryFee || 0
    totalAmount += deliveryFee

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        totalAmount,
        paymentMethod,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get('orderNumber')
    const phone = searchParams.get('phone')

    if (!orderNumber && !phone) {
      return NextResponse.json(
        { error: 'Order number or phone required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {}
    if (orderNumber) where.orderNumber = orderNumber
    if (phone) where.customerPhone = phone

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
