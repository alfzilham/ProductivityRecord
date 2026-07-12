const Dashboard = {
  finance: null,
  todo: null,
  habit: null,
  journal: null,
  gym: null,

  loadAll() {
    this.finance = Storage.get('remindme:finance');
    this.todo = Storage.get('remindme:todo');
    this.habit = Storage.get('remindme:habit');
    this.journal = Storage.get('remindme:journal');
    this.gym = Storage.get('remindme:gym');
  },

  getToday() {
    return new Date().toISOString().slice(0, 10);
  },

  getCalendarWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      start: mon.toISOString().slice(0, 10),
      end: sun.toISOString().slice(0, 10),
    };
  },

  getMonthRange(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return {
      start,
      end: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  },

  formatCurrency(amount, settings) {
    if (!settings) return `Rp ${amount || 0}`;
    try {
      const formatted = new Intl.NumberFormat(settings.currencyLocale || 'id-ID', {
        style: 'decimal',
        minimumFractionDigits: settings.currencyDecimals || 0,
        maximumFractionDigits: settings.currencyDecimals || 0,
      }).format(amount || 0);
      return `${settings.currencySymbol || 'Rp'} ${formatted}`;
    } catch {
      return `${settings.currencySymbol || 'Rp'} ${amount || 0}`;
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  },

  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  /* ── Data gathering ── */
  getFinanceSummary() {
    if (!this.finance || !this.finance.transactions) {
      return { balance: 0, today: 0, week: 0, month: 0 };
    }

    const txns = this.finance.transactions;
    const today = this.getToday();
    const week = this.getCalendarWeek(today);
    const month = this.getMonthRange(today);

    const calc = (txList) => {
      let income = 0, expense = 0;
      txList.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      });
      return { income, expense, total: income - expense };
    };

    const all = calc(txns);
    const todaySum = calc(txns.filter(t => t.date === today));
    const weekSum = calc(txns.filter(t => t.date >= week.start && t.date <= week.end));
    const monthSum = calc(txns.filter(t => t.date >= month.start && t.date <= month.end));

    return {
      balance: all.total,
      today: todaySum.total,
      week: weekSum.total,
      month: monthSum.total,
      settings: this.finance.settings,
    };
  },

  getTodoSummary() {
    if (!this.todo || !this.todo.tasks) {
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }

    const tasks = this.todo.tasks;
    const today = this.getToday();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed).length;
    const overdue = tasks.filter(t => !t.completed && t.deadlineDate && t.deadlineDate < today).length;

    return { total, completed, pending, overdue };
  },

  getHabitSummary() {
    if (!this.habit || !this.habit.habits) {
      return { total: 0, topStreak: 0, topHabit: null, todayChecked: 0 };
    }

    const habits = this.habit.habits;
    const today = this.getToday();

    let bestStreak = 0;
    let bestHabit = null;
    let todayChecked = 0;

    habits.forEach(h => {
      const entries = this.habit.entries.filter(e => e.habitId === h.id && e.completed);
      const entryToday = entries.find(e => e.date === today);
      if (entryToday) todayChecked++;

      const dates = entries.map(e => e.date).sort().reverse();
      let current = 1;
      if (dates[0] !== today && dates[0] !== this.yesterday()) current = 0;
      if (current > 0) {
        for (let i = 1; i < dates.length; i++) {
          const prev = new Date(dates[i - 1] + 'T00:00:00');
          const curr = new Date(dates[i] + 'T00:00:00');
          const diff = (prev - curr) / (1000 * 60 * 60 * 24);
          if (diff === 1) current++;
          else break;
        }
      }

      let longest = current, temp = 1;
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1] + 'T00:00:00');
        const curr = new Date(dates[i] + 'T00:00:00');
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diff === 1) { temp++; longest = Math.max(longest, temp); }
        else temp = 1;
      }

      if (longest > bestStreak) {
        bestStreak = longest;
        bestHabit = h.name;
      }
    });

    return { total: habits.length, topStreak: bestStreak, topHabit: bestHabit, todayChecked };
  },

  yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  },

  getJournalSummary() {
    if (!this.journal || !this.journal.entries) {
      return { entries: [] };
    }

    const entries = [...this.journal.entries]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);

    return { entries };
  },

  getGymSummary() {
    if (!this.gym || !this.gym.sessions) {
      return { lastSession: null, monthCount: 0 };
    }

    const sessions = [...this.gym.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const today = this.getToday();
    const month = this.getMonthRange(today);
    const monthCount = sessions.filter(s => s.date >= month.start && s.date <= month.end).length;

    return { lastSession: sessions[0] || null, monthCount };
  },

  getMood(journalData, moodId) {
    if (!journalData) return null;
    const allMoods = [...(journalData.defaultMoods || []), ...(journalData.customMoods || [])];
    return allMoods.find(m => m.id === moodId) || null;
  },

  /* ── Render ── */
  init() {
    this.loadAll();
    this.render();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  render() {
    const el = document.getElementById('dashboard-content');
    if (!el) return;

    const finance = this.getFinanceSummary();
    const todo = this.getTodoSummary();
    const habit = this.getHabitSummary();
    const journal = this.getJournalSummary();
    const gym = this.getGymSummary();

    el.innerHTML = `
      <div class="dash-grid">
        ${this.renderFinanceCard(finance)}
        ${this.renderTodoCard(todo)}
        ${this.renderHabitCard(habit)}
        ${this.renderGymCard(gym)}
        ${this.renderJournalCard(journal)}
      </div>
    `;

    if (typeof AOS !== 'undefined') AOS.refresh();
  },

  renderFinanceCard(data) {
    const arrow = data.balance >= 0 ? 'trending-up' : 'trending-down';
    const cls = data.balance >= 0 ? 'text-success' : 'text-danger';

    return `
      <div class="card dash-card" data-aos="fade-up" data-aos-delay="50">
        <div class="dash-card-header">
          <div class="dash-card-icon">
            <i data-lucide="wallet" width="20" height="20"></i>
          </div>
          <span class="dash-card-module">Finance</span>
        </div>
        <div class="dash-card-value ${cls}">${this.formatCurrency(data.balance, data.settings)}</div>
        <div class="dash-card-label">Saldo</div>
        <div class="dash-card-rows">
          <div class="dash-row">
            <span>Hari ini</span>
            <span class="${data.today >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(data.today, data.settings)}</span>
          </div>
          <div class="dash-row">
            <span>Minggu ini</span>
            <span class="${data.week >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(data.week, data.settings)}</span>
          </div>
          <div class="dash-row">
            <span>Bulan ini</span>
            <span class="${data.month >= 0 ? 'text-success' : 'text-danger'}">${this.formatCurrency(data.month, data.settings)}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderTodoCard(data) {
    return `
      <div class="card dash-card" data-aos="fade-up" data-aos-delay="100">
        <div class="dash-card-header">
          <div class="dash-card-icon">
            <i data-lucide="list-checks" width="20" height="20"></i>
          </div>
          <span class="dash-card-module">To-Do</span>
        </div>
        <div class="dash-card-value">${data.total}</div>
        <div class="dash-card-label">Total Task</div>
        <div class="dash-card-rows">
          <div class="dash-row">
            <span>Selesai</span>
            <span class="text-success">${data.completed}</span>
          </div>
          <div class="dash-row">
            <span>Pending</span>
            <span>${data.pending}</span>
          </div>
          <div class="dash-row">
            <span>Terlewat</span>
            <span class="text-danger">${data.overdue}</span>
          </div>
        </div>
        <a href="todo.html" class="dash-card-link">Buka To-Do <i data-lucide="arrow-right" width="14" height="14"></i></a>
      </div>
    `;
  },

  renderHabitCard(data) {
    return `
      <div class="card dash-card" data-aos="fade-up" data-aos-delay="150">
        <div class="dash-card-header">
          <div class="dash-card-icon">
            <i data-lucide="repeat" width="20" height="20"></i>
          </div>
          <span class="dash-card-module">Habit</span>
        </div>
        <div class="dash-card-value">${data.total}</div>
        <div class="dash-card-label">Habit Aktif</div>
        <div class="dash-card-rows">
          <div class="dash-row">
            <span>Hari ini check-in</span>
            <span class="text-success">${data.todayChecked}</span>
          </div>
          <div class="dash-row">
            <span>Streak terpanjang</span>
            <span style="color:var(--warning)">${data.topStreak} hari</span>
          </div>
          <div class="dash-row">
            <span>${data.topHabit ? this.escHtml(data.topHabit) : '-'}</span>
            <span class="text-muted">${data.topStreak > 0 ? '🏆' : ''}</span>
          </div>
        </div>
        <a href="habit.html" class="dash-card-link">Buka Habit <i data-lucide="arrow-right" width="14" height="14"></i></a>
      </div>
    `;
  },

  renderGymCard(data) {
    const s = data.lastSession;
    const totalEx = s ? s.exercises.length : 0;
    const totalSets = s ? s.exercises.reduce((sum, e) => sum + e.sets.length, 0) : 0;

    return `
      <div class="card dash-card" data-aos="fade-up" data-aos-delay="200">
        <div class="dash-card-header">
          <div class="dash-card-icon">
            <i data-lucide="dumbbell" width="20" height="20"></i>
          </div>
          <span class="dash-card-module">Gym</span>
        </div>
        <div class="dash-card-value">${data.monthCount}</div>
        <div class="dash-card-label">Sesi Bulan Ini</div>
        <div class="dash-card-rows">
          ${s ? `
            <div class="dash-row">
              <span>Sesi terakhir</span>
              <span>${this.formatDate(s.date)}</span>
            </div>
            <div class="dash-row">
              <span>Latihan</span>
              <span>${totalEx} latihan, ${totalSets} set</span>
            </div>
          ` : `
            <div class="dash-row">
              <span class="text-muted">Belum ada sesi</span>
              <span></span>
            </div>
          `}
        </div>
        <a href="gym.html" class="dash-card-link">Buka Gym <i data-lucide="arrow-right" width="14" height="14"></i></a>
      </div>
    `;
  },

  renderJournalCard(data) {
    const entries = data.entries;

    return `
      <div class="card dash-card dash-card-wide" data-aos="fade-up" data-aos-delay="250">
        <div class="dash-card-header">
          <div class="dash-card-icon">
            <i data-lucide="book-open" width="20" height="20"></i>
          </div>
          <span class="dash-card-module">Journal</span>
        </div>
        ${entries.length === 0
          ? `<p class="text-muted" style="margin-top:var(--spacing-sm)">Belum ada entri jurnal.</p>`
          : `<div class="dash-journal-list">
              ${entries.map(e => {
                const mood = this.getMood(this.journal, e.moodId);
                return `
                  <div class="dash-journal-item">
                    <div class="dash-journal-title-row">
                      <span class="dash-journal-title">${e.title || 'Tanpa judul'}</span>
                      ${mood ? `<i data-lucide="${mood.icon}" width="14" height="14" style="color:var(--accent)"></i>` : ''}
                    </div>
                    <span class="dash-journal-date">${this.formatDate(e.date)}</span>
                  </div>
                `;
              }).join('')}
            </div>`
        }
        <a href="journal.html" class="dash-card-link">Buka Journal <i data-lucide="arrow-right" width="14" height="14"></i></a>
      </div>
    `;
  },
};

window.dashboardInit = function () {
  Dashboard.init();
};
