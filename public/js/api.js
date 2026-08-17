// API Client & UI Notification Helpers

const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = window.Auth ? window.Auth.getToken() : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición al servidor');
      }

      return data;
    } catch (err) {
      console.warn(`[API Info] ${endpoint}:`, err.message);
      // Only toast on explicit user actions (POST, PUT, DELETE, PATCH) or when not silent
      const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes((options.method || 'GET').toUpperCase());
      if (isWriteMethod && !options.silent) {
        this.toast(err.message, 'error');
      }
      throw err;
    }
  },

  // LEADS
  async getLeads(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/leads${params ? '?' + params : ''}`);
  },

  async getLead(id) {
    return this.request(`/leads/${id}`);
  },

  async createLead(lead) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(lead)
    });
  },

  async batchCreateLeads(leads) {
    return this.request('/leads/batch', {
      method: 'POST',
      body: JSON.stringify({ leads })
    });
  },

  async updateLead(id, updates) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async updateLeadStage(id, stage) {
    return this.request(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage })
    });
  },

  async deleteLead(id) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE'
    });
  },

  // SCRAPER
  async searchProspects(niche, location) {
    return this.request(`/scraper/search?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`);
  },

  async generateSalesScripts(prospect, city, offer) {
    return this.request('/scraper/script-preview', {
      method: 'POST',
      body: JSON.stringify({ prospect, city, offer })
    });
  },

  // SALES & NFC
  async getSales() {
    return this.request('/sales');
  },

  async createSale(sale) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    });
  },

  async getNfcInventory() {
    return this.request('/sales/nfc-inventory');
  },

  async createNfcCard(card) {
    return this.request('/sales/nfc-inventory', {
      method: 'POST',
      body: JSON.stringify(card)
    });
  },

  // WEBHOOKS & SIMULATION
  async simulateFacebookLead(payload = {}) {
    return this.request('/webhooks/simulate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // ANALYTICS & LOGS
  async getAnalytics() {
    return this.request('/analytics');
  },

  async getActivityLogs(limit = 30) {
    return this.request(`/analytics/activity?limit=${limit}`);
  },

  // SETTINGS
  async getSettings() {
    return this.request('/settings');
  },

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // Toast Notification System
  toast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '⚡';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Formatters
  formatCurrency(amount, currency = 'USD') {
    const num = parseFloat(amount) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  },

  cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  },

  openWhatsApp(phone, message = '') {
    const clean = this.cleanPhoneNumber(phone);
    if (!clean) {
      this.toast('Este lead no tiene número de teléfono registrado', 'warning');
      return;
    }
    const cleanNoPlus = clean.startsWith('+') ? clean.substring(1) : clean;
    const url = `https://wa.me/${cleanNoPlus}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};

window.API = API;
