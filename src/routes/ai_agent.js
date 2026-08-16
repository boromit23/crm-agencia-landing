const express = require('express');
const router = express.Router();
const { adsStrategist } = require('../agents/ads_strategist');
const { whatsappWarmer } = require('../agents/whatsapp_warmer');

// POST /api/agent/generate-campaign - Generates custom Meta Ads strategy & copies
router.post('/generate-campaign', (req, res) => {
  try {
    const { niche, city, budget_daily, angle } = req.body;
    const campaign = adsStrategist.generateCampaign({
      niche: niche || 'Talleres Mecánicos',
      city: city || 'Valencia, Venezuela',
      budget_daily: budget_daily || 10,
      angle: angle || 'gbp_landing_gift'
    });
    res.json(campaign);
  } catch (error) {
    console.error('Error generating campaign:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agent/whatsapp-initial - Generates initial warm-up message for newly registered lead
router.post('/whatsapp-initial', (req, res) => {
  try {
    const { lead, campaignName } = req.body;
    const result = whatsappWarmer.generateInitialWarmup(lead || {}, campaignName || '');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/agent/whatsapp-reply - Generates smart AI reply to customer objection or question
router.post('/whatsapp-reply', (req, res) => {
  try {
    const { message, leadContext } = req.body;
    const result = whatsappWarmer.processCustomerMessage(message || '', leadContext || {});
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
