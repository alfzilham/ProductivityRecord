const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: 'index.html' },
  { id: 'finance', label: 'Finance', icon: 'wallet', href: 'finance.html' },
  { id: 'todo', label: 'To-Do List', icon: 'list-checks', href: 'todo.html' },
  { id: 'habit', label: 'Habit Tracker', icon: 'repeat', href: 'habit.html' },
  { id: 'journal', label: 'Journal', icon: 'book-open', href: 'journal.html' },
  { id: 'gym', label: 'Gym & Workout', icon: 'dumbbell', href: 'gym.html' },
];

const SIDEBAR_STORAGE_KEY = 'remindme:sidebar';

function getSidebarProfile() {
  const p = Storage.get('remindme:profile');
  return p || { username: 'user', email: 'user@example.com' };
}

const Sidebar = {
  expanded: true,
  currentPage: '',
  searchQuery: '',
  searchResults: [],
  searchOverlayOpen: false,
  _searchTimer: null,

  loadState() {
    const state = Storage.get(SIDEBAR_STORAGE_KEY);
    this.expanded = state ? state.expanded : true;
  },

  saveState() {
    Storage.set(SIDEBAR_STORAGE_KEY, { expanded: this.expanded });
  },

  detectPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const match = NAV_ITEMS.find(item => item.href === path);
    this.currentPage = match ? match.id : 'dashboard';
  },

  toggle() {
    this.expanded = !this.expanded;
    this.saveState();
    this.inject();
    this.updateAppGrid();
  },

  updateAppGrid() {
    const app = document.getElementById('app');
    if (app) {
      app.classList.toggle('sidebar-expanded', this.expanded);
    }
  },

  search(query) {
    this.searchQuery = query.trim().toLowerCase();
    if (!this.searchQuery) {
      this.searchResults = [];
      this.searchOverlayOpen = false;
      this.injectSearchOverlay();
      return;
    }

    const results = [];

    const keys = ['remindme:finance', 'remindme:todo', 'remindme:habit', 'remindme:journal', 'remindme:gym'];
    const moduleNames = { 'remindme:finance': 'Finance', 'remindme:todo': 'To-Do', 'remindme:habit': 'Habit', 'remindme:journal': 'Journal', 'remindme:gym': 'Gym' };
    const moduleLinks = { 'remindme:finance': 'finance.html', 'remindme:todo': 'todo.html', 'remindme:habit': 'habit.html', 'remindme:journal': 'journal.html', 'remindme:gym': 'gym.html' };

    keys.forEach(key => {
      const data = Storage.get(key);
      if (!data) return;
      const moduleName = moduleNames[key];
      const moduleLink = moduleLinks[key];

      if (key === 'remindme:finance') {
        if (data.categories) {
          data.categories.forEach(cat => {
            if (cat.name.toLowerCase().includes(this.searchQuery)) {
              results.push({ module: moduleName, text: cat.name, href: moduleLink, type: 'Kategori' });
            }
          });
        }
        if (data.transactions) {
          data.transactions.forEach(t => {
            if ((t.description || '').toLowerCase().includes(this.searchQuery)) {
              const cat = data.categories ? data.categories.find(c => c.id === t.categoryId) : null;
              results.push({ module: moduleName, text: t.description, href: moduleLink, type: cat ? cat.name : 'Transaksi' });
            }
          });
        }
      }

      if (key === 'remindme:todo') {
        if (data.tasks) {
          data.tasks.forEach(t => {
            if (t.title.toLowerCase().includes(this.searchQuery) || (t.description || '').toLowerCase().includes(this.searchQuery)) {
              results.push({ module: moduleName, text: t.title, href: moduleLink, type: 'Task' });
            }
          });
        }
        if (data.categories) {
          data.categories.forEach(cat => {
            if (cat.name.toLowerCase().includes(this.searchQuery)) {
              results.push({ module: moduleName, text: cat.name, href: moduleLink, type: 'Kategori' });
            }
          });
        }
      }

      if (key === 'remindme:habit') {
        if (data.habits) {
          data.habits.forEach(h => {
            if (h.name.toLowerCase().includes(this.searchQuery) || (h.description || '').toLowerCase().includes(this.searchQuery)) {
              results.push({ module: moduleName, text: h.name, href: moduleLink, type: 'Habit' });
            }
          });
        }
      }

      if (key === 'remindme:journal') {
        if (data.entries) {
          data.entries.forEach(e => {
            if ((e.title || '').toLowerCase().includes(this.searchQuery) || (e.content || '').toLowerCase().includes(this.searchQuery)) {
              results.push({ module: moduleName, text: e.title || 'Tanpa judul', href: moduleLink, type: 'Entri' });
            }
          });
        }
      }

      if (key === 'remindme:gym') {
        if (data.sessions) {
          data.sessions.forEach(s => {
            if ((s.note || '').toLowerCase().includes(this.searchQuery)) {
              results.push({ module: moduleName, text: s.note || s.date, href: moduleLink, type: 'Sesi' });
            }
            s.exercises.forEach(ex => {
              if (ex.name.toLowerCase().includes(this.searchQuery)) {
                results.push({ module: moduleName, text: ex.name, href: moduleLink, type: 'Latihan' });
              }
            });
          });
        }
      }
    });

    this.searchResults = results.slice(0, 20);
    this.searchOverlayOpen = results.length > 0;
    this.injectSearchOverlay();
  },

  closeSearchOverlay() {
    this.searchOverlayOpen = false;
    this.searchResults = [];
    this.injectSearchOverlay();
  },

  /* ── Render ── */

  renderSidebar() {
    return this.expanded ? this.renderExpanded() : this.renderCollapsed();
  },

  renderExpanded() {
    return `
      <div class="sidebar-inner">
        <div class="sidebar-logo-section">
          <div class="sidebar-logo-main" id="sidebar-logo">
            <img src="assets/image/logo/logo.png" alt="PR" class="sidebar-logo-img">
            <div class="sidebar-brand">
              <span class="sidebar-brand-name">Productivity</span>
              <span class="sidebar-brand-subtitle">Record</span>
            </div>
          </div>
          <div class="sidebar-logo-toggle" id="sidebar-toggle" title="Collapse sidebar">
            <i data-lucide="chevron-left" width="14" height="14"></i>
          </div>
        </div>

        <div class="sidebar-search-wrapper">
          <i data-lucide="search" class="sidebar-search-icon" width="16" height="16"></i>
          <input type="text" class="sidebar-search-input" id="sidebar-search-input" placeholder="Cari..." value="${this.escHtml(this.searchQuery)}" autocomplete="off">
          <div id="sidebar-search-overlay"></div>
        </div>

        <nav class="sidebar-nav">
          ${NAV_ITEMS.map(item => `
            <a href="${item.href}" class="sidebar-item ${this.currentPage === item.id ? 'active' : ''}" title="${item.label}">
              <span class="sidebar-item-icon"><i data-lucide="${item.icon}" width="24" height="24"></i></span>
              <span class="sidebar-item-label">${item.label}</span>
            </a>
          `).join('')}
        </nav>
        ${this.renderUserSection()}
      </div>
    `;
  },

  renderCollapsed() {
    return `
      <div class="sidebar-inner">
        <div class="sidebar-logo-section" style="justify-content:center">
          <div class="sidebar-logo-main" id="sidebar-logo">
            <img src="assets/image/logo/logo.png" alt="PR" class="sidebar-logo-img">
          </div>
        </div>

        <div class="sidebar-search-wrapper">
          <i data-lucide="search" class="sidebar-search-icon" width="24" height="24" id="sidebar-search-icon-btn"></i>
          <div id="sidebar-search-overlay"></div>
        </div>

        <nav class="sidebar-nav">
          ${NAV_ITEMS.map(item => `
            <a href="${item.href}" class="sidebar-item ${this.currentPage === item.id ? 'active' : ''}" title="${item.label}" data-tooltip="${item.label}">
              <span class="sidebar-item-icon"><i data-lucide="${item.icon}" width="24" height="24"></i></span>
              <span class="sidebar-item-label">${item.label}</span>
            </a>
          `).join('')}
        </nav>
        ${this.renderUserSection()}
      </div>
    `;
  },

  renderUserSection() {
    const p = getSidebarProfile();
    const initial = p.username.charAt(0).toUpperCase();
    return `
      <div class="sidebar-user-section">
        <div class="sidebar-user-main" id="sidebar-user-avatar" title="Pengaturan">
          <div class="sidebar-user-avatar">${initial}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">${this.escHtml(p.username)}</span>
            <span class="sidebar-user-email">${this.escHtml(p.email)}</span>
          </div>
        </div>
        <div class="sidebar-user-settings" id="sidebar-user-settings" title="Pengaturan">
          <i data-lucide="more-vertical" width="18" height="18"></i>
        </div>
      </div>
    `;
  },

  renderBottomNav() {
    return `
      <nav id="bottom-nav-inner">
        ${NAV_ITEMS.map(item => `
          <a href="${item.href}" class="bottom-nav-item ${this.currentPage === item.id ? 'active' : ''}">
            <i data-lucide="${item.icon}" class="bottom-nav-icon" width="20" height="20"></i>
            <span class="bottom-nav-label">${item.label.split(' ')[0]}</span>
          </a>
        `).join('')}
      </nav>
    `;
  },

  injectSearchOverlay() {
    const el = document.getElementById('sidebar-search-overlay');
    if (!el) return;

    if (!this.searchOverlayOpen || this.searchResults.length === 0) {
      el.innerHTML = '';
      return;
    }

    el.innerHTML = `
      <div class="sidebar-search-overlay">
        ${this.searchResults.map(r => `
          <a href="${r.href}" class="search-overlay-item">
            <span class="search-overlay-module">${this.escHtml(r.module)}</span>
            <span class="search-overlay-title">${this.escHtml(r.text)}</span>
          </a>
        `).join('')}
      </div>
    `;
  },

  /* ── Init ── */

  inject() {
    this.loadState();
    this.detectPage();

    const sidebarEl = document.getElementById('sidebar');
    const bottomNavEl = document.getElementById('bottom-nav');

    if (sidebarEl) {
      sidebarEl.innerHTML = this.renderSidebar();
      sidebarEl.classList.toggle('is-expanded', this.expanded);
    }
    if (bottomNavEl) {
      bottomNavEl.innerHTML = this.renderBottomNav();
    }

    this.updateAppGrid();
    this.bindSidebarEvents();

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  },

  /* ── Events ── */

  _eventsBound: false,

  bindSidebarEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    document.addEventListener('click', (e) => {
      if (e.target.closest('#sidebar-toggle')) {
        this.toggle();
        return;
      }

      if (e.target.closest('#sidebar-logo')) {
        if (!this.expanded) {
          this.toggle();
        }
        return;
      }

      if (e.target.closest('#sidebar-search-icon-btn') || e.target.closest('.sidebar-search-icon')) {
        if (!this.expanded) {
          this.toggle();
          setTimeout(() => {
            const input = document.getElementById('sidebar-search-input');
            if (input) input.focus();
          }, 300);
        }
        return;
      }

      if (e.target.closest('#sidebar-user-settings') || e.target.closest('.sidebar-user-settings')) {
        if (typeof Settings !== 'undefined') Settings.toggle();
        return;
      }

      if (e.target.closest('#sidebar-user-avatar')) {
        if (!this.expanded) {
          if (typeof Settings !== 'undefined') Settings.toggle();
        }
        return;
      }

      if (!e.target.closest('.sidebar-search-wrapper') && !e.target.closest('.sidebar-search-overlay')) {
        this.closeSearchOverlay();
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'sidebar-search-input') {
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
          this.search(e.target.value);
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 300);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSearchOverlay();
      }
    });
  },

  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
