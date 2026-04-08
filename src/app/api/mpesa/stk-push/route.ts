import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

async function getMpesaToken(consumerKey: string, consumerSecret: string): Promise<string> {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
  const res = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    }
  )
  if (!res.ok) throw new Error('Failed to get M-Pesa token')
  const data = await res.json()
  return data.access_token
}

function formatPhone(phone: string): string {
  // Normalize to 254XXXXXXXXX format
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return '254' + cleaned.slice(1)
  if (cleaned.startsWith('+254')) return cleaned.slice(1)
  if (cleaned.startsWith('254')) return cleaned
  return '254' + cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { phone, amount, orderNumber, orderId } = await request.json()

    if (!phone || !amount || !orderNumber) {
      return NextResponse.json({ error: 'phone, amount, and orderNumber are required' }, { status: 400 })
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'settings' } })

    if (!settings?.mpesaEnabled) {
      return NextResponse.json({ error: 'M-Pesa STK is not enabled' }, { status: 400 })
    }

    const { mpesaConsumerKey, mpesaConsumerSecret, mpesaPasskey, mpesaShortcode } = settings
    if (!mpesaConsumerKey || !mpesaConsumerSecret || !mpesaPasskey || !mpesaShortcode) {
      return NextResponse.json({ error: 'M-Pesa credentials not configured' }, { status: 400 })
    }

    const token = await getMpesaToken(mpesaConsumerKey, mpesaConsumerSecret)

    const now = new Date()
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')

    const password = Buffer.from(`${mpesaShortcode}${mpesaPasskey}${timestamp}`).toString('base64')
    const formattedPhone = formatPhone(phone)

    // Use NEXTAUTH_URL or fallback to localhost for callback
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/api/mpesa/callback`

    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: mpesaShortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerBuyGoodsOnline',
          Amount: Math.ceil(amount),
          PartyA: formattedPhone,
          PartyB: mpesaShortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: orderNumber,
          TransactionDesc: `Payment for ${orderNumber}`,
        }),
      }
    )

    const stkData = await stkRes.json()

    if (stkData.ResponseCode !== '0') {
      return NextResponse.json(
        { error: stkData.ResponseDescription || 'STK push failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      checkoutRequestID: stkData.CheckoutRequestID,
      merchantRequestID: stkData.MerchantRequestID,
      message: 'STK push sent. Waiting for customer to complete payment.',
    })
  } catch (error) {
    console.error('M-Pesa STK error:', error)
    return NextResponse.json({ error: 'Failed to initiate M-Pesa payment' }, { status: 500 })
  }
}
