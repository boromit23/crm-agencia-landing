// Google Maps Prospect Finder & Scraper Module

const ScraperUI = {
  currentResults: [],

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

    // Bulk Import Button
    const bulkBtn = document.getElementById('btnBulkImport');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => this.bulkImportAll());
    }
  },

  async performSearch() {
    const niche = document.getElementById('searchNiche').value.trim();
    const location = document.getElementById('searchLocation').value.trim();

    if (!niche || !location) {
      API.toast('Ingresa un nicho y una ciudad para buscar', 'warning');
      return;
    }

    const resultsContainer = document.getElementById('prospectsGrid');
    const loadingState = document.getElementById('scraperLoading');
    const resultsBar = document.getElementById('scraperResultsBar');

    resultsContainer.innerHTML = '';
    loadingState.style.display = 'block';
    resultsBar.style.display = 'none';

    try {
      const res = await API.searchProspects(niche, location);
      this.currentResults = res.data.results || [];

      loadingState.style.display = 'none';
      resultsBar.style.display = 'flex';

      document.getElementById('totalFoundCount').innerText = res.data.total_found;
      document.getElementById('highOppCount').innerText = res.data.high_priority_count;

      this.renderProspects(this.currentResults);
      API.toast(`Se encontraron ${this.currentResults.length} negocios en ${location}`, 'success');
    } catch (err) {
      loadingState.style.display = 'none';
      API.toast('Error al buscar prospectos en Google Maps', 'error');
    }
  },

  renderProspects(prospects) {
    const grid = document.getElementById('prospectsGrid');
    if (!grid) return;

    if (prospects.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          No se encontraron resultados para esta búsqueda. Intenta con otro nicho o ciudad más específica.
        </div>
      `;
      return;
    }

    grid.innerHTML = prospects.map((p, index) => {
      const isHigh = p.opportunity_score >= 80;
      const hasPhone = !!p.phone;

      return `
        <div class="prospect-card ${isHigh ? 'high-opportunity' : 'medium-opportunity'}" id="prospect-card-${index}">
          <div class="prospect-top">
            <div class="prospect-title">
              <h4>${p.business_name}</h4>
              <div class="prospect-category">📍 ${p.address || p.city} | ${p.category}</div>
            </div>
            <div class="opportunity-score-badge">
              ${isHigh ? '🔥 Alta' : '⚡ Media'} (${p.opportunity_score}%)
            </div>
          </div>

          <div class="prospect-diagnosis">
            <div class="diagnosis-item">
              <span class="diagnosis-label">Sitio Web:</span>
              <span class="diagnosis-val" style="color: ${p.has_website ? 'var(--accent-warning-text)' : 'var(--accent-danger-text)'};">
                ${p.has_website ? '⚡ Tiene Web (Propuesta Rediseño)' : '🚩 Sin Web (Gifting GBP + Landing)'}
              </span>
            </div>
            <div class="diagnosis-item">
              <span class="diagnosis-label">Reseñas en Google:</span>
              <span class="diagnosis-val" style="color: ${p.reviews_count < 20 ? 'var(--accent-purple-text)' : 'var(--text-primary)'};">
                ⭐ ${p.rating || '4.0'} (${p.reviews_count || 0} reseñas) ${p.reviews_count < 20 ? '· 💳 Ideal NFC' : ''}
              </span>
            </div>
            <div class="diagnosis-item">
              <span class="diagnosis-label">Teléfono:</span>
              <span class="diagnosis-val" style="color: ${hasPhone ? 'var(--text-primary)' : 'var(--text-muted)'};">
                ${hasPhone ? p.phone : '⚠️ No listado en ficha pública'}
              </span>
            </div>
          </div>

          <div class="prospect-footer-actions">
            <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="ScraperUI.importSingleLead(${index})">
              📥 Importar a CRM
            </button>
            <button class="btn btn-whatsapp btn-sm" onclick="ScraperUI.openScriptModal(${index})">
              💬 WhatsApp
            </button>
            ${p.maps_url ? `
              <a href="${p.maps_url}" target="_blank" class="btn btn-secondary btn-sm" title="Abrir ficha exacta en Google Maps">
                🗺️ Maps
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  async importSingleLead(index) {
    const prospect = this.currentResults[index];
    if (!prospect) return;

    const btn = document.querySelector(`#prospect-card-${index} .btn-primary`);
    if (btn) {
      btn.innerText = 'Importando...';
      btn.disabled = true;
    }

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

      API.toast(`"${prospect.business_name}" importado al CRM`, 'success');
      if (btn) {
        btn.innerText = '✅ Importado';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }

      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error al importar lead', 'error');
      if (btn) {
        btn.innerText = '📥 Importar a CRM';
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
      API.toast(`¡${res.count} negocios importados al Pipeline!`, 'success');
      
      document.querySelectorAll('.prospect-card .btn-primary').forEach(b => {
        b.innerText = '✅ Importado';
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
        targetPhone = prompt(`Por favor ingresa el número de WhatsApp de "${prospect.business_name}":`, '+34');
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
