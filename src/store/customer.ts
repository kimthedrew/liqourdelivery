import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Customer {
  id: string
  email: string
  name: string
  phone: string
  address: string | null
}

interface CustomerState {
  customer: Customer | null
  setCustomer: (customer: Customer) => void
  clearCustomer: () => void
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customer: null,
      setCustomer: (customer) => set({ customer }),
      clearCustomer: () => set({ customer: null }),
    }),
    { name: 'customer-storage' }
  )
)
