import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Safaricom calls this URL after payment is completed or fails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { Body } = body

    if (!Body?.stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const { ResultCode, ResultDesc, CallbackMetadata, MerchantRequestID } = Body.stkCallback

    // Extract the AccountReference (order number) from metadata
    const metaItems: { Name: string; Value: string | number }[] = CallbackMetadata?.Item || []
    const receiptNumber = metaItems.find((i) => i.Name === 'MpesaReceiptNumber')?.Value as string
    const phoneNumber = metaItems.find((i) => i.Name === 'PhoneNumber')?.Value as string
    const amount = metaItems.find((i) => i.Name === 'Amount')?.Value as number

    // The AccountReference is in the STK request, not directly in callback metadata.
    // We match by phone and pending payment status.
    if (ResultCode === 0 && receiptNumber && phoneNumber) {
      // Payment succeeded — find the most recent pending order for this phone
      const phone = phoneNumber.toString()
      const normalizedPhone = phone.startsWith('254') ? '0' + phone.slice(3) : phone

      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { customerPhone: phone },
            { customerPhone: normalizedPhone },
          ],
          paymentStatus: 'pending',
          paymentMethod: 'mpesa_stk',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            mpesaReceiptNo: receiptNumber,
            status: 'confirmed',
          },
        })
      }
    } else if (ResultCode !== 0) {
      // Payment failed or was cancelled — optionally log or mark order
      console.log('M-Pesa payment failed/cancelled:', ResultDesc)
    }

    // Always acknowledge the callback to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}
