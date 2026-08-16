require('dotenv').config();

const sql = `
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  category TEXT,
  maps_url TEXT,
  has_website BOOLEAN DEFAULT false,
  website_url TEXT,
  website_status TEXT DEFAULT 'sin_web',
  rating NUMERIC(3,2),
  reviews_count INTEGER DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'nuevo_prospecto',
  deal_value NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  source TEXT DEFAULT 'google_maps',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT DEFAULT 'efectivo',
  payment_status TEXT DEFAULT 'completado',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nfc_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'disponible',
  assigned_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  batch TEXT DEFAULT 'Lote 1',
  unit_cost NUMERIC(10,2) DEFAULT 3.00,
  sale_price NUMERIC(10,2) DEFAULT 35.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agency_settings (
  id TEXT PRIMARY KEY DEFAULT 'config_default',
  agency_name TEXT DEFAULT 'Mi Agencia Digital',
  default_currency TEXT DEFAULT 'USD',
  default_nfc_price NUMERIC(10,2) DEFAULT 35.00,
  default_landing_price NUMERIC(10,2) DEFAULT 250.00,
  default_redesign_price NUMERIC(10,2) DEFAULT 450.00,
  webhook_secret TEXT DEFAULT 'wh_sec_nfc_crm_2026',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO agency_settings (id, agency_name, default_currency, default_nfc_price, default_landing_price, default_redesign_price)
VALUES ('config_default', 'Agencia Growth & GBP', 'USD', 35.00, 250.00, 450.00)
ON CONFLICT (id) DO NOTHING;
`;

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Sending schema to Supabase project opaqkietypicupvipwgx...');
  const res = await fetch('https://api.supabase.com/v1/projects/opaqkietypicupvipwgx/database/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const data = await res.json();
  console.log('Result:', data);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { sql };
