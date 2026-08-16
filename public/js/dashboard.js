// Executive Dashboard Module - Hubly CRM Style

const Dashboard = {
  async init() {
    this.setupEventListeners();
    await this.loadDashboardData();
  },

  setupEventListeners() {
    const refreshBtn = document.getElementById('btnRefreshDashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadDashboardData());
    }
  },

  async loadDashboardData() {
    try {
      // 1. Fetch leads, sales, and analytics in parallel
      const [analyticsRes, leadsRes, salesRes] = await Promise.all([
        API.getAnalytics(),
        API.getLeads(),
        API.getSales()
      ]);

      const summary = analyticsRes.data.summary || {};
      const leads = leadsRes.data || [];
      const sales = salesRes.data || [];

      this.renderKPIs(summary, leads, sales);
      this.renderSalesGoal(summary.total_revenue || 0);
      this.renderConversionFunnel(leads);
      this.renderActivityFeed(leads, sales);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  },

  renderKPIs(summary, leads, sales) {
    const totalRevenue = summary.total_revenue || 0;
    const pipelineValue = summary.pipeline_value || 0;
    const winRate = summary.win_rate || 0;

    // Calculate business model specific counts
    const streetVisits = leads.filter(l => l.source === 'calle_nfc').length;
    const nfcSalesCount = sales.filter(s => s.service_type === 'nfc_tarjeta').length;
    const gbpLandingCount = leads.filter(l => l.stage === 'sin_web_gbp' || l.stage === 'ganado').length;
    const contactedCount = leads.filter(l => ['contactado', 'propuesta', 'ganado'].includes(l.stage)).length;
    const fbLeadsCount = leads.filter(l => l.source === 'facebook_ads').length;

    // Update KPI Elements
    this.updateEl('kpiDashRevenue', `$${Number(totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    this.updateEl('kpiDashPipeline', `$${Number(pipelineValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    this.updateEl('kpiDashStreetVisits', streetVisits);
    this.updateEl('kpiDashNfcSold', nfcSalesCount);
    this.updateEl('kpiDashContacted', contactedCount);
    this.updateEl('kpiDashGbpGifts', gbpLandingCount);
    this.updateEl('kpiDashWinRate', `${winRate}%`);
    this.updateEl('kpiDashFbLeads', fbLeadsCount);
  },

  renderSalesGoal(currentRevenue) {
    const monthlyTarget = 5000; // $5,000 USD Monthly Agency Goal
    const progressPercent = Math.min(100, Math.round((currentRevenue / monthlyTarget) * 100));

    this.updateEl('goalCurrentAmount', `$${Number(currentRevenue).toLocaleString('en-US', { minimumFractionDigits: 0 })}`);
    this.updateEl('goalTargetAmount', `$${Number(monthlyTarget).toLocaleString('en-US', { minimumFractionDigits: 0 })}`);
    this.updateEl('goalPercentText', `${progressPercent}% alcanzado`);

    const barFill = document.getElementById('goalBarFill');
    if (barFill) {
      barFill.style.width = `${progressPercent}%`;
    }
  },

  renderConversionFunnel(leads) {
    const total = leads.length || 1;
    const newProspects = leads.filter(l => ['nuevo_prospecto', 'sin_web_gbp', 'web_deficiente', 'nfc_calle'].includes(l.stage)).length;
    const contacted = leads.filter(l => l.stage === 'contactado').length;
    const proposal = leads.filter(l => l.stage === 'propuesta').length;
    const won = leads.filter(l => l.stage === 'ganado').length;

    const pNew = Math.max(15, Math.round((newProspects / total) * 100));
    const pContacted = Math.max(12, Math.round((contacted / total) * 100));
    const pProposal = Math.max(10, Math.round((proposal / total) * 100));
    const pWon = Math.max(8, Math.round((won / total) * 100));

    this.updateBar('funnelNewBar', pNew, newProspects);
    this.updateBar('funnelContactedBar', pContacted, contacted);
    this.updateBar('funnelProposalBar', pProposal, proposal);
    this.updateBar('funnelWonBar', pWon, won);
  },

  updateBar(barId, percent, count) {
    const bar = document.getElementById(barId);
    if (bar) {
      bar.style.width = `${percent}%`;
      const tag = bar.parentElement.querySelector('.funnel-count-tag');
      if (tag) tag.innerText = `${count} leads`;
    }
  },

  renderActivityFeed(leads, sales) {
    const feedContainer = document.getElementById('dashActivityFeed');
    if (!feedContainer) return;

    const activities = [];

    // Add recent sales
    sales.slice(0, 4).forEach(s => {
      activities.push({
        icon: '💵',
        title: `Venta cerrada: ${s.business_name}`,
        details: `${s.service_name} · Cobrado $${s.amount} (${s.payment_method})`,
        time: this.formatDate(s.created_at)
      });
    });

    // Add recent leads
    leads.slice(0, 4).forEach(l => {
      activities.push({
        icon: l.source === 'calle_nfc' ? '🏃‍♂️' : (l.source === 'facebook_ads' ? '⚡' : '🗺️'),
        title: `Nuevo prospecto: ${l.business_name}`,
        details: `${l.category || 'Local'} en ${l.city || 'Valencia'} · Etapa: ${l.stage}`,
        time: this.formatDate(l.created_at)
      });
    });

    if (activities.length === 0) {
      feedContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 14px;">Sin actividad reciente.</div>`;
      return;
    }

    feedContainer.innerHTML = activities.slice(0, 6).map(act => `
      <div class="activity-feed-item">
        <div class="activity-icon-badge">${act.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${act.title}</div>
          <div class="activity-details">${act.details}</div>
        </div>
        <div class="activity-time">${act.time}</div>
      </div>
    `).join('');
  },

  updateEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  },

  formatDate(dateStr) {
    if (!dateStr) return 'Hoy';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  }
};

window.Dashboard = Dashboard;
