// Facebook Ads AI Strategist & WhatsApp Lead Warmer UI Controller

const AdsAgentUI = {
  currentCampaign: null,
  activeCopyIndex: 0,
  chatHistory: [],

  init() {
    this.setupSubTabs();
    this.setupCampaignBuilder();
    this.setupWhatsAppSim();
    // Auto-generate default campaign on load
    this.generateStrategy('Talleres Mecánicos', 'Valencia, Venezuela', 10, 'gbp_landing_gift');
  },

  setupSubTabs() {
    const tabs = document.querySelectorAll('.ads-subtab-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.ads-tab-pane').forEach(p => p.style.display = 'none');
        const activePane = document.getElementById(`tab-pane-${target}`);
        if (activePane) activePane.style.display = 'block';
      });
    });
  },

  setupCampaignBuilder() {
    const form = document.getElementById('adsGeneratorForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const niche = document.getElementById('adGenNiche').value.trim();
        const city = document.getElementById('adGenCity').value.trim();
        const budget = document.getElementById('adGenBudget').value;
        const angle = document.getElementById('adGenAngle').value;
        this.generateStrategy(niche, city, budget, angle);
      });
    }

    const btnCopyAdText = document.getElementById('btnCopyPrimaryCopy');
    if (btnCopyAdText) {
      btnCopyAdText.addEventListener('click', () => {
        const text = document.getElementById('adPrimaryCopyDisplay').innerText;
        navigator.clipboard.writeText(text);
        API.toast('Copy publicitario copiado al portapapeles', 'success');
      });
    }

    const btnCopyFullPack = document.getElementById('btnCopyFullCampaignPack');
    if (btnCopyFullPack) {
      btnCopyFullPack.addEventListener('click', () => this.copyFullCampaignPackage());
    }
  },

  async generateStrategy(niche, city, budget, angle) {
    const loading = document.getElementById('adsGenLoading');
    const previewBox = document.getElementById('adsGenResults');

    if (loading) loading.style.display = 'block';
    if (previewBox) previewBox.style.display = 'none';

    try {
      const res = await API.request('/agent/generate-campaign', 'POST', {
        niche: niche || 'Talleres Mecánicos',
        city: city || 'Valencia, Venezuela',
        budget_daily: budget || 10,
        angle: angle || 'gbp_landing_gift'
      });

      this.currentCampaign = res;
      this.activeCopyIndex = 0;
      this.renderCampaignResults(res);

      if (loading) loading.style.display = 'none';
      if (previewBox) previewBox.style.display = 'grid';
    } catch (err) {
      if (loading) loading.style.display = 'none';
      API.toast('Error generando campaña de Facebook Ads', 'error');
    }
  },

  renderCampaignResults(data) {
    const c = data.campaign_data;
    if (!c) return;

    // Overview Stats
    document.getElementById('adCampNameDisplay').innerText = c.campaign_name;
    document.getElementById('adObjectiveDisplay').innerText = c.objective;
    document.getElementById('adEstLeadsDisplay').innerText = `~${c.estimated_leads_daily} leads/día (${c.cost_per_lead})`;
    document.getElementById('adTargetingDisplay').innerText = `${c.targeting.location} · ${c.targeting.detailed_targeting.join(', ')}`;

    // Render Copy Chips
    const chipsContainer = document.getElementById('copyVariantChips');
    if (chipsContainer && c.copies) {
      chipsContainer.innerHTML = c.copies.map((copy, i) => `
        <button class="copy-chip ${i === 0 ? 'active' : ''}" onclick="AdsAgentUI.switchCopyVariant(${i})">
          ${copy.type}
        </button>
      `).join('');
    }

    this.renderCurrentCopy();

    // Lead Form Questions
    const formQuestionsBox = document.getElementById('leadFormQuestionsList');
    if (formQuestionsBox && c.lead_form) {
      formQuestionsBox.innerHTML = c.lead_form.questions.map((q, i) => `
        <div style="font-size: 12px; margin-bottom: 6px; padding: 6px 10px; background: var(--crm-bg-input); border-radius: 6px; border: 1px solid var(--crm-border-subtle);">
          <strong>P${i+1}:</strong> ${q.label} ${q.options ? `<em>(Opciones: ${q.options.join(' / ')})</em>` : ''}
        </div>
      `).join('');
    }
  },

  switchCopyVariant(index) {
    this.activeCopyIndex = index;
    document.querySelectorAll('.copy-chip').forEach((c, i) => c.classList.toggle('active', i === index));
    this.renderCurrentCopy();
  },

  renderCurrentCopy() {
    if (!this.currentCampaign || !this.currentCampaign.campaign_data) return;
    const copies = this.currentCampaign.campaign_data.copies || [];
    const copy = copies[this.activeCopyIndex] || copies[0];
    if (!copy) return;

    document.getElementById('adPrimaryCopyDisplay').innerText = copy.primary_text;
    document.getElementById('adHeadlineDisplay').innerText = copy.headline;
    document.getElementById('adCtaBtnDisplay').innerText = copy.cta_button;
    document.getElementById('adMediaSuggestionDisplay').innerText = `💡 Creativo Sugerido: ${copy.media_suggestion}`;
  },

  copyFullCampaignPackage() {
    if (!this.currentCampaign) return;
    const c = this.currentCampaign.campaign_data;
    const copies = c.copies || [];
    const selectedCopy = copies[this.activeCopyIndex] || copies[0];

    const fullText = `
=== CONFIGURACIÓN DE CAMPAÑA META ADS (GROWTHCRM) ===
📌 Nombre de Campaña: ${c.campaign_name}
🎯 Objetivo: ${c.objective}
💵 Presupuesto Diario: $${this.currentCampaign.budget_daily} USD ($${this.currentCampaign.budget_monthly_projected} USD/mes)

--- SEGMENTACIÓN ---
📍 Ubicación: ${c.targeting.location}
👥 Edad: ${c.targeting.age}
🎯 Intereses: ${c.targeting.detailed_targeting.join(', ')}
📱 Ubicaciones: ${c.targeting.placements}

--- ANUNCIO & COPYWRITING (${selectedCopy.type}) ---
📝 TÍTULO: ${selectedCopy.headline}
📄 TEXTO PRINCIPAL:
${selectedCopy.primary_text}

🔘 BOTÓN CTA: ${selectedCopy.cta_button}
🖼️ SUGERENCIA DE IMAGEN/VIDEO: ${selectedCopy.media_suggestion}

--- FORMULARIO INSTANTÁNEO ---
📋 Nombre Formulario: ${c.lead_form.form_name}
❓ Preguntas:
${c.lead_form.questions.map((q, i) => `${i+1}. ${q.label}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(fullText);
    API.toast('¡Paquete completo copiado para Meta Ads Manager!', 'success');
  },

  /* ========================================================== */
  /* WHATSAPP AI LEAD WARMER SIMULATOR */
  /* ========================================================== */
  setupWhatsAppSim() {
    const input = document.getElementById('simChatInput');
    const sendBtn = document.getElementById('btnSimSend');

    if (sendBtn && input) {
      const sendHandler = () => {
        const text = input.value.trim();
        if (text) {
          this.handleCustomerMessage(text);
          input.value = '';
        }
      };

      sendBtn.addEventListener('click', sendHandler);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendHandler();
      });
    }

    // Quick objection chips
    document.querySelectorAll('.btn-objection-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = btn.getAttribute('data-msg');
        if (msg) this.handleCustomerMessage(msg);
      });
    });

    // Reset Chat Button
    const resetBtn = document.getElementById('btnResetChatSim');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetChatSim());
    }

    // Initial greeting in simulator
    this.resetChatSim();
  },

  resetChatSim() {
    this.chatHistory = [];
    const chatBody = document.getElementById('chatMessagesBody');
    if (!chatBody) return;

    chatBody.innerHTML = `
      <div style="text-align: center; font-size: 11px; color: #8696a0; margin-bottom: 8px; background: rgba(18,140,126,0.1); padding: 4px 8px; border-radius: 6px;">
        🔒 Los mensajes están cifrados de extremo a extremo.
      </div>
      <div class="chat-msg agent">
        Hola Carlos, un gusto saludarte. Recibimos tu solicitud en Facebook para la *Landing Page de obsequio* para tu negocio *Taller Mecánico El Trigal*.<br><br>
        ¿Actualmente atienden a sus clientes principalmente por WhatsApp o por llamadas?
        <div class="chat-time">10:00 AM</div>
      </div>
    `;

    document.getElementById('simLeadTemperatureDisplay').innerText = '70%';
    document.getElementById('simNextStepDisplay').innerText = 'Hacer pregunta de calificación abierta para enganchar la conversación.';
  },

  async handleCustomerMessage(text) {
    const chatBody = document.getElementById('chatMessagesBody');
    if (!chatBody) return;

    const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 1. Append customer message bubble
    const custBubble = document.createElement('div');
    custBubble.className = 'chat-msg customer';
    custBubble.innerHTML = `${text}<div class="chat-time">${timeStr}</div>`;
    chatBody.appendChild(custBubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-msg agent';
    typingBubble.id = 'agentTyping';
    typingBubble.innerHTML = `<em>Escribiendo... 💬</em>`;
    chatBody.appendChild(typingBubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const res = await API.request('/agent/whatsapp-reply', 'POST', {
        message: text,
        leadContext: {
          business_name: 'Taller Mecánico El Trigal',
          contact_name: 'Carlos Mendoza',
          city: 'Valencia, Venezuela'
        }
      });

      // Remove typing
      const typ = document.getElementById('agentTyping');
      if (typ) typ.remove();

      // 3. Append agent reply
      const agentBubble = document.createElement('div');
      agentBubble.className = 'chat-msg agent';
      agentBubble.innerHTML = `${res.ai_suggested_reply.replace(/\n/g, '<br>')}<div class="chat-time">${timeStr}</div>`;
      chatBody.appendChild(agentBubble);
      chatBody.scrollTop = chatBody.scrollHeight;

      // 4. Update temperature gauge & next steps
      document.getElementById('simLeadTemperatureDisplay').innerText = res.lead_temperature;
      document.getElementById('simNextStepDisplay').innerText = res.recommended_next_step;
    } catch (err) {
      const typ = document.getElementById('agentTyping');
      if (typ) typ.remove();
    }
  }
};

window.AdsAgentUI = AdsAgentUI;
