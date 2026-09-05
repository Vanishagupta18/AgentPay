// Run with: npm run seed
// Generates ~110 realistic synthetic products programmatically across 8
// categories rather than hand-listing them one by one — real variation
// in brand/price/stock, deterministic, and easy to extend. Deliberately
// includes some zero-stock items and a few priced above a typical spend
// cap, so your policy-blocked and out-of-stock demo cases exist on
// purpose rather than by luck.

import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product';

interface Template {
  category: string;
  brands: string[];
  models: string[];
  priceRangePaise: [number, number];
  tags: string[];
  attributes?: Record<string, unknown>;
}

const templates: Template[] = [
  {
    category: 'footwear',
    brands: ['Stridewell', 'Velocore', 'CloudStep', 'Trailmark'],
    models: ['Beginner Runner', 'Everyday Trainer', 'Trail Pro', 'Racing Flat', 'Cushion Max'],
    priceRangePaise: [149900, 899900],
    tags: ['running', 'footwear'],
  },
  {
    category: 'headphones',
    brands: ['Auralite', 'BassForge', 'ClearWave', 'Nomad Audio'],
    models: ['Wireless ANC', 'Sport Buds', 'Studio Over-Ear', 'Budget Wired', 'Travel Mini'],
    priceRangePaise: [99900, 2499900],
    tags: ['audio', 'wireless'],
  },
  {
    category: 'smartphones',
    brands: ['Nimbus', 'OrbitTech', 'Quanta', 'Rivelex'],
    models: ['Lite', 'Pro', 'Ultra', 'SE', 'Max'],
    priceRangePaise: [999900, 8999900],
    tags: ['mobile', 'electronics'],
  },
  {
    category: 'monitors',
    brands: ['ViewForge', 'PixelArc', 'Clarity', 'Framewave'],
    models: ['24in FHD', '27in QHD', '32in 4K', 'Ultrawide 34in', 'Portable 15in'],
    priceRangePaise: [749900, 4999900],
    tags: ['display', 'electronics'],
  },
  {
    category: 'keyboards',
    brands: ['KeyForge', 'Tactile Co', 'Switchbox', 'Quietype'],
    models: ['Mechanical RGB', 'Compact 60%', 'Wireless Slim', 'Ergo Split', 'Office Membrane'],
    priceRangePaise: [99900, 1499900],
    tags: ['peripherals', 'electronics'],
  },
  {
    category: 'watches',
    brands: ['Chronotag', 'Pulseline', 'Ferrotime', 'Driftwood'],
    models: ['Fitness Tracker', 'Classic Analog', 'Smartwatch Pro', 'Minimalist Steel', 'Sport GPS'],
    priceRangePaise: [149900, 3499900],
    tags: ['wearable', 'fashion'],
  },
  {
    category: 'backpacks',
    brands: ['Trailhead', 'Urban Carry', 'PackWorks', 'Summit Gear'],
    models: ['Laptop 15in', 'Travel 40L', 'Daypack', 'Hiking 30L', 'Commuter Slim'],
    priceRangePaise: [79900, 799900],
    tags: ['bags', 'travel'],
  },
  {
    category: 'fitness',
    brands: ['IronCore', 'FlexBand', 'PulseFit', 'GripWorks'],
    models: ['Resistance Bands Set', 'Adjustable Dumbbell', 'Yoga Mat Pro', 'Foam Roller', 'Jump Rope Speed'],
    priceRangePaise: [49900, 999900],
    tags: ['fitness', 'home-gym'],
  },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]!;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  currency: string;
  stock: number;
  rating: number;
  reviewCount: number;
  attributes: Record<string, unknown>;
  tags: string[];
  isActive: boolean;
}

function generateProducts(): SeedProduct[] {
  const products: SeedProduct[] = [];
  let counter = 0;

  for (const template of templates) {
    for (let i = 0; i < 14; i++) {
      counter++;
      const brand = pick(template.brands, counter);
      const model = pick(template.models, counter + i);
      const name = `${brand} ${model}`;
      const [minPrice, maxPrice] = template.priceRangePaise;
      const priceStep = (maxPrice - minPrice) / 14;
      const price = Math.round(minPrice + priceStep * i);

      // Deliberate edge cases, spread predictably rather than randomly,
      // so you know exactly which products to use for which demo case.
      const stock = i === 3 ? 0 : i === 7 ? 2 : 5 + (counter % 15);
      const isActive = i !== 11; // one deliberately inactive product per category

      products.push({
        name,
        slug: `${slugify(name)}-${counter}`,
        description: `${name} — ${template.category} from ${brand}.`,
        category: template.category,
        brand,
        price,
        currency: 'INR',
        stock,
        rating: Number((3.5 + (counter % 15) / 10).toFixed(1)),
        reviewCount: 10 + counter * 3,
        attributes: {
          forBeginner: i % 2 === 0,
          ...template.attributes,
        },
        tags: [...template.tags, slugify(model)],
        isActive,
      });
    }
  }
  return products;
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const products = generateProducts();
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products across ${templates.length} categories.`);
  const outOfStock = products.filter((p) => (p.stock as number) === 0).length;
  const inactive = products.filter((p) => !p.isActive).length;
  console.log(`  ${outOfStock} out-of-stock, ${inactive} inactive — your deliberate demo edge cases.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
