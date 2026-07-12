const STORAGE_KEY_GYM = 'remindme:gym';

const Gym = {
  data: null,

  loadData() {
    const raw = Storage.get(STORAGE_KEY_GYM);
    if (raw && raw.templates && raw.sessions) {
      this.data = raw;
      return;
    }
    this.data = { unit: 'kg', templates: [], sessions: [] };
    this.save();
  },

  save() {
    Storage.set(STORAGE_KEY_GYM, this.data);
  },

  /* ── Templates ── */
  addTemplate(name, exerciseNames) {
    const tpl = {
      id: `tpl_${crypto.randomUUID()}`,
      name: name.trim(),
      exercises: exerciseNames.filter(n => n.trim()).map(n => ({ name: n.trim(), sets: 3 })),
      createdAt: new Date().toISOString(),
    };
    if (tpl.exercises.length === 0) return null;
    this.data.templates.push(tpl);
    this.save();
    return tpl;
  },

  deleteTemplate(id) {
    this.data.templates = this.data.templates.filter(t => t.id !== id);
    this.save();
  },

  getTemplate(id) {
    return this.data.templates.find(t => t.id === id);
  },

  /* ── Sessions ── */
  addSession({ date, templateId, templateName, note, exercises }) {
    const session = {
      id: `sess_${crypto.randomUUID()}`,
      date: date || new Date().toISOString().slice(0, 10),
      templateId: templateId || null,
      templateName: templateName || null,
      note: (note || '').trim(),
      exercises: exercises || [],
      createdAt: new Date().toISOString(),
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  },

  deleteSession(id) {
    this.data.sessions = this.data.sessions.filter(s => s.id !== id);
    this.save();
  },

  getSessions() {
    return [...this.data.sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getAllExerciseNames() {
    const names = new Set();
    this.data.sessions.forEach(s => {
      s.exercises.forEach(e => names.add(e.name));
    });
    this.data.templates.forEach(t => {
      t.exercises.forEach(e => names.add(e.name));
    });
    return [...names].sort();
  },

  getProgressForExercise(name) {
    const points = [];
    this.data.sessions.forEach(s => {
      const ex = s.exercises.find(e => e.name === name);
      if (ex && ex.sets.length > 0) {
        const maxWeight = Math.max(...ex.sets.map(st => st.weight));
        const totalVolume = ex.sets.reduce((sum, st) => sum + st.rep * st.weight, 0);
        points.push({
          date: s.date,
          maxWeight,
          totalVolume,
          totalReps: ex.sets.reduce((sum, st) => sum + st.rep, 0),
        });
      }
    });
    return points.sort((a, b) => a.date.localeCompare(b.date));
  },

  getToday() {
    return new Date().toISOString().slice(0, 10);
  },

  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = this.getToday();
    if (dateStr === today) return 'Hari Ini';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  },

  /* ── Render ── */
  init() {
    this.loadData();
    this.render();
    this.bindEvents();
  },

  render() {
    this.renderMain();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderMain() {
    const el = document.getElementById('gym-content');
    if (!el) return;

    const view = this.data._view || 'sessions';

    el.innerHTML = `
      <div class="gym-tabs" data-aos="fade-up" data-aos-delay="50">
        <button class="gym-tab ${view === 'sessions' ? 'active' : ''}" data-view="sessions">Sesi</button>
        <button class="gym-tab ${view === 'templates' ? 'active' : ''}" data-view="templates">Template</button>
        <button class="gym-tab ${view === 'progress' ? 'active' : ''}" data-view="progress">Progress</button>
        <button class="gym-tab ${view === 'settings' ? 'active' : ''}" data-view="settings">Pengaturan</button>
      </div>

      <div class="gym-tab-content">
        ${view === 'sessions' ? this.renderSessionsView() : ''}
        ${view === 'templates' ? this.renderTemplatesView() : ''}
        ${view === 'progress' ? this.renderProgressView() : ''}
        ${view === 'settings' ? this.renderSettingsView() : ''}
      </div>
    `;
  },

  /* ── Sessions View ── */
  renderSessionsView() {
    const sessions = this.getSessions();

    return `
      <div class="card gym-form-card" data-aos="fade-up" data-aos-delay="100">
        <h3 class="card-title" style="margin-bottom:var(--spacing-md)">Catat Sesi Latihan</h3>
        <form id="gym-session-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="gym-date">Tanggal</label>
              <input type="date" id="gym-date" class="input-field" value="${this.getToday()}">
            </div>
            <div class="form-group">
              <label class="form-label" for="gym-template">Template (opsional)</label>
              <select id="gym-template" class="input-field">
                <option value="">— Free session —</option>
                ${this.data.templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label" for="gym-note">Catatan (opsional)</label>
              <input type="text" id="gym-note" class="input-field" placeholder="Mis: Push Day berat">
            </div>
          </div>
          <div id="gym-exercise-list">
            <div class="gym-exercise-row" data-exercise="0">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nama Latihan</label>
                  <input type="text" class="input-field gym-ex-name" placeholder="Bench Press" list="gym-exercise-datalist">
                </div>
                <div class="form-group" style="flex:0 0 80px">
                  <label class="form-label">Set</label>
                  <input type="number" class="input-field gym-ex-sets" value="3" min="1" max="20">
                </div>
                <button type="button" class="btn-icon gym-remove-ex" style="align-self:flex-end;margin-bottom:2px">
                  <i data-lucide="x" width="16" height="16"></i>
                </button>
              </div>
              <div class="gym-sets-container" data-exercise="0">
                ${this.renderSetInputs(0, 3)}
              </div>
            </div>
          </div>
          <datalist id="gym-exercise-datalist">
            ${this.getAllExerciseNames().map(n => `<option value="${n}">`).join('')}
          </datalist>
          <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-sm)">
            <button type="button" class="btn btn-secondary" id="gym-add-exercise">
              <i data-lucide="plus" width="16" height="16"></i> Tambah Latihan
            </button>
          </div>
          <button type="submit" class="btn btn-primary form-submit">Simpan Sesi</button>
        </form>
      </div>

      <div class="gym-sessions-list" data-aos="fade-up" data-aos-delay="200">
        ${sessions.length === 0
          ? '<div class="card"><p class="text-muted">Belum ada sesi latihan.</p></div>'
          : sessions.map((s, i) => this.renderSessionCard(s, i)).join('')
        }
      </div>
    `;
  },

  renderSetInputs(exIndex, count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="form-row gym-set-row">
          <span class="gym-set-label">Set ${i + 1}</span>
          <div class="form-group">
            <input type="number" class="input-field gym-set-rep" placeholder="Rep" min="1" value="10">
          </div>
          <div class="form-group">
            <input type="number" class="input-field gym-set-weight" placeholder="Berat" min="0" step="0.5" value="0">
          </div>
        </div>
      `;
    }
    return html;
  },

  renderSessionCard(session, index) {
    const totalExercises = session.exercises.length;
    const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);

    return `
      <div class="card gym-session-card" data-aos="fade-up" data-aos-delay="${200 + index * 50}">
        <div class="gym-session-header">
          <div>
            <span class="gym-session-date">${this.formatDate(session.date)}</span>
            ${session.templateName ? `<span class="badge badge-warning">${session.templateName}</span>` : '<span class="badge">Free</span>'}
          </div>
          <div class="gym-session-meta">
            <span>${totalExercises} latihan</span>
            <span>·</span>
            <span>${totalSets} set</span>
          </div>
        </div>
        ${session.note ? `<p class="gym-session-note">${this.escHtml(session.note)}</p>` : ''}
        <div class="gym-session-exercises">
          ${session.exercises.map(ex => `
            <div class="gym-exercise-summary">
              <span class="gym-ex-name">${this.escHtml(ex.name)}</span>
              <span class="gym-ex-detail">${ex.sets.length} set · Max ${Math.max(...ex.sets.map(st => st.weight))} ${this.data.unit}</span>
            </div>
          `).join('')}
        </div>
        <button class="btn-icon gym-delete-session" data-id="${session.id}" style="margin-left:auto;display:block">
          <i data-lucide="trash-2" width="16" height="16"></i>
        </button>
      </div>
    `;
  },

  /* ── Templates View ── */
  renderTemplatesView() {
    return `
      <div class="card" data-aos="fade-up" data-aos-delay="100">
        <h3 class="card-title" style="margin-bottom:var(--spacing-md)">Buat Template</h3>
        <form id="gym-template-form">
          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label" for="tpl-name">Nama Template</label>
              <input type="text" id="tpl-name" class="input-field" placeholder="Mis: Push Day" required>
            </div>
          </div>
          <div id="tpl-exercise-list">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Latihan 1</label>
                <input type="text" class="input-field tpl-ex-name" placeholder="Bench Press">
              </div>
              <div class="form-group" style="flex:0 0 80px">
                <label class="form-label">Set</label>
                <input type="number" class="input-field tpl-ex-sets" value="3" min="1">
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-secondary" id="tpl-add-exercise" style="margin-top:var(--spacing-sm)">
            <i data-lucide="plus" width="16" height="16"></i> Tambah Latihan
          </button>
          <button type="submit" class="btn btn-primary form-submit">Simpan Template</button>
        </form>
      </div>

      <div style="margin-top:var(--spacing-lg)" data-aos="fade-up" data-aos-delay="150">
        ${this.data.templates.length === 0
          ? '<div class="card"><p class="text-muted">Belum ada template.</p></div>'
          : this.data.templates.map(t => `
            <div class="card" style="margin-bottom:var(--spacing-sm)">
              <div class="card-header">
                <h3 class="card-title">${this.escHtml(t.name)}</h3>
                <button class="btn-icon gym-delete-tpl" data-id="${t.id}"><i data-lucide="trash-2" width="16" height="16"></i></button>
              </div>
              <div class="gym-session-exercises">
                ${t.exercises.map(e => `
                  <div class="gym-exercise-summary">
                    <span class="gym-ex-name">${this.escHtml(e.name)}</span>
                    <span class="gym-ex-detail">${e.sets} set</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
  },

  /* ── Progress View ── */
  renderProgressView() {
    const allExercises = this.getAllExerciseNames();

    if (allExercises.length === 0) {
      return '<div class="card"><p class="text-muted">Belum ada data latihan untuk ditampilkan.</p></div>';
    }

    const selected = this.data._progressExercise || allExercises[0];
    const points = this.getProgressForExercise(selected);

    return `
      <div class="card" data-aos="fade-up" data-aos-delay="100">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="progress-exercise">Pilih Latihan</label>
            <select id="progress-exercise" class="input-field">
              ${allExercises.map(n => `<option value="${n}" ${n === selected ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
        </div>

        ${points.length === 0
          ? '<p class="text-muted" style="margin-top:var(--spacing-md)">Belum ada data progress untuk latihan ini.</p>'
          : `
            <div class="progress-chart">
              ${this.renderSVGChart(points)}
            </div>
            <div class="progress-table">
              <div class="progress-table-header">
                <span>Tanggal</span>
                <span>Max Berat</span>
                <span>Total Reps</span>
                <span>Volume</span>
              </div>
              ${[...points].reverse().map(p => `
                <div class="progress-table-row">
                  <span>${this.formatDate(p.date)}</span>
                  <span class="text-accent">${p.maxWeight} ${this.data.unit}</span>
                  <span>${p.totalReps}</span>
                  <span>${p.totalVolume}</span>
                </div>
              `).join('')}
            </div>
          `
        }
      </div>
    `;
  },

  renderSVGChart(points) {
    if (points.length < 2) {
      return '<p class="text-muted" style="margin-top:var(--spacing-md)">Butuh minimal 2 sesi untuk grafik.</p>';
    }

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxWeight = Math.max(...points.map(p => p.maxWeight)) * 1.1;
    const minWeight = 0;

    const xScale = (i) => padding.left + (i / (points.length - 1)) * chartW;
    const yScale = (v) => padding.top + chartH - ((v - minWeight) / (maxWeight - minWeight)) * chartH;

    let pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.maxWeight)}`).join(' ');
    let areaD = pathD + ` L${xScale(points.length - 1)},${padding.top + chartH} L${xScale(0)},${padding.top + chartH} Z`;

    const xLabels = points.map((p, i) => {
      if (points.length <= 5 || i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 5) === 0) {
        return `<text x="${xScale(i)}" y="${height - 5}" text-anchor="middle" font-size="10" fill="#6A6A6E">${this.formatDate(p.date)}</text>`;
      }
      return '';
    }).join('');

    const yTicks = 5;
    let yLabels = '';
    for (let i = 0; i <= yTicks; i++) {
      const val = minWeight + (maxWeight - minWeight) * (i / yTicks);
      const y = yScale(val);
      yLabels += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#2A2A2E" stroke-width="1" />
        <text x="${padding.left - 5}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6A6A6E">${Math.round(val)}</text>
      `;
    }

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;max-height:300px">
        ${yLabels}
        <path d="${areaD}" fill="rgba(74, 222, 128, 0.1)" />
        <path d="${pathD}" fill="none" stroke="#4ADE80" stroke-width="2" stroke-linejoin="round" />
        ${points.map((p, i) => `
          <circle cx="${xScale(i)}" cy="${yScale(p.maxWeight)}" r="4" fill="#4ADE80" stroke="#0D0D0D" stroke-width="2" />
          <title>${p.date}: ${p.maxWeight} ${this.data.unit}</title>
        `).join('')}
        ${xLabels}
      </svg>
    `;
  },

  /* ── Settings View ── */
  renderSettingsView() {
    return `
      <div class="card" data-aos="fade-up" data-aos-delay="100">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="gym-unit">Satuan Berat</label>
            <select id="gym-unit" class="input-field">
              <option value="kg" ${this.data.unit === 'kg' ? 'selected' : ''}>Kg</option>
              <option value="lbs" ${this.data.unit === 'lbs' ? 'selected' : ''}>Lbs</option>
            </select>
          </div>
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
      if (e.target.classList.contains('gym-tab') || e.target.closest('.gym-tab')) {
        const tab = e.target.classList.contains('gym-tab') ? e.target : e.target.closest('.gym-tab');
        this.data._view = tab.dataset.view;
        this.save();
        this.render();
        return;
      }

      if (e.target.id === 'gym-add-exercise') {
        this.addExerciseRow();
        return;
      }

      if (e.target.classList.contains('gym-remove-ex') || e.target.closest('.gym-remove-ex')) {
        const btn = e.target.classList.contains('gym-remove-ex') ? e.target : e.target.closest('.gym-remove-ex');
        const row = btn.closest('.gym-exercise-row');
        if (row && document.querySelectorAll('.gym-exercise-row').length > 1) {
          row.remove();
        }
        return;
      }

      if (e.target.id === 'tpl-add-exercise') {
        const list = document.getElementById('tpl-exercise-list');
        const count = list.querySelectorAll('.form-row').length + 1;
        const div = document.createElement('div');
        div.className = 'form-row';
        div.innerHTML = `
          <div class="form-group">
            <label class="form-label">Latihan ${count}</label>
            <input type="text" class="input-field tpl-ex-name" placeholder="Nama latihan">
          </div>
          <div class="form-group" style="flex:0 0 80px">
            <label class="form-label">Set</label>
            <input type="number" class="input-field tpl-ex-sets" value="3" min="1">
          </div>
        `;
        list.appendChild(div);
        return;
      }

      if (e.target.classList.contains('gym-delete-session') || e.target.closest('.gym-delete-session')) {
        const btn = e.target.classList.contains('gym-delete-session') ? e.target : e.target.closest('.gym-delete-session');
        if (confirm('Hapus sesi ini?')) {
          this.deleteSession(btn.dataset.id);
          this.render();
        }
        return;
      }

      if (e.target.classList.contains('gym-delete-tpl') || e.target.closest('.gym-delete-tpl')) {
        const btn = e.target.classList.contains('gym-delete-tpl') ? e.target : e.target.closest('.gym-delete-tpl');
        if (confirm('Hapus template ini?')) {
          this.deleteTemplate(btn.dataset.id);
          this.render();
        }
        return;
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'gym-template') {
        const tplId = e.target.value;
        if (tplId) {
          const tpl = this.getTemplate(tplId);
          if (tpl) {
            this.loadTemplateExercises(tpl);
          }
        }
        return;
      }

      if (e.target.id === 'gym-unit') {
        this.data.unit = e.target.value;
        this.save();
        this.render();
        return;
      }

      if (e.target.id === 'progress-exercise') {
        this.data._progressExercise = e.target.value;
        this.save();
        this.renderMain();
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'gym-session-form') {
        e.preventDefault();
        this.handleSessionSubmit();
        return;
      }
      if (e.target.id === 'gym-template-form') {
        e.preventDefault();
        this.handleTemplateSubmit();
        return;
      }
    });
  },

  addExerciseRow() {
    const list = document.getElementById('gym-exercise-list');
    const count = list.querySelectorAll('.gym-exercise-row').length;
    const div = document.createElement('div');
    div.className = 'gym-exercise-row';
    div.dataset.exercise = count;
    div.innerHTML = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nama Latihan</label>
          <input type="text" class="input-field gym-ex-name" placeholder="Nama latihan" list="gym-exercise-datalist">
        </div>
        <div class="form-group" style="flex:0 0 80px">
          <label class="form-label">Set</label>
          <input type="number" class="input-field gym-ex-sets" value="3" min="1" max="20">
        </div>
        <button type="button" class="btn-icon gym-remove-ex" style="align-self:flex-end;margin-bottom:2px">
          <i data-lucide="x" width="16" height="16"></i>
        </button>
      </div>
      <div class="gym-sets-container" data-exercise="${count}">
        ${this.renderSetInputs(count, 3)}
      </div>
    `;
    list.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  loadTemplateExercises(tpl) {
    const list = document.getElementById('gym-exercise-list');
    list.innerHTML = '';
    tpl.exercises.forEach((ex, i) => {
      const div = document.createElement('div');
      div.className = 'gym-exercise-row';
      div.dataset.exercise = i;
      div.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nama Latihan</label>
            <input type="text" class="input-field gym-ex-name" value="${this.escHtml(ex.name)}" readonly style="opacity:0.7">
          </div>
          <div class="form-group" style="flex:0 0 80px">
            <label class="form-label">Set</label>
            <input type="number" class="input-field gym-ex-sets" value="${ex.sets}" min="1" max="20">
          </div>
        </div>
        <div class="gym-sets-container" data-exercise="${i}">
          ${this.renderSetInputs(i, ex.sets)}
        </div>
      `;
      list.appendChild(div);
    });
  },

  handleSessionSubmit() {
    const date = document.getElementById('gym-date').value;
    const tplSelect = document.getElementById('gym-template');
    const templateId = tplSelect.value || null;
    const templateName = templateId ? this.getTemplate(templateId)?.name : null;
    const note = document.getElementById('gym-note').value;

    const exerciseRows = document.querySelectorAll('.gym-exercise-row');
    const exercises = [];

    exerciseRows.forEach(row => {
      const name = row.querySelector('.gym-ex-name').value.trim();
      if (!name) return;

      const sets = [];
      row.querySelectorAll('.gym-set-row').forEach(setRow => {
        const rep = parseInt(setRow.querySelector('.gym-set-rep').value) || 0;
        const weight = parseFloat(setRow.querySelector('.gym-set-weight').value) || 0;
        if (rep > 0) sets.push({ rep, weight });
      });

      if (sets.length > 0) {
        exercises.push({ name, sets });
      }
    });

    if (exercises.length === 0) return;

    this.addSession({ date, templateId, templateName, note, exercises });
    this.render();
  },

  handleTemplateSubmit() {
    const name = document.getElementById('tpl-name').value.trim();
    if (!name) return;

    const exInputs = document.querySelectorAll('.tpl-ex-name');
    const exNames = [];
    exInputs.forEach(input => {
      if (input.value.trim()) exNames.push(input.value.trim());
    });

    this.addTemplate(name, exNames);
    document.getElementById('tpl-name').value = '';
    document.querySelectorAll('.tpl-ex-name').forEach((input, i) => {
      if (i > 0) input.closest('.form-row').remove();
      else input.value = '';
    });
    this.render();
  },
};

window.gymInit = function () {
  Gym.init();
};
