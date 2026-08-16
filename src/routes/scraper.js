const express = require('express');
const router = express.Router();
const { scraper } = require('../scraper');

// GET /api/scraper/search - Search Google Maps prospects with customizable limit (10 to 50)
router.get('/search', async (req, res) => {
  try {
    const { niche, location, limit } = req.query;
    if (!niche || !location) {
      return res.status(400).json({ success: false, error: 'Se requiere nicho (ej. Talleres mecánicos) y ubicación (ej. Valencia, Venezuela)' });
    }

    const maxLimit = Math.min(50, Math.max(5, parseInt(limit) || 25));
    const data = await scraper.searchProspects(niche, location, { limit: maxLimit });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in scraper search:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scraper/script-preview - Generate sales script for custom prospect
router.post('/script-preview', (req, res) => {
  try {
    const { prospect, city, offer } = req.body;
    const scripts = scraper.generateSalesScripts(prospect || { business_name: 'Negocio', reviews_count: 10 }, city || 'Local', offer || 'gbp_landing');
    res.json({ success: true, data: scripts });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
