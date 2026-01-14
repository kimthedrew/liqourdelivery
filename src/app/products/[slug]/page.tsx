'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/store/cart'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  imageUrl: string | null
  inStock: boolean
  quantity: number
  category: {
    id: string
    name: string
    slug: string
  }
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [slug, setSlug] = useState<string>('')

  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items)

  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (!slug) return

    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products?slug=${slug}`)
        const products = await res.json()
        if (products.length > 0) {
          setProduct(products[0])
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const cartItem = product ? items.find((item) => item.id === product.id) : null

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      })
    }
    setQuantity(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-200 rounded-lg h-96"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link
            href="/products"
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Back to products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center text-gray-600 hover:text-amber-600 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to products
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="relative h-96 md:h-full bg-gray-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="h-24 w-24" />
                </div>
              )}
              {!product.inStock && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold text-2xl">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-8">
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-sm text-amber-600 font-medium uppercase tracking-wide hover:text-amber-700"
              >
                {product.category.name}
              </Link>

              <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>

              <p className="text-4xl font-bold text-amber-600 mt-4">
                KSh {product.price.toLocaleString()}
              </p>

              {product.description && (
                <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>
              )}

              {product.inStock && product.quantity > 0 && (
                <p className="text-sm text-green-600 mt-4">
                  {product.quantity} in stock
                </p>
              )}

              {product.inStock ? (
                <div className="mt-8 space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-700 font-medium">Quantity:</span>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="text-xl font-medium w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 text-lg"
                  >
                    <ShoppingCart className="h-6 w-6" />
                    <span>Add to Cart - KSh {(product.price * quantity).toLocaleString()}</span>
                  </button>

                  {cartItem && (
                    <p className="text-center text-gray-500">
                      You have {cartItem.quantity} of this item in your cart
                    </p>
                  )}
                </div>
              ) : (
                <button
                  disabled
                  className="w-full mt-8 bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed text-lg"
                >
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
