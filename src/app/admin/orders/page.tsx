'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, Eye, Check, X, Truck, Clock } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    imageUrl: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  customerAddress: string
  totalAmount: number
  status: string
  paymentStatus: string
  paymentMethod: string
  mpesaReceiptNo: string | null
  createdAt: string
  items: OrderItem[]
}

const statusOptions = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled']
const paymentOptions = ['pending', 'paid', 'failed']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrder = async (
    id: string,
    updates: { status?: string; paymentStatus?: string; mpesaReceiptNo?: string }
  ) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!res.ok) throw new Error('Failed to update order')

      const updatedOrder = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)))
      if (selectedOrder?.id === id) {
        setSelectedOrder(updatedOrder)
      }
    } catch (error) {
      alert('Failed to update order')
    }
  }

  const filteredOrders =
    filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="flex space-x-2">
          {['all', ...statusOptions].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-amber-500 text-black'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-amber-600">{order.orderNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    KSh {order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrder(order.id, { status: e.target.value })}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : order.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'preparing'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.paymentStatus}
                      onChange={(e) =>
                        updateOrder(order.id, { paymentStatus: e.target.value })
                      }
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 ${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : order.paymentStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {paymentOptions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Order {selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Customer Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                  <p>
                    <span className="text-gray-500">Name:</span> {selectedOrder.customerName}
                  </p>
                  <p>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <a href={`tel:${selectedOrder.customerPhone}`} className="text-amber-600">
                      {selectedOrder.customerPhone}
                    </a>
                  </p>
                  {selectedOrder.customerEmail && (
                    <p>
                      <span className="text-gray-500">Email:</span>{' '}
                      {selectedOrder.customerEmail}
                    </p>
                  )}
                  <p>
                    <span className="text-gray-500">Address:</span>{' '}
                    {selectedOrder.customerAddress}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-gray-50 rounded-lg p-3"
                    >
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} × KSh {item.price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-medium">
                        KSh {(item.quantity * item.price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-amber-600">
                    KSh {selectedOrder.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="text-gray-500">Method:</span>{' '}
                    {selectedOrder.paymentMethod === 'mpesa_stk'
                      ? 'M-Pesa STK Push'
                      : 'Manual Payment'}
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : selectedOrder.paymentStatus === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </p>
                  {selectedOrder.mpesaReceiptNo && (
                    <p>
                      <span className="text-gray-500">M-Pesa Receipt:</span>{' '}
                      {selectedOrder.mpesaReceiptNo}
                    </p>
                  )}

                  {/* Add M-Pesa Receipt */}
                  {!selectedOrder.mpesaReceiptNo && selectedOrder.paymentStatus === 'paid' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Enter M-Pesa receipt number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onBlur={(e) => {
                          if (e.target.value) {
                            updateOrder(selectedOrder.id, {
                              mpesaReceiptNo: e.target.value,
                            })
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-3">
                {selectedOrder.paymentStatus === 'pending' && (
                  <button
                    onClick={() =>
                      updateOrder(selectedOrder.id, { paymentStatus: 'paid' })
                    }
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Confirm Payment
                  </button>
                )}
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => updateOrder(selectedOrder.id, { status: 'confirmed' })}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <Clock className="h-5 w-5 mr-2" />
                    Confirm Order
                  </button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrder(selectedOrder.id, { status: 'preparing' })}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Start Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button
                    onClick={() => updateOrder(selectedOrder.id, { status: 'delivered' })}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center"
                  >
                    <Truck className="h-5 w-5 mr-2" />
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
