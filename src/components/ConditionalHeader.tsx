'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  // Don't show the public header on admin or auth pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null
  return <Header />
}
