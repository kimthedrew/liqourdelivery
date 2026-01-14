import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@liquorstore.com' },
    update: {},
    create: {
      email: 'admin@liquorstore.com',
      password: hashedPassword,
      name: 'Store Admin',
    },
  })

  console.log('Created admin:', admin.email)

  // Create default settings
  const settings = await prisma.settings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      storeName: 'Liquor Delivery',
      storePhone: '',
      storeEmail: '',
      storeAddress: '',
      mpesaEnabled: false,
      manualPaymentPhone: '0712345678',
      manualPaymentName: 'Store Name',
      manualPaymentInstructions: 'Send payment to the number above and include your order number as the reference.',
      deliveryFee: 200,
      minimumOrder: 500,
    },
  })

  console.log('Created settings')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'whisky' },
      update: {},
      create: { name: 'Whisky', slug: 'whisky' },
    }),
    prisma.category.upsert({
      where: { slug: 'vodka' },
      update: {},
      create: { name: 'Vodka', slug: 'vodka' },
    }),
    prisma.category.upsert({
      where: { slug: 'beer' },
      update: {},
      create: { name: 'Beer', slug: 'beer' },
    }),
    prisma.category.upsert({
      where: { slug: 'wine' },
      update: {},
      create: { name: 'Wine', slug: 'wine' },
    }),
    prisma.category.upsert({
      where: { slug: 'spirits' },
      update: {},
      create: { name: 'Spirits', slug: 'spirits' },
    }),
  ])

  console.log('Created categories:', categories.map(c => c.name).join(', '))

  // Create sample products
  const whiskyCategory = categories.find(c => c.slug === 'whisky')!
  const vodkaCategory = categories.find(c => c.slug === 'vodka')!
  const beerCategory = categories.find(c => c.slug === 'beer')!

  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'johnnie-walker-black' },
      update: {},
      create: {
        name: 'Johnnie Walker Black Label',
        slug: 'johnnie-walker-black',
        description: 'A rich, smooth blend with deep flavors of vanilla and dried fruit.',
        price: 4500,
        inStock: true,
        quantity: 20,
        categoryId: whiskyCategory.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'jameson-irish' },
      update: {},
      create: {
        name: 'Jameson Irish Whiskey',
        slug: 'jameson-irish',
        description: 'Triple distilled Irish whiskey with a smooth, mild flavor.',
        price: 3200,
        inStock: true,
        quantity: 15,
        categoryId: whiskyCategory.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'smirnoff-vodka' },
      update: {},
      create: {
        name: 'Smirnoff Vodka',
        slug: 'smirnoff-vodka',
        description: 'Classic triple distilled vodka, perfect for cocktails.',
        price: 1800,
        inStock: true,
        quantity: 30,
        categoryId: vodkaCategory.id,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'tusker-lager' },
      update: {},
      create: {
        name: 'Tusker Lager (6-pack)',
        slug: 'tusker-lager',
        description: 'Kenya\'s favorite lager beer, crisp and refreshing.',
        price: 1200,
        inStock: true,
        quantity: 50,
        categoryId: beerCategory.id,
      },
    }),
  ])

  console.log('Created products:', products.map(p => p.name).join(', '))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
