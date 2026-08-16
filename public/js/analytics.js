// Sales Analytics & Reporting Module

const Analytics = {
  data: null,

  async init() {
    await this.loadMetrics();
    this.setupEventListeners();
  },

  async loadMetrics() {
    try {
      const res = await API.getAnalytics();
      this.data = res.data;
      this.renderKPIs(this.data);
      this.renderBreakdowns(this.data);
      await this.loadRecentSalesTable();
    } catch (err) {
      console.error('Error cargando analítica:', err);
    }
  },

  renderKPIs(data) {
    const revEl = document.getElementById('kpiTotalRevenue');
    const pipeEl = document.getElementById('kpiPipelineValue');
    const nfcRevEl = document.getElementById('kpiNfcRevenue');
    const winRateEl = document.getElementById('kpiWinRate');

    if (revEl) revEl.innerText = API.formatCurrency(data.totalRevenue || 0);
    if (pipeEl) pipeEl.innerText = API.formatCurrency(data.pipelineValue || 0);
    if (nfcRevEl) nfcRevEl.innerText = API.formatCurrency(data.revenueByService?.nfc_card || 0);
    if (winRateEl) winRateEl.innerText = `${data.winRate || 0}%`;
  },

  renderBreakdowns(data) {
    // 1. Revenue by Service
    const serviceContainer = document.getElementById('revenueByServiceList');
    if (serviceContainer) {
      const services = [
        { key: 'nfc_card', label: '💳 Tarjetas NFC (Reseñas)', color: 'fill-purple' },
        { key: 'gbp_landing', label: '🌐 GBP + Landing Page', color: 'fill-blue' },
        { key: 'web_redesign', label: '⚡ Rediseño Web Premium', color: 'fill-amber' },
        { key: 'monthly_maintenance', label: '🔄 Mantenimiento Mensual', color: 'fill-green' }
      ];

      const total = data.totalRevenue || 1; // avoid division by zero

      serviceContainer.innerHTML = services.map(s => {
        const amount = data.revenueByService[s.key] || 0;
        const pct = Math.min(100, Math.round((amount / total) * 100));

        return `
          <div class="breakdown-item">
            <div class="breakdown-info">
              <span class="breakdown-name">${s.label}</span>
              <span class="breakdown-amount">${API.formatCurrency(amount)} (${pct}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${s.color}" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Leads by Acquisition Channel
    const sourceContainer = document.getElementById('leadsBySourceList');
    if (sourceContainer) {
      const sources = [
        { key: 'google_maps', label: '🗺️ Google Maps Scraper', color: 'fill-blue' },
        { key: 'calle_nfc', label: '💳 Visita en Calle (NFC)', color: 'fill-amber' },
        { key: 'facebook_ads', label: '⚡ Campañas Facebook Ads', color: 'fill-purple' },
        { key: 'web_form', label: '🌐 Formulario Web Directo', color: 'fill-green' }
      ];

      const totalLeads = data.totalLeads || 1;

      sourceContainer.innerHTML = sources.map(src => {
        const count = data.leadsBySource[src.key] || 0;
        const pct = Math.min(100, Math.round((count / totalLeads) * 100));

        return `
          <div class="breakdown-item">
            <div class="breakdown-info">
              <span class="breakdown-name">${src.label}</span>
              <span class="breakdown-amount">${count} prospectos (${pct}%)</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${src.color}" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  async loadRecentSalesTable() {
    const tableBody = document.getElementById('salesHistoryTableBody');
    if (!tableBody) return;

    try {
      const res = await API.getSales();
      const sales = res.data || [];

      if (sales.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Aún no hay ventas registradas.</td></tr>`;
        return;
      }

      tableBody.innerHTML = sales.map(s => {
        let badge = '<span class="tag-badge">Otro</span>';
        if (s.service_type === 'nfc_card') badge = '<span class="tag-badge source-calle">💳 Tarjeta NFC</span>';
        if (s.service_type === 'gbp_landing') badge = '<span class="tag-badge source-maps">🌐 GBP + Landing</span>';
        if (s.service_type === 'web_redesign') badge = '<span class="tag-badge website-bad">⚡ Rediseño Web</span>';

        return `
          <tr>
            <td><strong>${s.business_name}</strong></td>
            <td>${badge}</td>
            <td style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent-success);">${API.formatCurrency(s.amount)}</td>
            <td style="text-transform: capitalize;">${s.payment_method || 'efectivo'}</td>
            <td>${new Date(s.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('Error loading sales table:', err);
    }
  },

  setupEventListeners() {
    // CSV Export button
    const exportBtn = document.getElementById('btnExportCsv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportLeadsCsv());
    }

    // Refresh Analytics
    const refreshBtn = document.getElementById('btnRefreshAnalytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadMetrics();
        API.toast('Métricas actualizadas', 'info');
      });
    }
  },

  async exportLeadsCsv() {
    try {
      const res = await API.getLeads();
      const leads = res.data || [];

      if (leads.length === 0) {
        API.toast('No hay leads para exportar', 'warning');
        return;
      }

      const headers = ['ID', 'Negocio', 'Contacto', 'Telefono', 'Email', 'Ciudad', 'Etapa', 'Valor', 'Origen', 'Tiene Web', 'Reseñas'];
      const rows = leads.map(l => [
        l.id,
        `"${(l.business_name || '').replace(/"/g, '""')}"`,
        `"${(l.contact_name || '').replace(/"/g, '""')}"`,
        `"${l.phone || ''}"`,
        `"${l.email || ''}"`,
        `"${l.city || ''}"`,
        `"${l.stage || ''}"`,
        l.deal_value || 0,
        `"${l.source || ''}"`,
        l.has_website ? 'SI' : 'NO',
        l.reviews_count || 0
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `leads_agencia_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      API.toast('Reporte CSV descargado con éxito', 'success');
    } catch (err) {
      API.toast('Error exportando CSV', 'error');
    }
  }
};

window.Analytics = Analytics;
