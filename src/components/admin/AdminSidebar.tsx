'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Store,
} from 'lucide-react'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <Store className="h-8 w-8 text-amber-500" />
          <div>
            <span className="text-xl font-bold text-amber-500">Liquor</span>
            <span className="text-xl font-light">Admin</span>
          </div>
        </Link>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <Link
          href="/"
          className="flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
        >
          <Store className="h-5 w-5 mr-3" />
          View Store
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
