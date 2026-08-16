// Google Maps Prospect Finder & Scraper Module - Compact Row & Grid Views

const ScraperUI = {
  currentResults: [],
  selectedIndices: new Set(),
  viewMode: 'table', // 'table' (compact rows) or 'grid' (cards)

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const searchForm = document.getElementById('scraperForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.performSearch();
      });
    }

    // Quick niche chips
    const chips = document.querySelectorAll('.niche-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const nicheInput = document.getElementById('searchNiche');
        if (nicheInput) {
          nicheInput.value = chip.getAttribute('data-niche');
          this.performSearch();
        }
      });
    });

    // View mode toggle
    const btnViewTable = document.getElementById('btnViewTable');
    const btnViewGrid = document.getElementById('btnViewGrid');

    if (btnViewTable) {
      btnViewTable.addEventListener('click', () => this.switchViewMode('table'));
    }
    if (btnViewGrid) {
      btnViewGrid.addEventListener('click', () => this.switchViewMode('grid'));
    }

    // Select All Checkbox
    const selectAllCb = document.getElementById('selectAllProspects');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => {
        this.toggleSelectAll(e.target.checked);
      });
    }

    // Bulk Import Button (all)
    const bulkBtn = document.getElementById('btnBulkImport');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this.bulkImportAll());
    }

    // Batch Import Selected Button
    const batchSelectedBtn = document.getElementById('btnImportSelected');
    if (batchSelectedBtn) {
      batchSelectedBtn.addEventListener('click', () => this.importSelectedLeads());
    }
  },

  switchViewMode(mode) {
    this.viewMode = mode;
    const btnTable = document.getElementById('btnViewTable');
    const btnGrid = document.getElementById('btnViewGrid');
    const tableContainer = document.getElementById('prospectsTableContainer');
    const gridContainer = document.getElementById('prospectsGrid');

    if (btnTable) btnTable.classList.toggle('active', mode === 'table');
    if (btnGrid) btnGrid.classList.toggle('active', mode === 'grid');

    if (tableContainer) tableContainer.style.display = mode === 'table' ? 'block' : 'none';
    if (gridContainer) {
      gridContainer.style.display = mode === 'grid' ? 'grid' : 'none';
      gridContainer.classList.toggle('active', mode === 'grid');
    }
  },

  async performSearch() {
    const niche = document.getElementById('searchNiche').value.trim();
    const location = document.getElementById('searchLocation').value.trim();
    const limitSelect = document.getElementById('searchLimit');
    const limit = limitSelect ? parseInt(limitSelect.value) || 25 : 25;

    if (!niche || !location) {
      API.toast('Ingresa un nicho y una ciudad para buscar', 'warning');
      return;
    }

    const tableBody = document.getElementById('prospectsTableBody');
    const gridContainer = document.getElementById('prospectsGrid');
    const loadingState = document.getElementById('scraperLoading');
    const resultsBar = document.getElementById('scraperResultsBar');
    const emptyState = document.getElementById('scraperEmptyState');

    if (tableBody) tableBody.innerHTML = '';
    if (gridContainer) gridContainer.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    loadingState.style.display = 'block';
    resultsBar.style.display = 'none';
    this.selectedIndices.clear();
    this.updateBatchActionBar();

    try {
      const res = await API.request(`/scraper/search?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}&limit=${limit}`);
      this.currentResults = res.data.results || [];

      loadingState.style.display = 'none';
      resultsBar.style.display = 'flex';

      document.getElementById('totalFoundCount').innerText = res.data.total_found;
      document.getElementById('highOppCount').innerText = res.data.high_priority_count;

      this.renderResults();
      API.toast(`Se encontraron ${this.currentResults.length} negocios en ${location}`, 'success');
    } catch (err) {
      loadingState.style.display = 'none';
      API.toast('Error al buscar prospectos en Google Maps', 'error');
    }
  },

  renderResults() {
    this.renderTableView();
    this.renderGridView();
    this.switchViewMode(this.viewMode);
  },

  getCategoryAvatar(category = '', name = '') {
    const cat = (category + ' ' + name).toLowerCase();
    if (cat.includes('dent') || cat.includes('odont')) return '🦷';
    if (cat.includes('pizz') || cat.includes('restaur') || cat.includes('comida') || cat.includes('bar') || cat.includes('caf')) return '🍕';
    if (cat.includes('taller') || cat.includes('mecanic') || cat.includes('auto') || cat.includes('coche') || cat.includes('freno')) return '🚗';
    if (cat.includes('barber') || cat.includes('salon') || cat.includes('estetic') || cat.includes('belleza') || cat.includes('spa') || cat.includes('uña')) return '💅';
    if (cat.includes('gym') || cat.includes('gimnasio') || cat.includes('fitness')) return '🏋️';
    if (cat.includes('medic') || cat.includes('salud') || cat.includes('clinic')) return '🏥';
    return '🏢';
  },

  // 1. RENDER COMPACT TABLE / ROW VIEW
  renderTableView() {
    const tableBody = document.getElementById('prospectsTableBody');
    if (!tableBody) return;

    if (this.currentResults.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">No se encontraron prospectos para esta búsqueda.</td></tr>`;
      return;
    }

    tableBody.innerHTML = this.currentResults.map((p, index) => {
      const avatar = this.getCategoryAvatar(p.category, p.business_name);
      const isSelected = this.selectedIndices.has(index);

      let webPill = p.has_website
        ? '<span class="tag-badge website-bad">⚡ Web Lenta</span>'
        : '<span class="tag-badge website-none">🚩 Sin Web</span>';

      let reviewsPill = (p.reviews_count !== null && p.reviews_count !== undefined)
        ? `<span class="tag-badge ${p.reviews_count < 20 ? 'reviews-low' : ''}">⭐ ${p.rating || '4.0'} (${p.reviews_count})</span>`
        : '<span class="tag-badge">⭐ 4.0</span>';

      let scorePill = p.opportunity_score >= 80
        ? `<span class="opportunity-score-badge">🔥 ${p.opportunity_score}%</span>`
        : `<span class="opportunity-score-badge high">⚡ ${p.opportunity_score}%</span>`;

      return `
        <tr class="prospect-row ${isSelected ? 'selected' : ''}" id="row-prospect-${index}">
          <td>
            <input type="checkbox" class="table-checkbox row-cb" data-index="${index}" ${isSelected ? 'checked' : ''} onchange="ScraperUI.handleRowCheckbox(${index}, this.checked)">
          </td>
          <td>
            <div class="cell-biz-name">
              <span class="cell-avatar">${avatar}</span>
              <div>
                <div class="cell-name-text">${p.business_name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${p.category}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="font-size: 12px; color: var(--text-secondary);">📍 ${p.address || p.city}</span>
          </td>
          <td>
            <div class="cell-phone">
              ${p.phone ? `
                <a href="javascript:void(0)" onclick="ScraperUI.openScriptModal(${index})" title="Enviar WhatsApp">
                  💬 ${p.phone}
                </a>
              ` : '<span style="color: var(--text-muted); font-size: 11.5px;">⚠️ No listado</span>'}
            </div>
          </td>
          <td>${webPill}</td>
          <td>${reviewsPill}</td>
          <td>${scorePill}</td>
          <td>
            <div class="cell-actions">
              <button class="btn btn-primary btn-sm" id="btn-import-row-${index}" onclick="ScraperUI.importSingleLead(${index})">
                📥 Importar
              </button>
              <button class="btn btn-whatsapp btn-sm" onclick="ScraperUI.openScriptModal(${index})" title="Guion WhatsApp">
                💬
              </button>
              ${p.maps_url ? `
                <a href="${p.maps_url}" target="_blank" class="btn btn-secondary btn-sm" title="Abrir en Google Maps">
                  🗺️
                </a>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // 2. RENDER GRID / CARD VIEW
  renderGridView() {
    const grid = document.getElementById('prospectsGrid');
    if (!grid) return;

    grid.innerHTML = this.currentResults.map((p, index) => {
      const isHigh = p.opportunity_score >= 80;
      const avatar = this.getCategoryAvatar(p.category, p.business_name);

      return `
        <div class="prospect-card" id="prospect-card-${index}">
          <div class="prospect-top">
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="cell-avatar">${avatar}</span>
              <div class="prospect-title">
                <h4>${p.business_name}</h4>
                <div class="prospect-category">📍 ${p.address || p.city} | ${p.category}</div>
              </div>
            </div>
            <div class="opportunity-score-badge ${isHigh ? '' : 'high'}">
              ${isHigh ? '🔥' : '⚡'} ${p.opportunity_score}%
            </div>
          </div>

          <div class="prospect-diagnosis">
            <div class="diagnosis-item">
              <span class="diagnosis-label">Sitio Web:</span>
              <span class="diagnosis-val" style="color: ${p.has_website ? 'var(--accent-warning-text)' : 'var(--accent-danger-text)'};">
                ${p.has_website ? '⚡ Tiene Web (Rediseño)' : '🚩 Sin Web (GBP Gift)'}
              </span>
            </div>
            <div class="diagnosis-item">
              <span class="diagnosis-label">Reseñas:</span>
              <span class="diagnosis-val">⭐ ${p.rating || '4.0'} (${p.reviews_count || 0}) ${p.reviews_count < 20 ? '· 💳 NFC' : ''}</span>
            </div>
            <div class="diagnosis-item">
              <span class="diagnosis-label">Teléfono:</span>
              <span class="diagnosis-val">${p.phone || '⚠️ No listado'}</span>
            </div>
          </div>

          <div class="prospect-footer-actions">
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="ScraperUI.importSingleLead(${index})">
              📥 Importar
            </button>
            <button class="btn btn-whatsapp btn-sm" onclick="ScraperUI.openScriptModal(${index})">
              💬 WhatsApp
            </button>
            ${p.maps_url ? `
              <a href="${p.maps_url}" target="_blank" class="btn btn-secondary btn-sm" title="Google Maps">
                🗺️
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  handleRowCheckbox(index, isChecked) {
    if (isChecked) {
      this.selectedIndices.add(index);
    } else {
      this.selectedIndices.delete(index);
    }

    const row = document.getElementById(`row-prospect-${index}`);
    if (row) row.classList.toggle('selected', isChecked);

    this.updateBatchActionBar();
  },

  toggleSelectAll(isChecked) {
    this.currentResults.forEach((_, idx) => {
      if (isChecked) {
        this.selectedIndices.add(idx);
      } else {
        this.selectedIndices.delete(idx);
      }
      const row = document.getElementById(`row-prospect-${idx}`);
      if (row) row.classList.toggle('selected', isChecked);
    });

    document.querySelectorAll('.row-cb').forEach(cb => cb.checked = isChecked);
    this.updateBatchActionBar();
  },

  updateBatchActionBar() {
    const bar = document.getElementById('batchActionBar');
    const countEl = document.getElementById('selectedCountText');
    const selectAllCb = document.getElementById('selectAllProspects');

    if (!bar) return;

    const count = this.selectedIndices.size;
    if (count > 0) {
      bar.style.display = 'flex';
      if (countEl) countEl.innerText = `${count} prospecto${count > 1 ? 's' : ''} seleccionado${count > 1 ? 's' : ''}`;
    } else {
      bar.style.display = 'none';
      if (selectAllCb) selectAllCb.checked = false;
    }
  },

  async importSingleLead(index) {
    const prospect = this.currentResults[index];
    if (!prospect) return;

    const rowBtn = document.getElementById(`btn-import-row-${index}`);
    const cardBtn = document.querySelector(`#prospect-card-${index} .btn-primary`);

    if (rowBtn) { rowBtn.innerText = '...'; rowBtn.disabled = true; }
    if (cardBtn) { cardBtn.innerText = '...'; cardBtn.disabled = true; }

    try {
      await API.createLead({
        business_name: prospect.business_name,
        contact_name: '',
        phone: prospect.phone || '',
        whatsapp: prospect.whatsapp || prospect.phone || '',
        email: prospect.email || '',
        address: prospect.address,
        city: prospect.city,
        category: prospect.category,
        maps_url: prospect.maps_url,
        has_website: prospect.has_website,
        website_url: prospect.website_url,
        website_status: prospect.has_website ? 'web_deficiente' : 'sin_web',
        rating: prospect.rating,
        reviews_count: prospect.reviews_count,
        stage: prospect.suggested_stage || 'nuevo_prospecto',
        deal_value: prospect.deal_value || 250,
        source: 'google_maps',
        tags: ['Google Maps Scraper', prospect.main_offer === 'gbp_landing' ? 'Gifting GBP' : 'Rediseño Web']
      });

      API.toast(`"${prospect.business_name}" importado`, 'success');
      
      if (rowBtn) {
        rowBtn.innerText = '✅ Añadido';
        rowBtn.classList.remove('btn-primary');
        rowBtn.classList.add('btn-secondary');
      }
      if (cardBtn) {
        cardBtn.innerText = '✅ Añadido';
        cardBtn.classList.remove('btn-primary');
        cardBtn.classList.add('btn-secondary');
      }

      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error al importar lead', 'error');
      if (rowBtn) { rowBtn.innerText = '📥 Importar'; rowBtn.disabled = false; }
      if (cardBtn) { cardBtn.innerText = '📥 Importar'; cardBtn.disabled = false; }
    }
  },

  async importSelectedLeads() {
    const selectedList = Array.from(this.selectedIndices).map(i => this.currentResults[i]).filter(Boolean);

    if (selectedList.length === 0) {
      API.toast('Selecciona al menos un prospecto', 'warning');
      return;
    }

    const btn = document.getElementById('btnImportSelected');
    if (btn) {
      btn.innerText = 'Importando...';
      btn.disabled = true;
    }

    try {
      const res = await API.batchCreateLeads(selectedList);
      API.toast(`¡${res.count} prospectos seleccionados importados al Pipeline!`, 'success');

      // Update button labels in rows
      this.selectedIndices.forEach(idx => {
        const rowBtn = document.getElementById(`btn-import-row-${idx}`);
        if (rowBtn) {
          rowBtn.innerText = '✅ Añadido';
          rowBtn.classList.remove('btn-primary');
          rowBtn.classList.add('btn-secondary');
          rowBtn.disabled = true;
        }
      });

      this.selectedIndices.clear();
      this.updateBatchActionBar();

      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error en la importación por lote', 'error');
    } finally {
      if (btn) {
        btn.innerText = '📥 Importar Seleccionados a Pipeline';
        btn.disabled = false;
      }
    }
  },

  async bulkImportAll() {
    if (this.currentResults.length === 0) {
      API.toast('No hay prospectos para importar', 'warning');
      return;
    }

    const btn = document.getElementById('btnBulkImport');
    if (btn) {
      btn.innerText = 'Importando todos...';
      btn.disabled = true;
    }

    try {
      const res = await API.batchCreateLeads(this.currentResults);
      API.toast(`¡${res.count} prospectos importados al Pipeline!`, 'success');

      document.querySelectorAll('.cell-actions .btn-primary, .prospect-card .btn-primary').forEach(b => {
        b.innerText = '✅ Añadido';
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
        b.disabled = true;
      });

      if (btn) {
        btn.innerText = '✅ Todos Importados';
      }

      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error en la importación masiva', 'error');
      if (btn) {
        btn.innerText = '📥 Importar Todos a Pipeline';
        btn.disabled = false;
      }
    }
  },

  openScriptModal(index) {
    const prospect = this.currentResults[index];
    if (!prospect) return;

    const modal = document.getElementById('scriptModal');
    if (!modal) return;

    document.getElementById('scriptBizName').innerText = prospect.business_name;
    document.getElementById('scriptPhone').innerText = prospect.phone || 'Sin teléfono';

    const scripts = prospect.sales_scripts;
    const defaultScript = !prospect.has_website ? scripts.gbp_gift : (prospect.reviews_count < 20 ? scripts.nfc_reviews : scripts.web_redesign);

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
      let targetPhone = prospect.phone;
      if (!targetPhone) {
        targetPhone = prompt(`Por favor ingresa el número de WhatsApp de "${prospect.business_name}":`, '+58');
        if (!targetPhone) return;
      }
      const text = document.getElementById('scriptContent').value;
      API.openWhatsApp(targetPhone, text);
      modal.classList.remove('active');
    };

    modal.classList.add('active');
  }
};

window.ScraperUI = ScraperUI;
