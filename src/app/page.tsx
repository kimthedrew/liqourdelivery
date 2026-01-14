import Link from 'next/link'
import prisma from '@/lib/db'
import ProductCard from '@/components/ProductCard'
import { Wine, Truck, Clock, ShieldCheck } from 'lucide-react'

async function getProducts() {
  return prisma.product.findMany({
    where: { inStock: true },
    include: { category: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
  })
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
  })
}

export default async function Home() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Premium Drinks
              <span className="text-amber-500"> Delivered</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Order your favorite liquor, beer, and wine. Fast delivery right to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                Browse All Drinks
              </Link>
              <Link
                href="/products?category=beer"
                className="border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                View Beers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Truck className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold text-gray-900">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Quick delivery to your location</p>
            </div>
            <div className="text-center">
              <Wine className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold text-gray-900">Wide Selection</h3>
              <p className="text-sm text-gray-600">All your favorites in one place</p>
            </div>
            <div className="text-center">
              <Clock className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold text-gray-900">Order Anytime</h3>
              <p className="text-sm text-gray-600">24/7 online ordering</p>
            </div>
            <div className="text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-amber-500 mb-3" />
              <h3 className="font-semibold text-gray-900">Secure Payment</h3>
              <p className="text-sm text-gray-600">M-Pesa and more options</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow hover:border-amber-500 border-2 border-transparent"
              >
                <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {category._count.products} items
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Drinks</h2>
            <Link
              href="/products"
              className="text-amber-600 hover:text-amber-700 font-semibold"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                category={product.category.name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Browse our selection and get your drinks delivered fast. We accept M-Pesa payments.
          </p>
          <Link
            href="/products"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-8 rounded-lg transition-colors text-lg inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-bold text-amber-500">Liquor</span>
              <span className="text-2xl font-light text-white">Delivery</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/products" className="hover:text-white transition-colors">
                Products
              </Link>
              <Link href="/cart" className="hover:text-white transition-colors">
                Cart
              </Link>
              <Link href="/auth/login" className="hover:text-white transition-colors">
                Account
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
            <p>Must be 18+ to order. Please drink responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
