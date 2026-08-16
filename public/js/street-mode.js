// Street Mode & GPS Radar Proximity Scanner Module

const StreetMode = {
  currentLat: null,
  currentLon: null,
  currentRadius: 500,
  currentCategory: 'all',
  nearbyResults: [],
  selectedOffer: 'nfc_sale',
  selectedPayment: 'efectivo',

  init() {
    this.setupSubTabs();
    this.setupGpsRadar();
    this.setupEventListeners();
    this.loadStreetStats();
  },

  setupSubTabs() {
    const tabs = document.querySelectorAll('.street-subtab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const radarPane = document.getElementById('street-radar-pane');
        const formPane = document.getElementById('street-form-pane');

        if (target === 'radar') {
          if (radarPane) radarPane.style.display = 'block';
          if (formPane) formPane.style.display = 'none';
        } else {
          if (radarPane) radarPane.style.display = 'none';
          if (formPane) formPane.style.display = 'block';
        }
      });
    });
  },

  setupGpsRadar() {
    const scanBtn = document.getElementById('btnTriggerGpsRadar');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.activateGpsRadar());
    }

    const radiusSelect = document.getElementById('radarRadiusSelect');
    if (radiusSelect) {
      radiusSelect.addEventListener('change', (e) => {
        this.currentRadius = parseInt(e.target.value) || 500;
        if (this.currentLat && this.currentLon) {
          this.fetchNearbyProspects(this.currentLat, this.currentLon);
        } else {
          this.activateGpsRadar();
        }
      });
    }

    const categorySelect = document.getElementById('radarCategorySelect');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        if (this.currentLat && this.currentLon) {
          this.fetchNearbyProspects(this.currentLat, this.currentLon);
        } else {
          this.activateGpsRadar();
        }
      });
    }
  },

  activateGpsRadar() {
    const scanBtn = document.getElementById('btnTriggerGpsRadar');
    const loadingState = document.getElementById('radarLoadingState');
    const resultsContainer = document.getElementById('radarResultsContainer');
    const locationPill = document.getElementById('currentGpsLocationPill');

    if (scanBtn) {
      scanBtn.classList.add('scanning');
      scanBtn.innerHTML = '<span>🛰️</span> <span>Localizando señal GPS en tu teléfono...</span>';
    }
    if (loadingState) loadingState.style.display = 'block';
    if (resultsContainer) resultsContainer.innerHTML = '';

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLat = position.coords.latitude;
          this.currentLon = position.coords.longitude;
          console.log(`[GPS] Coordenadas obtenidas: ${this.currentLat}, ${this.currentLon}`);
          this.fetchNearbyProspects(this.currentLat, this.currentLon);
        },
        (error) => {
          console.warn('[GPS] Error de geolocalización o permiso denegado, usando coordenadas por defecto:', error.message);
          // Fallback coordinates (Valencia / Local Center)
          this.currentLat = 10.1620;
          this.currentLon = -67.9940;
          this.fetchNearbyProspects(this.currentLat, this.currentLon);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    } else {
      this.currentLat = 10.1620;
      this.currentLon = -67.9940;
      this.fetchNearbyProspects(this.currentLat, this.currentLon);
    }
  },

  async fetchNearbyProspects(lat, lon) {
    const scanBtn = document.getElementById('btnTriggerGpsRadar');
    const loadingState = document.getElementById('radarLoadingState');
    const resultsContainer = document.getElementById('radarResultsContainer');
    const locationPill = document.getElementById('currentGpsLocationPill');
    const locationText = document.getElementById('gpsCurrentAddressText');

    try {
      const radius = this.currentRadius || 500;
      const category = this.currentCategory || 'all';

      const res = await API.request(`/scraper/nearby?lat=${lat}&lon=${lon}&radius=${radius}&category=${category}`);
      this.nearbyResults = res.data.results || [];

      if (loadingState) loadingState.style.display = 'none';
      if (scanBtn) {
        scanBtn.classList.remove('scanning');
        scanBtn.innerHTML = '<span>🔄</span> <span>Volver a Escanear mi Alrededor</span>';
      }

      if (locationPill && locationText) {
        locationPill.style.display = 'flex';
        locationText.innerText = `${res.data.current_location_name} (${res.data.total_nearby} locales detectados a ${radius}m)`;
      }

      this.renderNearbyBusinesses(this.nearbyResults);
      API.toast(`Radar GPS: ${this.nearbyResults.length} negocios encontrados a ${radius}m`, 'success');
    } catch (err) {
      if (loadingState) loadingState.style.display = 'none';
      if (scanBtn) {
        scanBtn.classList.remove('scanning');
        scanBtn.innerHTML = '<span>📍</span> <span>Activar Radar GPS</span>';
      }
      API.toast('Error al escanear prospectos por GPS', 'error');
    }
  },

  renderNearbyBusinesses(list) {
    const container = document.getElementById('radarResultsContainer');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted); background: var(--crm-bg-input); border-radius: var(--radius-md);">
          No se encontraron locales en este radio. Prueba ampliando a 1 km o 2 km.
        </div>
      `;
      return;
    }

    container.innerHTML = list.map((b, index) => {
      const avatar = ScraperUI ? ScraperUI.getCategoryAvatar(b.category, b.business_name) : '🏢';
      
      let webBadge = b.has_website 
        ? '<span class="tag-badge website-bad">⚡ Web Lenta</span>'
        : '<span class="tag-badge website-none">🚩 Sin Web (Ofrecer Landing)</span>';

      let nfcBadge = b.reviews_count < 20
        ? `<span class="tag-badge reviews-low">⭐ ${b.reviews_count || 0} reseñas · Ideal Tarjeta NFC $35</span>`
        : `<span class="tag-badge">⭐ ${b.rating || '4.5'} (${b.reviews_count})</span>`;

      return `
        <div class="nearby-biz-card ${b.opportunity_score >= 80 ? 'highlight' : ''}">
          <div class="nearby-biz-top">
            <div style="display: flex; gap: 10px; align-items: center;">
              <span class="cell-avatar">${avatar}</span>
              <div>
                <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${b.business_name}</div>
                <div style="font-size: 11.5px; color: var(--text-muted);">${b.category} · ${b.address}</div>
              </div>
            </div>
            <div class="nearby-distance-tag">
              🚶‍♂️ ${b.distance_meters}m (~${b.walking_time_mins} min)
            </div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0;">
            ${webBadge}
            ${nfcBadge}
          </div>

          <div class="nearby-actions-bar">
            <button class="btn btn-primary btn-sm" onclick="StreetMode.loadIntoCaptureForm(${index})">
              💵 Abordar / Registrar Venta
            </button>
            <a href="${b.maps_nav_url}" target="_blank" class="btn btn-secondary btn-sm" title="Ruta a pie en Google Maps">
              🚶‍♂️ Cómo Llegar
            </a>
            <button class="btn btn-whatsapp btn-sm" onclick="StreetMode.openNearbyScript(${index})">
              💬 WhatsApp
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // 1-Click Pre-fill the Manual Capture Form from Radar
  loadIntoCaptureForm(index) {
    const b = this.nearbyResults[index];
    if (!b) return;

    // Switch sub-tab to Form
    const tabFormBtn = document.querySelector('.street-subtab-btn[data-tab="form"]');
    if (tabFormBtn) tabFormBtn.click();

    document.getElementById('streetBizName').value = b.business_name;
    document.getElementById('streetContactName').value = '';
    document.getElementById('streetPhone').value = b.phone || '';
    document.getElementById('streetAddress').value = `${b.address} (${b.distance_meters}m de tu GPS)`;
    document.getElementById('streetNotes').value = `Abordado en calle desde Radar GPS (${b.distance_meters}m). Calificación Google: ${b.reviews_count || 0} reseñas.`;

    API.toast(`Datos de "${b.business_name}" cargados en el formulario`, 'info');
    document.getElementById('streetBizName').focus();
  },

  openNearbyScript(index) {
    const b = this.nearbyResults[index];
    if (!b) return;

    const modal = document.getElementById('scriptModal');
    if (!modal) return;

    document.getElementById('scriptBizName').innerText = b.business_name;
    document.getElementById('scriptPhone').innerText = b.phone || 'Sin teléfono';

    const scripts = b.sales_scripts;
    const defaultScript = !b.has_website ? scripts.gbp_gift : (b.reviews_count < 20 ? scripts.nfc_reviews : scripts.web_redesign);

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
      let targetPhone = b.phone;
      if (!targetPhone) {
        targetPhone = prompt(`Ingresa el número de WhatsApp de "${b.business_name}":`, '+58');
        if (!targetPhone) return;
      }
      API.openWhatsApp(targetPhone, document.getElementById('scriptContent').value);
      modal.classList.remove('active');
    };

    modal.classList.add('active');
  },

  setupEventListeners() {
    // Offer Type cards selection
    const offerCards = document.querySelectorAll('.offer-option-card');
    offerCards.forEach(card => {
      card.addEventListener('click', () => {
        offerCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedOffer = card.getAttribute('data-offer');

        const nfcBox = document.getElementById('streetNfcBox');
        if (nfcBox) {
          nfcBox.style.display = this.selectedOffer === 'nfc_sale' ? 'block' : 'none';
        }
      });
    });

    // Payment method pills selection
    const paymentPills = document.querySelectorAll('.payment-pill');
    paymentPills.forEach(pill => {
      pill.addEventListener('click', () => {
        paymentPills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        this.selectedPayment = pill.getAttribute('data-payment');
      });
    });

    // Form GPS button
    const btnGetGps = document.getElementById('btnGetGps');
    if (btnGetGps) {
      btnGetGps.addEventListener('click', () => {
        if ('geolocation' in navigator) {
          btnGetGps.innerText = '📍 Obteniendo...';
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const input = document.getElementById('streetAddress');
              if (input) input.value = `GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
              btnGetGps.innerText = '📍 GPS Listo';
            },
            (err) => {
              API.toast('No se pudo obtener GPS del dispositivo', 'warning');
              btnGetGps.innerText = '📍 GPS';
            }
          );
        }
      });
    }

    // Street Capture Form Submit
    const form = document.getElementById('streetCaptureForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleStreetSubmit(e));
    }
  },

  async handleStreetSubmit(e) {
    e.preventDefault();

    const bizName = document.getElementById('streetBizName').value.trim();
    const contactName = document.getElementById('streetContactName').value.trim();
    const phone = document.getElementById('streetPhone').value.trim();
    const address = document.getElementById('streetAddress').value.trim();
    const notes = document.getElementById('streetNotes').value.trim();

    if (!bizName || !phone) {
      API.toast('Nombre del negocio y WhatsApp son obligatorios', 'warning');
      return;
    }

    const saveBtn = document.getElementById('btnStreetSave');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerText = 'Guardando visita...';
    }

    try {
      let stage = 'calle_nfc';
      let dealValue = 35;

      if (this.selectedOffer === 'nfc_sale') {
        stage = 'ganado';
        dealValue = parseFloat(document.getElementById('streetNfcPrice')?.value) || 35;
      } else if (this.selectedOffer === 'gbp_landing') {
        stage = 'sin_web_gbp';
        dealValue = 250;
      } else if (this.selectedOffer === 'web_redesign') {
        stage = 'web_deficiente';
        dealValue = 450;
      }

      // 1. Create Lead in Pipeline
      const leadRes = await API.createLead({
        business_name: bizName,
        contact_name: contactName,
        phone: phone,
        whatsapp: phone,
        address: address,
        city: 'Local',
        stage: stage,
        deal_value: dealValue,
        source: 'calle_nfc',
        tags: ['Modo Calle', this.selectedOffer === 'nfc_sale' ? 'Venta NFC Cobrada' : 'Visita en Frío'],
        notes: `Visita Presencial en Calle. ${notes}`
      });

      // 2. If NFC Sale closed, record transaction
      if (this.selectedOffer === 'nfc_sale') {
        await API.recordSale({
          lead_id: leadRes.data?.id,
          business_name: bizName,
          service_type: 'nfc_tarjeta',
          service_name: 'Tarjeta Inteligente NFC Reseñas Google',
          amount: dealValue,
          payment_method: this.selectedPayment,
          notes: notes
        });
      }

      API.toast(`¡Visita de "${bizName}" guardada con éxito!`, 'success');

      // 3. Open WhatsApp with Welcome Message
      const welcomeText = this.selectedOffer === 'nfc_sale'
        ? `Hola ${contactName || bizName}, un placer saludarte. Te confirmo la entrega de tu Tarjeta Inteligente NFC para reseñas de Google. ¡A multiplicar esas 5 estrellas! ⭐⭐⭐⭐⭐`
        : `Hola ${contactName || bizName}, un gusto haber visitado ${bizName} hoy. Te comparto nuestro contacto para coordinar la demo de tu Landing Page oficial. ¡Saludos!`;

      API.openWhatsApp(phone, welcomeText);

      // Reset form
      document.getElementById('streetCaptureForm').reset();
      this.loadStreetStats();
      if (window.Dashboard) window.Dashboard.loadDashboardData();
      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();
    } catch (err) {
      API.toast('Error al guardar la visita de calle', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💬</span> <span>Guardar y Abrir WhatsApp</span>';
      }
    }
  },

  async loadStreetStats() {
    try {
      const salesRes = await API.getSales();
      const sales = salesRes.data || [];
      const nfcSales = sales.filter(s => s.service_type === 'nfc_tarjeta');
      
      const nfcCountEl = document.getElementById('streetNfcSoldToday');
      const revenueEl = document.getElementById('streetRevenueToday');
      
      if (nfcCountEl) nfcCountEl.innerText = nfcSales.length;
      if (revenueEl) {
        const total = nfcSales.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
        revenueEl.innerText = `$${total.toFixed(0)}`;
      }
    } catch (err) {
      console.warn('Error loading street stats:', err);
    }
  }
};

window.StreetMode = StreetMode;
