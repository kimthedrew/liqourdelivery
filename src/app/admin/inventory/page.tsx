'use client'

import { useEffect, useState } from 'react'
import { Package, Plus, AlertTriangle, CheckCircle, Search } from 'lucide-react'

interface Product {
  id: string
  name: string
  quantity: number
  inStock: boolean
  price: number
  category: { name: string }
}

type Filter = 'all' | 'low' | 'out'

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [adjustValue, setAdjustValue] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const applyAdjustment = async (product: Product) => {
    const val = parseInt(adjustValue)
    if (isNaN(val) || val < 0) return

    let newQty: number
    if (adjustType === 'add') newQty = product.quantity + val
    else if (adjustType === 'subtract') newQty = Math.max(0, product.quantity - val)
    else newQty = val

    setSaving(true)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price.toString(),
          categoryId: '', // preserved server-side; not updated if empty
          quantity: newQty.toString(),
          inStock: newQty > 0,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchProducts()
      setAdjusting(null)
      setAdjustValue('')
    } catch {
      alert('Failed to update stock')
    } finally {
      setSaving(false)
    }
  }

  const toggleInStock = async (product: Product) => {
    try {
      await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          price: product.price.toString(),
          quantity: product.quantity.toString(),
          inStock: !product.inStock,
        }),
      })
      await fetchProducts()
    } catch {
      alert('Failed to update')
    }
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'low' && p.inStock && p.quantity > 0 && p.quantity <= 5) ||
      (filter === 'out' && (!p.inStock || p.quantity === 0))
    return matchSearch && matchFilter
  })

  const counts = {
    all: products.length,
    low: products.filter((p) => p.inStock && p.quantity > 0 && p.quantity <= 5).length,
    out: products.filter((p) => !p.inStock || p.quantity === 0).length,
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Inventory</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            <p className="text-sm text-gray-500">Total Products</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-yellow-600">{counts.low}</p>
            <p className="text-sm text-gray-500">Low Stock (≤5)</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold text-red-600">{counts.out}</p>
            <p className="text-sm text-gray-500">Out of Stock</p>
          </div>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'out'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-amber-500 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? `All (${counts.all})` : f === 'low' ? `Low (${counts.low})` : `Out (${counts.out})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  No products match
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const isLow = product.inStock && product.quantity > 0 && product.quantity <= 5
                const isOut = !product.inStock || product.quantity === 0
                return (
                  <tr key={product.id} className={`hover:bg-gray-50 ${isOut ? 'bg-red-50/30' : isLow ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">KSh {product.price.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.category.name}</td>
                    <td className="px-6 py-4">
                      {adjusting === product.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={adjustType}
                            onChange={(e) => setAdjustType(e.target.value as 'add' | 'subtract' | 'set')}
                            className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                          >
                            <option value="add">+ Add</option>
                            <option value="subtract">- Remove</option>
                            <option value="set">= Set to</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            value={adjustValue}
                            onChange={(e) => setAdjustValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') applyAdjustment(product)
                              if (e.key === 'Escape') setAdjusting(null)
                            }}
                            className="w-20 px-2 py-1 border border-amber-400 rounded text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="qty"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${
                              isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'
                            }`}
                          >
                            {product.quantity}
                          </span>
                          {isLow && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                          {isOut && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleInStock(product)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          product.inStock
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {product.inStock ? (
                          <><CheckCircle className="h-3.5 w-3.5" /> In Stock</>
                        ) : (
                          <><AlertTriangle className="h-3.5 w-3.5" /> Out of Stock</>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {adjusting === product.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => applyAdjustment(product)}
                            disabled={saving}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg disabled:opacity-50"
                          >
                            {saving ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setAdjusting(null); setAdjustValue('') }}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAdjusting(product.id); setAdjustValue(''); setAdjustType('add') }}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm rounded-lg ml-auto transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Adjust
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
