import prisma from '@/lib/db'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string }>
}

async function getProducts(search?: string, category?: string) {
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  if (category) {
    where.category = { slug: category }
  }

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { search, category } = params
  const [products, categories] = await Promise.all([
    getProducts(search, category),
    getCategories(),
  ])

  const currentCategory = categories.find((c) => c.slug === category)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li>
              <Link href="/" className="hover:text-amber-600">Home</Link>
            </li>
            <li>/</li>
            <li className={currentCategory ? 'hover:text-amber-600' : 'text-gray-900'}>
              <Link href="/products">Products</Link>
            </li>
            {currentCategory && (
              <>
                <li>/</li>
                <li className="text-gray-900">{currentCategory.name}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/products"
                    className={`block py-2 px-3 rounded-lg transition-colors ${
                      !category
                        ? 'bg-amber-100 text-amber-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Products
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`block py-2 px-3 rounded-lg transition-colors ${
                        category === cat.slug
                          ? 'bg-amber-100 text-amber-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {cat.name}
                      <span className="text-gray-400 text-sm ml-2">
                        ({cat._count.products})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {search
                  ? `Search results for "${search}"`
                  : currentCategory
                  ? currentCategory.name
                  : 'All Products'}
              </h1>
              <span className="text-gray-500">{products.length} products</span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 text-lg">No products found</p>
                <Link
                  href="/products"
                  className="text-amber-600 hover:text-amber-700 font-medium mt-2 inline-block"
                >
                  View all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
