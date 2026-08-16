const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/settings - Fetch agency settings
router.get('/', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings - Update agency settings
router.put('/', async (req, res) => {
  try {
    const updated = await db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
