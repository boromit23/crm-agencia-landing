require('dotenv').config();
const { db, supabase } = require('./src/db');

async function seed() {
  console.log('🌱 Insertando datos iniciales realistas en Supabase...');

  // Check if leads already exist
  const existing = await db.getLeads();
  if (existing && existing.length > 0) {
    console.log(`Ya existen ${existing.length} leads en Supabase. Omitiendo seed.`);
    return;
  }

  // 1. Seed Leads
  const leads = [
    {
      business_name: 'Clínica Dental Sonrisas & Salud',
      contact_name: 'Dra. Carmen Silva',
      phone: '+34612345678',
      whatsapp: '+34612345678',
      email: 'contacto@dentalsonrisas.es',
      address: 'Calle Mayor 45, Madrid',
      city: 'Madrid',
      category: 'Clínica Dental',
      has_website: false,
      website_status: 'sin_web',
      rating: 4.6,
      reviews_count: 12,
      stage: 'sin_web_gbp',
      deal_value: 250,
      source: 'google_maps',
      tags: ['Google Maps', 'Sin Web', 'Gifting GBP'],
      notes: 'No tienen web oficial en Google Maps. Candidata ideal para regalarle landing con el servicio de GBP.'
    },
    {
      business_name: 'Trattoria Bella Napoli',
      contact_name: 'Marco Rossi',
      phone: '+34611223344',
      whatsapp: '+34611223344',
      email: 'info@bellanapoli.com',
      address: 'Calle Sol 18, Madrid',
      city: 'Madrid',
      category: 'Restaurante Italiano',
      has_website: false,
      website_status: 'sin_web',
      rating: 4.7,
      reviews_count: 8,
      stage: 'contactado',
      deal_value: 250,
      source: 'google_maps',
      tags: ['Google Maps', 'Demo Enviada'],
      notes: 'Se le envió guion de WhatsApp con boceto de carta digital. Interesado en optimizar Google Maps.'
    },
    {
      business_name: 'Taller Mecánico AutoExpert',
      contact_name: 'Javier Mendoza',
      phone: '+34616112233',
      whatsapp: '+34616112233',
      email: 'taller@autoexpert.es',
      address: 'Polígono Norte 4, Madrid',
      city: 'Madrid',
      category: 'Taller Mecánico',
      has_website: false,
      website_status: 'sin_web',
      rating: 4.3,
      reviews_count: 6,
      stage: 'nfc_calle',
      deal_value: 35,
      source: 'calle_nfc',
      tags: ['Visita en Frío', 'Tarjeta NFC'],
      notes: 'Visita en calle. Le interesó la tarjeta NFC para colocar en recepción cuando entregan los coches.'
    },
    {
      business_name: 'Pizzería Don Luigi Express',
      contact_name: 'Luigi Vanni',
      phone: '+34615667788',
      whatsapp: '+34615667788',
      email: 'pedidos@donluigi.es',
      address: 'Av. de la Libertad 30, Madrid',
      city: 'Madrid',
      category: 'Pizzería',
      has_website: false,
      website_status: 'sin_web',
      rating: 4.8,
      reviews_count: 15,
      stage: 'ganado',
      deal_value: 35,
      source: 'calle_nfc',
      tags: ['Modo Calle', 'Venta Cerrada'],
      notes: 'Se le vendió tarjeta NFC en el mostrador. Pagó $35 en efectivo.'
    },
    {
      business_name: 'Salón de Belleza Glamour & Estilo',
      contact_name: 'Patricia Gómez',
      phone: '+34611334455',
      whatsapp: '+34611334455',
      email: 'citas@glamourestilo.com',
      address: 'Calle Alcalá 210, Madrid',
      city: 'Madrid',
      category: 'Salón de Belleza',
      has_website: false,
      website_status: 'sin_web',
      rating: 4.9,
      reviews_count: 9,
      stage: 'propuesta',
      deal_value: 250,
      source: 'facebook_ads',
      tags: ['Facebook Ads', 'Campaña Landing GBP'],
      notes: 'Lead recibido desde campaña de anuncios en Meta. Quiere agenda de citas online y mejor posición en Google.'
    },
    {
      business_name: 'Centro Médico Integral Salud',
      contact_name: 'Dr. Roberto Blanco',
      phone: '+34614112233',
      whatsapp: '+34614112233',
      email: 'consultas@integralsalud.es',
      address: 'Calle Velázquez 55, Madrid',
      city: 'Madrid',
      category: 'Clínica Médica',
      has_website: true,
      website_url: 'http://integralsalud-antiguo.es',
      website_status: 'web_deficiente',
      rating: 4.5,
      reviews_count: 84,
      stage: 'web_deficiente',
      deal_value: 450,
      source: 'google_maps',
      tags: ['Rediseño Web', 'High Ticket'],
      notes: 'Tiene web creada en 2018 que no es responsiva. Candidato perfecto para rediseño y modernización completa.'
    }
  ];

  for (const l of leads) {
    await db.createLead(l);
  }

  // 2. Seed Sales
  await db.createSale({
    business_name: 'Pizzería Don Luigi Express',
    service_type: 'nfc_card',
    amount: 35.00,
    payment_method: 'efectivo',
    payment_status: 'completado',
    notes: 'Cobro de tarjeta NFC en mostrador.'
  });

  await db.createSale({
    business_name: 'Barbería King Cuts',
    service_type: 'nfc_card',
    amount: 35.00,
    payment_method: 'zelle',
    payment_status: 'completado',
    notes: 'Tarjeta NFC entregada y configurada.'
  });

  await db.createSale({
    business_name: 'Restaurante Asador Don Fernando',
    service_type: 'gbp_landing',
    amount: 250.00,
    payment_method: 'transferencia',
    payment_status: 'completado',
    notes: 'Optimización de Google Maps + Landing de regalo entregada.'
  });

  // 3. Seed NFC Cards
  for (let i = 1; i <= 15; i++) {
    const code = `NFC-2026-${String(i).padStart(3, '0')}`;
    await db.createNfcCard({
      card_code: code,
      status: i <= 2 ? 'entregada' : 'disponible',
      batch: 'Lote Alpha 1',
      unit_cost: 3.50,
      sale_price: 35.00,
      notes: i <= 2 ? 'Entregada a cliente' : 'Disponible en mochila'
    });
  }

  console.log('✅ Seed data completado con éxito en Supabase.');
}

seed().catch(console.error);
