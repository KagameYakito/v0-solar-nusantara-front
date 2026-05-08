export interface Product {
  id: string
  name: string
  description?: string
  image: string
  price?: number
  discountedPrice?: number
  specifications?: Record<string, string>
}

export interface Subcategory {
  name: string
  products: Product[]
}

export interface Category {
  name: string
  subcategories: Subcategory[]
}

export const categoriesData: Category[] = [
  {
    name: 'Inverter Surya',
    subcategories: [
      {
        name: 'SOLIS - Inverter - Off grid inverter 4kW',
        products: [
          {
            id: 'solis-offgrid-1',
            name: 'SOLIS Off-Grid Inverter 4kW',
            description: 'Pure sine wave, 48V DC input',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,4kW',
            price: 15000000,
            discountedPrice: 13500000,
            specifications: {
              'Daya Output': '4 kW',
              'Input DC': '48V',
              'Efisiensi': '95%',
              'Jaminan': '3 Tahun',
            },
          },
          {
            id: 'solis-offgrid-2',
            name: 'SOLIS Hybrid Inverter 5kW',
            description: 'Grid-tied and battery capable',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,hybrid',
            price: 18500000,
            specifications: {
              'Daya Output': '5 kW',
              'Input DC': '48V',
              'Mode': 'Grid/Battery',
              'Jaminan': '5 Tahun',
            },
          },
          {
            id: 'solis-offgrid-3',
            name: 'SOLIS Off-Grid Inverter 6kW',
            description: '3-phase output, industrial grade',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,industrial',
            price: 22000000,
            specifications: {
              'Daya Output': '6 kW',
              'Input DC': '48V',
              'Output': '3-Phase',
              'Jaminan': '5 Tahun',
            },
          },
        ],
      },
      {
        name: 'LUMINOUS SINGLE PHASE / SINE WAVE 4000VA 48 VOLT',
        products: [
          {
            id: 'luminous-sp-1',
            name: 'LUMINOUS Single Phase Inverter 4kVA',
            description: '48V DC, pure sine wave',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,luminous',
            price: 12000000,
            specifications: {
              'Daya': '4 kVA',
              'Voltase': '48V DC',
              'Output': 'Pure Sine Wave',
              'Jaminan': '2 Tahun',
            },
          },
          {
            id: 'luminous-sp-2',
            name: 'LUMINOUS Single Phase Inverter 5kVA',
            description: 'Built-in MPPT controller',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,mppt',
            price: 14500000,
            specifications: {
              'Daya': '5 kVA',
              'Voltase': '48V DC',
              'Fitur': 'MPPT Built-in',
              'Jaminan': '2 Tahun',
            },
          },
        ],
      },
      {
        name: 'String Inverter 3-Phase - 10kW',
        products: [
          {
            id: 'string-3phase-1',
            name: 'String Inverter 10kW 3-Phase',
            description: 'Grid-tied, 400V output',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,10kw',
            price: 25000000,
            specifications: {
              'Daya': '10 kW',
              'Output': '3-Phase 400V',
              'Mode': 'Grid-Tied',
              'Jaminan': '5 Tahun',
            },
          },
          {
            id: 'string-3phase-2',
            name: 'String Inverter 15kW 3-Phase',
            description: 'Commercial grade, IP65 rated',
            image: 'https://source.unsplash.com/400x300/?solar,inverter,commercial',
            price: 32500000,
            specifications: {
              'Daya': '15 kW',
              'Output': '3-Phase 400V',
              'Rating': 'IP65 Industrial',
              'Jaminan': '5 Tahun',
            },
          },
        ],
      },
    ],
  },
  {
    name: 'Panel Surya',
    subcategories: [
      {
        name: 'Trina PV Module 425Wp',
        products: [
          {
            id: 'trina-425-1',
            name: 'Trina Solar Panel 425Wp Mono',
            description: 'Monocrystalline, 21.6% efficiency',
            image: 'https://source.unsplash.com/400x300/?solar,panel,monocrystalline',
            price: 2100000,
            specifications: {
              'Kapasitas': '425 Wp',
              'Tipe': 'Monocrystalline',
              'Efisiensi': '21.6%',
              'Jaminan': '12 Tahun',
            },
          },
          {
            id: 'trina-425-2',
            name: 'Trina Solar Panel 425Wp Bifacial',
            description: 'Bifacial technology, higher yield',
            image: 'https://source.unsplash.com/400x300/?solar,panel,bifacial',
            price: 2350000,
            specifications: {
              'Kapasitas': '425 Wp',
              'Tipe': 'Bifacial',
              'Efisiensi': '22.3%',
              'Jaminan': '12 Tahun',
            },
          },
        ],
      },
      {
        name: 'Jinko PV Module 625 Wp',
        products: [
          {
            id: 'jinko-625-1',
            name: 'Jinko Solar Panel 625Wp',
            description: 'Monocrystalline, 22.5% efficiency',
            image: 'https://source.unsplash.com/400x300/?solar,panel,625wp',
            price: 2800000,
            specifications: {
              'Kapasitas': '625 Wp',
              'Tipe': 'Monocrystalline',
              'Efisiensi': '22.5%',
              'Jaminan': '12 Tahun',
            },
          },
          {
            id: 'jinko-625-2',
            name: 'Jinko Solar Panel 650Wp',
            description: 'Latest generation, 23% efficiency',
            image: 'https://source.unsplash.com/400x300/?solar,panel,650wp',
            price: 2950000,
            specifications: {
              'Kapasitas': '650 Wp',
              'Tipe': 'Monocrystalline',
              'Efisiensi': '23%',
              'Jaminan': '12 Tahun',
            },
          },
          {
            id: 'jinko-625-3',
            name: 'Jinko Solar Panel 670Wp',
            description: 'Premium tier, highest efficiency',
            image: 'https://source.unsplash.com/400x300/?solar,panel,670wp',
            price: 3150000,
            specifications: {
              'Kapasitas': '670 Wp',
              'Tipe': 'Monocrystalline Premium',
              'Efisiensi': '23.3%',
              'Jaminan': '12 Tahun',
            },
          },
        ],
      },
      {
        name: 'Canadian Solar Panel 420Wp',
        products: [
          {
            id: 'canadian-420-1',
            name: 'Canadian Solar Panel 420Wp',
            description: 'Polycrystalline, reliable',
            image: 'https://via.placeholder.com/300x300?text=Canadian+420Wp',
          },
          {
            id: 'canadian-420-2',
            name: 'Canadian Solar Panel 430Wp',
            description: 'Monocrystalline variant',
            image: 'https://via.placeholder.com/300x300?text=Canadian+430Wp',
          },
        ],
      },
    ],
  },
  {
    name: 'Kabel Listrik & Kabel Surya',
    subcategories: [
      {
        name: 'Solar Cable 4mm2 PV Rated',
        products: [
          {
            id: 'solarcable-4mm-1',
            name: 'Solar Cable 4mm2, 500m Roll',
            description: 'UV resistant, 1500V rated',
            image: 'https://via.placeholder.com/300x300?text=Solar+Cable+4mm',
          },
          {
            id: 'solarcable-4mm-2',
            name: 'Solar Cable 4mm2, 1000m Roll',
            description: 'Bulk supply, commercial use',
            image: 'https://via.placeholder.com/300x300?text=Solar+Cable+Bulk',
          },
        ],
      },
      {
        name: 'MC4 Connector Set',
        products: [
          {
            id: 'mc4-set-1',
            name: 'MC4 Connector Male/Female Pair',
            description: '30A rated, IP67 sealed',
            image: 'https://via.placeholder.com/300x300?text=MC4+Connector',
          },
          {
            id: 'mc4-set-2',
            name: 'MC4 Connector Assembly Kit',
            description: 'Complete with crimper tool',
            image: 'https://via.placeholder.com/300x300?text=MC4+Assembly',
          },
        ],
      },
      {
        name: 'DC Breaker / Safety Switch 50A',
        products: [
          {
            id: 'dcbreaker-50-1',
            name: 'DC Breaker 50A Single Pole',
            description: '1000V DC rated',
            image: 'https://via.placeholder.com/300x300?text=DC+Breaker+50A',
          },
          {
            id: 'dcbreaker-50-2',
            name: 'DC Breaker 50A Double Pole',
            description: 'String protection, industrial',
            image: 'https://via.placeholder.com/300x300?text=DC+Breaker+DP',
          },
        ],
      },
    ],
  },
]
