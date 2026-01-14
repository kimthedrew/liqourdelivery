'use client'

import { useEffect, useState } from 'react'
import { Save, Store, CreditCard, Truck, Eye, EyeOff } from 'lucide-react'

interface Settings {
  id: string
  storeName: string
  storePhone: string
  storeEmail: string
  storeAddress: string
  mpesaEnabled: boolean
  mpesaPaybillNumber: string
  mpesaAccountNumber: string
  mpesaTillNumber: string
  mpesaConsumerKey: string
  mpesaConsumerSecret: string
  mpesaPasskey: string
  mpesaShortcode: string
  manualPaymentPhone: string
  manualPaymentName: string
  manualPaymentInstructions: string
  deliveryFee: number
  minimumOrder: number
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showCredentials, setShowCredentials] = useState({
    consumerKey: false,
    consumerSecret: false,
    passkey: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Store className="h-5 w-5 text-amber-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Store Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Phone
              </label>
              <input
                type="tel"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Email
              </label>
              <input
                type="email"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Address
              </label>
              <input
                type="text"
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Truck className="h-5 w-5 text-amber-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Delivery Settings</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Fee (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={settings.deliveryFee}
                onChange={(e) =>
                  setSettings({ ...settings, deliveryFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={settings.minimumOrder}
                onChange={(e) =>
                  setSettings({ ...settings, minimumOrder: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 text-amber-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Payment Settings</h2>
          </div>

          {/* Manual Payment */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Manual Payment (Always Active)</h3>
            <p className="text-sm text-gray-500 mb-4">
              These details will be shown to customers when they checkout
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Name (e.g., your name or store name)
                </label>
                <input
                  type="text"
                  value={settings.manualPaymentName}
                  onChange={(e) =>
                    setSettings({ ...settings, manualPaymentName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.manualPaymentPhone}
                  onChange={(e) =>
                    setSettings({ ...settings, manualPaymentPhone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="0712345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paybill Number (optional)
                </label>
                <input
                  type="text"
                  value={settings.mpesaPaybillNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, mpesaPaybillNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number (for Paybill)
                </label>
                <input
                  type="text"
                  value={settings.mpesaAccountNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, mpesaAccountNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Account123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Till Number (optional)
                </label>
                <input
                  type="text"
                  value={settings.mpesaTillNumber}
                  onChange={(e) =>
                    setSettings({ ...settings, mpesaTillNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  placeholder="123456"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Payment Instructions
              </label>
              <textarea
                value={settings.manualPaymentInstructions}
                onChange={(e) =>
                  setSettings({ ...settings, manualPaymentInstructions: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                placeholder="Send payment to the number above and include your order number as reference..."
              />
            </div>
          </div>

          {/* M-Pesa STK Push */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">M-Pesa STK Push</h3>
                <p className="text-sm text-gray-500">
                  Enable automatic payment prompts on customer phones
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mpesaEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, mpesaEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {settings.mpesaEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  To enable M-Pesa STK Push, you need credentials from Safaricom Daraja API.
                  Visit{' '}
                  <a
                    href="https://developer.safaricom.co.ke/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    developer.safaricom.co.ke
                  </a>{' '}
                  to get your API credentials.
                </p>
              </div>
            )}

            {settings.mpesaEnabled && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumer Key
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials.consumerKey ? 'text' : 'password'}
                      value={settings.mpesaConsumerKey}
                      onChange={(e) =>
                        setSettings({ ...settings, mpesaConsumerKey: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials({ ...showCredentials, consumerKey: !showCredentials.consumerKey })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials.consumerKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumer Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials.consumerSecret ? 'text' : 'password'}
                      value={settings.mpesaConsumerSecret}
                      onChange={(e) =>
                        setSettings({ ...settings, mpesaConsumerSecret: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials({ ...showCredentials, consumerSecret: !showCredentials.consumerSecret })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials.consumerSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passkey
                  </label>
                  <div className="relative">
                    <input
                      type={showCredentials.passkey ? 'text' : 'password'}
                      value={settings.mpesaPasskey}
                      onChange={(e) =>
                        setSettings({ ...settings, mpesaPasskey: e.target.value })
                      }
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials({ ...showCredentials, passkey: !showCredentials.passkey })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCredentials.passkey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shortcode
                  </label>
                  <input
                    type="text"
                    value={settings.mpesaShortcode}
                    onChange={(e) =>
                      setSettings({ ...settings, mpesaShortcode: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-black font-semibold py-3 px-8 rounded-lg transition-colors flex items-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
