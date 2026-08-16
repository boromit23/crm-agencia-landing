const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Default PIN if CRM_ACCESS_PIN is not defined in environment variables
const DEFAULT_PIN = process.env.CRM_ACCESS_PIN || '202688';
const AUTH_SECRET = process.env.AUTH_SECRET || 'crm_growth_secret_2026_key';

// Helper to generate secure session token
function generateToken(pin) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(pin + '_session').digest('hex');
}

// POST /api/auth/login - Validate PIN and return session token
router.post('/login', (req, res) => {
  const { pin } = req.body;
  const currentPin = process.env.CRM_ACCESS_PIN || DEFAULT_PIN;

  if (!pin) {
    return res.status(400).json({ success: false, error: 'Se requiere el PIN de acceso' });
  }

  // Support both configured PIN and default emergency pin
  if (pin.trim() === currentPin.trim() || pin.trim() === '202688') {
    const token = generateToken(currentPin);
    return res.json({
      success: true,
      token,
      message: 'Acceso autorizado al CRM'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'PIN de acceso incorrecto'
  });
});

// POST /api/auth/verify - Verify if existing session token is still valid
router.post('/verify', (req, res) => {
  const { token } = req.body;
  const currentPin = process.env.CRM_ACCESS_PIN || DEFAULT_PIN;
  const expectedToken = generateToken(currentPin);

  if (token && token === expectedToken) {
    return res.json({ success: true, valid: true });
  }

  return res.status(401).json({ success: false, valid: false, error: 'Sesión expirada o inválida' });
});

// Middleware to protect API routes (can be used for critical endpoints)
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const currentPin = process.env.CRM_ACCESS_PIN || DEFAULT_PIN;
  const expectedToken = generateToken(currentPin);

  if (token && token === expectedToken) {
    return next();
  }

  return res.status(401).json({ success: false, error: 'No autorizado. Se requiere PIN de acceso.' });
}

module.exports = { router, requireAuth };
