const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/analytics - Summary metrics for dashboard and reports
router.get('/', async (req, res) => {
  try {
    const analytics = await db.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/analytics/activity - Activity logs timeline
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = await db.getActivityLogs(limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
