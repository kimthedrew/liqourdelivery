import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import { TrendingUp, ShoppingBag, DollarSign, Package, Users, BarChart2 } from 'lucide-react'

// ─── Data helpers ────────────────────────────────────────────────────────────

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function getAnalytics() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = daysAgo(7)
  const monthStart = daysAgo(30)

  const [allOrders, allProducts, topProductsRaw] = await Promise.all([
    prisma.order.findMany({
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
        customerAddress: true,
        createdAt: true,
        items: { select: { quantity: true, price: true, productId: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, quantity: true, inStock: true, category: { select: { name: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    }),
  ])

  const paidOrders = allOrders.filter((o) => o.paymentStatus === 'paid')
  const onlineOrders = allOrders.filter((o) => o.customerAddress !== 'Walk-in / In-Store')
  const posOrders = allOrders.filter((o) => o.customerAddress === 'Walk-in / In-Store')

  const revenue = {
    today: paidOrders.filter((o) => o.createdAt >= todayStart).reduce((s, o) => s + o.totalAmount, 0),
    week: paidOrders.filter((o) => o.createdAt >= weekStart).reduce((s, o) => s + o.totalAmount, 0),
    month: paidOrders.filter((o) => o.createdAt >= monthStart).reduce((s, o) => s + o.totalAmount, 0),
    total: paidOrders.reduce((s, o) => s + o.totalAmount, 0),
  }

  const orderStats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === 'pending').length,
    confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
    preparing: allOrders.filter((o) => o.status === 'preparing').length,
    delivered: allOrders.filter((o) => o.status === 'delivered').length,
    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
    online: onlineOrders.length,
    pos: posOrders.length,
  }

  // Last 7 days daily revenue
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const dayOrders = paidOrders.filter((o) => o.createdAt >= date && o.createdAt < nextDate)
    return {
      label: date.toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
      orders: dayOrders.length,
    }
  })

  // Top products
  const productMap = new Map(allProducts.map((p) => [p.id, p]))
  // aggregate revenue per product from order items
  const productRevenue = new Map<string, number>()
  for (const order of allOrders) {
    for (const item of order.items) {
      productRevenue.set(item.productId, (productRevenue.get(item.productId) || 0) + item.price * item.quantity)
    }
  }
  const topProducts = topProductsRaw
    .map((r) => ({
      name: productMap.get(r.productId)?.name || 'Unknown',
      category: productMap.get(r.productId)?.category.name || '',
      sold: r._sum.quantity || 0,
      revenue: productRevenue.get(r.productId) || 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Payment method breakdown
  const paymentBreakdown = PAYMENT_LABELS.map(({ id, label }) => {
    const methodOrders = paidOrders.filter((o) => o.paymentMethod === id)
    return {
      method: label,
      count: methodOrders.length,
      revenue: methodOrders.reduce((s, o) => s + o.totalAmount, 0),
    }
  }).filter((p) => p.count > 0)

  // Low stock items
  const lowStock = allProducts
    .filter((p) => p.inStock && p.quantity > 0 && p.quantity <= 5)
    .sort((a, b) => a.quantity - b.quantity)

  const outOfStock = allProducts.filter((p) => !p.inStock || p.quantity === 0)

  return { revenue, orderStats, last7Days, topProducts, paymentBreakdown, lowStock, outOfStock }
}

const PAYMENT_LABELS = [
  { id: 'cash', label: 'Cash' },
  { id: 'manual', label: 'M-Pesa Manual' },
  { id: 'mpesa_stk', label: 'M-Pesa STK' },
  { id: 'mpesa_till', label: 'M-Pesa Till' },
]

// ─── Components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ElementType
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${color}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  )
}

