'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User, Menu, X, LogOut, Package } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { useCustomerStore } from '@/store/customer'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const totalItems = useCartStore((state) => state.getTotalItems())
  const customer = useCustomerStore((state) => state.customer)
  const clearCustomer = useCustomerStore((state) => state.clearCustomer)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleSignOut = () => {
    clearCustomer()
    setIsUserMenuOpen(false)
    router.push('/')
  }

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-amber-500">Liquor</span>
            <span className="text-2xl font-light">Delivery</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search drinks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-gray-400"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </form>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/products" className="hover:text-amber-500 transition-colors">
              Browse
            </Link>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              {customer ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 hover:text-amber-500 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{customer.name.split(' ')[0]}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 w-52 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                        <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                      </div>
                      <Link
                        href="/account/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/auth/login" className="hover:text-amber-500 transition-colors">
                  <User className="h-6 w-6" />
                </Link>
              )}
            </div>

            <Link href="/cart" className="relative hover:text-amber-500 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </nav>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 text-white placeholder-gray-400"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>
            <nav className="flex flex-col space-y-3">
              <Link
                href="/products"
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-amber-500 transition-colors"
              >
                Browse All
              </Link>
              {customer ? (
                <>
                  <Link
                    href="/account/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="hover:text-amber-500 transition-colors"
                  >
                    My Orders ({customer.name.split(' ')[0]})
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false) }}
                    className="text-left hover:text-red-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-amber-500 transition-colors"
                >
                  Account
                </Link>
              )}
              <Link
                href="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="hover:text-amber-500 transition-colors flex items-center"
              >
                Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
