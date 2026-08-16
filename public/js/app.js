// Main Application Controller & View Router - Hubly CRM (2026 Edition)

const App = {
  currentView: 'dashboard',
  theme: 'dark',

  init() {
    console.log('🚀 Iniciando GrowthCRM (Hubly Edition 2026)...');
    if (window.Auth) window.Auth.init();
    this.initTheme();
    this.setupRouting();
    this.setupModals();
    this.setupShortcuts();
    this.setupSubTabs();
    this.registerPWA();

    // Initialize submodules
    if (window.Dashboard) window.Dashboard.init();
    if (window.Pipeline) window.Pipeline.init();
    if (window.ScraperUI) window.ScraperUI.init();
    if (window.StreetMode) window.StreetMode.init();
    if (window.WebhooksUI) window.WebhooksUI.init();
    if (window.AdsAgentUI) window.AdsAgentUI.init();
    if (window.Analytics) window.Analytics.init();
    if (window.SettingsUI) window.SettingsUI.init();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('growthcrm_theme') || 'dark';
    this.setTheme(savedTheme);

    // Bind theme switch buttons
    document.querySelectorAll('.theme-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('growthcrm_theme', theme);

    // Update icon on buttons
    document.querySelectorAll('.theme-switch-btn').forEach(btn => {
      btn.innerText = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';
    });
  },

  toggleTheme() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    API.toast(`Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`, 'info');
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

    // Check hash in URL or default to dashboard
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'pipeline', 'scraper', 'webhooks', 'analytics', 'settings'].includes(hash)) {
      this.switchView(hash);
    } else {
      this.switchView('dashboard');
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
      dashboard: { title: 'Dashboard General', desc: 'Métricas clave, objetivos y rendimiento comercial' },
      pipeline: { title: 'Pipeline de Ventas', desc: 'Gestiona tus prospectos y etapas de cierre' },
      scraper: { title: 'Búsqueda & Modo Calle', desc: 'Scraper de Google Maps y captura rápida de clientes en frío' },
      webhooks: { title: 'Facebook Ads & Webhooks', desc: 'Recepción automática de prospectos desde campañas de anuncios' },
      analytics: { title: 'Reporte de Ventas', desc: 'Histórico de transacciones y facturación por servicio' },
      settings: { title: 'Configuración & Seguridad', desc: 'Gestiona tu PIN de acceso y dispositivos vinculados' }
    };

    const header = titleMap[viewName] || { title: 'GrowthCRM', desc: '' };
    const h2 = document.querySelector('.page-title h2');
    const p = document.querySelector('.page-title p');
    if (h2) h2.innerText = header.title;
    if (p) p.innerText = header.desc;

    // Refresh active view data cleanly
    if (viewName === 'dashboard' && window.Dashboard) window.Dashboard.loadDashboardData();
    if (viewName === 'pipeline' && window.Pipeline) {
      window.Pipeline.loadLeads();
    }
    if (viewName === 'analytics' && window.Analytics) window.Analytics.loadMetrics();
    if (viewName === 'scraper' && window.StreetMode) window.StreetMode.loadStreetStats();
    if (viewName === 'settings' && window.SettingsUI) window.SettingsUI.loadSettingsView();
  },

  setupSubTabs() {
    const subtabs = document.querySelectorAll('.subtab-btn');
    subtabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-subtab');
        subtabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mapTab = document.getElementById('tab-maps-scraper');
        const streetTab = document.getElementById('tab-street-mode');

        if (target === 'maps') {
          if (mapTab) mapTab.style.display = 'block';
          if (streetTab) streetTab.style.display = 'none';
        } else if (target === 'street') {
          if (mapTab) mapTab.style.display = 'none';
          if (streetTab) streetTab.style.display = 'block';
          if (window.StreetMode) window.StreetMode.loadStreetStats();
        }
      });
    });
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

    // Universal New Lead Buttons
    document.querySelectorAll('#btnNewLead, .btn-new-lead').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.Pipeline) {
          window.Pipeline.openNewLeadModal();
        }
      });
    });

    // Lead Form submit handler
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
      leadForm.addEventListener('submit', (e) => {
        if (window.Pipeline) {
          window.Pipeline.handleFormSubmit(e);
        }
      });
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
