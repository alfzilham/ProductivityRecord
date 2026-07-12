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

const SETTINGS_NOTIFICATION_KEY = 'remindme:notification';

const DEFAULT_NOTIFICATION = {
  taskDeadlineEnabled: true,
  taskDeadlineHours: 24,
  habitReminderEnabled: false,
  habitReminderTime: '20:00',
  browserNotifEnabled: false,
  browserNotifEvents: ['task_deadline'],
};

const ALL_MODULES = [
  { key: 'remindme:finance', label: 'Finance' },
  { key: 'remindme:todo', label: 'To-Do List' },
  { key: 'remindme:habit', label: 'Habit Tracker' },
  { key: 'remindme:journal', label: 'Journal' },
  { key: 'remindme:gym', label: 'Gym & Workout' },
];

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profil', icon: 'user' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'notification', label: 'Notification', icon: 'bell' },
  { id: 'privacy', label: 'Privacy', icon: 'shield' },
  { id: 'about', label: 'About', icon: 'info' },
];

const Settings = {
  visible: false,
  activeTab: 'profile',
  profile: null,
  appearance: null,
  notification: null,

  loadData() {
    this.profile = Storage.get(SETTINGS_PROFILE_KEY) || { ...DEFAULT_PROFILE };
    this.appearance = Storage.get(SETTINGS_APPEARANCE_KEY) || { ...DEFAULT_APPEARANCE };
    this.notification = Storage.get(SETTINGS_NOTIFICATION_KEY) || { ...DEFAULT_NOTIFICATION };
  },

  saveNotification() {
    Storage.set(SETTINGS_NOTIFICATION_KEY, this.notification);
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

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  },

  show() {
    this.loadData();
    this.visible = true;
    this.activeTab = 'profile';
    this.renderOverlay();
    this.renderPanel();
    this.bindPanelEvents();
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      const panel = document.getElementById('settings-panel');
      const overlay = document.getElementById('settings-overlay');
      if (panel) panel.classList.add('open');
      if (overlay) overlay.classList.add('open');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  },

  hide() {
    this.visible = false;
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');

    setTimeout(() => {
      const container = document.getElementById('settings-container');
      if (container) container.remove();
      const ov = document.getElementById('settings-overlay');
      if (ov) ov.remove();
      document.body.style.overflow = '';
    }, 350);
  },

  renderOverlay() {
    const existing = document.getElementById('settings-overlay');
    if (existing) return;

    const div = document.createElement('div');
    div.id = 'settings-overlay';
    div.className = 'settings-overlay';
    document.body.appendChild(div);
  },

  renderPanel() {
    let container = document.getElementById('settings-container');
    if (container) {
      container.innerHTML = this.buildPanelContent();
      return;
    }

    container = document.createElement('div');
    container.id = 'settings-container';
    container.innerHTML = `
      <aside id="settings-panel" class="settings-panel">
        <div class="settings-panel-inner">
          <div class="settings-panel-header">
            <h2 class="settings-panel-title">Pengaturan</h2>
            <button id="settings-close-btn" class="settings-close-btn" title="Tutup">
              <i data-lucide="x" width="20" height="20"></i>
            </button>
          </div>
          <div class="settings-panel-body" id="settings-panel-body">
            ${this.buildPanelContent()}
          </div>
        </div>
      </aside>
    `;
    document.body.appendChild(container);
  },

  buildPanelContent() {
    return `
      <div class="settings-tab-sidebar">
        ${SETTINGS_TABS.map(t => `
          <button class="settings-tab-btn ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
            <i data-lucide="${t.icon}" width="16" height="16"></i>
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="settings-tab-content" id="settings-tab-content">
        ${this.renderActiveContent()}
      </div>
    `;
  },

  renderActiveContent() {
    switch (this.activeTab) {
      case 'profile': return this.renderProfile();
      case 'appearance': return this.renderAppearance();
      case 'notification': return this.renderNotification();
      case 'privacy': return this.renderPrivacy();
      case 'about': return this.renderAbout();
      default: return this.renderProfile();
    }
  },

  switchTab(id) {
    this.activeTab = id;
    const content = document.getElementById('settings-tab-content');
    if (content) {
      content.innerHTML = this.renderActiveContent();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    document.querySelectorAll('.settings-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === id);
    });
  },

  renderProfile() {
    const initial = this.profile.username.charAt(0).toUpperCase();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Profil</h3>
        <div class="settings-profile-row">
          <div class="settings-avatar-sm">${initial}</div>
          <div class="settings-profile-fields">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="settings-username">Username</label>
                <input type="text" id="settings-username" class="input-field" value="${this.escHtml(this.profile.username)}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="settings-email">Email</label>
                <input type="email" id="settings-email" class="input-field" value="${this.escHtml(this.profile.email)}">
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="save-profile-btn">Simpan</button>
          </div>
        </div>
      </div>
    `;
  },

  renderAppearance() {
    const cur = this.appearance;
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Appearance</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="settings-currency">Mata Uang</label>
            <select id="settings-currency" class="input-field">
              ${CURRENCY_OPTIONS.map(c => `
                <option value="${c.code}" ${c.code === cur.currency ? 'selected' : ''}>${c.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="settings-locale">Bahasa / Locale</label>
            <select id="settings-locale" class="input-field">
              ${LOCALE_OPTIONS.map(l => `
                <option value="${l.code}" ${l.code === cur.locale ? 'selected' : ''}>${l.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <p class="form-hint">Mata uang dan locale digunakan oleh modul Finance.</p>
        <button class="btn btn-primary btn-sm" id="save-appearance-btn">Simpan</button>
      </div>
    `;
  },

  renderNotification() {
    const n = this.notification;
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Notification</h3>

        <div class="settings-notif-group">
          <div class="settings-notif-row">
            <span class="toggle-label">Pengingat deadline task</span>
            <label class="toggle-switch">
              <input type="checkbox" class="settings-notif-cb" data-key="taskDeadlineEnabled" ${n.taskDeadlineEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-notif-sub ${n.taskDeadlineEnabled ? '' : 'disabled'}">
            <span class="settings-notif-hint">Tampilkan peringatan</span>
            <div class="select-wrapper">
              <select data-key="taskDeadlineHours" ${n.taskDeadlineEnabled ? '' : 'disabled'}>
                <option value="24" ${n.taskDeadlineHours === 24 ? 'selected' : ''}>24 jam sebelumnya</option>
                <option value="12" ${n.taskDeadlineHours === 12 ? 'selected' : ''}>12 jam sebelumnya</option>
                <option value="6" ${n.taskDeadlineHours === 6 ? 'selected' : ''}>6 jam sebelumnya</option>
                <option value="1" ${n.taskDeadlineHours === 1 ? 'selected' : ''}>1 jam sebelumnya</option>
              </select>
              <i data-lucide="chevron-down" class="select-arrow" width="14" height="14"></i>
            </div>
          </div>
        </div>

        <div class="settings-notif-group">
          <div class="settings-notif-row">
            <span class="toggle-label">Pengingat check-in habit</span>
            <label class="toggle-switch">
              <input type="checkbox" class="settings-notif-cb" data-key="habitReminderEnabled" ${n.habitReminderEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-notif-sub ${n.habitReminderEnabled ? '' : 'disabled'}">
            <span class="settings-notif-hint">Waktu pengingat</span>
            <input type="time" class="settings-notif-time" data-key="habitReminderTime" value="${n.habitReminderTime}" ${n.habitReminderEnabled ? '' : 'disabled'}>
          </div>
        </div>

        <div class="settings-notif-group">
          <div class="settings-notif-row">
            <span class="toggle-label">Notifikasi browser</span>
            <label class="toggle-switch">
              <input type="checkbox" class="settings-notif-cb" data-key="browserNotifEnabled" ${n.browserNotifEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-notif-sub ${n.browserNotifEnabled ? '' : 'disabled'}">
            <span class="settings-notif-hint">Event notifikasi</span>
            <label class="settings-notif-check-event">
              <input type="checkbox" class="settings-notif-event-cb" value="task_deadline" ${n.browserNotifEvents.includes('task_deadline') ? 'checked' : ''} ${n.browserNotifEnabled ? '' : 'disabled'}>
              <span class="check-mark"></span>
              Deadline task
            </label>
            <label class="settings-notif-check-event">
              <input type="checkbox" class="settings-notif-event-cb" value="habit_reminder" ${n.browserNotifEvents.includes('habit_reminder') ? 'checked' : ''} ${n.browserNotifEnabled ? '' : 'disabled'}>
              <span class="check-mark"></span>
              Habit reminder
            </label>
            <button class="btn btn-secondary btn-sm" id="test-notif-btn" style="margin-top:var(--spacing-sm)" ${n.browserNotifEnabled ? '' : 'disabled'}>
              <i data-lucide="volume-2" width="14" height="14"></i> Test Notifikasi
            </button>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" id="save-notification-btn">Simpan Pengaturan</button>
      </div>
    `;
  },

  renderPrivacy() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Privacy</h3>

        <h4 class="settings-subsection-title">
          <i data-lucide="lock" width="14" height="14" style="margin-right:4px"></i>Bagaimana data Anda dilindungi
        </h4>
        <ul class="settings-privacy-list">
          <li>Semua data Anda disimpan di localStorage browser milik Anda sendiri — tidak pernah dikirim ke server mana pun</li>
          <li>Aplikasi ini tidak memiliki backend, database eksternal, atau sistem autentikasi</li>
          <li>Anda bisa menghapus data kapan saja melalui Clear Site Data di pengaturan browser</li>
          <li>Fitur Export/Import tersedia untuk backup manual data Anda</li>
        </ul>

        <h4 class="settings-subsection-title">
          <i data-lucide="eye-off" width="14" height="14" style="margin-right:4px"></i>Bagaimana data Anda digunakan
        </h4>
        <ul class="settings-privacy-list">
          <li>ProductivityRecord tidak mengumpulkan, menjual, atau membagikan data Anda ke pihak ketiga</li>
          <li>Tidak ada pelatihan AI, tidak ada analitik, tidak ada email marketing</li>
          <li>Aplikasi berjalan 100% secara lokal di browser Anda</li>
          <li>Anda memiliki kendali penuh atas data Anda setiap saat</li>
        </ul>

        <div class="settings-section-divider"></div>

        <h4 class="settings-subsection-title">Export</h4>
        <p class="form-hint">Pilih modul yang ingin di-export:</p>
        <div class="settings-checklist">
          ${ALL_MODULES.map(m => `
            <label class="settings-checkbox-label">
              <input type="checkbox" class="settings-export-checkbox" value="${m.key}" checked>
              <span>${m.label}</span>
            </label>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-sm" id="export-btn">
          <i data-lucide="download" width="14" height="14"></i> Export Selected
        </button>

        <div class="settings-section-divider"></div>

        <h4 class="settings-subsection-title">Import</h4>
        <p class="form-hint">Upload file JSON hasil export.</p>
        <input type="file" id="import-file-input" accept=".json" style="display:none">
        <button class="btn btn-secondary btn-sm" id="import-btn">
          <i data-lucide="upload" width="14" height="14"></i> Pilih File
        </button>
      </div>
    `;
  },

  renderAbout() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">About</h3>
        <p style="font-size:var(--text-h3);font-weight:var(--fw-bold);margin-bottom:var(--spacing-sm)">ProductivityRecord <span style="font-weight:var(--fw-regular);color:var(--text-muted)">v1.0.0</span></p>
        <p style="font-size:var(--text-body);color:var(--text-secondary);line-height:1.7;margin-bottom:var(--spacing-lg)">
          Aplikasi pencatatan produktivitas harian yang menyatukan keuangan, tugas, kebiasaan, jurnal, dan olahraga dalam satu tempat — tanpa ribet, tanpa login, tanpa server.
        </p>

        <h4 style="font-size:var(--text-body);font-weight:var(--fw-semibold);margin-bottom:var(--spacing-sm);color:var(--text-primary)">Apa yang bisa dilakukan?</h4>
        <ul style="font-size:var(--text-body);color:var(--text-secondary);line-height:2;margin-bottom:var(--spacing-lg);padding-left:var(--spacing-md);list-style:disc">
          <li>Catat pemasukan & pengeluaran dengan rekap harian/minggu/bulan</li>
          <li>Kelola tugas dengan prioritas, deadline, sub-task, dan recurring</li>
          <li>Lacak kebiasaan dengan streak dan kalender mini</li>
          <li>Tulis jurnal harian dengan mood tag</li>
          <li>Log sesi gym dengan progress chart</li>
          <li>Lihat ringkasan semua data di Dashboard</li>
        </ul>

        <h4 style="font-size:var(--text-body);font-weight:var(--fw-semibold);margin-bottom:var(--spacing-sm);color:var(--text-primary)">Manfaat</h4>
        <ul style="font-size:var(--text-body);color:var(--text-secondary);line-height:2;margin-bottom:var(--spacing-lg);padding-left:var(--spacing-md);list-style:disc">
          <li>Semua data tersimpan aman di browser Anda sendiri</li>
          <li>Bisa langsung dipakai — buka browser, catat, selesai</li>
          <li>Tampilan dark theme yang nyaman di mata</li>
          <li>Gratis, ringan, tanpa iklan</li>
        </ul>

        <a href="https://github.com/alfzilham/ProductivityRecord" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="margin-bottom:var(--spacing-sm)">
          <i data-lucide="external-link" width="14" height="14"></i> GitHub Repository
        </a>
        <p style="font-size:var(--text-caption);color:var(--text-muted)">Dibuat oleh Alfiz Ilham</p>
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
    let modal = document.getElementById('settings-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'settings-modal';
      modal.className = 'settings-modal hidden';
      modal.innerHTML = `
        <div class="settings-modal-box">
          <div class="settings-modal-header">
            <h4 id="settings-modal-title">Konfirmasi</h4>
          </div>
          <div class="settings-modal-body" id="settings-modal-body"></div>
          <div class="settings-modal-footer" id="settings-modal-footer"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('settings-modal-title').textContent = title || 'Konfirmasi';
    document.getElementById('settings-modal-body').innerHTML = body || '';
    const footer = document.getElementById('settings-modal-footer');
    footer.innerHTML = '';
    (buttons || [{ label: 'Tutup', class: 'btn-secondary', action: () => this.hideModal() }]).forEach(b => {
      const btn = document.createElement('button');
      btn.className = `btn ${b.class || 'btn-secondary'} btn-sm`;
      btn.textContent = b.label;
      btn.addEventListener('click', b.action);
      footer.appendChild(btn);
    });
    modal.classList.remove('hidden');

    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hideModal();
    });
  },

  hideModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
  },

  /* ── Events ── */
  _eventsBound: false,
  panelEventsBound: false,

  bindPanelEvents() {
    if (this.panelEventsBound && document.getElementById('settings-panel')) return;
    this.panelEventsBound = true;

    document.addEventListener('click', (e) => {
      if (!this.visible) return;

      if (e.target.closest('.settings-tab-btn')) {
        const tab = e.target.closest('.settings-tab-btn');
        this.switchTab(tab.dataset.tab);
        return;
      }

      if (e.target.closest('#settings-close-btn') || e.target.closest('.settings-close-btn')) {
        this.hide();
        return;
      }

      if (e.target.closest('#save-profile-btn')) {
        this.handleSaveProfile();
        return;
      }

      if (e.target.closest('#save-appearance-btn')) {
        this.handleSaveAppearance();
        return;
      }

      if (e.target.closest('#save-notification-btn')) {
        this.handleSaveNotification();
        return;
      }

      if (e.target.closest('#test-notif-btn')) {
        this.handleTestNotification();
        return;
      }

      if (e.target.classList.contains('settings-notif-cb')) {
        const sub = e.target.closest('.settings-notif-group').querySelector('.settings-notif-sub');
        const inputs = sub.querySelectorAll('select, input, button');
        inputs.forEach(inp => inp.disabled = !e.target.checked);
        sub.classList.toggle('disabled', !e.target.checked);
        return;
      }

      if (e.target.classList.contains('sidebar-default-btn')) {
        document.querySelectorAll('.sidebar-default-btn').forEach(b => {
          b.className = `btn btn-secondary btn-sm sidebar-default-btn`;
        });
        e.target.className = `btn btn-primary btn-sm sidebar-default-btn`;
        Storage.set('remindme:sidebar', { expanded: e.target.dataset.state === 'expanded' });
        return;
      }

      if (e.target.closest('#export-btn')) {
        this.handleExport();
        return;
      }

      if (e.target.closest('#import-btn')) {
        document.getElementById('import-file-input').click();
        return;
      }

      // Close when clicking overlay (outside panel)
      if (e.target.id === 'settings-overlay') {
        this.hide();
        return;
      }

      // Modal overlay
      if (e.target.closest('#settings-modal')) {
        // handled by modal's own click listener
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'import-file-input') {
        this.handleImport(e.target);
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

  handleSaveNotification() {
    const n = this.notification;
    n.taskDeadlineEnabled = document.querySelector('.settings-notif-checkbox[data-key="taskDeadlineEnabled"]')?.checked || false;
    n.habitReminderEnabled = document.querySelector('.settings-notif-checkbox[data-key="habitReminderEnabled"]')?.checked || false;
    n.browserNotifEnabled = document.querySelector('.settings-notif-checkbox[data-key="browserNotifEnabled"]')?.checked || false;
    n.taskDeadlineHours = parseInt(document.querySelector('.settings-notif-select[data-key="taskDeadlineHours"]')?.value) || 24;
    n.habitReminderTime = document.querySelector('.settings-notif-time[data-key="habitReminderTime"]')?.value || '20:00';
    const events = [];
    document.querySelectorAll('.settings-notif-event-cb:checked').forEach(cb => events.push(cb.value));
    n.browserNotifEvents = events;
    this.saveNotification();
    this.showModal({
      title: 'Tersimpan',
      body: '<p>Pengaturan notifikasi berhasil diperbarui.</p>',
      buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
    });
  },

  handleTestNotification() {
    if (!('Notification' in window)) {
      this.showModal({
        title: 'Tidak Didukung',
        body: '<p>Browser Anda tidak mendukung notifikasi sistem.</p>',
        buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
      });
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('ProductivityRecord', { body: 'Notifikasi berfungsi dengan baik!' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification('ProductivityRecord', { body: 'Notifikasi berhasil diaktifkan!' });
          this.showModal({
            title: 'Berhasil',
            body: '<p>Notifikasi browser telah diaktifkan.</p>',
            buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
          });
        }
      });
    } else {
      this.showModal({
        title: 'Diblokir',
        body: '<p>Notifikasi telah diblokir oleh browser. Ubah di pengaturan situs browser Anda.</p>',
        buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
      });
    }
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
    const exportObj = { exportedAt: new Date().toISOString(), version: '1.0.0', data };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-record-${new Date().toISOString().slice(0, 10)}.json`;
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
        if (!parsed.data || typeof parsed.data !== 'object') throw new Error('Format tidak valid');

        const backup = {};
        ALL_MODULES.forEach(m => {
          const val = Storage.get(m.key);
          if (val) backup[m.key] = val;
        });
        Storage.set('remindme:backup', backup);

        const moduleList = Object.keys(parsed.data).join(', ');
        this.showModal({
          title: 'Import Data',
          body: `
            <p>Data berikut akan ditimpa:</p>
            <p style="font-size:var(--text-caption);color:var(--text-muted);margin:var(--spacing-sm) 0">${this.escHtml(moduleList)}</p>
            <p>Backup sudah dibuat. Lanjutkan?</p>
          `,
          buttons: [
            { label: 'Batal', class: 'btn-secondary', action: () => { this.hideModal(); fileInput.value = ''; }},
            { label: 'Import', class: 'btn-primary', action: () => {
              Object.entries(parsed.data).forEach(([key, val]) => Storage.set(key, val));
              this.hideModal();
              location.reload();
            }},
          ],
        });
      } catch (err) {
        this.showModal({
          title: 'Gagal',
          body: `<p>File tidak valid: ${err.message}</p>`,
          buttons: [{ label: 'OK', class: 'btn-primary', action: () => this.hideModal() }],
        });
        fileInput.value = '';
      }
    };
    reader.readAsText(file);
  },
};
