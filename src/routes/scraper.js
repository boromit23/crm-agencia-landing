const express = require('express');
const router = express.Router();
const { scraper } = require('../scraper');

// GET /api/scraper/search - Search Google Maps prospects
router.get('/search', async (req, res) => {
  try {
    const { niche, location } = req.query;
    if (!niche || !location) {
      return res.status(400).json({ success: false, error: 'Se requiere nicho (ej. Dentistas) y ubicación (ej. Madrid)' });
    }

    const data = await scraper.searchProspects(niche, location);
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
