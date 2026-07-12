const STORAGE_KEY_TODO = 'remindme:todo';

const PRIORITY_CONFIG = {
  high: { label: 'High', className: 'badge-danger' },
  medium: { label: 'Medium', className: 'badge-warning' },
  low: { label: 'Low', className: 'badge-success' },
};

const Todo = {
  data: null,

  loadData() {
    const raw = Storage.get(STORAGE_KEY_TODO);
    if (raw && raw.categories && raw.tasks) {
      this.data = raw;
      return;
    }
    this.data = { categories: [], tasks: [] };
    this.save();
  },

  save() {
    Storage.set(STORAGE_KEY_TODO, this.data);
  },

  /* ── Categories ── */
  addCategory(name, color) {
    const cat = {
      id: `cat_${crypto.randomUUID()}`,
      name: name.trim(),
      color: color || '#4ADE80',
      createdAt: new Date().toISOString(),
    };
    this.data.categories.push(cat);
    this.save();
    return cat;
  },

  deleteCategory(id) {
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.data.tasks.forEach(t => {
      if (t.categoryId === id) t.categoryId = null;
    });
    this.save();
  },

  getCategory(id) {
    return this.data.categories.find(c => c.id === id);
  },

  /* ── Tasks ── */
  addTask({ title, description, deadlineDate, deadlineTime, priority, categoryId, isRecurring, recurringType, recurringEnd }) {
    const task = {
      id: `task_${crypto.randomUUID()}`,
      title: title.trim(),
      description: (description || '').trim(),
      deadlineDate: deadlineDate || null,
      deadlineTime: deadlineTime || null,
      priority: priority || 'medium',
      categoryId: categoryId || null,
      isRecurring: !!isRecurring,
      recurringType: isRecurring ? (recurringType || 'daily') : null,
      recurringEnd: recurringEnd || null,
      completed: false,
      completedAt: null,
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    this.data.tasks.push(task);
    this.save();
    return task;
  },

  updateTask(id, updates) {
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return task;
  },

  deleteTask(id) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
  },

  toggleComplete(id) {
    const task = this.data.tasks.find(t => t.id === id);
    if (!task) return;

    if (task.completed) {
      task.completed = false;
      task.completedAt = null;
      this.save();
      return;
    }

    task.completed = true;
    task.completedAt = new Date().toISOString();
    this.save();

    if (task.isRecurring) this.handleRecurring(task);
  },

  handleRecurring(task) {
    const nextDate = this.calcNextDate(task.deadlineDate, task.recurringType);
    if (!nextDate) return;
    if (task.recurringEnd && nextDate > task.recurringEnd) return;

    const newTask = {
      ...task,
      id: `task_${crypto.randomUUID()}`,
      completed: false,
      completedAt: null,
      subtasks: task.subtasks.map(st => ({ ...st, completed: false })),
      deadlineDate: nextDate,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    this.data.tasks.push(newTask);
    this.save();
  },

  calcNextDate(currentDate, type) {
    if (!currentDate) {
      if (type === 'daily') return new Date().toISOString().slice(0, 10);
      return null;
    }
    const d = new Date(currentDate + 'T00:00:00');
    if (type === 'daily') d.setDate(d.getDate() + 1);
    else if (type === 'weekly') d.setDate(d.getDate() + 7);
    else if (type === 'monthly') d.setMonth(d.getMonth() + 1);
    else return null;
    return d.toISOString().slice(0, 10);
  },

  /* ── Subtasks ── */
  addSubtask(taskId, title) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.subtasks.push({
      id: `sub_${crypto.randomUUID()}`,
      title: title.trim(),
      completed: false,
    });
    task.updatedAt = new Date().toISOString();
    this.save();
  },

  toggleSubtask(taskId, subtaskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;
    sub.completed = !sub.completed;
    task.updatedAt = new Date().toISOString();
    const allDone = task.subtasks.length > 0 && task.subtasks.every(s => s.completed);
    if (allDone && !task.completed) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
      if (task.isRecurring) this.handleRecurring(task);
    }
    if (!allDone) {
      task.completed = false;
      task.completedAt = null;
    }
    this.save();
  },

  deleteSubtask(taskId, subtaskId) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    task.updatedAt = new Date().toISOString();
    this.save();
  },

  /* ── Grouping ── */
  getGroups() {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const groups = { overdue: [], today: [], upcoming: [], completed: [] };

    this.data.tasks.forEach(t => {
      if (t.completed) {
        groups.completed.push(t);
        return;
      }
      if (!t.deadlineDate) {
        groups.upcoming.push(t);
        return;
      }
      if (t.deadlineDate < today) {
        groups.overdue.push(t);
        return;
      }
      if (t.deadlineDate === today) {
        groups.today.push(t);
        return;
      }
      groups.upcoming.push(t);
    });

    const sortByPriority = (a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 1) - (order[b.priority] || 1);
    };

    groups.overdue.sort(sortByPriority);
    groups.today.sort(sortByPriority);
    groups.upcoming.sort((a, b) => (a.deadlineDate || '').localeCompare(b.deadlineDate || ''));
    groups.completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    return groups;
  },

  isOverdue(task) {
    if (task.completed || !task.deadlineDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return task.deadlineDate < today;
  },

  isNearDeadline(task) {
    if (task.completed || !task.deadlineDate) return false;
    const now = new Date();
    const deadline = new Date(task.deadlineDate + 'T' + (task.deadlineTime || '23:59'));
    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  },

  getTodayStr() {
    return new Date().toISOString().slice(0, 10);
  },

  /* ── Render ── */
  init() {
    this.loadData();
    this.render();
    this.bindEvents();
  },

  render() {
    const view = this.data.view || 'list';
    this.renderHeader();
    if (view === 'calendar') {
      this.renderCalendar();
    } else {
      this.renderList();
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderHeader() {
    const el = document.getElementById('todo-header-actions');
    if (!el) return;
    const view = this.data.view || 'list';
    el.innerHTML = `
      <button class="btn btn-secondary view-toggle" data-view="list">
        <i data-lucide="list" width="18" height="18"></i>
        ${view === 'list' ? 'List' : 'List'}
      </button>
      <button class="btn btn-secondary view-toggle" data-view="calendar">
        <i data-lucide="calendar" width="18" height="18"></i>
        ${view === 'calendar' ? 'Kalender' : 'Kalender'}
      </button>
    `;
  },

  renderList() {
    const el = document.getElementById('todo-content-area');
    if (!el) return;

    const groups = this.getGroups();
    const cats = this.data.categories;

    el.innerHTML = `
      <div class="todo-form-section" data-aos="fade-up" data-aos-delay="100">
        <form id="todo-form" class="card todo-form-card">
          <h3 class="card-title" style="margin-bottom:var(--spacing-md)">Tambah Task</h3>
          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label" for="task-title">Judul</label>
              <input type="text" id="task-title" class="input-field" placeholder="Apa yang ingin dilakukan?" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-desc">Deskripsi (opsional)</label>
              <input type="text" id="task-desc" class="input-field" placeholder="Deskripsi singkat">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-deadline-date">Deadline Tanggal</label>
              <input type="date" id="task-deadline-date" class="input-field">
            </div>
            <div class="form-group">
              <label class="form-label" for="task-deadline-time">Jam (opsional)</label>
              <input type="time" id="task-deadline-time" class="input-field">
            </div>
            <div class="form-group">
              <label class="form-label" for="task-priority">Prioritas</label>
              <select id="task-priority" class="input-field">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="task-category">Kategori</label>
              <select id="task-category" class="input-field">
                <option value="">— Tanpa kategori —</option>
                ${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="task-recurring-toggle">
                Ulangi
              </label>
              <select id="task-recurring-type" class="input-field" disabled>
                <option value="daily">Setiap hari</option>
                <option value="weekly">Setiap minggu</option>
                <option value="monthly">Setiap bulan</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary form-submit">Tambah Task</button>
        </form>
      </div>

      <div class="todo-lists" data-aos="fade-up" data-aos-delay="200">
        ${this.renderGroup('Terlewat', groups.overdue, 'alert-circle', 'text-danger')}
        ${this.renderGroup('Hari Ini', groups.today, 'sun', 'text-accent')}
        ${this.renderGroup('Mendatang', groups.upcoming, 'calendar', 'text-secondary')}
        ${this.renderGroup('Selesai', groups.completed, 'check-circle', 'text-success')}
      </div>

      <div class="todo-categories-section card" data-aos="fade-up" data-aos-delay="300">
        <div class="card-header">
          <h3 class="card-title">Kategori</h3>
        </div>
        <div class="cat-list">
          ${cats.map(c => `
            <div class="cat-list-item" data-id="${c.id}">
              <span style="display:flex;align-items:center;gap:var(--spacing-sm)">
                <span class="cat-dot" style="background-color:${c.color}"></span>
                ${c.name}
              </span>
              <button class="btn-icon todo-cat-delete" data-id="${c.id}" title="Hapus kategori">
                <i data-lucide="x" width="14" height="14"></i>
              </button>
            </div>
          `).join('')}
        </div>
        <div class="add-cat-row" style="margin-top:var(--spacing-sm)">
          <input type="text" id="new-todo-cat-name" class="input-field" placeholder="Nama kategori baru">
          <input type="color" id="new-todo-cat-color" class="input-field cat-color-input" value="#4ADE80">
          <button class="btn btn-primary" id="add-todo-cat-btn">Tambah</button>
        </div>
      </div>
    `;
  },

  renderGroup(label, tasks, icon, iconClass) {
    if (tasks.length === 0) return '';

    return `
      <div class="todo-group">
        <div class="todo-group-header">
          <i data-lucide="${icon}" width="18" height="18" class="${iconClass}"></i>
          <span class="todo-group-label">${label}</span>
          <span class="todo-group-count">${tasks.length}</span>
        </div>
        <div class="todo-group-list">
          ${tasks.map(t => this.renderTaskCard(t)).join('')}
        </div>
      </div>
    `;
  },

  renderTaskCard(task) {
    const cat = task.categoryId ? this.getCategory(task.categoryId) : null;
    const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
    const overdue = this.isOverdue(task);
    const nearDeadline = this.isNearDeadline(task);
    const allSubtasksDone = task.subtasks.length > 0 && task.subtasks.every(s => s.completed);

    return `
      <div class="todo-task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <label class="todo-checkbox-label">
          <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''}>
          <span class="todo-checkmark"></span>
        </label>
        <div class="todo-task-body">
          <div class="todo-task-title-row">
            <span class="todo-task-title ${task.completed ? 'line-through' : ''}">${this.escHtml(task.title)}</span>
            <span class="badge ${prio.className}">${prio.label}</span>
          </div>
          ${task.description ? `<p class="todo-task-desc">${this.escHtml(task.description)}</p>` : ''}
          <div class="todo-task-meta">
            ${task.deadlineDate ? `
              <span class="todo-meta-item ${overdue ? 'text-danger' : ''}">
                <i data-lucide="clock" width="12" height="12"></i>
                ${this.formatDeadline(task.deadlineDate, task.deadlineTime)}
                ${overdue ? ' (Terlewat)' : ''}
                ${nearDeadline ? '<span class="badge badge-warning">Hampir deadline</span>' : ''}
              </span>
            ` : ''}
            ${cat ? `<span class="todo-meta-item"><span class="cat-dot" style="background-color:${cat.color}"></span>${this.escHtml(cat.name)}</span>` : ''}
            ${task.isRecurring ? `<span class="todo-meta-item"><i data-lucide="repeat" width="12" height="12"></i>${task.recurringType}</span>` : ''}
          </div>
          ${task.subtasks.length > 0 ? `
            <div class="todo-subtask-list">
              ${task.subtasks.map(st => `
                <label class="todo-subtask-item" data-subid="${st.id}">
                  <input type="checkbox" class="todo-sub-checkbox" ${st.completed ? 'checked' : ''}>
                  <span class="todo-sub-text ${st.completed ? 'line-through' : ''}">${this.escHtml(st.title)}</span>
                  <button class="btn-icon todo-sub-delete" data-subid="${st.id}" style="margin-left:auto">
                    <i data-lucide="x" width="12" height="12"></i>
                  </button>
                </label>
              `).join('')}
            </div>
          ` : ''}
          <div class="todo-task-actions">
            <div class="todo-add-sub-row">
              <input type="text" class="input-field todo-sub-input" placeholder="Tambah sub-task..." style="font-size:var(--text-caption);padding:4px 8px">
              <button class="btn-icon todo-add-sub-btn"><i data-lucide="plus" width="14" height="14"></i></button>
            </div>
            <button class="btn-icon todo-delete-btn" title="Hapus task"><i data-lucide="trash-2" width="16" height="16"></i></button>
          </div>
        </div>
      </div>
    `;
  },

  /* ── Calendar View ── */
  renderCalendar() {
    const el = document.getElementById('todo-content-area');
    if (!el) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    const dateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const taskCountByDate = {};
    this.data.tasks.forEach(t => {
      if (t.deadlineDate && !t.completed) {
        taskCountByDate[t.deadlineDate] = (taskCountByDate[t.deadlineDate] || 0) + 1;
      }
    });

    el.innerHTML = `
      <div class="todo-form-section" data-aos="fade-up" data-aos-delay="100">
        <div class="card calendar-card">
          <div class="card-header">
            <h3 class="card-title">${monthNames[month]} ${year}</h3>
            <span class="caption">${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[month]} ${year}</span>
          </div>
          <div class="calendar-grid">
            ${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
            ${Array.from({ length: firstDay }, (_, i) => `<div class="calendar-day empty"></div>`).join('')}
            ${Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const ds = dateStr(day);
              const count = taskCountByDate[ds] || 0;
              const isToday = ds === this.getTodayStr();
              return `
                <div class="calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'has-task' : ''}">
                  <span class="calendar-day-num">${day}</span>
                  ${count > 0 ? `<span class="calendar-task-count">${count}</span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /* ── Helpers ── */
  formatDeadline(date, time) {
    if (!date) return '';
    const d = new Date(date + 'T' + (time || '00:00'));
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmStr = tomorrow.toISOString().slice(0, 10);

    if (date === today) return 'Hari ini' + (time ? `, ${time}` : '');
    if (date === tmStr) return 'Besok' + (time ? `, ${time}` : '');

    const parts = date.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    let formatted = `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
    if (time) formatted += `, ${time}`;
    return formatted;
  },

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
      const target = e.target.closest('[data-action]') || e.target;

      if (target.classList.contains('view-toggle')) {
        this.data.view = target.dataset.view;
        this.save();
        this.render();
        return;
      }

      if (target.classList.contains('todo-delete-btn') || target.closest('.todo-delete-btn')) {
        const btn = target.classList.contains('todo-delete-btn') ? target : target.closest('.todo-delete-btn');
        const card = btn.closest('.todo-task-card');
        if (card && confirm('Hapus task ini?')) {
          this.deleteTask(card.dataset.id);
          this.render();
        }
        return;
      }

      if (target.classList.contains('todo-cat-delete') || target.closest('.todo-cat-delete')) {
        const btn = target.classList.contains('todo-cat-delete') ? target : target.closest('.todo-cat-delete');
        if (confirm('Hapus kategori ini? Task dengan kategori ini akan kehilangan kategorinya.')) {
          this.deleteCategory(btn.dataset.id);
          this.render();
        }
        return;
      }

      if (target.classList.contains('todo-add-sub-btn') || target.closest('.todo-add-sub-btn')) {
        const btn = target.classList.contains('todo-add-sub-btn') ? target : target.closest('.todo-add-sub-btn');
        const row = btn.closest('.todo-add-sub-row');
        const input = row.querySelector('.todo-sub-input');
        const card = btn.closest('.todo-task-card');
        if (input.value.trim() && card) {
          this.addSubtask(card.dataset.id, input.value);
          input.value = '';
          this.render();
        }
        return;
      }

      if (target.classList.contains('todo-sub-delete') || target.closest('.todo-sub-delete')) {
        const btn = target.classList.contains('todo-sub-delete') ? target : target.closest('.todo-sub-delete');
        const item = btn.closest('.todo-subtask-item');
        const card = btn.closest('.todo-task-card');
        if (item && card) {
          this.deleteSubtask(card.dataset.id, item.dataset.subid);
          this.render();
        }
        return;
      }

      if (target.id === 'add-todo-cat-btn') {
        const nameInput = document.getElementById('new-todo-cat-name');
        const colorInput = document.getElementById('new-todo-cat-color');
        if (nameInput.value.trim()) {
          this.addCategory(nameInput.value, colorInput.value);
          nameInput.value = '';
          this.render();
        }
        return;
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('todo-checkbox')) {
        const card = e.target.closest('.todo-task-card');
        if (card) {
          this.toggleComplete(card.dataset.id);
          this.render();
        }
        return;
      }

      if (e.target.classList.contains('todo-sub-checkbox')) {
        const item = e.target.closest('.todo-subtask-item');
        const card = e.target.closest('.todo-task-card');
        if (item && card) {
          this.toggleSubtask(card.dataset.id, item.dataset.subid);
          this.render();
        }
        return;
      }

      if (e.target.id === 'task-recurring-toggle') {
        document.getElementById('task-recurring-type').disabled = !e.target.checked;
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'todo-form') {
        e.preventDefault();
        this.handleFormSubmit();
      }
    });
  },

  handleFormSubmit() {
    const title = document.getElementById('task-title').value.trim();
    if (!title) return;

    const isRecurring = document.getElementById('task-recurring-toggle').checked;

    this.addTask({
      title,
      description: document.getElementById('task-desc').value,
      deadlineDate: document.getElementById('task-deadline-date').value || null,
      deadlineTime: document.getElementById('task-deadline-time').value || null,
      priority: document.getElementById('task-priority').value,
      categoryId: document.getElementById('task-category').value || null,
      isRecurring,
      recurringType: isRecurring ? document.getElementById('task-recurring-type').value : null,
      recurringEnd: null,
    });

    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-deadline-date').value = '';
    document.getElementById('task-deadline-time').value = '';
    document.getElementById('task-recurring-toggle').checked = false;
    document.getElementById('task-recurring-type').disabled = true;
    this.render();
  },
};

window.todoInit = function () {
  Todo.init();
};
