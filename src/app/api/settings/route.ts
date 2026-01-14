import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'settings' },
      })
    }

    // Return only public settings (hide M-Pesa credentials)
    return NextResponse.json({
      storeName: settings.storeName,
      storePhone: settings.storePhone,
      storeEmail: settings.storeEmail,
      storeAddress: settings.storeAddress,
      mpesaEnabled: settings.mpesaEnabled,
      mpesaPaybillNumber: settings.mpesaPaybillNumber,
      mpesaAccountNumber: settings.mpesaAccountNumber,
      mpesaTillNumber: settings.mpesaTillNumber,
      manualPaymentPhone: settings.manualPaymentPhone,
      manualPaymentName: settings.manualPaymentName,
      manualPaymentInstructions: settings.manualPaymentInstructions,
      deliveryFee: settings.deliveryFee,
      minimumOrder: settings.minimumOrder,
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
