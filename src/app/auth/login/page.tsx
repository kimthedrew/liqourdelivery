'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Registration failed')
        }

        setSuccess('Account created! You can now login.')
        setMode('login')
        setFormData({ ...formData, password: '' })
      } else {
        // For login, we'll store customer info in localStorage for now
        // In a full implementation, you'd use NextAuth with a customer provider
        const res = await fetch('/api/auth/customer-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Login failed')
        }

        const customer = await res.json()
        localStorage.setItem('customer', JSON.stringify(customer))
        router.push('/checkout')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600 mt-2">
            {mode === 'login'
              ? 'Sign in to your account for faster checkout'
              : 'Register for faster checkout and order tracking'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                      placeholder="John Doe"
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                      placeholder="0712345678"
                    />
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="john@example.com"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address (optional)
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Your default delivery address..."
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('register')
                    setError('')
                    setSuccess('')
                  }}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setSuccess('')
                  }}
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/checkout"
              className="text-gray-600 hover:text-amber-600 text-sm"
            >
              Continue as guest →
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/admin/login"
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
