// Pipeline Kanban Board Module

const Pipeline = {
  stages: [
    { id: 'nuevo_prospecto', label: 'Nuevo Prospecto', icon: '📥', color: '#38bdf8' },
    { id: 'sin_web_gbp', label: 'Sin Web (GBP + Landing)', icon: '🌐', color: '#ec4899' },
    { id: 'web_deficiente', label: 'Web Deficiente (Rediseño)', icon: '⚡', color: '#f59e0b' },
    { id: 'nfc_calle', label: 'Tarjeta NFC Reseñas', icon: '💳', color: '#8b5cf6' },
    { id: 'contactado', label: 'Contactado / Demo', icon: '📞', color: '#06b6d4' },
    { id: 'propuesta', label: 'En Propuesta', icon: '🤝', color: '#3b82f6' },
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
            <span class="column-color-indicator" style="background: ${stage.color};"></span>
            <span class="column-title">${stage.icon} ${stage.label}</span>
          </div>
          <span class="column-count" id="count-${stage.id}">0</span>
        </div>
        <div class="column-cards" data-stage="${stage.id}" id="cards-${stage.id}">
          <div class="loading-cards" style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px;">Cargando...</div>
        </div>
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
    // Reset columns
    this.stages.forEach(stage => {
      const container = document.getElementById(`cards-${stage.id}`);
      const countEl = document.getElementById(`count-${stage.id}`);
      if (container) container.innerHTML = '';
      if (countEl) countEl.innerText = '0';
    });

    const filteredLeads = this.leads.filter(lead => {
      // Source filter
      if (this.currentFilter !== 'all' && lead.source !== this.currentFilter) {
        return false;
      }
      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const matchName = (lead.business_name || '').toLowerCase().includes(q);
        const matchContact = (lead.contact_name || '').toLowerCase().includes(q);
        const matchPhone = (lead.phone || '').includes(q);
        const matchCity = (lead.city || '').toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone && !matchCity) return false;
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
        container.appendChild(this.createLeadCardElement(lead));
      }
    });

    // Update counts
    this.stages.forEach(stage => {
      const countEl = document.getElementById(`count-${stage.id}`);
      if (countEl) countEl.innerText = counts[stage.id] || '0';
    });

    // Update global counter in sidebar
    const badge = document.getElementById('pipelineCountBadge');
    if (badge) badge.innerText = filteredLeads.length;
  },

  createLeadCardElement(lead) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', lead.id);

    // Badges & Source tags
    let sourceBadge = '<span class="tag-badge source-maps">🗺️ Maps</span>';
    if (lead.source === 'calle_nfc') sourceBadge = '<span class="tag-badge source-calle">💳 Calle NFC</span>';
    if (lead.source === 'facebook_ads') sourceBadge = '<span class="tag-badge source-fb">⚡ Facebook Ads</span>';
    if (lead.source === 'web_form') sourceBadge = '<span class="tag-badge">🌐 Form Web</span>';

    let webBadge = lead.has_website 
      ? '<span class="tag-badge website-bad">⚡ Web Lenta / Rediseño</span>'
      : '<span class="tag-badge website-none">🚩 Sin Web (Gifting GBP)</span>';

    let reviewsBadge = lead.reviews_count !== null 
      ? `<span class="tag-badge ${lead.reviews_count < 20 ? 'reviews-low' : ''}">⭐ ${lead.rating || '4.0'} (${lead.reviews_count} reseñas)</span>` 
      : '';

    card.innerHTML = `
      <div class="card-top">
        <div class="card-business-name">${lead.business_name}</div>
        <div class="card-deal-value">${API.formatCurrency(lead.deal_value || 0)}</div>
      </div>

      <div class="card-meta">
        ${lead.contact_name ? `<div class="card-meta-item"><span>👤</span> <span>${lead.contact_name}</span></div>` : ''}
        ${lead.phone ? `<div class="card-meta-item"><span>📞</span> <span>${lead.phone}</span></div>` : ''}
        ${lead.city ? `<div class="card-meta-item"><span>📍</span> <span>${lead.city}</span></div>` : ''}
      </div>

      <div class="card-tags">
        ${sourceBadge}
        ${webBadge}
        ${reviewsBadge}
      </div>

      <div class="card-actions">
        <div class="action-buttons-group">
          ${lead.phone || lead.whatsapp ? `
            <button class="card-btn btn-wa-direct" title="Abrir WhatsApp con Guion" onclick="Pipeline.openLeadScriptModal('${lead.id}')">
              💬
            </button>
          ` : ''}
          ${lead.maps_url ? `
            <a href="${lead.maps_url}" target="_blank" class="card-btn" title="Ver en Google Maps">
              🗺️
            </a>
          ` : ''}
          <button class="card-btn" title="Editar Lead" onclick="Pipeline.openEditModal('${lead.id}')">
            ✏️
          </button>
          <button class="card-btn" title="Eliminar" onclick="Pipeline.confirmDelete('${lead.id}', '${lead.business_name.replace(/'/g, "\\'")}')">
            🗑️
          </button>
        </div>
        <span class="card-date">${new Date(lead.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
      </div>
    `;

    // Drag Events
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
        const targetStage = col.getAttribute('data-stage');
        const leadId = this.draggedLeadId;

        if (leadId && targetStage) {
          const lead = this.leads.find(l => l.id === leadId);
          if (lead && lead.stage !== targetStage) {
            lead.stage = targetStage;
            this.renderCards();
            try {
              await API.updateLeadStage(leadId, targetStage);
              API.toast(`Etapa actualizada a "${Pipeline.getStageLabel(targetStage)}"`, 'success');
            } catch (err) {
              API.toast('Error actualizando etapa', 'error');
              await this.loadLeads();
            }
          }
        }
      });
    });
  },

  getStageLabel(stageId) {
    const s = this.stages.find(st => st.id === stageId);
    return s ? s.label : stageId;
  },

  setupEventListeners() {
    // Filter chips
    const filterChips = document.querySelectorAll('#pipelineFilters .filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.getAttribute('data-filter');
        this.renderCards();
      });
    });

    // Search input
    const searchInput = document.getElementById('pipelineSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderCards();
      });
    }

    // New Lead Button
    const newBtn = document.getElementById('btnNewLead');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.openNewLeadModal());
    }
  },

  openNewLeadModal() {
    const modal = document.getElementById('leadModal');
    const form = document.getElementById('leadForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('modalLeadId').value = '';
    document.getElementById('modalLeadTitle').innerText = 'Nuevo Lead / Prospecto';
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

    // Fetch or generate scripts
    try {
      const res = await API.generateSalesScripts(lead, lead.city || 'tu ciudad', lead.has_website ? 'web_redesign' : 'gbp_landing');
      const scripts = res.data;
      
      const defaultScript = !lead.has_website ? scripts.gbp_gift : (lead.reviews_count < 20 ? scripts.nfc_reviews : scripts.web_redesign);
      
      document.getElementById('scriptContent').value = defaultScript.whatsapp_text;

      // Tab switcher handlers
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

      // Direct WhatsApp Send button
      document.getElementById('btnSendWhatsappNow').onclick = () => {
        const text = document.getElementById('scriptContent').value;
        API.openWhatsApp(lead.phone || lead.whatsapp, text);
        modal.classList.remove('active');
        // Automatically move stage to 'contactado' if it was in 'nuevo_prospecto'
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
