const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: 'index.html' },
  { id: 'finance', label: 'Finance', icon: 'wallet', href: 'finance.html' },
  { id: 'todo', label: 'To-Do', icon: 'list-checks', href: 'todo.html' },
  { id: 'habit', label: 'Habit', icon: 'repeat', href: 'habit.html' },
  { id: 'journal', label: 'Journal', icon: 'book-open', href: 'journal.html' },
  { id: 'gym', label: 'Gym', icon: 'dumbbell', href: 'gym.html' },
];

const Sidebar = {
  currentPage: '',

  detectPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const match = NAV_ITEMS.find(item => item.href === path);
    this.currentPage = match ? match.id : 'dashboard';
  },

  renderSidebar() {
    return `
      <nav id="sidebar-nav">
        ${NAV_ITEMS.map(item => `
          <a
            href="${item.href}"
            class="sidebar-item ${this.currentPage === item.id ? 'active' : ''}"
            title="${item.label}"
            data-tooltip="${item.label}"
          >
            <i data-lucide="${item.icon}" class="sidebar-icon"></i>
            <span class="sidebar-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>
    `;
  },

  renderBottomNav() {
    return `
      <nav id="bottom-nav-inner">
        ${NAV_ITEMS.map(item => `
          <a
            href="${item.href}"
            class="bottom-nav-item ${this.currentPage === item.id ? 'active' : ''}"
          >
            <i data-lucide="${item.icon}" class="bottom-nav-icon"></i>
            <span class="bottom-nav-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>
    `;
  },

  inject() {
    this.detectPage();

    const sidebarEl = document.getElementById('sidebar');
    const bottomNavEl = document.getElementById('bottom-nav');

    if (sidebarEl) sidebarEl.innerHTML = this.renderSidebar();
    if (bottomNavEl) bottomNavEl.innerHTML = this.renderBottomNav();
  },
};
