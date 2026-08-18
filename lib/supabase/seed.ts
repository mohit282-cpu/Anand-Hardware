import { getCategories, createCategory, createProduct, DEFAULT_SETTINGS, updateBusinessSettings } from './services';

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
    const existingCats = await getCategories();
    if (existingCats.length > 0) {
      return { seeded: false, message: 'Database already contains data. Seed skipped.' };
    }

    // Initialize business settings
    await updateBusinessSettings(DEFAULT_SETTINGS);

    // Create Categories
    const categoryMap: Record<string, { id: string; name: string }> = {};
    for (const cat of SEED_CATEGORIES) {
      const id = await createCategory(cat);
      categoryMap[cat.slug] = { id, name: cat.name };
    }

    // Create Products
    const productsToSeed = [
      {
        name: 'CPVC Heavy Pressure Pipe 1 inch (Panchakanya)',
        slug: 'cpvc-heavy-pressure-pipe-1-inch-panchakanya',
        sku: 'PIPE-CPVC-001',
        categorySlug: 'plumbing-pipes',
        brand: 'Panchakanya',
        price: 850,
        unit: 'length (3m)',
        description: 'Class 2 heavy-duty CPVC pipe for hot and cold water plumbing networks.',
        specifications: JSON.stringify({ Pressure: 'SDR 11', Diameter: '1 inch', Material: 'CPVC' }),
        imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
        stock: 120,
        lowStockLevel: 25,
        featured: true,
        active: true,
      },
      {
        name: 'Shivam OPC Cement 50kg Bag',
        slug: 'shivam-opc-cement-50kg-bag',
        sku: 'CEM-OPC-050',
        categorySlug: 'building-materials',
        brand: 'Shivam Cement',
        price: 720,
        unit: 'bag',
        description: '53 Grade Ordinary Portland Cement for structural concreting and foundation work.',
        specifications: JSON.stringify({ Weight: '50 kg', Grade: '53 Grade OPC', Standard: 'NS:49' }),
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        stock: 450,
        lowStockLevel: 50,
        featured: true,
        active: true,
      },
      {
        name: 'Asian Paints Apex Exterior Emulsion (20L)',
        slug: 'asian-paints-apex-exterior-emulsion-20l',
        sku: 'PNT-APX-020',
        categorySlug: 'paints-finishes',
        brand: 'Asian Paints',
        price: 8400,
        unit: 'bucket',
        description: 'Weatherproof smooth exterior emulsion with anti-algal protection and silicon additives.',
        specifications: JSON.stringify({ Volume: '20 Litres', Finish: 'Smooth Sheen', Coverage: '55-60 sq.ft/L' }),
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
        stock: 35,
        lowStockLevel: 10,
        featured: true,
        active: true,
      },
      {
        name: 'Multi-Strand Copper House Wire 2.5 sq.mm (Finolex)',
        slug: 'multi-strand-copper-house-wire-25-sqmm-finolex',
        sku: 'ELE-WIR-250',
        categorySlug: 'electrical-wiring',
        brand: 'Finolex',
        price: 4200,
        unit: 'roll (90m)',
        description: 'Flame retardant PVC insulated copper conductor wire for residential power circuits.',
        specifications: JSON.stringify({ Size: '2.5 sq.mm', Length: '90 meters', Conductor: 'Pure Copper' }),
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        stock: 80,
        lowStockLevel: 15,
        featured: true,
        active: true,
      },
      {
        name: 'Brass Bib Water Tap 1/2 inch',
        slug: 'brass-bib-water-tap-1-2-inch',
        sku: 'TAP-BRS-050',
        categorySlug: 'plumbing-pipes',
        brand: 'Prayag',
        price: 450,
        unit: 'pcs',
        description: 'Heavy solid brass chrome plated wall-mounted bib tap with leak-free ceramic disc cartridge.',
        specifications: JSON.stringify({ Inlet: '1/2 inch', Material: 'Solid Brass', Finish: 'Chrome' }),
        imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
        stock: 150,
        lowStockLevel: 20,
        featured: false,
        active: true,
      },
      {
        name: 'Forged Steel Claw Hammer 500g',
        slug: 'forged-steel-claw-hammer-500g',
        sku: 'TOL-HMR-500',
        categorySlug: 'hand-power-tools',
        brand: 'Stanley',
        price: 680,
        unit: 'pcs',
        description: 'Drop forged heat treated carbon steel head with shock absorbing fiberglass rubber grip handle.',
        specifications: JSON.stringify({ Weight: '500 grams', Handle: 'Fiberglass Grip', Material: 'Forged Steel' }),
        imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=600&q=80',
        stock: 40,
        lowStockLevel: 8,
        featured: true,
        active: true,
      },
      {
        name: 'Heavy Double Cylinder Mortise Door Lock',
        slug: 'heavy-double-cylinder-mortise-door-lock',
        sku: 'LCK-MRT-002',
        categorySlug: 'hardware-locks',
        brand: 'Godrej',
        price: 3250,
        unit: 'set',
        description: 'Brass 6-lever double cylinder mortise body lock set for main wooden entrance doors.',
        specifications: JSON.stringify({ Keys: '3 Computer Keys', Material: 'Solid Brass & Zinc', Finish: 'Antique Brass' }),
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
        stock: 22,
        lowStockLevel: 5,
        featured: true,
        active: true,
      },
      {
        name: 'MCB Double Pole 32A (Schneider Electric)',
        slug: 'mcb-double-pole-32a-schneider-electric',
        sku: 'ELE-MCB-032',
        categorySlug: 'electrical-wiring',
        brand: 'Schneider',
        price: 1150,
        unit: 'pcs',
        description: 'C-curve miniature circuit breaker for short circuit and overload protection.',
        specifications: JSON.stringify({ Rating: '32 Ampere', Poles: 'Double Pole (DP)', BreakingCapacity: '10kA' }),
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
        stock: 65,
        lowStockLevel: 10,
        featured: false,
        active: true,
      },
    ];

    for (const prod of productsToSeed) {
      const catInfo = categoryMap[prod.categorySlug];
      await createProduct({
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        categoryId: catInfo?.id || '',
        categoryName: catInfo?.name || '',
        brand: prod.brand,
        price: prod.price,
        unit: prod.unit,
        description: prod.description,
        specifications: prod.specifications,
        imageUrl: prod.imageUrl,
        stock: prod.stock,
        lowStockLevel: prod.lowStockLevel,
        featured: prod.featured,
        active: prod.active,
      });
    }

    return { seeded: true, message: `Successfully seeded demo categories and products.` };
  } catch (err: any) {
    console.error('Error seeding demo data:', err);
    return { seeded: false, message: err.message || 'Seeding failed.' };
  }
}
