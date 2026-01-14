'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useState } from 'react'

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  imageUrl?: string | null
  inStock: boolean
  category?: string
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  imageUrl,
  inStock,
  category,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  const cartItem = items.find((item) => item.id === id)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({ id, name, price, imageUrl })
    }
    setQuantity(1)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${slug}`}>
        <div className="relative h-48 bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-4"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <ShoppingCart className="h-16 w-16" />
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {category && (
          <span className="text-xs text-amber-600 font-medium uppercase tracking-wide">
            {category}
          </span>
        )}
        <Link href={`/products/${slug}`}>
          <h3 className="text-lg font-semibold text-gray-900 mt-1 hover:text-amber-600 transition-colors">
            {name}
          </h3>
        </Link>
        <p className="text-2xl font-bold text-amber-600 mt-2">
          KSh {price.toLocaleString()}
        </p>

        {inStock ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-medium w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>
            {cartItem && (
              <p className="text-sm text-center text-gray-500">
                {cartItem.quantity} in cart
              </p>
            )}
          </div>
        ) : (
          <button
            disabled
            className="w-full mt-4 bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  )
}
