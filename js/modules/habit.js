const STORAGE_KEY_HABIT = 'remindme:habit';

const DAY_NAMES = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const Habit = {
  data: null,

  loadData() {
    const raw = Storage.get(STORAGE_KEY_HABIT);
    if (raw && raw.habits && raw.entries) {
      this.data = raw;
      return;
    }
    this.data = { habits: [], entries: [] };
    this.save();
  },

  save() {
    Storage.set(STORAGE_KEY_HABIT, this.data);
  },

  /* ── Habits ── */
  addHabit({ name, description, frequency, customDays, weeklyTarget, hasTarget, targetValue, targetUnit }) {
    const habit = {
      id: `habit_${crypto.randomUUID()}`,
      name: name.trim(),
      description: (description || '').trim(),
      frequency: frequency || 'daily',
      customDays: frequency === 'custom' ? (customDays || []) : null,
      weeklyTarget: frequency === 'weekly' ? (weeklyTarget || 3) : null,
      hasTarget: !!hasTarget,
      targetValue: hasTarget ? (targetValue || 1) : null,
      targetUnit: hasTarget ? (targetUnit || '') : null,
      sortOrder: this.data.habits.length,
      createdAt: new Date().toISOString(),
    };
    this.data.habits.push(habit);
    this.save();
    return habit;
  },

  deleteHabit(id) {
    this.data.habits = this.data.habits.filter(h => h.id !== id);
    this.data.entries = this.data.entries.filter(e => e.habitId !== id);
    this.save();
  },

  getHabit(id) {
    return this.data.habits.find(h => h.id === id);
  },

  getSortedHabits() {
    return [...this.data.habits].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /* ── Entries ── */
  getEntry(habitId, date) {
    return this.data.entries.find(e => e.habitId === habitId && e.date === date);
  },

  getEntriesForHabit(habitId) {
    return this.data.entries.filter(e => e.habitId === habitId);
  },

  toggleCheckin(habitId, date) {
    const habit = this.getHabit(habitId);
    if (!habit) return;

    const existing = this.getEntry(habitId, date);
    if (existing) {
      existing.completed = !existing.completed;
      if (!existing.completed) existing.value = null;
      this.save();
      return;
    }

    this.data.entries.push({
      id: `entry_${crypto.randomUUID()}`,
      habitId,
      date,
      value: null,
      completed: true,
      createdAt: new Date().toISOString(),
    });
    this.save();
  },

  updateEntryValue(habitId, date, value) {
    let entry = this.getEntry(habitId, date);
    if (!entry) {
      this.data.entries.push({
        id: `entry_${crypto.randomUUID()}`,
        habitId,
        date,
        value: Math.max(0, value),
        completed: value > 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      entry.value = Math.max(0, value);
      entry.completed = value > 0;
    }
    this.save();
  },

  shouldCheckToday(habit) {
    const today = new Date();
    const dayName = DAY_NAMES[today.getDay()];

    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'custom') {
      return habit.customDays && habit.customDays.includes(dayName);
    }
    if (habit.frequency === 'weekly') return true;
    return true;
  },

  /* ── Streak ── */
  calcStreak(habitId) {
    const entries = this.data.entries
      .filter(e => e.habitId === habitId && e.completed)
      .map(e => e.date)
      .sort()
      .reverse();

    if (entries.length === 0) return { current: 0, longest: 0 };

    let current = 1;
    const today = new Date().toISOString().slice(0, 10);

    if (entries[0] !== today && entries[0] !== this.yesterday()) {
      current = 0;
    }

    if (current > 0) {
      for (let i = 1; i < entries.length; i++) {
        const prev = new Date(entries[i - 1] + 'T00:00:00');
        const curr = new Date(entries[i] + 'T00:00:00');
        const diff = (prev - curr) / (1000 * 60 * 60 * 24);
        if (diff === 1) current++;
        else break;
      }
    }

    let longest = current;
    let temp = 1;
    for (let i = 1; i < entries.length; i++) {
      const prev = new Date(entries[i - 1] + 'T00:00:00');
      const curr = new Date(entries[i] + 'T00:00:00');
      const diff = (prev - curr) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        temp++;
        longest = Math.max(longest, temp);
      } else {
        temp = 1;
      }
    }

    return { current, longest };
  },

  yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  },

  getToday() {
    return new Date().toISOString().slice(0, 10);
  },

  /* ── Render ── */
  init() {
    this.loadData();
    this.render();
    this.bindEvents();
  },

  render() {
    this.renderForm();
    this.renderHabits();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderForm() {
    const el = document.getElementById('habit-form');
    if (!el) return;

    el.innerHTML = `
      <form id="habit-add-form" class="card" data-aos="fade-up" data-aos-delay="100">
        <h3 class="card-title" style="margin-bottom:var(--spacing-md)">Tambah Habit Baru</h3>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label" for="habit-name">Nama Habit</label>
            <input type="text" id="habit-name" class="input-field" placeholder="Mis: Minum Air" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label" for="habit-desc">Deskripsi (opsional)</label>
            <input type="text" id="habit-desc" class="input-field" placeholder="Minum 8 gelas air putih">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="habit-frequency">Frekuensi</label>
            <select id="habit-frequency" class="input-field">
              <option value="daily">Setiap hari</option>
              <option value="custom">Hari tertentu</option>
              <option value="weekly">X kali seminggu</option>
            </select>
          </div>
          <div class="form-group" id="habit-frequency-custom" style="display:none">
            <label class="form-label">Hari</label>
            <div class="day-checkboxes">
              ${['senin','selasa','rabu','kamis','jumat','sabtu','minggu'].map((d, i) => `
                <label class="day-checkbox-label">
                  <input type="checkbox" class="day-checkbox" value="${d}">
                  <span>${DAY_SHORT[i]}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group" id="habit-frequency-weekly" style="display:none">
            <label class="form-label" for="habit-weekly-target">Target per minggu</label>
            <input type="number" id="habit-weekly-target" class="input-field" value="3" min="1" max="7">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="habit-has-target">
              Target kuantitatif
            </label>
          </div>
          <div class="form-group" id="habit-target-fields" style="display:none">
            <div class="form-row" style="margin-bottom:0">
              <div class="form-group">
                <label class="form-label" for="habit-target-value">Target</label>
                <input type="number" id="habit-target-value" class="input-field" value="1" min="1">
              </div>
              <div class="form-group">
                <label class="form-label" for="habit-target-unit">Satuan</label>
                <input type="text" id="habit-target-unit" class="input-field" placeholder="gelas, menit, km">
              </div>
            </div>
          </div>
        </div>
        <button type="submit" class="btn btn-primary form-submit">Tambah Habit</button>
      </form>
    `;
  },

  renderHabits() {
    const el = document.getElementById('habit-list');
    if (!el) return;

    const habits = this.getSortedHabits();
    const today = this.getToday();

    if (habits.length === 0) {
      el.innerHTML = `
        <div class="card" data-aos="fade-up" data-aos-delay="200">
          <p class="text-muted">Belum ada habit. Tambah habit baru di atas.</p>
        </div>
      `;
      return;
    }

    el.innerHTML = habits.map((habit, index) => {
      const streak = this.calcStreak(habit.id);
      const entry = this.getEntry(habit.id, today);
      const isChecked = entry ? entry.completed : false;
      const val = entry ? entry.value : 0;
      const should = this.shouldCheckToday(habit);
      const weekCompletions = this.getWeekCompletions(habit.id);

      return `
        <div class="card habit-card" data-id="${habit.id}" data-aos="fade-up" data-aos-delay="${200 + index * 50}">
          <div class="habit-card-header">
            <div class="habit-info">
              <h3 class="habit-name">${this.escHtml(habit.name)}</h3>
              ${habit.description ? `<p class="habit-desc">${this.escHtml(habit.description)}</p>` : ''}
            </div>
            <div class="habit-streak-info">
              <span class="habit-streak" title="Current streak">
                <i data-lucide="flame" width="16" height="16" class="streak-icon"></i>
                ${streak.current}
              </span>
              <span class="habit-longest" title="Longest streak">🏆 ${streak.longest}</span>
            </div>
          </div>

          ${habit.frequency !== 'daily' ? `
            <div class="habit-frequency-badge">
              ${habit.frequency === 'custom'
                ? `<span class="badge badge-warning">${habit.customDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</span>`
                : `<span class="badge badge-warning">${habit.weeklyTarget}x / minggu (${weekCompletions}x minggu ini)</span>`
              }
            </div>
          ` : ''}

          <div class="habit-checkin-row">
            ${should ? `
              <div class="habit-checkin-controls">
                ${habit.hasTarget ? `
                  <div class="habit-quant-input">
                    <input type="number" class="input-field habit-value-input" value="${val || 0}" min="0" step="1" data-habit="${habit.id}" placeholder="0">
                    ${habit.targetUnit ? `<span class="habit-unit">${habit.targetUnit}</span>` : ''}
                    ${habit.targetValue ? `<span class="habit-target"> / ${habit.targetValue}</span>` : ''}
                  </div>
                  <button class="btn btn-primary habit-checkin-btn" data-id="${habit.id}">
                    ${isChecked ? 'Update' : 'Catat'}
                  </button>
                ` : `
                  <label class="habit-toggle-label ${isChecked ? 'checked' : ''}">
                    <input type="checkbox" class="habit-toggle" data-id="${habit.id}" ${isChecked ? 'checked' : ''}>
                    <span class="habit-toggle-ui">
                      <i data-lucide="${isChecked ? 'check-circle' : 'circle'}" width="28" height="28"></i>
                    </span>
                    <span class="habit-toggle-text">${isChecked ? 'Selesai hari ini' : 'Tandai selesai'}</span>
                  </label>
                `}
              </div>
            ` : `
              <p class="text-muted" style="font-size:var(--text-caption)">Tidak perlu check-in hari ini</p>
            `}
          </div>

          <div class="habit-calendar-mini">
            ${this.renderMiniCalendar(habit.id)}
          </div>

          <div class="habit-actions">
            <button class="btn-icon habit-delete-btn" data-id="${habit.id}" title="Hapus habit">
              <i data-lucide="trash-2" width="16" height="16"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  getWeekCompletions(habitId) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.setDate(diff));
    const start = mon.toISOString().slice(0, 10);

    return this.data.entries.filter(e =>
      e.habitId === habitId && e.completed && e.date >= start
    ).length;
  },

  renderMiniCalendar(habitId) {
    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const entryMap = {};
    this.data.entries
      .filter(e => e.habitId === habitId && e.completed)
      .forEach(e => { entryMap[e.date] = true; });

    const todayStr = this.getToday();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return `
      <div class="mini-calendar">
        <div class="mini-cal-header">
          ${dayNames.map(d => `<span class="mini-cal-day-name">${d}</span>`).join('')}
        </div>
        <div class="mini-cal-body">
          ${days.map(d => {
            const isToday = d === todayStr;
            const checked = entryMap[d];
            const dayNum = new Date(d + 'T00:00:00').getDate();
            return `
              <div class="mini-cal-cell ${checked ? 'checked' : ''} ${isToday ? 'is-today' : ''}">
                <span>${dayNum}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  /* ── Helpers ── */
  escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /* ── Events ── */
  bindEvents() {
    if (this._bound) return;
    this._bound = true;

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('habit-delete-btn') || e.target.closest('.habit-delete-btn')) {
        const btn = e.target.classList.contains('habit-delete-btn') ? e.target : e.target.closest('.habit-delete-btn');
        if (confirm('Hapus habit ini? Semua riwayat check-in juga akan dihapus.')) {
          this.deleteHabit(btn.dataset.id);
          this.render();
        }
        return;
      }

      if (e.target.classList.contains('habit-checkin-btn')) {
        this.handleQuantitativeCheckin(e.target.dataset.id);
        return;
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('habit-toggle')) {
        const id = e.target.dataset.id;
        this.toggleCheckin(id, this.getToday());
        this.render();
        return;
      }

      if (e.target.id === 'habit-frequency') {
        const val = e.target.value;
        document.getElementById('habit-frequency-custom').style.display = val === 'custom' ? 'block' : 'none';
        document.getElementById('habit-frequency-weekly').style.display = val === 'weekly' ? 'block' : 'none';
        return;
      }

      if (e.target.id === 'habit-has-target') {
        document.getElementById('habit-target-fields').style.display = e.target.checked ? 'block' : 'none';
        return;
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'habit-add-form') {
        e.preventDefault();
        this.handleFormSubmit();
      }
    });
  },

  handleQuantitativeCheckin(habitId) {
    const input = document.querySelector(`.habit-value-input[data-habit="${habitId}"]`);
    if (!input) return;
    const value = parseInt(input.value) || 0;
    this.updateEntryValue(habitId, this.getToday(), value);
    this.render();
  },

  handleFormSubmit() {
    const name = document.getElementById('habit-name').value.trim();
    if (!name) return;

    const frequency = document.getElementById('habit-frequency').value;
    let customDays = null;
    let weeklyTarget = null;

    if (frequency === 'custom') {
      customDays = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => cb.value);
      if (customDays.length === 0) return;
    }

    if (frequency === 'weekly') {
      weeklyTarget = parseInt(document.getElementById('habit-weekly-target').value) || 3;
    }

    const hasTarget = document.getElementById('habit-has-target').checked;

    this.addHabit({
      name,
      description: document.getElementById('habit-desc').value,
      frequency,
      customDays,
      weeklyTarget,
      hasTarget,
      targetValue: hasTarget ? (parseInt(document.getElementById('habit-target-value').value) || 1) : null,
      targetUnit: hasTarget ? document.getElementById('habit-target-unit').value : null,
    });

    document.getElementById('habit-name').value = '';
    document.getElementById('habit-desc').value = '';
    document.getElementById('habit-has-target').checked = false;
    document.getElementById('habit-target-fields').style.display = 'none';
    document.getElementById('habit-frequency').value = 'daily';
    document.getElementById('habit-frequency-custom').style.display = 'none';
    document.getElementById('habit-frequency-weekly').style.display = 'none';
    document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
    this.render();
  },
};

window.habitInit = function () {
  Habit.init();
};
