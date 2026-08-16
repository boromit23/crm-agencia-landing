const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/sales - List all recorded sales
router.get('/', async (req, res) => {
  try {
    const sales = await db.getSales();
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sales - Register a new sale (Street NFC sale, Landing Page project, etc.)
router.post('/', async (req, res) => {
  try {
    const sale = await db.createSale(req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/sales/nfc-inventory - List NFC Cards inventory
router.get('/nfc-inventory', async (req, res) => {
  try {
    const cards = await db.getNfcInventory();
    res.json({ success: true, count: cards.length, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sales/nfc-inventory - Add new NFC card to inventory
router.post('/nfc-inventory', async (req, res) => {
  try {
    const card = await db.createNfcCard(req.body);
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/sales/nfc-inventory/:id - Update NFC card status (assign to lead, mark delivered)
router.put('/nfc-inventory/:id', async (req, res) => {
  try {
    const card = await db.updateNfcCard(req.params.id, req.body);
    res.json({ success: true, data: card });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
