'use client'

import { useEffect, useState, useRef } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, Printer, X, Check, Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  price: number
  imageUrl: string | null
  inStock: boolean
  quantity: number
  category: Category
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
  maxQty: number
}

interface CompletedOrder {
  orderNumber: string
  customerName: string
  customerPhone: string
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  mpesaReceiptNo: string
  createdAt: string
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'mpesa_till', label: 'M-Pesa Till' },
  { id: 'mpesa_stk', label: 'M-Pesa STK' },
]

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [mpesaReceipt, setMpesaReceipt] = useState('')
  const [discount, setDiscount] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null)
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
    // Focus search on mount (desktop only)
    if (window.innerWidth >= 768) setTimeout(() => searchRef.current?.focus(), 100)
  }, [])

  // Keyboard shortcut: F2 = focus search, F12 = complete sale
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products?inStock=true'),
        fetch('/api/categories'),
      ])
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || p.category.slug === activeCategory
    return matchSearch && matchCat
  })

  const addToCart = (product: Product) => {
    if (window.innerWidth < 768) setMobileTab('cart')
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        if (product.quantity > 0 && existing.quantity >= product.quantity) return prev
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
          maxQty: product.quantity,
        },
      ]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id !== id) return i
          const newQty = i.quantity + delta
          if (newQty <= 0) return null as unknown as CartItem
          if (i.maxQty > 0 && newQty > i.maxQty) return i
          return { ...i, quantity: newQty }
        })
        .filter(Boolean)
    )
  }

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id))
  const clearCart = () => { setCart([]); setCustomerName(''); setCustomerPhone(''); setMpesaReceipt(''); setDiscount('') }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)

  const completeSale = async () => {
    if (cart.length === 0) return
    if ((paymentMethod === 'mpesa_till' || paymentMethod === 'mpesa_stk') && !mpesaReceipt) {
      alert('Please enter the M-Pesa receipt number')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || '0000000000',
          items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
          paymentMethod,
          mpesaReceiptNo: mpesaReceipt || undefined,
          discount: discountAmt,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to complete sale')
      }

      const order = await res.json()
      setCompletedOrder({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: [...cart],
        subtotal,
        discount: discountAmt,
        total,
        paymentMethod,
        mpesaReceiptNo: mpesaReceipt,
        createdAt: order.createdAt,
      })

      // Refresh products to get updated stock
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to complete sale')
    } finally {
      setSubmitting(false)
    }
  }

  const printReceipt = () => window.print()

  const newSale = () => {
    clearCart()
    setCompletedOrder(null)
    setPaymentMethod('cash')
    setTimeout(() => searchRef.current?.focus(), 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt { position: fixed; top: 0; left: 0; width: 80mm; font-size: 12px; }
        }
      `}</style>

      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-b border-gray-200 bg-white -mx-4 -mt-16 pt-16 mb-0 sticky top-0 z-10">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            mobileTab === 'products'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-gray-500'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            mobileTab === 'cart'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-gray-500'
          }`}
        >
          Cart
          {cart.length > 0 && (
            <span className="ml-1 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-0px)] -mx-4 md:-m-8 mt-0">
        {/* Left: Product Browser */}
        <div className={`flex-1 flex flex-col bg-gray-50 overflow-hidden ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
          {/* Search + category bar */}
          <div className="bg-white border-b border-gray-200 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products… (F2)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.slug
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Package className="h-12 w-12 mb-2" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const inCart = cart.find((i) => i.id === product.id)
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`bg-white rounded-xl border-2 p-3 text-left hover:border-amber-400 hover:shadow-md transition-all group ${
                        inCart ? 'border-amber-400 shadow-sm' : 'border-gray-100'
                      }`}
                    >
                      <div className="aspect-square bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <Package className="h-10 w-10 text-gray-300" />
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-amber-600 font-bold mt-1">
                        KSh {product.price.toLocaleString()}
                      </p>
                      {product.quantity > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">Stock: {product.quantity}</p>
                      )}
                      {inCart && (
                        <div className="mt-1">
                          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {inCart.quantity} in cart
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <div className={`w-full md:w-96 bg-white border-l border-gray-200 flex flex-col ${mobileTab === 'products' ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-gray-900">Current Sale</h2>
              {cart.length > 0 && (
                <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                <ShoppingCart className="h-12 w-12 mb-2" />
                <p className="text-sm">Tap a product to add it</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        KSh {item.price.toLocaleString()} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900 w-20 text-right">
                      KSh {(item.price * item.quantity).toLocaleString()}
                    </p>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout section */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Customer (optional) */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-900 placeholder-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Discount (KSh):</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-900"
              />
            </div>

            {/* Payment method */}
            <div className="grid grid-cols-3 gap-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    paymentMethod === pm.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            {/* M-Pesa receipt number */}
            {(paymentMethod === 'mpesa_till' || paymentMethod === 'mpesa_stk') && (
              <input
                type="text"
                placeholder="M-Pesa receipt number *"
                value={mpesaReceipt}
                onChange={(e) => setMpesaReceipt(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 placeholder-gray-400 font-mono"
              />
            )}

            {/* Totals */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>KSh {subtotal.toLocaleString()}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>- KSh {discountAmt.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>TOTAL</span>
                <span className="text-amber-600">KSh {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Complete Sale */}
            <button
              onClick={completeSale}
              disabled={cart.length === 0 || submitting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Check className="h-6 w-6" />
                  Complete Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6 text-center border-b border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sale Complete!</h2>
              <p className="text-amber-600 font-mono font-medium mt-1">{completedOrder.orderNumber}</p>
            </div>

            {/* Printable receipt */}
            <div id="receipt" className="p-6 font-mono text-sm text-gray-900">
              <div className="text-center mb-4">
                <p className="font-bold text-lg tracking-widest">RECEIPT</p>
                <p className="text-gray-600 text-xs mt-1">{new Date(completedOrder.createdAt).toLocaleString()}</p>
                <p className="text-gray-700 text-xs font-medium">{completedOrder.orderNumber}</p>
              </div>
              <div className="border-t border-dashed border-gray-400 pt-3 mb-3">
                {completedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-800 mb-1.5">
                    <span className="flex-1 truncate font-medium">{item.name}</span>
                    <span className="ml-2 whitespace-nowrap text-gray-600">
                      {item.quantity}×{item.price.toLocaleString()}
                    </span>
                    <span className="ml-2 w-16 text-right font-semibold">
                      {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-700">
                  <span>Subtotal</span>
                  <span>KSh {completedOrder.subtotal.toLocaleString()}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs text-green-700 font-medium">
                    <span>Discount</span>
                    <span>- KSh {completedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-300">
                  <span>TOTAL</span>
                  <span>KSh {completedOrder.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-700 pt-1">
                  <span>Payment</span>
                  <span className="capitalize font-medium">{completedOrder.paymentMethod.replace('_', ' ')}</span>
                </div>
                {completedOrder.mpesaReceiptNo && (
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>M-Pesa Ref</span>
                    <span className="font-medium">{completedOrder.mpesaReceiptNo}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={printReceipt}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={newSale}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
