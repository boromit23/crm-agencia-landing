// Facebook Ads & Webhooks Integration Module

const WebhooksUI = {
  init() {
    this.setupUrls();
    this.setupEventListeners();
  },

  setupUrls() {
    const origin = window.location.origin;
    const webhookUrlEl = document.getElementById('webhookUrlDisplay');
    const captureUrlEl = document.getElementById('publicCaptureUrlDisplay');

    if (webhookUrlEl) webhookUrlEl.value = `${origin}/api/webhooks/facebook`;
    if (captureUrlEl) captureUrlEl.value = `${origin}/captura.html`;
  },

  setupEventListeners() {
    // Copy Webhook URL button
    const copyWhBtn = document.getElementById('btnCopyWebhookUrl');
    if (copyWhBtn) {
      copyWhBtn.addEventListener('click', () => {
        const input = document.getElementById('webhookUrlDisplay');
        navigator.clipboard.writeText(input.value);
        API.toast('URL del Webhook copiada al portapapeles', 'success');
      });
    }

    // Copy Verify Token button
    const copyTokenBtn = document.getElementById('btnCopyVerifyToken');
    if (copyTokenBtn) {
      copyTokenBtn.addEventListener('click', () => {
        const input = document.getElementById('webhookVerifyTokenDisplay');
        navigator.clipboard.writeText(input.value);
        API.toast('Verify Token copiado', 'success');
      });
    }

    // Copy Public Capture Page URL button
    const copyCapBtn = document.getElementById('btnCopyCaptureUrl');
    if (copyCapBtn) {
      copyCapBtn.addEventListener('click', () => {
        const input = document.getElementById('publicCaptureUrlDisplay');
        navigator.clipboard.writeText(input.value);
        API.toast('Enlace de formulario público copiado', 'success');
      });
    }

    // Simulate Facebook Lead button
    const simForm = document.getElementById('fbSimulatorForm');
    if (simForm) {
      simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.runSimulation();
      });
    }
  },

  async runSimulation() {
    const bizName = document.getElementById('simBizName').value.trim();
    const contactName = document.getElementById('simContactName').value.trim();
    const phone = document.getElementById('simPhone').value.trim();
    const campaign = document.getElementById('simCampaign').value;

    const btn = document.getElementById('btnRunSim');
    if (btn) {
      btn.innerText = '⚡ Simulando entrada...';
      btn.disabled = true;
    }

    try {
      const res = await API.simulateFacebookLead({
        business_name: bizName,
        contact_name: contactName,
        phone: phone,
        campaign: campaign,
        has_website: false
      });

      API.toast(`🚀 ¡Lead recibido de Facebook Ads: "${res.data.business_name}"!`, 'success');

      // Refresh Pipeline
      if (window.Pipeline) window.Pipeline.loadLeads();
      if (window.Analytics) window.Analytics.loadMetrics();

      // Show in result box
      const resultBox = document.getElementById('simResultBox');
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid var(--accent-success); border-radius: var(--radius-md); padding: 14px; margin-top: 14px;">
            <div style="font-weight: 700; color: var(--accent-success); margin-bottom: 4px;">✅ Lead Ingestado Correctamente en Supabase</div>
            <div style="font-size: 12.5px; color: var(--text-secondary);">
              <strong>ID:</strong> ${res.data.id}<br>
              <strong>Negocio:</strong> ${res.data.business_name} (${res.data.contact_name})<br>
              <strong>Campaña:</strong> ${campaign}<br>
              <strong>Etapa inicial:</strong> 📥 Nuevo Prospecto
            </div>
          </div>
        `;
      }
    } catch (err) {
      API.toast('Error en la simulación del Webhook', 'error');
    } finally {
      if (btn) {
        btn.innerText = '⚡ Disparar Lead Simulado de Facebook';
        btn.disabled = false;
      }
    }
  }
};

window.WebhooksUI = WebhooksUI;
