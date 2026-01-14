'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const totalItems = useCartStore((state) => state.getTotalItems())

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
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
            <Link href="/auth/login" className="hover:text-amber-500 transition-colors">
              <User className="h-6 w-6" />
            </Link>
            <Link href="/cart" className="relative hover:text-amber-500 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </nav>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
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
              <Link href="/products" className="hover:text-amber-500 transition-colors">
                Browse All
              </Link>
              <Link href="/auth/login" className="hover:text-amber-500 transition-colors">
                Account
              </Link>
              <Link href="/cart" className="hover:text-amber-500 transition-colors flex items-center">
                Cart {totalItems > 0 && `(${totalItems})`}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
