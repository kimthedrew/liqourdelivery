'use client'

import { useCartStore } from '@/store/cart'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Settings {
  deliveryFee: number
  minimumOrder: number
}

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)

  const [settings, setSettings] = useState<Settings>({ deliveryFee: 0, minimumOrder: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getTotalPrice()
  const deliveryFee = subtotal >= settings.minimumOrder ? settings.deliveryFee : 0
  const total = subtotal + deliveryFee
  const belowMinimum = subtotal > 0 && subtotal < settings.minimumOrder

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-12">
            <ShoppingCart className="h-24 w-24 mx-auto text-gray-300 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some drinks to get started!</p>
            <Link
              href="/products"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center"
            >
              Browse Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4"
              >
                <div className="relative h-20 w-20 bg-gray-100 rounded-lg flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-amber-600 font-bold">
                    KSh {item.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600 mt-1"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    KSh {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900">
                    KSh {deliveryFee.toLocaleString()}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-amber-600">KSh {total.toLocaleString()}</span>
                </div>
              </div>

              {belowMinimum && (
                <p className="text-red-500 text-sm mt-4">
                  Minimum order is KSh {settings.minimumOrder.toLocaleString()}. Add KSh{' '}
                  {(settings.minimumOrder - subtotal).toLocaleString()} more to checkout.
                </p>
              )}

              <Link
                href={belowMinimum ? '#' : '/checkout'}
                className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-center block ${
                  belowMinimum
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-black'
                }`}
                onClick={(e) => belowMinimum && e.preventDefault()}
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="w-full mt-3 py-3 px-4 rounded-lg font-semibold text-center block border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
