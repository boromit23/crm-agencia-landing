const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/webhooks/facebook - Meta Webhook Verification
router.get('/facebook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WEBHOOK_SECRET || 'wh_sec_crm_landing_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook] Meta Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send('Forbidden: Token no coincide');
    }
  }

  res.status(200).json({ status: 'active', message: 'Meta Ads Webhook endpoint listo para recibir suscripciones' });
});

// POST /api/webhooks/facebook - Ingest leads from Facebook Lead Ads / Zapier / Make / Web Forms
router.post('/facebook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Webhook] Recibido payload de Facebook Ads / Integración:', JSON.stringify(payload));

    let businessName = 'Prospecto Facebook Ads';
    let contactName = '';
    let phone = '';
    let email = '';
    let notes = '';
    let campaignName = 'Campaña Meta Ads';

    // 1. Meta Direct Leadgen Object Structure
    if (payload.entry && Array.isArray(payload.entry)) {
      for (const entry of payload.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.value && change.value.leadgen_id) {
              notes = `Lead ID Meta: ${change.value.leadgen_id} | Form ID: ${change.value.form_id || 'N/A'}`;
              campaignName = change.value.ad_name || 'Anuncio Facebook';
            }
          }
        }
      }
    } 
    // 2. Direct / Zapier / Make parsed JSON structure
    else {
      businessName = payload.business_name || payload.company || payload.empresa || payload.name || payload.full_name || 'Negocio Interesado (FB Ads)';
      contactName = payload.contact_name || payload.full_name || payload.name || '';
      phone = payload.phone || payload.phone_number || payload.telefono || payload.whatsapp || '';
      email = payload.email || payload.correo || '';
      campaignName = payload.campaign || payload.ad_name || payload.source_campaign || 'Campaña Landing Pages';
      notes = payload.notes || payload.message || `Lead recibido vía Facebook Ads (${campaignName})`;
    }

    const newLead = await db.createLead({
      business_name: businessName,
      contact_name: contactName,
      phone: phone,
      whatsapp: phone,
      email: email,
      category: payload.category || 'Servicio Local',
      stage: 'nuevo_prospecto',
      source: 'facebook_ads',
      deal_value: 250.00,
      tags: ['Facebook Ads', campaignName],
      notes: notes,
      has_website: payload.has_website || false,
      website_status: payload.has_website ? 'web_deficiente' : 'sin_web'
    });

    res.status(200).json({ success: true, message: 'Lead de Facebook Ads registrado correctamente en Supabase', lead: newLead });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/webhooks/simulate - Simulate an incoming Facebook Lead for instant testing
router.post('/simulate', async (req, res) => {
  try {
    const mockNames = ['Dr. Alejandro Morales', 'Pizzería Napolitana Don Luigi', 'Taller Mecánico El Veloz', 'Dra. Valentina Gómez', 'Barbería Urban Style'];
    const mockCampaigns = ['Campaña 1: Regalo Landing GBP', 'Campaña 2: Tarjetas NFC Reseñas', 'Campaña 3: Rediseño Web Rápido'];
    
    const randomBiz = req.body.business_name || mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomCampaign = req.body.campaign || mockCampaigns[Math.floor(Math.random() * mockCampaigns.length)];
    const randomPhone = req.body.phone || `+34 6${Math.floor(10000000 + Math.random() * 89999999)}`;
    const randomEmail = req.body.email || `lead.${Date.now().toString().slice(-4)}@gmail.com`;

    const lead = await db.createLead({
      business_name: randomBiz,
      contact_name: req.body.contact_name || randomBiz.split(' ')[0] + ' ' + (randomBiz.split(' ')[1] || ''),
      phone: randomPhone,
      whatsapp: randomPhone,
      email: randomEmail,
      address: 'Calle de los Anuncios 10, Madrid',
      city: 'Madrid',
      category: 'Servicio Local',
      has_website: req.body.has_website || false,
      website_status: 'sin_web',
      stage: 'nuevo_prospecto',
      deal_value: 250.00,
      source: 'facebook_ads',
      tags: ['Facebook Ads', 'Simulado', randomCampaign],
      notes: `Lead recibido desde Formulario de Anuncios: "${randomCampaign}". Pregunta respondida: ¿Te gustaría una landing page gratis con tu perfil de Google? -> "SÍ, ME INTERESA".`
    });

    res.status(201).json({ success: true, message: 'Lead de Facebook Ads simulado con éxito', data: lead });
  } catch (error) {
    console.error('Error in webhook simulation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
