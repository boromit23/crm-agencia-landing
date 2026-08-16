require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const leadsRouter = require('./src/routes/leads');
const scraperRouter = require('./src/routes/scraper');
const salesRouter = require('./src/routes/sales');
const webhooksRouter = require('./src/routes/webhooks');
const analyticsRouter = require('./src/routes/analytics');
const settingsRouter = require('./src/routes/settings');
const aiAgentRouter = require('./src/routes/ai_agent');
const { router: authRouter } = require('./src/routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/scraper', scraperRouter);
app.use('/api/sales', salesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/agent', aiAgentRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), system: 'Agencia CRM v1.0' });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint API no encontrado' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening if run directly
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 CRM AGENCIA LANDING & NFC CARDS INICIADO`);
    console.log(`📡 URL Local: http://localhost:${PORT}`);
    console.log(`🗄️ Supabase DB: Conectado a opaqkietypicupvipwgx`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
