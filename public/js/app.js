// Main Application Controller & View Router - Attio / Linear / Dribbble 2026

const App = {
  currentView: 'pipeline',

  init() {
    console.log('🚀 Iniciando GrowthCRM Agencia Digital (UI 2026 Enhanced)...');
    this.setupRouting();
    this.setupModals();
    this.setupShortcuts();
    this.registerPWA();

    // Initialize modules
    if (window.Pipeline) window.Pipeline.init();
    if (window.ScraperUI) window.ScraperUI.init();
    if (window.StreetMode) window.StreetMode.init();
    if (window.WebhooksUI) window.WebhooksUI.init();
    if (window.Analytics) window.Analytics.init();
  },

  setupRouting() {
    const navLinks = document.querySelectorAll('.nav-link, .bottom-nav-item');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Check hash in URL or default to pipeline
    const hash = window.location.hash.replace('#', '');
    if (hash && ['pipeline', 'scraper', 'street', 'webhooks', 'analytics', 'settings'].includes(hash)) {
      this.switchView(hash);
    }
  },

  switchView(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Update active view section
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === `view-${viewName}`);
    });

    // Update active nav links in sidebar and bottom nav
    document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });

    // Update Header Title
    const titleMap = {
      pipeline: { title: 'Pipeline de Ventas', desc: 'Gestiona tus prospectos y etapas de cierre' },
      scraper: { title: 'Buscador de Google Maps', desc: 'Encuentra negocios sin web y con pocas reseñas' },
      street: { title: 'Modo Calle & Venta NFC', desc: 'Captura rápida en 15s y registro de ventas presenciales' },
      webhooks: { title: 'Facebook Ads & Webhooks', desc: 'Recepción automática de prospectos desde campañas' },
      analytics: { title: 'Reportes y Métricas', desc: 'Rendimiento comercial y facturación por canal' }
    };

    const header = titleMap[viewName] || { title: 'CRM Agencia', desc: '' };
    const h2 = document.querySelector('.page-title h2');
    const p = document.querySelector('.page-title p');
    if (h2) h2.innerText = header.title;
    if (p) p.innerText = header.desc;

    // Special module refresh triggers
    if (viewName === 'analytics' && window.Analytics) window.Analytics.loadMetrics();
    if (viewName === 'street' && window.StreetMode) window.StreetMode.loadStreetStats();
    if (viewName === 'pipeline' && window.Pipeline) window.Pipeline.renderCards();
  },

  setupShortcuts() {
    // CMD+K / CTRL+K Global Search Omnibox Trigger
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const omni = document.getElementById('globalOmniboxInput');
        if (omni) {
          omni.focus();
          omni.select();
        }
      }
    });

    // Click on Omnibox Container triggers input focus
    const omniContainer = document.getElementById('globalOmniboxContainer');
    if (omniContainer) {
      omniContainer.addEventListener('click', () => {
        const input = document.getElementById('globalOmniboxInput');
        if (input) input.focus();
      });
    }
  },

  setupModals() {
    // Close modal handlers
    document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Close when clicking outside modal box
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      }
    });

    // Lead Form submit handler
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
      leadForm.addEventListener('submit', (e) => Pipeline.handleFormSubmit(e));
    }
  },

  registerPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (reg) => console.log('✅ ServiceWorker registrado:', reg.scope),
          (err) => console.warn('ServiceWorker error:', err)
        );
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
