'use client'

import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Phone, CreditCard } from 'lucide-react'

interface Settings {
  deliveryFee: number
  minimumOrder: number
  mpesaEnabled: boolean
  mpesaPaybillNumber: string
  mpesaAccountNumber: string
  mpesaTillNumber: string
  manualPaymentPhone: string
  manualPaymentName: string
  manualPaymentInstructions: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)

  const [settings, setSettings] = useState<Settings | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'manual',
  })

  useEffect(() => {
    setMounted(true)
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error)
  }, [])

  if (!mounted || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !orderComplete) {
    router.push('/cart')
    return null
  }

  const subtotal = getTotalPrice()
  const deliveryFee = settings.deliveryFee
  const total = subtotal + deliveryFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerEmail: formData.email || null,
          customerAddress: formData.address,
          paymentMethod: formData.paymentMethod,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create order')
      }

      const order = await res.json()
      setOrderNumber(order.orderNumber)
      setOrderComplete(true)
      clearCart()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed!</h1>
            <p className="text-gray-600 mb-2">Your order number is:</p>
            <p className="text-2xl font-bold text-amber-600 mb-6">{orderNumber}</p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-left mb-8">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-amber-600" />
                Payment Instructions
              </h2>
              {settings.mpesaEnabled && formData.paymentMethod === 'mpesa_stk' ? (
                <p className="text-gray-600">
                  You will receive an M-Pesa prompt on your phone. Please complete the payment.
                </p>
              ) : (
                <div className="space-y-3 text-gray-600">
                  <p>
                    <strong>Pay to:</strong> {settings.manualPaymentName}
                  </p>
                  <p>
                    <strong>Phone:</strong> {settings.manualPaymentPhone}
                  </p>
                  {settings.mpesaPaybillNumber && (
                    <p>
                      <strong>Paybill:</strong> {settings.mpesaPaybillNumber}
                      {settings.mpesaAccountNumber && ` (Account: ${settings.mpesaAccountNumber})`}
                    </p>
                  )}
                  {settings.mpesaTillNumber && (
                    <p>
                      <strong>Till Number:</strong> {settings.mpesaTillNumber}
                    </p>
                  )}
                  <p>
                    <strong>Amount:</strong> KSh {total.toLocaleString()}
                  </p>
                  <p>
                    <strong>Reference:</strong> {orderNumber}
                  </p>
                  {settings.manualPaymentInstructions && (
                    <p className="mt-4 text-sm bg-gray-100 p-3 rounded">
                      {settings.manualPaymentInstructions}
                    </p>
                  )}
                </div>
              )}
            </div>

            <p className="text-gray-500 text-sm mb-6">
              We will confirm your order once payment is received. You will be contacted on{' '}
              {formData.phone} for delivery.
            </p>

            <Link
              href="/products"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center text-gray-600 hover:text-amber-600 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Details</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Enter your delivery address with landmarks..."
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>

            <div className="space-y-3">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="manual"
                  checked={formData.paymentMethod === 'manual'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Manual M-Pesa Payment</p>
                  <p className="text-sm text-gray-500">
                    Pay to {settings.manualPaymentPhone} and we&apos;ll confirm
                  </p>
                </div>
              </label>

              {settings.mpesaEnabled && (
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-amber-500 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mpesa_stk"
                    checked={formData.paymentMethod === 'mpesa_stk'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="ml-3 flex items-center">
                    <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-gray-900">M-Pesa STK Push</p>
                      <p className="text-sm text-gray-500">
                        Receive payment prompt on your phone
                      </p>
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-2 text-gray-600">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>KSh {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <hr className="my-3" />
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>KSh {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>KSh {deliveryFee.toLocaleString()}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span className="text-amber-600">KSh {total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            {loading ? 'Placing Order...' : `Place Order - KSh ${total.toLocaleString()}`}
          </button>
        </form>
      </div>
    </div>
  )
}
