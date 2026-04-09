import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Allow access to login page without authentication
  // The actual page components handle their own auth check

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {session ? (
        <div className="flex min-w-0">
          <AdminSidebar />
          <main className="flex-1 min-w-0 md:ml-64 p-4 md:p-8 pt-16 md:pt-8">{children}</main>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
