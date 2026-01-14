import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'settings' },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const settings = await prisma.settings.upsert({
      where: { id: 'settings' },
      update: {
        storeName: body.storeName,
        storePhone: body.storePhone,
        storeEmail: body.storeEmail,
        storeAddress: body.storeAddress,
        mpesaEnabled: body.mpesaEnabled,
        mpesaPaybillNumber: body.mpesaPaybillNumber,
        mpesaAccountNumber: body.mpesaAccountNumber,
        mpesaTillNumber: body.mpesaTillNumber,
        mpesaConsumerKey: body.mpesaConsumerKey,
        mpesaConsumerSecret: body.mpesaConsumerSecret,
        mpesaPasskey: body.mpesaPasskey,
        mpesaShortcode: body.mpesaShortcode,
        manualPaymentPhone: body.manualPaymentPhone,
        manualPaymentName: body.manualPaymentName,
        manualPaymentInstructions: body.manualPaymentInstructions,
        deliveryFee: parseFloat(body.deliveryFee) || 0,
        minimumOrder: parseFloat(body.minimumOrder) || 0,
      },
      create: {
        id: 'settings',
        ...body,
        deliveryFee: parseFloat(body.deliveryFee) || 0,
        minimumOrder: parseFloat(body.minimumOrder) || 0,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
