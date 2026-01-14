import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import { Package, ShoppingBag, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'

async function getDashboardStats() {
  const [products, orders, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.findMany({
      select: {
        totalAmount: true,
        paymentStatus: true,
        status: true,
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    }),
  ])

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const totalOrders = orders.length

  return {
    products,
    totalOrders,
    pendingOrders,
    totalRevenue,
    recentOrders,
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin/login')
  }

  const stats = await getDashboardStats()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{stats.products}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Orders</p>
              <p className="text-3xl font-bold text-amber-600">{stats.pendingOrders}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                KSh {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No orders yet
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-amber-600 hover:text-amber-700 font-medium"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      KSh {order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.paymentStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