function BarChart({ data, maxVal }: { data: { label: string; revenue: number; orders: number }[]; maxVal: number }) {
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-700 font-medium">{d.label}</span>
            <span className="font-semibold text-gray-900">
              KSh {d.revenue.toLocaleString()} · {d.orders} orders
            </span>
          </div>
          <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: maxVal > 0 ? `${(d.revenue / maxVal) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function HorizontalBar({
  items,
  maxVal,
  valueKey,
  labelKey,
  subKey,
  format,
}: {
  items: Record<string, unknown>[]
  maxVal: number
  valueKey: string
  labelKey: string
  subKey?: string
  format?: (v: number) => string
}) {
  const fmt = format || ((v: number) => v.toLocaleString())
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-900 truncate">{item[labelKey] as string}</span>
            <span className="text-gray-600 ml-2 whitespace-nowrap">
              {fmt(item[valueKey] as number)}
              {subKey && <span className="text-gray-600 text-xs ml-1">({item[subKey] as number} sold)</span>}
            </span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: maxVal > 0 ? `${((item[valueKey] as number) / maxVal) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')

  const { revenue, orderStats, last7Days, topProducts, paymentBreakdown, lowStock, outOfStock } =
    await getAnalytics()

  const maxDayRevenue = Math.max(...last7Days.map((d) => d.revenue), 1)
  const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1)
  const maxPaymentRevenue = Math.max(...paymentBreakdown.map((p) => p.revenue), 1)

  const orderStatusItems = [
    { label: 'Pending', value: orderStats.pending, color: 'bg-yellow-400' },
    { label: 'Confirmed', value: orderStats.confirmed, color: 'bg-blue-400' },
    { label: 'Preparing', value: orderStats.preparing, color: 'bg-purple-400' },
    { label: 'Delivered', value: orderStats.delivered, color: 'bg-green-400' },
    { label: 'Cancelled', value: orderStats.cancelled, color: 'bg-red-400' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart2 className="h-8 w-8 text-amber-500" />
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* Revenue stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={`KSh ${revenue.today.toLocaleString()}`}
          color="bg-amber-100 text-amber-600"
          icon={DollarSign}
        />
        <StatCard
          label="Last 7 Days"
          value={`KSh ${revenue.week.toLocaleString()}`}
          color="bg-blue-100 text-blue-600"
          icon={TrendingUp}
        />
        <StatCard
          label="Last 30 Days"
          value={`KSh ${revenue.month.toLocaleString()}`}
          color="bg-green-100 text-green-600"
          icon={TrendingUp}
        />
        <StatCard
          label="All-Time Revenue"
          value={`KSh ${revenue.total.toLocaleString()}`}
          color="bg-purple-100 text-purple-600"
          icon={DollarSign}
        />
      </div>

      {/* Order stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={orderStats.total.toString()}
          color="bg-gray-100 text-gray-600"
          icon={ShoppingBag}
        />
        <StatCard
          label="Online Orders"
          value={orderStats.online.toString()}
          color="bg-blue-100 text-blue-600"
          icon={ShoppingBag}
        />
        <StatCard
          label="POS / Walk-in"
          value={orderStats.pos.toString()}
          color="bg-orange-100 text-orange-600"
          icon={ShoppingBag}
        />
        <StatCard
          label="Pending Now"
          value={orderStats.pending.toString()}
          sub="Needs attention"
          color="bg-yellow-100 text-yellow-600"
          icon={Users}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily revenue chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue — Last 7 Days</h2>
          <BarChart data={last7Days} maxVal={maxDayRevenue} />
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm">No sales data yet</p>
          ) : (
            <HorizontalBar
              items={topProducts as unknown as Record<string, unknown>[]}
              maxVal={maxProductRevenue}
              valueKey="revenue"
              labelKey="name"
              subKey="sold"
              format={(v) => `KSh ${v.toLocaleString()}`}
            />
          )}
        </div>
      </div>

      {/* Order status + payment breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status Breakdown</h2>
          <div className="space-y-3">
            {orderStatusItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600">{item.label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{
                      width: orderStats.total > 0 ? `${(item.value / orderStats.total) * 100}%` : '0%',
                    }}
                  />
                </div>
                <span className="w-8 text-sm font-medium text-gray-900 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment method breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Payment Methods</h2>
          {paymentBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm">No paid orders yet</p>
          ) : (
            <div className="space-y-4">
              {paymentBreakdown.map((pm) => (
                <div key={pm.method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900">{pm.method}</span>
                    <span className="text-gray-600">
                      KSh {pm.revenue.toLocaleString()} · {pm.count} orders
                    </span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${(pm.revenue / maxPaymentRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inventory alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Low Stock Alert</h2>
            {lowStock.length > 0 && (
              <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                {lowStock.length} items
              </span>
            )}
          </div>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm">All products have adequate stock</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-600">{p.category.name}</p>
                  </div>
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded-full ${
                      p.quantity <= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {p.quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out of stock */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Out of Stock</h2>
            {outOfStock.length > 0 && (
              <span className="ml-auto bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                {outOfStock.length} items
              </span>
            )}
          </div>
          {outOfStock.length === 0 ? (
            <p className="text-gray-400 text-sm">All products are in stock</p>
          ) : (
            <div className="space-y-2">
              {outOfStock.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-600">{p.category.name}</p>
                  </div>
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Out of Stock
                  </span>
                </div>
              ))}
              {outOfStock.length > 10 && (
                <p className="text-xs text-gray-400 text-center pt-1">+{outOfStock.length - 10} more</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
