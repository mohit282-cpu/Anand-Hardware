import { getDocs, query, limit } from 'firebase/firestore';
import { productsCol, categoriesCol } from '@/lib/firebase/client';
import { createCategory, createProduct, DEFAULT_SETTINGS, updateBusinessSettings } from '@/lib/firestore/services';

const SEED_CATEGORIES = [
  {
    name: 'Plumbing & Pipes',
    slug: 'plumbing-pipes',
    description: 'High-quality PVC, GI, and PPR pipes, fittings, valves, and water storage accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    name: 'Electrical & Wiring',
    slug: 'electrical-wiring',
    description: 'Copper wires, circuit breakers, switches, sockets, and industrial distribution boards.',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    name: 'Building Materials',
    slug: 'building-materials',
    description: 'Premium grade cement, TMT rebar, aggregate, waterproofing compounds, and sand.',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    name: 'Paints & Finishes',
    slug: 'paints-finishes',
    description: 'Interior & exterior paints, primers, wall putty, brushes, and protective coatings.',
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    name: 'Hand & Power Tools',
    slug: 'hand-power-tools',
    description: 'Hammers, screwdrivers, drills, angle grinders, measuring tapes, and safety gear.',
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    name: 'Hardware & Locks',
    slug: 'hardware-locks',
    description: 'Door locks, handles, hinges, bolts, padlocks, and structural metal fasteners.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
];

export async function seedDemoDataIfEmpty(): Promise<{ seeded: boolean; message: string }> {
  try {
    const catSnap = await getDocs(query(categoriesCol, limit(1)));
    if (!catSnap.empty) {
      return { seeded: false, message: 'Database already contains data. Seed skipped.' };
    }

    // Initialize business settings
    await updateBusinessSettings(DEFAULT_SETTINGS);

    // Create Categories
    const categoryIdMap: Record<string, string> = {};
    for (const cat of SEED_CATEGORIES) {
      const catId = await createCategory(cat);
      categoryIdMap[cat.name] = catId;
    }

    // Seed Products
    const SEED_PRODUCTS = [
      {
        name: 'PVC Pipe 2 Inch (6 Meters)',
        slug: 'pvc-pipe-2-inch-6m',
        sku: 'PLM-PVC-2IN',
        categoryName: 'Plumbing & Pipes',
        brand: 'Panchakanya',
        price: 850,
        unit: 'Piece',
        description: 'Heavy duty schedule-40 pressure PVC pipe suitable for residential and commercial plumbing lines.',
        specifications: JSON.stringify({ Diameter: '2 Inches', Length: '6 Meters', Class: 'Class 3 (6 Kgf/cm²)', Material: 'Unplasticized PVC' }),
        imageUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80',
        stock: 120,
        lowStockLevel: 20,
        featured: true,
        active: true,
      },
      {
        name: 'PVC 90 Degree Elbow 2 Inch',
        slug: 'pvc-90-degree-elbow-2-inch',
        sku: 'PLM-ELB-2IN',
        categoryName: 'Plumbing & Pipes',
        brand: 'Panchakanya',
        price: 95,
        unit: 'Piece',
        description: 'Precision molded 90-degree PVC elbow connector with leak-proof solvent weld sockets.',
        specifications: JSON.stringify({ Size: '2 Inches', Angle: '90 Degrees', Connection: 'Socket Weld' }),
        imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
        stock: 250,
        lowStockLevel: 30,
        featured: false,
        active: true,
      },
      {
        name: 'Multistrand Copper Electrical Wire 2.5 sq mm',
        slug: 'multistrand-copper-electrical-wire-2-5sqmm',
        sku: 'ELE-WIR-25MM',
        categoryName: 'Electrical & Wiring',
        brand: 'Himalayan Wires',
        price: 4200,
        unit: 'Coil (90m)',
        description: 'FR PVC insulated flexible copper conductor wire rated for 1100V. Ideal for power outlets and main wiring.',
        specifications: JSON.stringify({ Core: 'Single Core Multistrand', Conductor: '99.9% Pure Electrolytic Copper', Rating: '1100 Volts', Length: '90 Meters' }),
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        stock: 35,
        lowStockLevel: 10,
        featured: true,
        active: true,
      },
      {
        name: 'Portland Pozzolana Cement (PPC) 50kg',
        slug: 'portland-pozzolana-cement-ppc-50kg',
        sku: 'BLD-CEM-50KG',
        categoryName: 'Building Materials',
        brand: 'Shivam Cement',
        price: 780,
        unit: 'Bag (50kg)',
        description: 'High strength PPC cement offering enhanced durability, low heat of hydration, and resistance to chemical attack.',
        specifications: JSON.stringify({ Weight: '50 Kg', Grade: 'PPC Standard', Certification: 'NS:49 Approved' }),
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        stock: 300,
        lowStockLevel: 50,
        featured: true,
        active: true,
      },
      {
        name: 'Asian Paints Apex Exterior Emulsion 20L',
        slug: 'asian-paints-apex-exterior-emulsion-20l',
        sku: 'PNT-APX-20L',
        categoryName: 'Paints & Finishes',
        brand: 'Asian Paints',
        price: 11500,
        unit: 'Bucket (20L)',
        description: 'Weatherproof smooth exterior emulsion with 7-year performance warranty against algae and fading.',
        specifications: JSON.stringify({ Volume: '20 Liters', Finish: 'Smooth Matt', Coverage: '50-60 sq.ft/liter in 2 coats' }),
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
        stock: 14,
        lowStockLevel: 5,
        featured: true,
        active: true,
      },
      {
        name: 'Forged Steel Claw Hammer 500g',
        slug: 'forged-steel-claw-hammer-500g',
        sku: 'TOL-HMR-500G',
        categoryName: 'Hand & Power Tools',
        brand: 'Stanley',
        price: 650,
        unit: 'Piece',
        description: 'Ergonomic fiberglass handle claw hammer with drop-forged high-carbon steel polished head.',
        specifications: JSON.stringify({ Weight: '500 Grams', Handle: 'Anti-vibration Fiberglass', 'Head Material': 'Drop Forged Carbon Steel' }),
        imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80',
        stock: 45,
        lowStockLevel: 8,
        featured: false,
        active: true,
      },
      {
        name: 'Heavy Duty Stainless Steel Mortise Door Lock Set',
        slug: 'heavy-duty-stainless-steel-mortise-door-lock-set',
        sku: 'HWD-LCK-SS01',
        categoryName: 'Hardware & Locks',
        brand: 'Godrej',
        price: 2850,
        unit: 'Set',
        description: 'Dual latch double action brass cylinder door lock set with SS 304 finish handles and 3 computer keys.',
        specifications: JSON.stringify({ Material: 'Stainless Steel 304', Cylinder: 'Solid Brass', Keys: '3 Computerized Dimple Keys' }),
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        stock: 18,
        lowStockLevel: 5,
        featured: true,
        active: true,
      },
      {
        name: 'Brass Bib Water Tap 1/2 Inch',
        slug: 'brass-bib-water-tap-1-2-inch',
        sku: 'PLM-TAP-12IN',
        categoryName: 'Plumbing & Pipes',
        brand: 'Jaguar',
        price: 1100,
        unit: 'Piece',
        description: 'Heavy chrome-plated solid brass bib tap with ceramic disc cartridge for smooth quarter-turn operation.',
        specifications: JSON.stringify({ 'Thread Size': '1/2 Inch BSP', Material: 'Solid Brass Body', Finish: 'Triple Chrome Plating' }),
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        stock: 4, // Intentionally low stock to demonstrate low-stock badge
        lowStockLevel: 10,
        featured: false,
        active: true,
      },
    ];

    for (const p of SEED_PRODUCTS) {
      const categoryId = categoryIdMap[p.categoryName] || '';
      await createProduct({
        ...p,
        categoryId,
      });
    }

    return { seeded: true, message: 'Demo hardware catalog successfully seeded!' };
  } catch (err: any) {
    console.error('Seed execution error:', err);
    return { seeded: false, message: err.message || 'Seed execution failed.' };
  }
}
