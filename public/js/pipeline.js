// Pipeline Kanban Board Module - Hubly CRM (Accessible Color Palette)

const Pipeline = {
  stages: [
    { id: 'nuevo_prospecto', label: 'Nuevo Prospecto', icon: '📥', color: '#38bdf8' },
    { id: 'sin_web_gbp', label: 'Sin Web (GBP + Landing)', icon: '🌐', color: '#f97316' },
    { id: 'web_deficiente', label: 'Web Deficiente (Rediseño)', icon: '⚡', color: '#f59e0b' },
    { id: 'nfc_calle', label: 'Tarjeta NFC Reseñas', icon: '💳', color: '#0ea5e9' },
    { id: 'contactado', label: 'Contactado / Demo', icon: '📞', color: '#06b6d4' },
    { id: 'propuesta', label: 'En Propuesta', icon: '🤝', color: '#6366f1' },
    { id: 'ganado', label: 'Ganado (Cierre)', icon: '🏆', color: '#10b981' },
    { id: 'perdido', label: 'Perdido', icon: '❌', color: '#64748b' }
  ],

  leads: [],
  currentFilter: 'all',
  searchQuery: '',
  draggedLeadId: null,

  async init() {
    this.renderBoardSkeleton();
    await this.loadLeads();
    this.setupEventListeners();
  },

  renderBoardSkeleton() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    board.innerHTML = this.stages.map(stage => `
      <div class="kanban-column" data-stage="${stage.id}" id="col-${stage.id}">
        <div class="column-header">
          <div class="column-title-group">
            <span class="column-color-indicator" style="background: ${stage.color}; color: ${stage.color};"></span>
            <span class="column-title">${stage.icon} ${stage.label}</span>
          </div>
          <span class="column-count" id="count-${stage.id}">0</span>
        </div>
        <div class="column-cards" data-stage="${stage.id}" id="cards-${stage.id}"></div>
      </div>
    `).join('');

    this.setupDragAndDrop();
  },

  async loadLeads() {
    try {
      const res = await API.getLeads();
      this.leads = res.data || [];
      this.renderCards();
    } catch (err) {
      console.error('Error cargando leads:', err);
    }
  },

  renderCards() {
    const badge = document.getElementById('pipelineCountBadge');
    if (badge) badge.innerText = this.leads.length;

    // Reset all column containers and counters
    this.stages.forEach(stage => {
      const container = document.getElementById(`cards-${stage.id}`);
      const countEl = document.getElementById(`count-${stage.id}`);
      if (container) container.innerHTML = '';
      if (countEl) countEl.innerText = '0';
    });

    const filteredLeads = this.leads.filter(lead => {
      if (this.currentFilter !== 'all' && lead.source !== this.currentFilter) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchName = (lead.business_name || '').toLowerCase().includes(q);
        const matchContact = (lead.contact_name || '').toLowerCase().includes(q);
        const matchPhone = (lead.phone || '').includes(q);
        const matchCity = (lead.city || '').toLowerCase().includes(q);
        const matchNotes = (lead.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone && !matchCity && !matchNotes) return false;
      }
      return true;
    });

    const counts = {};
    this.stages.forEach(s => counts[s.id] = 0);

    filteredLeads.forEach(lead => {
      const stage = lead.stage || 'nuevo_prospecto';
      const container = document.getElementById(`cards-${stage}`);
      
      if (container) {
        counts[stage] = (counts[stage] || 0) + 1;
        const card = this.createLeadCard(lead);
        container.appendChild(card);
      }
    });

    // Update column counters
    this.stages.forEach(stage => {
      const countEl = document.getElementById(`count-${stage.id}`);
      if (countEl) {
        countEl.innerText = counts[stage.id] || 0;
      }
    });
  },

  createLeadCard(lead) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = lead.id;

    // Resolve Category Emoji
    const avatar = ScraperUI ? ScraperUI.getCategoryAvatar(lead.category, lead.business_name) : '🏢';

    // Source Tag
    const sourceMap = {
      google_maps: { label: '🗺️ Maps', cls: 'source-maps' },
      calle_nfc: { label: '💳 Calle NFC', cls: 'source-calle' },
      facebook_ads: { label: '⚡ FB Ads', cls: 'source-fb' },
      web_form: { label: '🌐 Web Form', cls: 'source-maps' },
      manual: { label: '✍️ Manual', cls: 'source-maps' }
    };
    const srcInfo = sourceMap[lead.source] || { label: lead.source, cls: 'source-maps' };

    // Website Tag
    let webTag = '';
    if (lead.has_website === false || lead.website_status === 'sin_web') {
      webTag = '<span class="tag-badge website-none">🚩 Sin Web</span>';
    } else if (lead.website_status === 'web_deficiente') {
      webTag = '<span class="tag-badge website-bad">⚡ Web Lenta</span>';
    }

    // Reviews Tag
    let reviewsTag = '';
    if (lead.reviews_count !== null && lead.reviews_count !== undefined) {
      reviewsTag = `<span class="tag-badge ${lead.reviews_count < 20 ? 'reviews-low' : ''}">⭐ ${lead.rating || '4.0'} (${lead.reviews_count})</span>`;
    }

    const valueFormatted = lead.deal_value ? `$${parseFloat(lead.deal_value).toFixed(0)}` : '$0';
    const dateFormatted = lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : 'Hoy';

    card.innerHTML = `
      <div class="card-head">
        <span class="card-avatar">${avatar}</span>
        <div class="card-title-group">
          <div class="card-business-name" title="${lead.business_name}">${lead.business_name}</div>
          <div class="card-subtitle">${lead.contact_name ? lead.contact_name + ' · ' : ''}${lead.city || 'Local'}</div>
        </div>
        <div class="card-deal-value">${valueFormatted}</div>
      </div>

      <div class="card-tags">
        <span class="tag-badge ${srcInfo.cls}">${srcInfo.label}</span>
        ${webTag}
        ${reviewsTag}
      </div>

      <div class="card-meta-row">
        <div class="card-meta-contact">
          <span>📞</span>
          <span>${lead.phone || lead.whatsapp || 'Sin teléfono'}</span>
        </div>
        <span class="card-date">${dateFormatted}</span>
      </div>

      <div class="card-action-dock">
        <div class="action-buttons-group">
          <button class="card-btn btn-wa-direct" onclick="event.stopPropagation(); Pipeline.openLeadScriptModal('${lead.id}')" title="Abrir Guion y Enviar WhatsApp">
            <span>💬</span> <span>WhatsApp</span>
          </button>
          ${lead.maps_url ? `
            <a href="${lead.maps_url}" target="_blank" class="card-btn" onclick="event.stopPropagation();" title="Abrir en Google Maps">
              <span>🗺️</span>
            </a>
          ` : ''}
        </div>
        <div class="action-buttons-group">
          <button class="card-btn" onclick="event.stopPropagation(); Pipeline.openEditModal('${lead.id}')" title="Editar Prospecto">
            <span>✏️</span>
          </button>
          <button class="card-btn" onclick="event.stopPropagation(); Pipeline.confirmDelete('${lead.id}', '${lead.business_name.replace(/'/g, "\\'")}')" title="Eliminar">
            <span>🗑️</span>
          </button>
        </div>
      </div>
    `;

    // Click on card opens edit modal
    card.addEventListener('click', () => {
      this.openEditModal(lead.id);
    });

    // Drag start / end
    card.addEventListener('dragstart', (e) => {
      this.draggedLeadId = lead.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', lead.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.draggedLeadId = null;
    });

    return card;
  },

  setupDragAndDrop() {
    const columns = document.querySelectorAll('.column-cards');

    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');

        const leadId = e.dataTransfer.getData('text/plain') || this.draggedLeadId;
        const newStage = col.dataset.stage;

        if (leadId && newStage) {
          await this.moveLeadStage(leadId, newStage);
        }
      });
    });
  },

  async moveLeadStage(leadId, newStage) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    // Optimistic UI update
    lead.stage = newStage;
    this.renderCards();

    try {
      await API.updateLeadStage(leadId, newStage);
      API.toast(`Movido a "${this.stages.find(s => s.id === newStage)?.label}"`, 'info');
      
      // If won, trigger celebration
      if (newStage === 'ganado') {
        API.toast(`🏆 ¡Trato ganado con ${lead.business_name}!`, 'success');
      }

      if (window.Dashboard) window.Dashboard.loadDashboardData();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error actualizando etapa del lead', 'error');
      await this.loadLeads();
    }
  },

  setupEventListeners() {
    // Filter chips
    const filterButtons = document.querySelectorAll('#pipelineFilters .filter-chip');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');
        this.renderCards();
      });
    });

    // Search input (toolbar)
    const searchInput = document.getElementById('pipelineSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        const omni = document.getElementById('globalOmniboxInput');
        if (omni && omni.value !== this.searchQuery) omni.value = this.searchQuery;
        this.renderCards();
      });
    }

    // Global Omnibox Search input (header)
    const omniInput = document.getElementById('globalOmniboxInput');
    if (omniInput) {
      omniInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        const searchInput = document.getElementById('pipelineSearchInput');
        if (searchInput && searchInput.value !== this.searchQuery) searchInput.value = this.searchQuery;
        if (window.App && window.App.currentView !== 'pipeline') {
          window.App.switchView('pipeline');
        }
        this.renderCards();
      });
    }

    // New Lead Buttons (bind all instances)
    document.querySelectorAll('#btnNewLead, .btn-new-lead').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openNewLeadModal();
      });
    });
  },

  openNewLeadModal() {
    const modal = document.getElementById('leadModal');
    const form = document.getElementById('leadForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('modalLeadId').value = '';
    document.getElementById('modalLeadTitle').innerText = 'Nuevo Prospecto';
    document.getElementById('leadDealValue').value = '250.00';
    modal.classList.add('active');
  },

  openEditModal(id) {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return;

    const modal = document.getElementById('leadModal');
    if (!modal) return;

    document.getElementById('modalLeadId').value = lead.id;
    document.getElementById('modalLeadTitle').innerText = `Editar: ${lead.business_name}`;
    document.getElementById('leadBusinessName').value = lead.business_name || '';
    document.getElementById('leadContactName').value = lead.contact_name || '';
    document.getElementById('leadPhone').value = lead.phone || lead.whatsapp || '';
    document.getElementById('leadEmail').value = lead.email || '';
    document.getElementById('leadAddress').value = lead.address || '';
    document.getElementById('leadCity').value = lead.city || '';
    document.getElementById('leadStage').value = lead.stage || 'nuevo_prospecto';
    document.getElementById('leadDealValue').value = lead.deal_value || 0;
    document.getElementById('leadSource').value = lead.source || 'google_maps';
    document.getElementById('leadHasWebsite').value = lead.has_website ? 'true' : 'false';
    document.getElementById('leadWebsiteUrl').value = lead.website_url || '';
    document.getElementById('leadNotes').value = lead.notes || '';

    modal.classList.add('active');
  },

  async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('modalLeadId').value;
    const payload = {
      business_name: document.getElementById('leadBusinessName').value.trim(),
      contact_name: document.getElementById('leadContactName').value.trim(),
      phone: document.getElementById('leadPhone').value.trim(),
      whatsapp: document.getElementById('leadPhone').value.trim(),
      email: document.getElementById('leadEmail').value.trim(),
      address: document.getElementById('leadAddress').value.trim(),
      city: document.getElementById('leadCity').value.trim(),
      stage: document.getElementById('leadStage').value,
      deal_value: parseFloat(document.getElementById('leadDealValue').value) || 0,
      source: document.getElementById('leadSource').value,
      has_website: document.getElementById('leadHasWebsite').value === 'true',
      website_url: document.getElementById('leadWebsiteUrl').value.trim(),
      notes: document.getElementById('leadNotes').value.trim()
    };

    try {
      if (id) {
        await API.updateLead(id, payload);
        API.toast('Lead actualizado correctamente', 'success');
      } else {
        await API.createLead(payload);
        API.toast('Nuevo lead creado con éxito', 'success');
      }

      document.getElementById('leadModal').classList.remove('active');
      await this.loadLeads();
      if (window.Dashboard) window.Dashboard.loadDashboardData();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error guardando lead', 'error');
    }
  },

  async confirmDelete(id, name) {
    if (confirm(`¿Estás seguro de eliminar al prospecto "${name}"?`)) {
      try {
        await API.deleteLead(id);
        API.toast('Lead eliminado', 'info');
        await this.loadLeads();
        if (window.Dashboard) window.Dashboard.loadDashboardData();
        if (window.Analytics) window.Analytics.loadMetrics();
      } catch (err) {
        API.toast('Error eliminando lead', 'error');
      }
    }
  },

  // Open tailored WhatsApp script modal
  async openLeadScriptModal(leadId) {
    const lead = this.leads.find(l => l.id === leadId);
    if (!lead) return;

    const modal = document.getElementById('scriptModal');
    if (!modal) return;

    document.getElementById('scriptBizName').innerText = lead.business_name;
    document.getElementById('scriptPhone').innerText = lead.phone || lead.whatsapp || 'Sin teléfono';

    try {
      const res = await API.generateSalesScripts(lead, lead.city || 'tu ciudad', lead.has_website ? 'web_redesign' : 'gbp_landing');
      const scripts = res.data;
      
      const defaultScript = !lead.has_website ? scripts.gbp_gift : (lead.reviews_count < 20 ? scripts.nfc_reviews : scripts.web_redesign);
      
      document.getElementById('scriptContent').value = defaultScript.whatsapp_text;

      document.getElementById('btnTabGbp').onclick = () => {
        document.getElementById('scriptContent').value = scripts.gbp_gift.whatsapp_text;
        Pipeline.activateScriptTab('btnTabGbp');
      };
      document.getElementById('btnTabNfc').onclick = () => {
        document.getElementById('scriptContent').value = scripts.nfc_reviews.whatsapp_text;
        Pipeline.activateScriptTab('btnTabNfc');
      };
      document.getElementById('btnTabRedesign').onclick = () => {
        document.getElementById('scriptContent').value = scripts.web_redesign.whatsapp_text;
        Pipeline.activateScriptTab('btnTabRedesign');
      };

      document.getElementById('btnSendWhatsappNow').onclick = () => {
        const text = document.getElementById('scriptContent').value;
        API.openWhatsApp(lead.phone || lead.whatsapp, text);
        modal.classList.remove('active');
        if (lead.stage === 'nuevo_prospecto' || lead.stage === 'sin_web_gbp' || lead.stage === 'web_deficiente') {
          API.updateLeadStage(lead.id, 'contactado').then(() => Pipeline.loadLeads());
        }
      };

      modal.classList.add('active');
    } catch (err) {
      API.toast('Error generando guion', 'error');
    }
  },

  activateScriptTab(activeId) {
    ['btnTabGbp', 'btnTabNfc', 'btnTabRedesign'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', id === activeId);
    });
  }
};

window.Pipeline = Pipeline;
