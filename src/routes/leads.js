const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/leads - List all leads with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      stage: req.query.stage,
      source: req.query.source,
      has_website: req.query.has_website !== undefined ? req.query.has_website === 'true' : undefined
    };
    const leads = await db.getLeads(filters);
    res.json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/:id - Single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead no encontrado' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads - Create new lead
router.post('/', async (req, res) => {
  try {
    const lead = await db.createLead(req.body);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/leads/batch - Create multiple leads from Scraper
router.post('/batch', async (req, res) => {
  try {
    const leads = await db.createLeadsBatch(req.body.leads || []);
    res.status(201).json({ success: true, count: leads.length, data: leads });
  } catch (error) {
    console.error('Error batch importing leads:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/leads/:id - Update lead details
router.put('/:id', async (req, res) => {
  try {
    const lead = await db.updateLead(req.params.id, req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/leads/:id/stage - Fast Stage change (drag & drop)
router.patch('/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage) return res.status(400).json({ success: false, error: 'Etapa requerida' });
    const lead = await db.updateLeadStage(req.params.id, stage);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.deleteLead(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
