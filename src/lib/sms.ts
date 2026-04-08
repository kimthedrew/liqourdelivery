/**
 * Africa's Talking SMS integration
 *
 * Required env vars:
 *   AT_USERNAME   – your Africa's Talking username (use "sandbox" for testing)
 *   AT_API_KEY    – your Africa's Talking API key
 *
 * Sandbox: messages are not delivered to real phones but visible in the AT dashboard.
 * Production: set AT_USERNAME to your registered username.
 */

const AT_BASE = process.env.AT_ENV === 'production'
  ? 'https://api.africastalking.com'
  : 'https://api.sandbox.africastalking.com'

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1)
  if (cleaned.startsWith('254')) return '+' + cleaned
  if (cleaned.startsWith('+254')) return cleaned
  return '+254' + cleaned
}

export async function sendSMS(to: string | string[], message: string): Promise<boolean> {
  const username = process.env.AT_USERNAME
  const apiKey = process.env.AT_API_KEY

  if (!username || !apiKey) {
    // SMS not configured — log and continue without throwing
    console.log('[SMS not configured] Would send to', to, ':', message)
    return false
  }

  const recipients = Array.isArray(to) ? to.map(formatPhone) : [formatPhone(to)]

  try {
    const body = new URLSearchParams({
      username,
      to: recipients.join(','),
      message,
    })

    const res = await fetch(`${AT_BASE}/version1/messaging`, {
      method: 'POST',
      headers: {
        apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      console.error('[SMS] Failed:', await res.text())
      return false
    }

    return true
  } catch (err) {
    console.error('[SMS] Error:', err)
    return false
  }
}

// ─── Pre-built message templates ─────────────────────────────────────────────

export function orderPlacedCustomerSMS(orderNumber: string, total: number, storeName: string): string {
  return `Hi! Your order ${orderNumber} has been placed with ${storeName}. Total: KSh ${total.toLocaleString()}. We'll contact you for delivery. Save this number for updates.`
}

export function orderPlacedAdminSMS(
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  total: number
): string {
  return `NEW ORDER: ${orderNumber}\nCustomer: ${customerName} (${customerPhone})\nTotal: KSh ${total.toLocaleString()}\nCheck admin panel for details.`
}

export function orderStatusSMS(orderNumber: string, status: string, storeName: string): string {
  const messages: Record<string, string> = {
    confirmed: `Your order ${orderNumber} has been confirmed by ${storeName} and is being processed.`,
    preparing: `Great news! Your order ${orderNumber} is now being prepared for delivery.`,
    delivered: `Your order ${orderNumber} has been delivered. Thank you for shopping with ${storeName}!`,
    cancelled: `Your order ${orderNumber} has been cancelled. Contact us if you have questions.`,
  }
  return messages[status] || `Your order ${orderNumber} status has been updated to: ${status}.`
}
