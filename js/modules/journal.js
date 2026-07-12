const STORAGE_KEY_JOURNAL = 'remindme:journal';

const DEFAULT_MOODS = [
  { id: 'mood_happy',   label: 'Baik',      icon: 'smile' },
  { id: 'mood_meh',     label: 'Biasa',     icon: 'meh' },
  { id: 'mood_sad',     label: 'Sedih',     icon: 'frown' },
  { id: 'mood_angry',   label: 'Marah',     icon: 'angry' },
  { id: 'mood_tired',   label: 'Lelah',     icon: 'sleep' },
  { id: 'mood_excited', label: 'Semangat',  icon: 'zap' },
  { id: 'mood_grateful',label: 'Bersyukur', icon: 'heart' },
];

const MOOD_ICONS = [
  'smile', 'meh', 'frown', 'angry', 'sleep', 'zap', 'heart',
  'sun', 'moon', 'cloud', 'star', 'thumbs-up', 'target', 'activity',
];

const Journal = {
  data: null,

  loadData() {
    const raw = Storage.get(STORAGE_KEY_JOURNAL);
    if (raw && raw.defaultMoods && raw.entries) {
      this.data = raw;
      return;
    }
    this.data = {
      defaultMoods: DEFAULT_MOODS.map(m => ({ ...m })),
      customMoods: [],
      entries: [],
    };
    this.save();
  },

  save() {
    Storage.set(STORAGE_KEY_JOURNAL, this.data);
  },

  getAllMoods() {
    return [...this.data.defaultMoods, ...this.data.customMoods];
  },

  getMood(id) {
    return this.getAllMoods().find(m => m.id === id);
  },

  addCustomMood(label, icon) {
    const mood = {
      id: `mood_${crypto.randomUUID()}`,
      label: label.trim(),
      icon: icon || 'smile',
    };
    this.data.customMoods.push(mood);
    this.save();
    return mood;
  },

  deleteCustomMood(id) {
    this.data.customMoods = this.data.customMoods.filter(m => m.id !== id);
    this.data.entries.forEach(e => {
      if (e.moodId === id) e.moodId = null;
    });
    this.save();
  },

  addEntry({ date, title, content, moodId, reflection }) {
    const entry = {
      id: `entry_${crypto.randomUUID()}`,
      date: date || new Date().toISOString().slice(0, 10),
      title: (title || '').trim(),
      content: (content || '').trim(),
      moodId: moodId || null,
      reflection: (reflection || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    this.data.entries.push(entry);
    this.save();
    return entry;
  },

  updateEntry(id, updates) {
    const entry = this.data.entries.find(e => e.id === id);
    if (!entry) return null;
    Object.assign(entry, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return entry;
  },

  deleteEntry(id) {
    this.data.entries = this.data.entries.filter(e => e.id !== id);
    this.save();
  },

  getEntries({ search } = {}) {
    let entries = [...this.data.entries];
    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.content || '').toLowerCase().includes(q)
      );
    }
    entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return entries;
  },

  groupByDate(entries) {
    const groups = {};
    entries.forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  },

  getToday() {
    return new Date().toISOString().slice(0, 10);
  },

  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = this.getToday();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);

    if (dateStr === today) return 'Hari Ini';
    if (dateStr === yStr) return 'Kemarin';

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  formatTime(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  },

  /* ── Render ── */
  init() {
    this.loadData();
    this.render();
    this.bindEvents();
  },

  render() {
    this.renderForm();
    this.renderEntries();
    this.renderMoodSettings();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderForm() {
    const el = document.getElementById('journal-form');
    if (!el) return;

    const moods = this.getAllMoods();

    el.innerHTML = `
      <form id="journal-entry-form" class="card" data-aos="fade-up" data-aos-delay="100">
        <h3 class="card-title" style="margin-bottom:var(--spacing-md)">Tulis Jurnal</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="journal-date">Tanggal</label>
            <input type="date" id="journal-date" class="input-field" value="${this.getToday()}">
          </div>
          <div class="form-group">
            <label class="form-label" for="journal-mood">Mood</label>
            <select id="journal-mood" class="input-field">
              <option value="">— Pilih mood —</option>
              ${moods.map(m => `<option value="${m.id}">${m.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label" for="journal-title">Judul</label>
            <input type="text" id="journal-title" class="input-field" placeholder="Ringkasan hari ini">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label" for="journal-content">Isi Jurnal</label>
            <textarea id="journal-content" class="input-field journal-textarea" rows="5" placeholder="Ceritakan hari Anda..."></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label" for="journal-reflection">Refleksi / Hal yang disyukuri (opsional)</label>
            <textarea id="journal-reflection" class="input-field journal-textarea" rows="2" placeholder="Apa yang Anda syukuri hari ini?"></textarea>
          </div>
        </div>
        <div class="form-row" style="gap:var(--spacing-sm)">
          <button type="submit" class="btn btn-primary">Simpan</button>
          <button type="button" class="btn btn-secondary" id="journal-cancel-edit" style="display:none">Batal</button>
        </div>
      </form>
    `;
  },

  renderEntries() {
    const el = document.getElementById('journal-entries');
    if (!el) return;

    const search = document.getElementById('journal-search-input');
    const query = search ? search.value : '';

    const entries = this.getEntries({ search: query });
    const groups = this.groupByDate(entries);

    el.innerHTML = `
      <div class="journal-search-bar" data-aos="fade-up" data-aos-delay="120">
        <i data-lucide="search" width="18" height="18" class="search-icon"></i>
        <input type="text" id="journal-search-input" class="input-field journal-search-input" placeholder="Cari jurnal..." value="${this.escHtml(query)}">
      </div>

      ${groups.length === 0
        ? `<div class="card" data-aos="fade-up" data-aos-delay="150"><p class="text-muted">${query ? 'Tidak ada jurnal yang cocok.' : 'Belum ada entri jurnal.'}</p></div>`
        : groups.map(([date, dayEntries], gi) => `
          <div class="journal-day-group" data-aos="fade-up" data-aos-delay="${150 + gi * 50}">
            <div class="journal-day-header">
              <h3 class="journal-day-title">${this.formatDate(date)}</h3>
              <span class="caption">${dayEntries.length} entri</span>
            </div>
            ${dayEntries.map(e => this.renderEntryCard(e)).join('')}
          </div>
        `).join('')
      }
    `;
  },

  renderEntryCard(entry) {
    const mood = entry.moodId ? this.getMood(entry.moodId) : null;
    const shortContent = (entry.content || '').length > 150
      ? entry.content.slice(0, 150) + '...'
      : entry.content;

    return `
      <div class="card journal-entry-card" data-id="${entry.id}">
        <div class="journal-entry-header">
          <div class="journal-entry-title-row">
            <h4 class="journal-entry-title">${entry.title || 'Tanpa judul'}</h4>
            ${mood ? `<span class="journal-entry-mood" title="${mood.label}"><i data-lucide="${mood.icon}" width="18" height="18"></i></span>` : ''}
          </div>
          <span class="journal-entry-time">${this.formatTime(entry.createdAt)}</span>
        </div>
        <div class="journal-entry-body">
          <p class="journal-entry-content">${this.escHtml(shortContent)}</p>
          ${entry.reflection ? `
            <div class="journal-reflection">
              <span class="journal-reflection-label">Refleksi:</span>
              <p>${this.escHtml(entry.reflection)}</p>
            </div>
          ` : ''}
        </div>
        <div class="journal-entry-actions">
          <button class="btn-icon journal-edit-btn" data-id="${entry.id}" title="Edit">
            <i data-lucide="pencil" width="16" height="16"></i>
          </button>
          <button class="btn-icon journal-delete-btn" data-id="${entry.id}" title="Hapus">
            <i data-lucide="trash-2" width="16" height="16"></i>
          </button>
        </div>
      </div>
    `;
  },

  renderMoodSettings() {
    const el = document.getElementById('journal-mood-settings');
    if (!el) return;

    const customMoods = this.data.customMoods;

    el.innerHTML = `
      <div class="card" data-aos="fade-up" data-aos-delay="300">
        <div class="card-header">
          <h3 class="card-title">Mood Custom</h3>
        </div>
        ${customMoods.length > 0 ? `
          <ul class="cat-list">
            ${customMoods.map(m => `
              <li class="cat-list-item">
                <span><i data-lucide="${m.icon}" width="16" height="16"></i> ${m.label}</span>
                <button class="btn-icon journal-mood-delete" data-id="${m.id}"><i data-lucide="x" width="14" height="14"></i></button>
              </li>
            `).join('')}
          </ul>
        ` : '<p class="text-muted" style="margin-bottom:var(--spacing-sm)">Belum ada mood custom.</p>'}
        <div class="add-cat-row" style="margin-top:var(--spacing-sm)">
          <input type="text" id="new-mood-label" class="input-field" placeholder="Nama mood baru">
          <select id="new-mood-icon" class="input-field" style="flex:0 0 120px">
            ${MOOD_ICONS.map(ic => `<option value="${ic}">${ic}</option>`).join('')}
          </select>
          <button class="btn btn-primary" id="add-mood-btn">Tambah</button>
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
      if (e.target.classList.contains('journal-delete-btn') || e.target.closest('.journal-delete-btn')) {
        const btn = e.target.classList.contains('journal-delete-btn') ? e.target : e.target.closest('.journal-delete-btn');
        if (confirm('Hapus entri jurnal ini?')) {
          this.deleteEntry(btn.dataset.id);
          this.render();
        }
        return;
      }

      if (e.target.classList.contains('journal-edit-btn') || e.target.closest('.journal-edit-btn')) {
        const btn = e.target.classList.contains('journal-edit-btn') ? e.target : e.target.closest('.journal-edit-btn');
        this.loadEditForm(btn.dataset.id);
        return;
      }

      if (e.target.id === 'journal-cancel-edit') {
        this.cancelEdit();
        return;
      }

      if (e.target.classList.contains('journal-mood-delete') || e.target.closest('.journal-mood-delete')) {
        const btn = e.target.classList.contains('journal-mood-delete') ? e.target : e.target.closest('.journal-mood-delete');
        this.deleteCustomMood(btn.dataset.id);
        this.render();
        return;
      }

      if (e.target.id === 'add-mood-btn') {
        const label = document.getElementById('new-mood-label');
        const icon = document.getElementById('new-mood-icon');
        if (label.value.trim()) {
          this.addCustomMood(label.value, icon.value);
          label.value = '';
          this.render();
        }
        return;
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target.id === 'journal-search-input') {
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => this.renderEntries(), 300);
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'journal-entry-form') {
        e.preventDefault();
        this.handleFormSubmit();
      }
    });
  },

  _editingId: null,

  loadEditForm(id) {
    const entry = this.data.entries.find(e => e.id === id);
    if (!entry) return;

    this._editingId = id;
    document.getElementById('journal-date').value = entry.date;
    document.getElementById('journal-title').value = entry.title;
    document.getElementById('journal-content').value = entry.content;
    document.getElementById('journal-mood').value = entry.moodId || '';
    document.getElementById('journal-reflection').value = entry.reflection || '';
    document.getElementById('journal-cancel-edit').style.display = 'inline-flex';
    document.querySelector('#journal-entry-form .card-title').textContent = 'Edit Jurnal';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  cancelEdit() {
    this._editingId = null;
    document.getElementById('journal-entry-form').reset();
    document.getElementById('journal-date').value = this.getToday();
    document.getElementById('journal-cancel-edit').style.display = 'none';
    document.querySelector('#journal-entry-form .card-title').textContent = 'Tulis Jurnal';
  },

  handleFormSubmit() {
    const date = document.getElementById('journal-date').value;
    const title = document.getElementById('journal-title').value;
    const content = document.getElementById('journal-content').value;
    const moodId = document.getElementById('journal-mood').value;
    const reflection = document.getElementById('journal-reflection').value;

    if (!content.trim()) return;

    if (this._editingId) {
      this.updateEntry(this._editingId, { date, title, content, moodId, reflection });
      this.cancelEdit();
    } else {
      this.addEntry({ date, title, content, moodId, reflection });
      document.getElementById('journal-entry-form').reset();
      document.getElementById('journal-date').value = this.getToday();
    }
    this.render();
  },
};

window.journalInit = function () {
  Journal.init();
};
