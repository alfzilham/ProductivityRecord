const SETTINGS_PROFILE_KEY = 'remindme:profile';
const SETTINGS_APPEARANCE_KEY = 'remindme:appearance';

const DEFAULT_PROFILE = {
  username: 'user',
  email: 'user@example.com',
};

const DEFAULT_APPEARANCE = {
  currency: 'IDR',
  currencySymbol: 'Rp',
  currencyDecimals: 0,
  locale: 'id-ID',
};

const CURRENCY_OPTIONS = [
  { code: 'IDR', symbol: 'Rp', decimals: 0, locale: 'id-ID', label: 'IDR — Rupiah Indonesia' },
  { code: 'USD', symbol: '$', decimals: 2, locale: 'en-US', label: 'USD — US Dollar' },
  { code: 'EUR', symbol: '€', decimals: 2, locale: 'de-DE', label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£', decimals: 2, locale: 'en-GB', label: 'GBP — British Pound' },
  { code: 'JPY', symbol: '¥', decimals: 0, locale: 'ja-JP', label: 'JPY — Japanese Yen' },
  { code: 'MYR', symbol: 'RM', decimals: 0, locale: 'ms-MY', label: 'MYR — Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', decimals: 2, locale: 'en-SG', label: 'SGD — Singapore Dollar' },
  { code: 'KRW', symbol: '₩', decimals: 0, locale: 'ko-KR', label: 'KRW — South Korean Won' },
  { code: 'CNY', symbol: '¥', decimals: 2, locale: 'zh-CN', label: 'CNY — Chinese Yuan' },
  { code: 'PHP', symbol: '₱', decimals: 2, locale: 'fil-PH', label: 'PHP — Philippine Peso' },
];

const LOCALE_OPTIONS = [
  { code: 'id-ID', label: 'Bahasa Indonesia' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'ms-MY', label: 'Bahasa Melayu' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'zh-CN', label: '中文' },
  { code: 'fil-PH', label: 'Filipino' },
];

const ALL_MODULES = [
  { key: 'remindme:finance', label: 'Finance' },
  { key: 'remindme:todo', label: 'To-Do List' },
  { key: 'remindme:habit', label: 'Habit Tracker' },
  { key: 'remindme:journal', label: 'Journal' },
  { key: 'remindme:gym', label: 'Gym & Workout' },
];

const Settings = {
  profile: null,
  appearance: null,

  loadData() {
    this.profile = Storage.get(SETTINGS_PROFILE_KEY) || { ...DEFAULT_PROFILE };
    this.appearance = Storage.get(SETTINGS_APPEARANCE_KEY) || { ...DEFAULT_APPEARANCE };
  },

  saveProfile() {
    Storage.set(SETTINGS_PROFILE_KEY, this.profile);
  },

  saveAppearance() {
    Storage.set(SETTINGS_APPEARANCE_KEY, this.appearance);
  },

  getCurrencyOption(code) {
    return CURRENCY_OPTIONS.find(c => c.code === code) || CURRENCY_OPTIONS[0];
  },

  /* ── Render ── */
  init() {
    this.loadData();
    this.render();
    this.bindEvents();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  render() {
    const el = document.getElementById('settings-content');
    if (!el) return;

    el.innerHTML = `
      <div class="settings-container">
        ${this.renderProfile()}
        ${this.renderAppearance()}
        ${this.renderSidebar()}
        ${this.renderData()}
        ${this.renderAbout()}
      </div>
    `;
  },

  renderProfile() {
    const initial = this.profile.username.charAt(0).toUpperCase();
    return `
      <div class="card settings-section-card" data-aos="fade-up" data-aos-delay="50">
        <h2 class="settings-section-title">Profil</h2>
        <div class="settings-profile-row">
          <div class="settings-avatar-preview">${initial}</div>
          <div class="settings-profile-fields">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="settings-username">Username</label>
                <input type="text" id="settings-username" class="input-field" value="${this.escHtml(this.profile.username)}">
              </div>
              <div class="form-group">
                <label class="form-label" for="settings-email">Email</label>
                <input type="email" id="settings-email" class="input-field" value="${this.escHtml(this.profile.email)}">
              </div>
            </div>
            <button class="btn btn-primary" id="save-profile-btn">Simpan Profil</button>
          </div>
        </div>
      </div>
    `;
  },

  renderAppearance() {
    const cur = this.appearance;
    const currOpt = this.getCurrencyOption(cur.currency);

    return `
      <div class="card settings-section-card" data-aos="fade-up" data-aos-delay="100">
        <h2 class="settings-section-title">Appearance</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="settings-currency">Mata Uang</label>
            <select id="settings-currency" class="input-field">
              ${CURRENCY_OPTIONS.map(c => `
                <option value="${c.code}" ${c.code === cur.currency ? 'selected' : ''}>
                  ${c.label}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="settings-locale">Bahasa / Locale</label>
            <select id="settings-locale" class="input-field">
              ${LOCALE_OPTIONS.map(l => `
                <option value="${l.code}" ${l.code === cur.locale ? 'selected' : ''}>
                  ${l.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        <p class="form-hint">Mata uang dan locale digunakan oleh modul Finance.</p>
        <button class="btn btn-primary" id="save-appearance-btn">Simpan Tampilan</button>
      </div>
    `;
  },

  renderSidebar() {
    const sidebarState = Storage.get('remindme:sidebar');
    const expanded = sidebarState ? sidebarState.expanded : true;

    return `
      <div class="card settings-section-card" data-aos="fade-up" data-aos-delay="150">
        <h2 class="settings-section-title">Sidebar</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Default state saat buka halaman</label>
            <div class="settings-toggle-row">
              <button class="btn ${expanded ? 'btn-primary' : 'btn-secondary'} sidebar-default-btn" data-state="expanded">Expand</button>
              <button class="btn ${!expanded ? 'btn-primary' : 'btn-secondary'} sidebar-default-btn" data-state="collapsed">Collapse</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderData() {
    return `
      <div class="card settings-section-card" data-aos="fade-up" data-aos-delay="200">
        <h2 class="settings-section-title">Data</h2>

        <div class="settings-subsection">
          <h3 class="settings-subsection-title">Export Data</h3>
          <p class="form-hint">Pilih modul yang ingin di-export:</p>
          <div class="settings-checklist">
            ${ALL_MODULES.map(m => `
              <label class="settings-checkbox-label">
                <input type="checkbox" class="settings-export-checkbox" value="${m.key}" checked>
                <span>${m.label}</span>
              </label>
            `).join('')}
          </div>
          <button class="btn btn-primary" id="export-btn">
            <i data-lucide="download" width="16" height="16"></i> Export Selected
          </button>
        </div>

        <div class="settings-divider"></div>

        <div class="settings-subsection">
          <h3 class="settings-subsection-title">Import Data</h3>
          <p class="form-hint">Upload file JSON hasil export untuk mengembalikan data.</p>
          <div style="position:relative">
            <input type="file" id="import-file-input" accept=".json" style="display:none">
            <button class="btn btn-secondary" id="import-btn">
              <i data-lucide="upload" width="16" height="16"></i> Pilih File
            </button>
          </div>
          <p id="import-status" class="form-hint" style="margin-top:var(--spacing-sm)"></p>
        </div>
      </div>
    `;
  },

  renderAbout() {
    return `
      <div class="card settings-section-card" data-aos="fade-up" data-aos-delay="250">
        <h2 class="settings-section-title">About</h2>
        <div class="settings-about-row">
          <div>
            <p class="settings-about-version">ProductivityRecord v1.0.0</p>
            <p class="form-hint">Personal productivity platform — pure frontend</p>
          </div>
          <a href="https://github.com/alfzilham/ProductivityRecord" target="_blank" rel="noopener" class="btn btn-secondary">
            <i data-lucide="github" width="16" height="16"></i> GitHub
          </a>
        </div>
      </div>
    `;
  },

  /* ── Helpers ── */
  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  /* ── Modal ── */
  showModal({ title, body, buttons }) {
    document.getElementById('modal-title').textContent = title || 'Konfirmasi';
    document.getElementById('modal-body').innerHTML = body || '';
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    (buttons || [{ label: 'Tutup', class: 'btn-secondary', action: () => this.hideModal() }]).forEach(b => {
      const btn = document.createElement('button');
      btn.className = `btn ${b.class || 'btn-secondary'}`;
      btn.textContent = b.label;
      btn.addEventListener('click', b.action);
      footer.appendChild(btn);
    });
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  /* ── Events ── */
  bindEvents() {
    if (this._bound) return;
    this._bound = true;

    document.addEventListener('click', (e) => {
      // Profile save
      if (e.target.id === 'save-profile-btn') {
        this.handleSaveProfile();
        return;
      }

      // Appearance save
      if (e.target.id === 'save-appearance-btn') {
        this.handleSaveAppearance();
        return;
      }

      // Sidebar default state
      if (e.target.classList.contains('sidebar-default-btn')) {
        document.querySelectorAll('.sidebar-default-btn').forEach(b => {
          b.className = `btn btn-secondary sidebar-default-btn`;
        });
        e.target.className = `btn btn-primary sidebar-default-btn`;
        const state = e.target.dataset.state === 'expanded';
        Storage.set('remindme:sidebar', { expanded: state });
        return;
      }

      // Export
      if (e.target.id === 'export-btn' || e.target.closest('#export-btn')) {
        this.handleExport();
        return;
      }

      // Import - trigger file input
      if (e.target.id === 'import-btn' || e.target.closest('#import-btn')) {
        document.getElementById('import-file-input').click();
        return;
      }

      // Modal overlay click (close)
      if (e.target.id === 'modal-overlay') {
        this.hideModal();
        return;
      }
    });

    // Import file selection
    document.addEventListener('change', (e) => {
      if (e.target.id === 'import-file-input') {
        this.handleImport(e.target);
        return;
      }
    });
  },

  handleSaveProfile() {
    const username = document.getElementById('settings-username').value.trim();
    const email = document.getElementById('settings-email').value.trim();
    if (!username) return;

    this.profile.username = username;
    this.profile.email = email;
    this.saveProfile();
    this.showModal({
      title: 'Tersimpan',
      body: '<p>Profil berhasil diperbarui.</p>',
      buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
    });
  },

  handleSaveAppearance() {
    const code = document.getElementById('settings-currency').value;
    const locale = document.getElementById('settings-locale').value;
    const opt = this.getCurrencyOption(code);

    this.appearance.currency = code;
    this.appearance.currencySymbol = opt.symbol;
    this.appearance.currencyDecimals = opt.decimals;
    this.appearance.locale = locale;
    this.saveAppearance();

    this.showModal({
      title: 'Tersimpan',
      body: '<p>Pengaturan tampilan berhasil diperbarui.</p>',
      buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
    });
  },

  handleExport() {
    const checked = document.querySelectorAll('.settings-export-checkbox:checked');
    if (checked.length === 0) {
      this.showModal({
        title: 'Tidak ada data',
        body: '<p>Pilih minimal satu modul untuk di-export.</p>',
        buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
      });
      return;
    }

    const data = {};
    checked.forEach(cb => {
      const val = Storage.get(cb.value);
      if (val) data[cb.value] = val;
    });

    const exportObj = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      data,
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-record-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  handleImport(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.data || typeof parsed.data !== 'object') {
          throw new Error('Format tidak valid: tidak ada field data');
        }

        // Backup dulu
        const backup = {};
        ALL_MODULES.forEach(m => {
          const val = Storage.get(m.key);
          if (val) backup[m.key] = val;
        });
        Storage.set('remindme:backup', backup);

        // Tampilkan modal konfirmasi
        const moduleList = Object.keys(parsed.data).join(', ');
        this.showModal({
          title: 'Import Data',
          body: `
            <p>Data berikut akan ditimpa:</p>
            <p style="font-size:var(--text-caption);color:var(--text-muted);margin-top:var(--spacing-sm)">${this.escHtml(moduleList)}</p>
            <p style="margin-top:var(--spacing-md)">Backup data existing sudah disimpan. Lanjutkan?</p>
          `,
          buttons: [
            { label: 'Batal', class: 'btn-secondary', action: () => {
              this.hideModal();
              fileInput.value = '';
            }},
            { label: 'Lanjutkan Import', class: 'btn-primary', action: () => {
              Object.entries(parsed.data).forEach(([key, val]) => {
                Storage.set(key, val);
              });
              this.hideModal();
              location.reload();
            }},
          ],
        });
      } catch (err) {
        this.showModal({
          title: 'Gagal Import',
          body: `<p>File tidak valid: ${err.message}</p>`,
          buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
        });
        fileInput.value = '';
      }
    };
    reader.readAsText(file);
  },
};

window.settingsInit = function () {
  Settings.init();
};
