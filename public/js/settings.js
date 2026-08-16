// Settings & Security Devices Manager Module

const SettingsUI = {
  activeDevices: [],

  init() {
    this.setupPinChangeForm();
    this.setupDeviceManagement();
  },

  async loadSettingsView() {
    await this.loadActiveDevices();
  },

  setupPinChangeForm() {
    const form = document.getElementById('changePinForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPin = document.getElementById('settingCurrentPin').value.trim();
      const newPin = document.getElementById('settingNewPin').value.trim();
      const confirmPin = document.getElementById('settingConfirmPin').value.trim();
      const statusBox = document.getElementById('pinChangeStatus');

      if (!currentPin || !newPin) {
        API.toast('Por favor completa todos los campos', 'warning');
        return;
      }

      if (newPin.length < 4 || newPin.length > 8) {
        API.toast('El nuevo PIN debe tener entre 4 y 8 dígitos', 'warning');
        return;
      }

      if (newPin !== confirmPin) {
        API.toast('Los nuevos PINs no coinciden', 'error');
        return;
      }

      const saveBtn = document.getElementById('btnSaveNewPin');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Guardando...';
      }

      try {
        const res = await API.request('/auth/change-pin', {
          method: 'POST',
          body: JSON.stringify({ currentPin, newPin })
        });

        if (res.success && res.token) {
          // Update local session token
          if (window.Auth) {
            window.Auth.setToken(res.token, true);
          }

          API.toast('✅ ¡PIN de seguridad actualizado con éxito!', 'success');
          form.reset();

          if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.className = 'status-alert success';
            statusBox.innerText = 'Tu PIN ha sido cambiado. Se aplicará a todos los accesos futuros.';
            setTimeout(() => statusBox.style.display = 'none', 5000);
          }
        }
      } catch (err) {
        API.toast(err.message || 'Error al cambiar PIN', 'error');
        if (statusBox) {
          statusBox.style.display = 'block';
          statusBox.className = 'status-alert error';
          statusBox.innerText = err.message || 'PIN actual incorrecto.';
        }
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerText = '💾 Guardar Nuevo PIN';
        }
      }
    });
  },

  setupDeviceManagement() {
    const btnRevokeAll = document.getElementById('btnRevokeAllDevices');
    if (btnRevokeAll) {
      btnRevokeAll.addEventListener('click', async () => {
        if (confirm('¿Cerrar sesión en todos los demás teléfonos y computadoras conectados?')) {
          try {
            await API.request('/auth/revoke-device', {
              method: 'POST',
              body: JSON.stringify({ revokeAllOthers: true, currentDeviceId: 'dev_current' })
            });
            API.toast('Sesiones cerradas en los demás dispositivos', 'info');
            await this.loadActiveDevices();
          } catch (err) {
            API.toast('Error cerrando sesiones', 'error');
          }
        }
      });
    }

    const btnRefreshDevices = document.getElementById('btnRefreshDevices');
    if (btnRefreshDevices) {
      btnRefreshDevices.addEventListener('click', () => this.loadActiveDevices());
    }
  },

  async loadActiveDevices() {
    const container = document.getElementById('linkedDevicesList');
    if (!container) return;

    try {
      const res = await API.request('/auth/devices');
      this.activeDevices = res.data || [];
      this.renderDevicesList(this.activeDevices);
    } catch (err) {
      console.warn('Error loading devices:', err);
    }
  },

  renderDevicesList(devices) {
    const container = document.getElementById('linkedDevicesList');
    if (!container) return;

    if (devices.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 16px;">
          No hay otros dispositivos registrados.
        </div>
      `;
      return;
    }

    container.innerHTML = devices.map((dev, index) => {
      const isCurrent = index === 0 || dev.id === 'dev_current';
      const lastActiveFormatted = dev.last_active ? new Date(dev.last_active).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Activo ahora';

      return `
        <div class="device-item-card ${isCurrent ? 'current-session' : ''}">
          <div class="device-icon">${dev.icon || '💻'}</div>
          <div class="device-info">
            <div class="device-name-row">
              <span class="device-name">${dev.device_name || 'Navegador Web'}</span>
              ${isCurrent ? '<span class="device-badge-current">🟢 Este Dispositivo (Sesión Actual)</span>' : ''}
            </div>
            <div class="device-meta">
              <span>IP: ${dev.ip || '127.0.0.1'}</span>
              <span>·</span>
              <span>Última actividad: ${lastActiveFormatted}</span>
            </div>
          </div>
          ${!isCurrent ? `
            <button class="btn btn-secondary btn-sm" onclick="SettingsUI.revokeSingleDevice('${dev.id}')" title="Desvincular">
              Desvincular
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  async revokeSingleDevice(deviceId) {
    if (confirm('¿Desvincular este dispositivo?')) {
      try {
        await API.request('/auth/revoke-device', {
          method: 'POST',
          body: JSON.stringify({ deviceId })
        });
        API.toast('Dispositivo desvinculado', 'info');
        await this.loadActiveDevices();
      } catch (err) {
        API.toast('Error al desvincular', 'error');
      }
    }
  }
};

window.SettingsUI = SettingsUI;
