import { config } from 'dotenv';
config({ path: '.env.local' });
import mongoose from 'mongoose';
import Product from '../models/Product';

interface Template { category: string; brands: string[]; models: string[]; priceRangePaise: [number, number]; tags: string[]; }

const templates: Template[] = [
  { category: 'Running Shoes', brands: ['Stridewell', 'Velocore', 'CloudStep', 'Trailmark'], models: ['Beginner Runner', 'Everyday Trainer', 'Trail Pro', 'Racing Flat', 'Cushion Max'], priceRangePaise: [149900, 899900], tags: ['running', 'footwear'] },
  { category: 'Electronics', brands: ['Nimbus', 'OrbitTech', 'Quanta', 'Rivelex'], models: ['Smart Plug', 'Portable Charger', 'Bluetooth Speaker', 'Webcam HD', 'Power Bank'], priceRangePaise: [59900, 499900], tags: ['electronics', 'gadgets'] },
  { category: 'Headphones', brands: ['Auralite', 'BassForge', 'ClearWave', 'Nomad Audio'], models: ['Wireless ANC', 'Sport Buds', 'Studio Over-Ear', 'Budget Wired', 'Travel Mini'], priceRangePaise: [99900, 2499900], tags: ['audio', 'wireless'] },
  { category: 'Laptops', brands: ['CoreLine', 'ByteForge', 'Wavetop', 'Pinnacle'], models: ['Student 14in', 'Developer Pro', 'Ultrabook Air', 'Budget Essentials', 'Creator 16in'], priceRangePaise: [2999900, 8999900], tags: ['laptop', 'computing'] },
  { category: 'Smartphones', brands: ['Nimbus', 'OrbitTech', 'Quanta', 'Rivelex'], models: ['Lite', 'Pro', 'Ultra', 'SE', 'Max'], priceRangePaise: [999900, 8999900], tags: ['mobile', 'electronics'] },
  { category: 'Watches', brands: ['Chronotag', 'Pulseline', 'Ferrotime', 'Driftwood'], models: ['Fitness Tracker', 'Classic Analog', 'Smartwatch Pro', 'Minimalist Steel', 'Sport GPS'], priceRangePaise: [149900, 3499900], tags: ['wearable', 'fashion'] },
  { category: 'Bags', brands: ['Trailhead', 'Urban Carry', 'PackWorks', 'Summit Gear'], models: ['Laptop 15in', 'Travel 40L', 'Daypack', 'Hiking 30L', 'Commuter Slim'], priceRangePaise: [79900, 799900], tags: ['bags', 'travel'] },
  { category: 'Accessories', brands: ['KeyForge', 'Tactile Co', 'Switchbox', 'Quietype'], models: ['Mechanical Keyboard', 'Wireless Mouse', 'Laptop Stand', 'USB-C Hub', 'Desk Mat'], priceRangePaise: [49900, 1499900], tags: ['accessories', 'desk'] },
];

interface SeedProduct { name: string; slug: string; description: string; category: string; brand: string; price: number; currency: string; stock: number; rating: number; reviewCount: number; image: null; attributes: Record<string, unknown>; tags: string[]; isActive: boolean; }

function pick<T>(arr: T[], seed: number): T { return arr[seed % arr.length]!; }
function slugify(text: string): string { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

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
      const stock = i === 3 ? 0 : i === 7 ? 2 : 5 + (counter % 15);
      const isActive = i !== 11;
      products.push({
        name, slug: `${slugify(name)}-${counter}`, description: `${name} — ${template.category} from ${brand}.`,
        category: template.category, brand, price, currency: 'INR', stock,
        rating: Number((3.5 + (counter % 15) / 10).toFixed(1)), reviewCount: 10 + counter * 3,
        image: null, attributes: { forBeginner: i % 2 === 0 }, tags: [...template.tags, slugify(model)], isActive,
      });
    }
  }
  return products;
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.'); process.exit(1); }
  await mongoose.connect(uri);
  const products = generateProducts();
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products across ${templates.length} categories.`);
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const overCap = products.filter((p) => p.price > 500000).length;
  console.log(`  ${outOfStock} out-of-stock, ${overCap} priced over ₹5,000 — your deliberate demo edge cases.`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
