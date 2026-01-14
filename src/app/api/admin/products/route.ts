import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, description, price, imageUrl, inStock, quantity, categoryId } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let slug = generateSlug(name)

    // Check for duplicate slug and make unique if needed
    const existingProduct = await prisma.product.findUnique({ where: { slug } })
    if (existingProduct) {
      slug = `${slug}-${Date.now()}`
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        inStock: inStock ?? true,
        quantity: parseInt(quantity) || 0,
        categoryId,
      },
      include: { category: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, name, description, price, imageUrl, inStock, quantity, categoryId } = body

    if (!id || !name || !price || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        imageUrl: imageUrl || null,
        inStock: inStock ?? true,
        quantity: parseInt(quantity) || 0,
        categoryId,
      },
      include: { category: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
