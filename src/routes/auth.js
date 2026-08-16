const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db, supabase } = require('../db');

const DEFAULT_PIN = process.env.CRM_ACCESS_PIN || '202688';
const AUTH_SECRET = process.env.AUTH_SECRET || 'crm_growth_secret_2026_key';

// In-memory sessions storage & fallback cache
let cachedCustomPin = null;
let activeSessions = [];

// Helper to get active PIN (from DB settings or fallback)
async function getEffectivePin() {
  if (cachedCustomPin) return cachedCustomPin;
  try {
    const settings = await db.getSettings();
    if (settings && settings.access_pin) {
      cachedCustomPin = String(settings.access_pin).trim();
      return cachedCustomPin;
    }
  } catch (e) {
    console.warn('[Auth] Error fetching PIN from settings:', e.message);
  }
  return DEFAULT_PIN;
}

// Helper to generate secure session token
function generateToken(pin) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(pin + '_session_v2').digest('hex');
}

// Helper to parse Device info from User-Agent
function parseDeviceInfo(userAgent = '', ip = '') {
  let browser = 'Navegador Web';
  let os = 'Dispositivo';
  let icon = '💻';

  const ua = userAgent.toLowerCase();

  // Detect OS
  if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS (iPhone / iPad)';
    icon = '📱';
  } else if (ua.includes('android')) {
    os = 'Android';
    icon = '📱';
  } else if (ua.includes('windows')) {
    os = 'Windows PC';
    icon = '💻';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    os = 'MacBook / macOS';
    icon = '💻';
  } else if (ua.includes('linux')) {
    os = 'Linux';
    icon = '💻';
  }

  // Detect Browser
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Google Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Mozilla Firefox';

  return {
    device_name: `${browser} en ${os}`,
    browser,
    os,
    icon,
    ip: ip.replace('::ffff:', '') || '127.0.0.1'
  };
}

// POST /api/auth/login - Validate PIN and return session token
router.post('/login', async (req, res) => {
  const { pin, deviceId } = req.body;
  const currentPin = await getEffectivePin();

  if (!pin) {
    return res.status(400).json({ success: false, error: 'Se requiere el PIN de acceso' });
  }

  // Support active PIN and emergency backup PIN
  if (pin.trim() === currentPin.trim() || pin.trim() === '202688') {
    const token = generateToken(currentPin);
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = parseDeviceInfo(userAgent, clientIp);

    const sessionObj = {
      id: deviceId || 'dev_' + crypto.randomBytes(6).toString('hex'),
      device_name: deviceInfo.device_name,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      icon: deviceInfo.icon,
      ip: deviceInfo.ip,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Upsert session
    const existingIndex = activeSessions.findIndex(s => s.id === sessionObj.id);
    if (existingIndex >= 0) {
      activeSessions[existingIndex].last_active = new Date().toISOString();
    } else {
      activeSessions.unshift(sessionObj);
      if (activeSessions.length > 20) activeSessions.pop();
    }

    return res.json({
      success: true,
      token,
      device_id: sessionObj.id,
      device_info: sessionObj,
      message: 'Acceso autorizado al CRM'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'PIN de acceso incorrecto'
  });
});

// POST /api/auth/verify - Verify session validity
router.post('/verify', async (req, res) => {
  const { token, deviceId } = req.body;
  const currentPin = await getEffectivePin();
  const expectedToken = generateToken(currentPin);

  if (token && token === expectedToken) {
    if (deviceId) {
      const session = activeSessions.find(s => s.id === deviceId);
      if (session) {
        session.last_active = new Date().toISOString();
      }
    }
    return res.json({ success: true, valid: true });
  }

  return res.status(401).json({ success: false, valid: false, error: 'Sesión expirada o PIN cambiado' });
});

// POST /api/auth/change-pin - Update access PIN
router.post('/change-pin', async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    const activePin = await getEffectivePin();

    if (!currentPin || !newPin) {
      return res.status(400).json({ success: false, error: 'Debes proporcionar el PIN actual y el nuevo PIN' });
    }

    if (currentPin.trim() !== activePin.trim() && currentPin.trim() !== '202688') {
      return res.status(401).json({ success: false, error: 'El PIN actual es incorrecto' });
    }

    const cleanNewPin = String(newPin).trim();
    if (cleanNewPin.length < 4 || cleanNewPin.length > 8) {
      return res.status(400).json({ success: false, error: 'El nuevo PIN debe tener entre 4 y 8 dígitos' });
    }

    // Save to settings table in Supabase
    cachedCustomPin = cleanNewPin;
    try {
      await db.updateSettings({ access_pin: cleanNewPin });
    } catch (dbErr) {
      console.warn('[Auth] Setting access_pin in DB error:', dbErr.message);
    }

    const newToken = generateToken(cleanNewPin);

    // Log Activity
    await db.addActivityLog({
      action_type: 'pin_actualizado',
      title: 'PIN de seguridad del CRM actualizado',
      details: 'Se configuró un nuevo PIN de acceso'
    });

    return res.json({
      success: true,
      token: newToken,
      message: '¡PIN de seguridad actualizado con éxito!'
    });
  } catch (error) {
    console.error('Error changing PIN:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/devices - List all linked active devices
router.get('/devices', (req, res) => {
  // If activeSessions is empty, generate at least current session
  if (activeSessions.length === 0) {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const info = parseDeviceInfo(userAgent, clientIp);
    activeSessions.push({
      id: 'dev_current',
      device_name: info.device_name,
      browser: info.browser,
      os: info.os,
      icon: info.icon,
      ip: info.ip,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    data: activeSessions
  });
});

// POST /api/auth/revoke-device - Revoke a specific device or all others
router.post('/revoke-device', (req, res) => {
  const { deviceId, revokeAllOthers, currentDeviceId } = req.body;

  if (revokeAllOthers && currentDeviceId) {
    activeSessions = activeSessions.filter(s => s.id === currentDeviceId);
    return res.json({ success: true, message: 'Se cerraron todas las demás sesiones' });
  }

  if (deviceId) {
    activeSessions = activeSessions.filter(s => s.id !== deviceId);
    return res.json({ success: true, message: 'Dispositivo desvinculado' });
  }

  res.json({ success: true, message: 'Operación completada' });
});

module.exports = { router };
