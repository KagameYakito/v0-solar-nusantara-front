'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Language = 'EN' | 'ID'

const translations = {
  EN: {
    // Navbar
    nav: {
      products: 'Products',
      auctions: 'Auctions',
      contact: 'Contact',
      login: 'Log In',
      dashboard: 'Dashboard',
      signOut: 'Sign Out',
      loginAlert: 'Please login to access this feature!',
      profileAlert: 'Complete your company profile first!',
    },
    // Hero
    hero: {
      headline1: "Powering Indonesia's",
      headline2: 'Industrial Future',
      subtitle:
        'Enterprise-grade solar energy solutions designed for businesses. Reduce operational costs, maximize energy efficiency, and accelerate your sustainable growth.',
      searchPlaceholder: 'Search solar panels, inverters, battery systems...',
      searchBtn: 'Search',
      viewProducts: 'View Products',
      requestQuotation: 'Request for Quotation',
      loginPrompt: 'Please Login to Access!',
      metrics: {
        partners: 'Enterprise Partners',
        capacity: 'Installed Capacity',
        savings: 'Average Cost Savings',
      },
    },
    // Hero RFQ Modal
    rfq: {
      title: 'Product Request (RFQ)',
      description: 'Review products in your wishlist and submit a request.',
      emptyTitle: 'No wishlist yet?',
      emptyDesc: 'Browse our catalog and add products to your wishlist!',
      openCatalog: 'Open Product Catalog',
      addedDate: 'Added:',
      cancel: 'Cancel',
      addProduct: 'Add Product',
      submitRequest: 'Submit Request',
      submitting: 'Submitting...',
      errorEmpty: '❌ Wishlist is empty! Add products from the catalog first.',
      successSubmit: '✅ Product request submitted successfully! Our team will verify shortly.',
      errorSubmit: '❌ Failed to submit request: ',
    },
    // Products section
    products: {
      sectionTitle: 'Featured Products',
      sectionDesc:
        'Enterprise-grade solar components engineered for maximum reliability and performance at scale.',
      viewDetails: 'View Details',
      outputLabel: 'Output',
      efficiencyLabel: 'Efficiency',
      items: [
        {
          name: 'Premium Solar Panels',
          power: '600W',
          efficiency: '22%',
          features: [
            'Monocrystalline cells',
            '25-year warranty',
            'Temperature resistant',
            'Industry leading efficiency',
          ],
        },
        {
          name: 'Smart Inverters',
          power: '10kW',
          efficiency: '98.5%',
          features: [
            'Advanced monitoring',
            'Grid compatible',
            'Battery ready',
            'Real-time analytics',
          ],
        },
        {
          name: 'Battery Storage',
          power: '15kWh',
          efficiency: '96%',
          features: [
            'Lithium-ion cells',
            'Fast charging',
            '10,000+ cycles',
            'Scalable system',
          ],
        },
      ],
    },
    // Solutions section
    solutions: {
      sectionTitle: 'Industry Solutions',
      sectionDesc:
        'Purpose-built solar systems for commercial, industrial, and grid integration applications.',
      whyTitle: 'Why Solar Nusantara',
      items: [
        {
          title: 'Commercial Buildings',
          description:
            'Optimize energy costs for office complexes and commercial properties with scalable solar solutions.',
          benefits: [
            'Reduce utility bills by 60-80%',
            'Tax incentives & rebates',
            'Improve property value',
          ],
        },
        {
          title: 'Industrial Facilities',
          description:
            'Reliable energy for manufacturing and heavy-duty operations with 24/7 system monitoring.',
          benefits: [
            'Uninterrupted operations',
            'Carbon footprint reduction',
            'ROI in 5-7 years',
          ],
        },
        {
          title: 'Residential Complexes',
          description:
            'Multi-unit residential installations with shared energy management and billing systems.',
          benefits: [
            'Community energy sharing',
            'Lower resident costs',
            'Sustainable living',
          ],
        },
        {
          title: 'Smart Grid Integration',
          description:
            'Connect with smart grids and energy trading platforms for maximum efficiency and revenue.',
          benefits: [
            'Sell excess energy',
            'Real-time monitoring',
            'Predictive analytics',
          ],
        },
      ],
      stats: [
        { label: 'Industry Experience', value: '18+ Years', desc: 'Deep expertise in enterprise solar deployment' },
        { label: 'System Reliability', value: '99.9%', desc: 'Enterprise-grade monitoring and support' },
        { label: 'ROI Timeline', value: '5-7 Yrs', desc: 'Proven financial returns for clients' },
      ],
    },
    // About section
    about: {
      sectionTitle: 'About Solar Nusantara',
      sectionDesc:
        'Pioneering enterprise solar solutions across Southeast Asia for over 18 years with proven track record in industrial-scale renewable energy deployment.',
      missionTitle: 'Our Mission',
      missionP1:
        'Solar Nusantara is dedicated to making enterprise solar energy accessible, affordable, and reliable for businesses across Southeast Asia with cutting-edge technology.',
      missionP2:
        "With over 18 years of industry experience, we've deployed 2.5GW of solar capacity, partnered with 250+ enterprises, and consistently delivered 40% average cost savings for clients across industrial and commercial sectors.",
      certifications: [
        'ISO 9001 & ISO 14001 Certified',
        'Industry leader in safety standards',
        'Award-winning enterprise support',
        'Partnerships with global manufacturers',
      ],
      values: [
        { title: 'Innovation', description: "Cutting-edge technology for tomorrow's energy needs" },
        { title: 'Sustainability', description: 'Committed to reducing carbon footprint globally' },
        { title: 'Quality', description: 'Industry-leading standards and certifications' },
        { title: 'Partnership', description: 'Long-term relationships with our enterprise clients' },
      ],
      stats: [
        { number: '2.5GW', label: 'Installed Capacity' },
        { number: '250+', label: 'Enterprise Partners' },
        { number: '18+', label: 'Years Experience' },
        { number: '99.9%', label: 'System Uptime' },
      ],
    },
    // Contact & Footer
    contact: {
      sectionTitle: 'Get In Touch',
      sectionDesc:
        'Connect with our enterprise team to discuss your solar energy requirements and get a custom solution tailored to your business.',
      methods: [
        { title: 'Email', value: 'enterprise@solarnusantara.com', desc: 'Response within 24 hours' },
        { title: 'Phone', value: '+62 (021) 555-0123', desc: 'Available Mon-Fri, 9AM-6PM WIB' },
        { title: 'Office', value: 'Jakarta, Indonesia', desc: 'Regional presence across SE Asia' },
      ],
      form: {
        fullName: 'Full Name',
        email: 'Email Address',
        company: 'Company Name',
        message: 'Describe your energy requirements and business type...',
        submit: 'Submit Inquiry',
      },
      footer: {
        tagline: 'Enterprise renewable energy solutions across Southeast Asia.',
        company: 'Company',
        companyLinks: ['About', 'Careers', 'Blog', 'Press'],
        products: 'Products',
        productLinks: ['Solar Panels', 'Inverters', 'Battery Storage', 'Monitoring'],
        resources: 'Resources',
        resourceLinks: ['Documentation', 'FAQ', 'Support', 'Contact'],
        legal: 'Legal',
        legalLinks: ['Privacy', 'Terms', 'Cookies', 'Security'],
        copyright: '© 2024 Solar Nusantara. All rights reserved.',
      },
    },
    // Dashboard User
    dashboard: {
      backHome: 'Back to Home',
      toCatalog: 'To Catalog',
      profileComplete: 'Profile Complete',
      profileIncomplete: 'Profile',
      profileCompleteSuffix: '% Complete',
      profileIncompleteAlert:
        'Complete your company profile to participate in auctions',
      profileIncompleteAlertDesc:
        'A complete profile builds trust with sellers and unlocks access to exclusive auctions.',
      tabs: {
        profile: 'Company Profile',
        auctions: 'Auction History',
        bids: 'Bid History',
        requests: 'Product Requests',
      },
      profileCard: {
        title: 'Company Information',
        editProfile: 'Edit Profile',
        locked: 'Locked',
        lockedDays: 'days remaining',
        cancel: 'Cancel',
        saving: 'Saving...',
        save: 'Save',
        lockedNotice: 'Profile locked for',
        lockedNoticeDesc: 'Profile is locked after first wishlist to maintain data integrity. Contact admin if there is an error.',
        cardDesc: 'Complete your company information for verification and B2B auction participation.',
        fullName: 'Full Name',
        email: 'Email',
        companyName: 'Company Name',
        companyType: 'Company Type',
        taxId: 'Tax ID (NPWP)',
        companyAddress: 'Company Address',
        phone: 'Phone Number',
        selectType: 'Select Type',
      },
      profileModal: {
        title: 'Profile Incomplete',
        desc: 'Please complete your profile before accessing this feature!',
        fillNow: 'Fill Profile Now',
      },
      wishlist: {
        title: 'Wishlist & Requests',
        emptyTitle: 'Wishlist is Empty',
        emptyDesc: 'Add products from the catalog to start a request.',
        browseCatalog: 'Browse Catalog',
        request: 'Submit Request',
        addedDate: 'Added:',
        total: 'Total',
        selected: 'selected',
        items: 'item(s)',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
      },
      bids: {
        title: 'Bid History',
        loading: 'Loading bid history...',
        empty: 'No bid history yet.',
        bidCode: 'Bid Code',
        product: 'Product',
        yourBid: 'Your Bid',
        currentPrice: 'Current Price',
        time: 'Time',
        timeRemaining: 'Time Remaining',
        ended: 'Ended',
        placeBid: 'Place Bid',
      },
      auctions: {
        title: 'Auction Participation',
        loading: 'Loading auction data...',
        empty: 'Not participating in any auctions yet.',
        product: 'Product',
        lastBid: 'Last Bid',
        status: 'Status',
        active: 'Active',
        winner: '🏆 Winner',
        notWinner: 'Not Winner',
        ended: 'Auction Ended',
        timeLeft: 'Time Left',
        viewAuctions: 'View Auctions',
      },
      requests: {
        title: 'Product Requests',
        loading: 'Loading requests...',
        empty: 'No product requests yet.',
        requestNum: 'Request #',
        items: 'items',
        status: 'Status',
        createdAt: 'Created',
        detail: 'Details',
      },
      loading: 'Loading Dashboard...',
      errorTitle: 'An Error Occurred',
      retryBtn: 'Try Again',
    },
  },
  ID: {
    // Navbar
    nav: {
      products: 'Produk',
      auctions: 'Lelang',
      contact: 'Kontak',
      login: 'Masuk',
      dashboard: 'Dasbor',
      signOut: 'Keluar',
      loginAlert: 'Login terlebih dahulu untuk akses!',
      profileAlert: 'Lengkapi profil perusahaan terlebih dahulu!',
    },
    // Hero
    hero: {
      headline1: 'Memberdayakan',
      headline2: 'Industri Indonesia',
      subtitle:
        'Solusi energi surya kelas enterprise untuk bisnis. Kurangi biaya operasional, maksimalkan efisiensi energi, dan percepat pertumbuhan berkelanjutan Anda.',
      searchPlaceholder: 'Cari panel surya, inverter, sistem baterai...',
      searchBtn: 'Cari',
      viewProducts: 'Lihat Produk',
      requestQuotation: 'Permintaan Penawaran',
      loginPrompt: 'Login Terlebih Dahulu Untuk Akses!',
      metrics: {
        partners: 'Mitra Enterprise',
        capacity: 'Kapasitas Terpasang',
        savings: 'Rata-rata Penghematan',
      },
    },
    // Hero RFQ Modal
    rfq: {
      title: 'Buat Permintaan Produk (RFQ)',
      description: 'Review produk di wishlist Anda dan ajukan permintaan.',
      emptyTitle: 'Belum ada wishlist?',
      emptyDesc: 'Yuk pilih produk dari katalog kami dan tambahkan ke wishlist!',
      openCatalog: 'Buka Katalog Produk',
      addedDate: 'Ditambahkan:',
      cancel: 'Batal',
      addProduct: 'Tambah Produk',
      submitRequest: 'Kirim Permintaan',
      submitting: 'Mengirim...',
      errorEmpty: '❌ Wishlist kosong! Tambahkan produk dulu dari katalog.',
      successSubmit: '✅ Permintaan produk berhasil dikirim! Tim kami akan segera memverifikasi.',
      errorSubmit: '❌ Gagal mengirim permintaan: ',
    },
    // Products section
    products: {
      sectionTitle: 'Produk Unggulan',
      sectionDesc:
        'Komponen surya kelas enterprise yang dirancang untuk keandalan dan performa maksimal.',
      viewDetails: 'Lihat Detail',
      outputLabel: 'Output',
      efficiencyLabel: 'Efisiensi',
      items: [
        {
          name: 'Panel Surya Premium',
          power: '600W',
          efficiency: '22%',
          features: [
            'Sel monokristal',
            'Garansi 25 tahun',
            'Tahan suhu ekstrem',
            'Efisiensi terdepan di industri',
          ],
        },
        {
          name: 'Inverter Cerdas',
          power: '10kW',
          efficiency: '98.5%',
          features: [
            'Pemantauan canggih',
            'Kompatibel grid',
            'Siap baterai',
            'Analitik real-time',
          ],
        },
        {
          name: 'Penyimpanan Baterai',
          power: '15kWh',
          efficiency: '96%',
          features: [
            'Sel lithium-ion',
            'Pengisian cepat',
            '10.000+ siklus',
            'Sistem skalabel',
          ],
        },
      ],
    },
    // Solutions section
    solutions: {
      sectionTitle: 'Solusi Industri',
      sectionDesc:
        'Sistem surya yang dirancang khusus untuk aplikasi komersial, industri, dan integrasi jaringan.',
      whyTitle: 'Mengapa Solar Nusantara',
      items: [
        {
          title: 'Gedung Komersial',
          description:
            'Optimalkan biaya energi untuk kompleks perkantoran dan properti komersial dengan solusi surya yang skalabel.',
          benefits: [
            'Kurangi tagihan utilitas 60-80%',
            'Insentif pajak & subsidi',
            'Tingkatkan nilai properti',
          ],
        },
        {
          title: 'Fasilitas Industri',
          description:
            'Energi andal untuk manufaktur dan operasi berat dengan pemantauan sistem 24/7.',
          benefits: [
            'Operasi tanpa gangguan',
            'Pengurangan jejak karbon',
            'ROI dalam 5-7 tahun',
          ],
        },
        {
          title: 'Kompleks Perumahan',
          description:
            'Instalasi multi-unit dengan manajemen energi bersama dan sistem penagihan terpadu.',
          benefits: [
            'Berbagi energi komunitas',
            'Biaya penghuni lebih rendah',
            'Kehidupan berkelanjutan',
          ],
        },
        {
          title: 'Integrasi Smart Grid',
          description:
            'Terhubung dengan smart grid dan platform perdagangan energi untuk efisiensi dan pendapatan maksimal.',
          benefits: [
            'Jual energi berlebih',
            'Pemantauan real-time',
            'Analitik prediktif',
          ],
        },
      ],
      stats: [
        { label: 'Pengalaman Industri', value: '18+ Tahun', desc: 'Keahlian mendalam dalam penerapan surya enterprise' },
        { label: 'Keandalan Sistem', value: '99.9%', desc: 'Pemantauan dan dukungan kelas enterprise' },
        { label: 'Jangka Waktu ROI', value: '5-7 Thn', desc: 'Hasil keuangan terbukti untuk klien' },
      ],
    },
    // About section
    about: {
      sectionTitle: 'Tentang Solar Nusantara',
      sectionDesc:
        'Pelopor solusi surya enterprise di Asia Tenggara selama lebih dari 18 tahun dengan rekam jejak terbukti dalam penerapan energi terbarukan skala industri.',
      missionTitle: 'Misi Kami',
      missionP1:
        'Solar Nusantara berdedikasi menjadikan energi surya enterprise aksesibel, terjangkau, dan andal bagi bisnis di seluruh Asia Tenggara dengan teknologi mutakhir.',
      missionP2:
        'Dengan pengalaman industri lebih dari 18 tahun, kami telah memasang kapasitas surya 2,5GW, bermitra dengan 250+ perusahaan, dan secara konsisten memberikan penghematan biaya rata-rata 40% bagi klien di sektor industri dan komersial.',
      certifications: [
        'Bersertifikat ISO 9001 & ISO 14001',
        'Pemimpin industri dalam standar keselamatan',
        'Dukungan enterprise pemenang penghargaan',
        'Kemitraan dengan produsen global',
      ],
      values: [
        { title: 'Inovasi', description: 'Teknologi mutakhir untuk kebutuhan energi masa depan' },
        { title: 'Keberlanjutan', description: 'Berkomitmen mengurangi jejak karbon secara global' },
        { title: 'Kualitas', description: 'Standar dan sertifikasi terdepan di industri' },
        { title: 'Kemitraan', description: 'Hubungan jangka panjang dengan klien enterprise kami' },
      ],
      stats: [
        { number: '2.5GW', label: 'Kapasitas Terpasang' },
        { number: '250+', label: 'Mitra Enterprise' },
        { number: '18+', label: 'Tahun Pengalaman' },
        { number: '99.9%', label: 'Uptime Sistem' },
      ],
    },
    // Contact & Footer
    contact: {
      sectionTitle: 'Hubungi Kami',
      sectionDesc:
        'Hubungi tim enterprise kami untuk mendiskusikan kebutuhan energi surya Anda dan dapatkan solusi khusus sesuai bisnis Anda.',
      methods: [
        { title: 'Email', value: 'enterprise@solarnusantara.com', desc: 'Respons dalam 24 jam' },
        { title: 'Telepon', value: '+62 (021) 555-0123', desc: 'Tersedia Senin-Jumat, 09.00-18.00 WIB' },
        { title: 'Kantor', value: 'Jakarta, Indonesia', desc: 'Hadir di seluruh Asia Tenggara' },
      ],
      form: {
        fullName: 'Nama Lengkap',
        email: 'Alamat Email',
        company: 'Nama Perusahaan',
        message: 'Jelaskan kebutuhan energi dan jenis bisnis Anda...',
        submit: 'Kirim Pertanyaan',
      },
      footer: {
        tagline: 'Solusi energi terbarukan enterprise di seluruh Asia Tenggara.',
        company: 'Perusahaan',
        companyLinks: ['Tentang', 'Karir', 'Blog', 'Pers'],
        products: 'Produk',
        productLinks: ['Panel Surya', 'Inverter', 'Penyimpanan Baterai', 'Pemantauan'],
        resources: 'Sumber Daya',
        resourceLinks: ['Dokumentasi', 'FAQ', 'Dukungan', 'Kontak'],
        legal: 'Legal',
        legalLinks: ['Privasi', 'Ketentuan', 'Cookie', 'Keamanan'],
        copyright: '© 2024 Solar Nusantara. Hak cipta dilindungi.',
      },
    },
    // Dashboard User
    dashboard: {
      backHome: 'Kembali ke Beranda',
      toCatalog: 'Ke Katalog',
      profileComplete: 'Profil Lengkap',
      profileIncomplete: 'Profil',
      profileCompleteSuffix: '% Lengkap',
      profileIncompleteAlert: 'Lengkapi profil perusahaan Anda untuk mengikuti lelang',
      profileIncompleteAlertDesc:
        'Profil yang lengkap meningkatkan kepercayaan seller dan akses ke lelang eksklusif.',
      tabs: {
        profile: 'Profil Perusahaan',
        auctions: 'Riwayat Lelang',
        bids: 'Riwayat Bid',
        requests: 'Permintaan Produk',
      },
      profileCard: {
        title: 'Informasi Perusahaan',
        editProfile: 'Edit Profil',
        locked: 'Terkunci',
        lockedDays: 'hari',
        cancel: 'Batal',
        saving: 'Menyimpan...',
        save: 'Simpan',
        lockedNotice: 'Profil terkunci selama',
        lockedNoticeDesc:
          'Profil terkunci setelah wishlist pertama untuk menjaga integritas data. Jika ada kesalahan, hubungi admin.',
        cardDesc: 'Lengkapi informasi perusahaan untuk verifikasi dan partisipasi lelang B2B.',
        fullName: 'Nama Lengkap',
        email: 'Email',
        companyName: 'Nama Perusahaan',
        companyType: 'Tipe Perusahaan',
        taxId: 'NPWP',
        companyAddress: 'Alamat Perusahaan',
        phone: 'Nomor Telepon',
        selectType: 'Pilih Tipe',
      },
      profileModal: {
        title: 'Profil Belum Lengkap',
        desc: 'Lengkapilah profil terlebih dahulu sebelum mengakses fitur!',
        fillNow: 'Isi Profil Sekarang',
      },
      wishlist: {
        title: 'Wishlist & Permintaan',
        emptyTitle: 'Wishlist Kosong',
        emptyDesc: 'Tambahkan produk dari katalog untuk memulai permintaan.',
        browseCatalog: 'Buka Katalog',
        request: 'Ajukan Permintaan',
        addedDate: 'Ditambahkan:',
        total: 'Total',
        selected: 'dipilih',
        items: 'item',
        selectAll: 'Pilih Semua',
        deselectAll: 'Batal Pilih',
      },
      bids: {
        title: 'Riwayat Bid',
        loading: 'Memuat riwayat bid...',
        empty: 'Belum ada riwayat bid.',
        bidCode: 'Kode Bid',
        product: 'Produk',
        yourBid: 'Bid Anda',
        currentPrice: 'Harga Saat Ini',
        time: 'Waktu',
        timeRemaining: 'Sisa Waktu',
        ended: 'Selesai',
        placeBid: 'Pasang Bid',
      },
      auctions: {
        title: 'Partisipasi Lelang',
        loading: 'Memuat data lelang...',
        empty: 'Belum mengikuti lelang apapun.',
        product: 'Produk',
        lastBid: 'Bid Terakhir',
        status: 'Status',
        active: 'Aktif',
        winner: '🏆 Pemenang',
        notWinner: 'Bukan Pemenang',
        ended: 'Lelang Selesai',
        timeLeft: 'Sisa Waktu',
        viewAuctions: 'Lihat Lelang',
      },
      requests: {
        title: 'Permintaan Produk',
        loading: 'Memuat permintaan...',
        empty: 'Belum ada permintaan produk.',
        requestNum: 'Permintaan #',
        items: 'item',
        status: 'Status',
        createdAt: 'Dibuat',
        detail: 'Detail',
      },
      loading: 'Memuat Dashboard...',
      errorTitle: 'Terjadi Kesalahan',
      retryBtn: 'Coba Lagi',
    },
  },
} as const

type Translations = typeof translations['EN']

interface LanguageContextType {
  language: Language
  toggleLanguage: () => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('EN')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_language') as Language | null
      if (saved === 'EN' || saved === 'ID') {
        setLanguage(saved)
      }
    } catch {}
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'EN' ? 'ID' : 'EN'
      try {
        localStorage.setItem('app_language', next)
      } catch {}
      return next
    })
  }, [])

  const t = translations[language] as Translations

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
