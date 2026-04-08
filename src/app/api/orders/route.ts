import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendSMS, orderPlacedCustomerSMS, orderPlacedAdminSMS } from '@/lib/sms'

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

      if (product.quantity > 0 && product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for: ${product.name} (available: ${product.quantity})` },
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

    // Create order and decrement inventory atomically
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
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

      // Decrement stock for each product
      for (const item of orderItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (product && product.quantity > 0) {
          const newQty = Math.max(0, product.quantity - item.quantity)
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: newQty,
              inStock: newQty > 0,
            },
          })
        }
      }

      return newOrder
    })

    // Send SMS notifications (non-blocking — don't fail order if SMS fails)
    const storeName = settings?.storeName || 'Liquor Store'
    const storePhone = settings?.storePhone

    Promise.all([
      sendSMS(order.customerPhone, orderPlacedCustomerSMS(order.orderNumber, order.totalAmount, storeName)),
      storePhone
        ? sendSMS(storePhone, orderPlacedAdminSMS(order.orderNumber, order.customerName, order.customerPhone, order.totalAmount))
        : Promise.resolve(),
    ]).catch(() => {}) // swallow — order is already created

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
