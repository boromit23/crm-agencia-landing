// Street Mode & NFC Sales Module

const StreetMode = {
  selectedOffer: 'nfc_sale', // 'nfc_sale', 'gbp_landing', 'web_redesign'
  selectedPayment: 'efectivo',

  init() {
    this.setupEventListeners();
    this.loadStreetStats();
  },

  setupEventListeners() {
    // Offer selectors
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

    // Payment method pills
    const paymentPills = document.querySelectorAll('.payment-pill');
    paymentPills.forEach(pill => {
      pill.addEventListener('click', () => {
        paymentPills.forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        this.selectedPayment = pill.getAttribute('data-payment');
      });
    });

    // GPS Button
    const gpsBtn = document.getElementById('btnGetGps');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => this.detectCurrentLocation());
    }

    // Street Capture Form Submit
    const streetForm = document.getElementById('streetCaptureForm');
    if (streetForm) {
      streetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStreetCapture();
      });
    }
  },

  detectCurrentLocation() {
    const addressInput = document.getElementById('streetAddress');
    const gpsBtn = document.getElementById('btnGetGps');

    if (!navigator.geolocation) {
      API.toast('Geolocalización no soportada en este navegador', 'warning');
      return;
    }

    if (gpsBtn) gpsBtn.innerText = '📍 Detectando...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        addressInput.value = `Ubicación GPS: ${lat}, ${lng}`;
        if (gpsBtn) gpsBtn.innerText = '✅ Ubicado';
        API.toast('Ubicación capturada con éxito', 'success');
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        if (gpsBtn) gpsBtn.innerText = '📍 Reintentar';
        API.toast('No se pudo obtener la ubicación exacta. Escríbela manualmente.', 'info');
      },
      { timeout: 7000 }
    );
  },

  async handleStreetCapture() {
    const bizName = document.getElementById('streetBizName').value.trim();
    const contactName = document.getElementById('streetContactName').value.trim();
    const phone = document.getElementById('streetPhone').value.trim();
    const address = document.getElementById('streetAddress').value.trim();
    const notes = document.getElementById('streetNotes').value.trim();
    const nfcPrice = parseFloat(document.getElementById('streetNfcPrice').value) || 35.0;

    if (!bizName) {
      API.toast('Por favor escribe el nombre del negocio', 'warning');
      return;
    }

    const saveBtn = document.getElementById('btnStreetSave');
    if (saveBtn) {
      saveBtn.innerText = 'Guardando...';
      saveBtn.disabled = true;
    }

    try {
      let stage = 'nfc_calle';
      let dealValue = 35;
      let tags = ['Visita en Frío', 'Modo Calle'];

      if (this.selectedOffer === 'nfc_sale') {
        stage = 'ganado'; // Closed sale on street
        dealValue = nfcPrice;
        tags.push('Venta Tarjeta NFC');
      } else if (this.selectedOffer === 'gbp_landing') {
        stage = 'propuesta';
        dealValue = 250;
        tags.push('Interesado GBP + Landing');
      } else {
        stage = 'propuesta';
        dealValue = 450;
        tags.push('Interesado Rediseño Web');
      }

      // 1. Create Lead in Supabase
      const leadRes = await API.createLead({
        business_name: bizName,
        contact_name: contactName,
        phone: phone,
        whatsapp: phone,
        address: address,
        city: 'Local / Calle',
        stage: stage,
        deal_value: dealValue,
        source: 'calle_nfc',
        tags: tags,
        notes: notes ? `Visita en Calle: ${notes}` : 'Visita presencial en frío.'
      });

      const newLead = leadRes.data;

      // 2. If it was an immediate NFC Sale, register the transaction in `sales`
      if (this.selectedOffer === 'nfc_sale') {
        await API.createSale({
          lead_id: newLead.id,
          business_name: bizName,
          service_type: 'nfc_card',
          amount: nfcPrice,
          payment_method: this.selectedPayment,
          payment_status: 'completado',
          notes: `Venta directa en calle a ${contactName || bizName}. Método: ${this.selectedPayment}`
        });

        API.toast(`🎉 ¡Venta de Tarjeta NFC de $${nfcPrice} registrada!`, 'success');
      } else {
        API.toast(`Prospecto "${bizName}" guardado en el Pipeline`, 'success');
      }

      // 3. Open WhatsApp welcome / confirmation message
      if (phone) {
        let welcomeMsg = '';
        if (this.selectedOffer === 'nfc_sale') {
          welcomeMsg = `¡Hola ${contactName || bizName}! Un placer haberte visitado hoy.\n\nAquí tienes nuestro contacto directo para la configuración de tu *Tarjeta NFC de Reseñas de Google*.\n\nCualquier duda o ajuste a tu ficha de Google Maps, estamos a tu total disposición. ¡Muchos éxitos y más clientes de 5 estrellas! 🚀`;
        } else {
          welcomeMsg = `¡Hola ${contactName || bizName}! Gracias por el tiempo en tu local hoy.\n\nTe dejamos nuestro contacto directo. En breve te enviaremos la propuesta y demo para potenciar tu presencia en Google con tu *Landing Page profesional*.\n\n¡Un cordial saludo!`;
        }

        API.openWhatsApp(phone, welcomeMsg);
      }

      // Reset Form & Refresh Stats
      document.getElementById('streetCaptureForm').reset();
      this.loadStreetStats();
      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();

    } catch (err) {
      API.toast('Error al guardar en el servidor', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.innerText = '⚡ Guardar y Abrir WhatsApp';
        saveBtn.disabled = false;
      }
    }
  },

  async loadStreetStats() {
    try {
      const analytics = await API.getAnalytics();
      const nfc = analytics.data.nfcStats || {};
      const sales = analytics.data.recentSales || [];

      const streetSalesCount = sales.filter(s => s.service_type === 'nfc_card').length;
      const streetRevenue = analytics.data.revenueByService?.nfc_card || 0;

      const countEl = document.getElementById('streetNfcSoldToday');
      const revEl = document.getElementById('streetRevenueToday');
      const cardsInBagEl = document.getElementById('streetCardsInBag');

      if (countEl) countEl.innerText = streetSalesCount;
      if (revEl) revEl.innerText = API.formatCurrency(streetRevenue);
      if (cardsInBagEl) cardsInBagEl.innerText = nfc.disponibles || '10+';
    } catch (err) {
      console.warn('Error loading street stats:', err);
    }
  }
};

window.StreetMode = StreetMode;
