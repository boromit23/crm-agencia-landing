// Secure PIN Access & CRM Lock Manager

const Auth = {
  tokenKey: 'growthcrm_auth_token',
  rememberKey: 'growthcrm_remember_device',
  isAuthenticated: false,

  async init() {
    this.setupEventListeners();
    await this.checkSession();
  },

  getToken() {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey);
  },

  setToken(token, remember = true) {
    if (remember) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.rememberKey, 'true');
    } else {
      sessionStorage.setItem(this.tokenKey, token);
      localStorage.removeItem(this.rememberKey);
    }
  },

  clearToken() {
    localStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.tokenKey);
  },

  async checkSession() {
    const token = this.getToken();
    const lockOverlay = document.getElementById('authLockOverlay');
    const appContainer = document.querySelector('.app-container');

    if (!token) {
      this.showLockScreen();
      return;
    }

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();
      if (data.success && data.valid) {
        this.unlockCRM();
      } else {
        this.clearToken();
        this.showLockScreen();
      }
    } catch (err) {
      // In case of network error with existing token, allow unlock
      this.unlockCRM();
    }
  },

  showLockScreen() {
    this.isAuthenticated = false;
    const lockOverlay = document.getElementById('authLockOverlay');
    const appContainer = document.querySelector('.app-container');

    if (lockOverlay) lockOverlay.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';

    const pinInput = document.getElementById('pinInputField');
    if (pinInput) {
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 200);
    }
  },

  unlockCRM() {
    this.isAuthenticated = true;
    const lockOverlay = document.getElementById('authLockOverlay');
    const appContainer = document.querySelector('.app-container');

    if (lockOverlay) lockOverlay.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
  },

  async submitPin(pin) {
    if (!pin || pin.length < 4) {
      this.showPinError('Introduce al menos 4 dígitos');
      return;
    }

    const unlockBtn = document.getElementById('btnUnlockCrm');
    if (unlockBtn) {
      unlockBtn.disabled = true;
      unlockBtn.innerHTML = '<span>⏳</span> <span>Verificando...</span>';
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      const data = await res.json();

      if (data.success && data.token) {
        const remember = document.getElementById('rememberDeviceCheckbox')?.checked ?? true;
        this.setToken(data.token, remember);
        this.unlockCRM();
        API.toast('🔓 Acceso concedido al CRM', 'success');

        // Refresh views
        if (window.Dashboard) window.Dashboard.loadDashboardData();
        if (window.Pipeline) window.Pipeline.loadLeads();
      } else {
        this.showPinError(data.error || 'PIN incorrecto');
      }
    } catch (err) {
      this.showPinError('Error de conexión al verificar');
    } finally {
      if (unlockBtn) {
        unlockBtn.disabled = false;
        unlockBtn.innerHTML = '<span>🔓</span> <span>Desbloquear CRM</span>';
      }
    }
  },

  showPinError(message) {
    const pinInput = document.getElementById('pinInputField');
    const errorText = document.getElementById('pinErrorMsg');

    if (pinInput) {
      pinInput.classList.add('error');
      pinInput.value = '';
      setTimeout(() => pinInput.classList.remove('error'), 600);
      pinInput.focus();
    }

    if (errorText) {
      errorText.innerText = message;
      errorText.style.display = 'block';
    }
  },

  lockCRM() {
    this.clearToken();
    this.showLockScreen();
    API.toast('🔒 CRM bloqueado', 'info');
  },

  setupEventListeners() {
    const pinInput = document.getElementById('pinInputField');
    const form = document.getElementById('pinAuthForm');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = pinInput?.value || '';
        this.submitPin(pin);
      });
    }

    // Keypad Buttons
    document.querySelectorAll('.numpad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val');
        if (!pinInput) return;

        if (val === 'backspace') {
          pinInput.value = pinInput.value.slice(0, -1);
        } else if (val === 'clear') {
          pinInput.value = '';
        } else if (val) {
          if (pinInput.value.length < 8) {
            pinInput.value += val;
          }
        }

        const errorText = document.getElementById('pinErrorMsg');
        if (errorText) errorText.style.display = 'none';

        // Auto-submit if reaches 6 digits
        if (pinInput.value.length === 6) {
          this.submitPin(pinInput.value);
        }
      });
    });

    // Lock CRM button in Sidebar / Header
    document.querySelectorAll('.btn-lock-crm, #btnLockCrm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.lockCRM();
      });
    });
  }
};

window.Auth = Auth;
