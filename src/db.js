require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://opaqkietypicupvipwgx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials missing from environment.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions
const db = {
  // LEADS
  async getLeads(filters = {}) {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    
    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.has_website !== undefined) {
      query = query.eq('has_website', filters.has_website);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getLeadById(id) {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createLead(lead) {
    const payload = {
      business_name: lead.business_name,
      contact_name: lead.contact_name || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      category: lead.category || 'General',
      maps_url: lead.maps_url || '',
      has_website: lead.has_website === true,
      website_url: lead.website_url || '',
      website_status: lead.website_status || (lead.has_website ? 'web_deficiente' : 'sin_web'),
      rating: lead.rating ? parseFloat(lead.rating) : null,
      reviews_count: lead.reviews_count ? parseInt(lead.reviews_count) : 0,
      stage: lead.stage || 'nuevo_prospecto',
      deal_value: lead.deal_value ? parseFloat(lead.deal_value) : 0,
      currency: lead.currency || 'USD',
      source: lead.source || 'google_maps',
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      notes: lead.notes || ''
    };

    const { data, error } = await supabase.from('leads').insert([payload]).select().single();
    if (error) throw error;

    // Log activity
    await this.addActivityLog({
      lead_id: data.id,
      action_type: 'lead_creado',
      title: `Nuevo lead registrado: ${data.business_name}`,
      details: `Origen: ${data.source} | Etapa: ${data.stage}`
    });

    return data;
  },

  async createLeadsBatch(leads) {
    if (!leads || leads.length === 0) return [];
    
    const formatted = leads.map(lead => ({
      business_name: lead.business_name,
      contact_name: lead.contact_name || '',
      phone: lead.phone || '',
      whatsapp: lead.whatsapp || lead.phone || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      category: lead.category || 'General',
      maps_url: lead.maps_url || '',
      has_website: lead.has_website === true,
      website_url: lead.website_url || '',
      website_status: lead.website_status || (lead.has_website ? 'web_deficiente' : 'sin_web'),
      rating: lead.rating ? parseFloat(lead.rating) : null,
      reviews_count: lead.reviews_count ? parseInt(lead.reviews_count) : 0,
      stage: lead.stage || (lead.has_website ? 'web_deficiente' : 'sin_web_gbp'),
      deal_value: lead.deal_value ? parseFloat(lead.deal_value) : 0,
      currency: lead.currency || 'USD',
      source: lead.source || 'google_maps',
      tags: Array.isArray(lead.tags) ? lead.tags : ['Importado Maps'],
      notes: lead.notes || ''
    }));

    const { data, error } = await supabase.from('leads').insert(formatted).select();
    if (error) throw error;
    return data || [];
  },

  async updateLead(id, updates) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async updateLeadStage(id, newStage) {
    const old = await this.getLeadById(id);
    const updated = await this.updateLead(id, { stage: newStage });

    await this.addActivityLog({
      lead_id: id,
      action_type: 'cambio_etapa',
      title: `Cambio de etapa: ${old.stage} ➔ ${newStage}`,
      details: `Negocio: ${old.business_name}`
    });

    return updated;
  },

  async deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
    return { success: true, id };
  },

  // SALES
  async getSales() {
    const { data, error } = await supabase.from('sales').select('*, leads(business_name, contact_name, phone)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createSale(sale) {
    const payload = {
      lead_id: sale.lead_id || null,
      business_name: sale.business_name,
      service_type: sale.service_type, // 'nfc_card', 'gbp_landing', 'web_redesign', 'monthly_maintenance'
      amount: parseFloat(sale.amount) || 0,
      currency: sale.currency || 'USD',
      payment_method: sale.payment_method || 'efectivo',
      payment_status: sale.payment_status || 'completado',
      notes: sale.notes || ''
    };

    const { data, error } = await supabase.from('sales').insert([payload]).select().single();
    if (error) throw error;

    // Log activity if linked to lead
    if (sale.lead_id) {
      await this.addActivityLog({
        lead_id: sale.lead_id,
        action_type: 'venta_registrada',
        title: `Venta registrada: $${payload.amount} (${payload.service_type})`,
        details: `Método: ${payload.payment_method} | Estado: ${payload.payment_status}`
      });

      // Also set lead stage to 'ganado'
      await this.updateLead(sale.lead_id, { stage: 'ganado', deal_value: payload.amount });
    }

    return data;
  },

  // NFC INVENTORY
  async getNfcInventory() {
    const { data, error } = await supabase.from('nfc_inventory').select('*, leads(business_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createNfcCard(card) {
    const payload = {
      card_code: card.card_code,
      status: card.status || 'disponible',
      assigned_lead_id: card.assigned_lead_id || null,
      batch: card.batch || 'Lote 1',
      unit_cost: card.unit_cost ? parseFloat(card.unit_cost) : 3.00,
      sale_price: card.sale_price ? parseFloat(card.sale_price) : 35.00,
      notes: card.notes || ''
    };

    const { data, error } = await supabase.from('nfc_inventory').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  async updateNfcCard(id, updates) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('nfc_inventory').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ACTIVITY LOGS
  async getActivityLogs(limit = 50) {
    const { data, error } = await supabase.from('activity_logs').select('*, leads(business_name)').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  },

  async addActivityLog(log) {
    const payload = {
      lead_id: log.lead_id || null,
      action_type: log.action_type || 'general',
      title: log.title,
      details: log.details || ''
    };
    const { data, error } = await supabase.from('activity_logs').insert([payload]).select().single();
    if (error) {
      console.error('Error logging activity:', error.message);
      return null;
    }
    return data;
  },

  // SETTINGS
  async getSettings() {
    const { data, error } = await supabase.from('agency_settings').select('*').eq('id', 'config_default').single();
    if (error) {
      return {
        id: 'config_default',
        agency_name: 'Agencia Growth & GBP',
        default_currency: 'USD',
        default_nfc_price: 35.0,
        default_landing_price: 250.0,
        default_redesign_price: 450.0,
        webhook_secret: 'wh_sec_crm_landing_2026'
      };
    }
    return data;
  },

  async updateSettings(updates) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('agency_settings').update(updates).eq('id', 'config_default').select().single();
    if (error) throw error;
    return data;
  },

  // ANALYTICS
  async getAnalytics() {
    const [leadsRes, salesRes, nfcRes] = await Promise.all([
      supabase.from('leads').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('nfc_inventory').select('*')
    ]);

    const leads = leadsRes.data || [];
    const sales = salesRes.data || [];
    const nfc = nfcRes.data || [];

    const totalRevenue = sales.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    const pipelineValue = leads
      .filter(l => l.stage !== 'ganado' && l.stage !== 'perdido')
      .reduce((acc, l) => acc + (parseFloat(l.deal_value) || 0), 0);

    const wonLeads = leads.filter(l => l.stage === 'ganado').length;
    const closedLeads = leads.filter(l => l.stage === 'ganado' || l.stage === 'perdido').length;
    const winRate = closedLeads > 0 ? ((wonLeads / closedLeads) * 100).toFixed(1) : 0;

    // Sales by Service Type
    const revenueByService = {
      nfc_card: 0,
      gbp_landing: 0,
      web_redesign: 0,
      monthly_maintenance: 0
    };
    sales.forEach(s => {
      if (revenueByService[s.service_type] !== undefined) {
        revenueByService[s.service_type] += parseFloat(s.amount) || 0;
      }
    });

    // Leads by Stage
    const leadsByStage = {};
    leads.forEach(l => {
      leadsByStage[l.stage] = (leadsByStage[l.stage] || 0) + 1;
    });

    // Leads by Source
    const leadsBySource = {
      google_maps: 0,
      calle_nfc: 0,
      facebook_ads: 0,
      web_form: 0,
      manual: 0
    };
    leads.forEach(l => {
      const src = l.source || 'google_maps';
      leadsBySource[src] = (leadsBySource[src] || 0) + 1;
    });

    // NFC Inventory stats
    const nfcStats = {
      total: nfc.length,
      disponibles: nfc.filter(c => c.status === 'disponible').length,
      vendidas: nfc.filter(c => c.status === 'entregada' || c.status === 'asignada').length,
      totalSalesRevenue: revenueByService.nfc_card
    };

    return {
      totalRevenue,
      pipelineValue,
      totalLeads: leads.length,
      wonLeads,
      winRate,
      revenueByService,
      leadsByStage,
      leadsBySource,
      nfcStats,
      recentSales: sales.slice(0, 5)
    };
  }
};

module.exports = { db, supabase };
