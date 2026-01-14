import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, address } = body

    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, password, name, and phone are required' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        address: address || null,
      },
    })

    return NextResponse.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    )
  }
}
