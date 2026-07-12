const DEFAULT_CATEGORIES = [
  { id: 'cat_income_gaji', name: 'Gaji', type: 'income', isFixed: true },
  { id: 'cat_income_freelance', name: 'Freelance', type: 'income', isFixed: true },
  { id: 'cat_income_investasi', name: 'Investasi', type: 'income', isFixed: true },
  { id: 'cat_income_hadiah', name: 'Hadiah', type: 'income', isFixed: true },
  { id: 'cat_income_lain', name: 'Lain-lain', type: 'income', isFixed: true },
  { id: 'cat_expense_makan', name: 'Makan & Minum', type: 'expense', isFixed: true },
  { id: 'cat_expense_transport', name: 'Transportasi', type: 'expense', isFixed: true },
  { id: 'cat_expense_belanja', name: 'Belanja', type: 'expense', isFixed: true },
  { id: 'cat_expense_hiburan', name: 'Hiburan', type: 'expense', isFixed: true },
  { id: 'cat_expense_tagihan', name: 'Tagihan & Bayar', type: 'expense', isFixed: true },
  { id: 'cat_expense_kesehatan', name: 'Kesehatan', type: 'expense', isFixed: true },
  { id: 'cat_expense_lain', name: 'Lain-lain', type: 'expense', isFixed: true },
];

const DEFAULT_SETTINGS = {
  currency: 'IDR',
  currencySymbol: 'Rp',
  currencyLocale: 'id-ID',
  currencyDecimals: 0,
};

const STORAGE_KEY = 'remindme:finance';

const Finance = {
  data: null,

  loadData() {
    const raw = Storage.get(STORAGE_KEY);
    if (raw && raw.settings && raw.categories && raw.transactions) {
      this.data = raw;
      return;
    }

    this.data = {
      settings: { ...DEFAULT_SETTINGS },
      categories: DEFAULT_CATEGORIES.map(c => ({
        ...c,
        createdAt: new Date().toISOString(),
      })),
      transactions: [],
      inputMode: 'transaction',
    };
    this.save();
  },

  save() {
    Storage.set(STORAGE_KEY, this.data);
  },

  getCategories(type = null) {
    if (!type) return [...this.data.categories];
    return this.data.categories.filter(c => c.type === type);
  },

  getCategory(id) {
    return this.data.categories.find(c => c.id === id);
  },

  addTransaction({ date, type, categoryId, amount, description }) {
    const txn = {
      id: crypto.randomUUID(),
      date,
      type,
      categoryId,
      amount: Math.round(Math.abs(amount)),
      description: (description || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    this.data.transactions.push(txn);
    this.save();
    return txn;
  },

  deleteTransaction(id) {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.save();
  },

  addCategory(name, type) {
    const cat = {
      id: `cat_${crypto.randomUUID()}`,
      name: name.trim(),
      type,
      isFixed: false,
      createdAt: new Date().toISOString(),
    };
    this.data.categories.push(cat);
    this.save();
    return cat;
  },

  deleteCategory(id) {
    const cat = this.data.categories.find(c => c.id === id);
    if (!cat || cat.isFixed) return false;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.data.transactions = this.data.transactions.filter(t => t.categoryId !== id);
    this.save();
    return true;
  },

  updateSettings(settings) {
    Object.assign(this.data.settings, settings);
    this.save();
  },

  getToday() {
    return new Date().toISOString().slice(0, 10);
  },

  getTransactionsForDate(date) {
    return this.data.transactions.filter(t => t.date === date);
  },

  getTransactionsForRange(startDate, endDate) {
    return this.data.transactions.filter(t => t.date >= startDate && t.date <= endDate);
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
    const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  },

  calcSummary(txns) {
    let income = 0, expense = 0;
    txns.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { income, expense, total: income - expense };
  },

  formatCurrency(amount) {
    const s = this.data.settings;
    try {
      const formatted = new Intl.NumberFormat(s.currencyLocale, {
        style: 'decimal',
        minimumFractionDigits: s.currencyDecimals,
        maximumFractionDigits: s.currencyDecimals,
      }).format(amount);
      return `${s.currencySymbol} ${formatted}`;
    } catch {
      return `${s.currencySymbol} ${amount}`;
    }
  },

  /* ── Render ── */

  init() {
    this.loadData();
    this.render();
    this.bindEvents();
  },

  render() {
    this.renderSummary();
    this.renderForm();
    this.renderTransactions();
    this.renderRekap();
    this.renderSettingsUI();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  renderSummary() {
    const today = this.getToday();
    const todayTxns = this.getTransactionsForDate(today);
    const todaySum = this.calcSummary(todayTxns);

    const week = this.getCalendarWeek(today);
    const weekTxns = this.getTransactionsForRange(week.start, week.end);
    const weekSum = this.calcSummary(weekTxns);

    const rollingStart = new Date();
    rollingStart.setDate(rollingStart.getDate() - 6);
    const rs = rollingStart.toISOString().slice(0, 10);
    const rollingTxns = this.getTransactionsForRange(rs, today);
    const rollingSum = this.calcSummary(rollingTxns);

    const monthRange = this.getMonthRange(today);
    const monthTxns = this.getTransactionsForRange(monthRange.start, monthRange.end);
    const monthSum = this.calcSummary(monthTxns);

    const allSum = this.calcSummary(this.data.transactions);

    const el = document.getElementById('finance-summary');
    if (!el) return;
    el.innerHTML = `
      <div class="summary-grid" data-aos="fade-up" data-aos-delay="100">
        <div class="card summary-card summary-balance">
          <span class="summary-label">Saldo</span>
          <span class="summary-value ${allSum.total < 0 ? 'text-danger' : 'text-accent'}">${this.formatCurrency(allSum.total)}</span>
          <span class="summary-sub">Pemasukan: ${this.formatCurrency(allSum.income)} · Pengeluaran: ${this.formatCurrency(allSum.expense)}</span>
        </div>
        <div class="card summary-card">
          <span class="summary-label">Hari Ini</span>
          <span class="summary-value ${todaySum.total < 0 ? 'text-danger' : 'text-accent'}">${this.formatCurrency(todaySum.total)}</span>
          <span class="summary-sub">${this.formatCurrency(todaySum.income)} masuk / ${this.formatCurrency(todaySum.expense)} keluar</span>
        </div>
        <div class="card summary-card">
          <span class="summary-label">Minggu Ini</span>
          <span class="summary-value ${weekSum.total < 0 ? 'text-danger' : 'text-accent'}">${this.formatCurrency(weekSum.total)}</span>
          <span class="summary-sub">${week.start} — ${week.end}</span>
        </div>
        <div class="card summary-card">
          <span class="summary-label">7 Hari Terakhir</span>
          <span class="summary-value ${rollingSum.total < 0 ? 'text-danger' : 'text-accent'}">${this.formatCurrency(rollingSum.total)}</span>
          <span class="summary-sub">${rs} — ${today}</span>
        </div>
        <div class="card summary-card">
          <span class="summary-label">Bulan Ini</span>
          <span class="summary-value ${monthSum.total < 0 ? 'text-danger' : 'text-accent'}">${this.formatCurrency(monthSum.total)}</span>
          <span class="summary-sub">${monthRange.start} — ${monthRange.end}</span>
        </div>
      </div>
    `;
    if (typeof AOS !== 'undefined') AOS.refreshHard();
  },

  renderForm() {
    const el = document.getElementById('finance-form');
    if (!el) return;

    const mode = this.data.inputMode;
    const incomeCats = this.getCategories('income');
    const expenseCats = this.getCategories('expense');

    el.innerHTML = `
      <div class="card form-card" data-aos="fade-up" data-aos-delay="150">
        <div class="card-header">
          <h3 class="card-title">Catat Transaksi</h3>
          <div class="mode-toggle">
            <button class="mode-btn ${mode === 'transaction' ? 'active' : ''}" data-mode="transaction">Per Transaksi</button>
            <button class="mode-btn ${mode === 'total' ? 'active' : ''}" data-mode="total">Total per Kategori</button>
          </div>
        </div>
        <form id="transaction-form">
          ${mode === 'total' ? this.renderTotalForm(incomeCats, expenseCats) : this.renderSingleForm(incomeCats, expenseCats)}
        </form>
      </div>
    `;
  },

  renderSingleForm(incomeCats, expenseCats) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipe</label>
          <div class="type-toggle">
            <button type="button" class="type-btn active" data-type="expense">Pengeluaran</button>
            <button type="button" class="type-btn" data-type="income">Pemasukan</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="txn-date">Tanggal</label>
          <input type="date" id="txn-date" class="input-field" value="${this.getToday()}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="txn-category">Kategori</label>
          <select id="txn-category" class="input-field">
            ${expenseCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="txn-amount">Jumlah</label>
          <input type="number" id="txn-amount" class="input-field" placeholder="0" min="0" step="1">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group full-width">
          <label class="form-label" for="txn-desc">Deskripsi (opsional)</label>
          <input type="text" id="txn-desc" class="input-field" placeholder="Mis: Makan siang di warteg">
        </div>
      </div>
      <button type="submit" class="btn btn-primary form-submit">Simpan</button>
    `;
  },

  renderTotalForm(incomeCats, expenseCats) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipe</label>
          <div class="type-toggle">
            <button type="button" class="type-btn active" data-type="expense">Pengeluaran</button>
            <button type="button" class="type-btn" data-type="income">Pemasukan</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="total-date">Tanggal</label>
          <input type="date" id="total-date" class="input-field" value="${this.getToday()}">
        </div>
      </div>
      <div id="total-categories-list">
        ${this.renderTotalCategoryInputs('expense', expenseCats)}
      </div>
      <button type="submit" class="btn btn-primary form-submit">Simpan Semua</button>
    `;
  },

  renderTotalCategoryInputs(type, cats) {
    return cats.map(c => `
      <div class="form-row total-cat-row">
        <div class="form-group cat-label">
          <label>${c.name}</label>
        </div>
        <div class="form-group cat-input">
          <input type="number" class="input-field total-cat-amount" data-cat-id="${c.id}" placeholder="0" min="0" step="1">
        </div>
      </div>
    `).join('');
  },

  renderTransactions() {
    const el = document.getElementById('finance-transactions');
    if (!el) return;

    const today = this.getToday();
    const txns = this.getTransactionsForDate(today);

    if (txns.length === 0) {
      el.innerHTML = `
        <div class="card" data-aos="fade-up" data-aos-delay="200">
          <div class="card-header">
            <h3 class="card-title">Transaksi Hari Ini</h3>
          </div>
          <p class="text-muted">Belum ada transaksi hari ini.</p>
        </div>
      `;
      return;
    }

    txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    el.innerHTML = `
      <div class="card" data-aos="fade-up" data-aos-delay="200">
        <div class="card-header">
          <h3 class="card-title">Transaksi Hari Ini</h3>
          <span class="badge ${txns.length > 0 ? 'badge-success' : ''}">${txns.length} transaksi</span>
        </div>
        <ul class="txn-list">
          ${txns.map(t => {
            const cat = this.getCategory(t.categoryId);
            return `
              <li class="txn-item" data-id="${t.id}">
                <div class="txn-left">
                  <span class="txn-cat-name">${cat ? cat.name : 'Unknown'}</span>
                  ${t.description ? `<span class="txn-desc">${t.description}</span>` : ''}
                </div>
                <div class="txn-right">
                  <span class="txn-amount ${t.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                  </span>
                  <button class="btn-icon txn-delete" data-id="${t.id}" title="Hapus">
                    <i data-lucide="trash-2" width="16" height="16"></i>
                  </button>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  },

  renderRekap() {
    const el = document.getElementById('finance-rekap');
    if (!el) return;

    const today = this.getToday();

    const week = this.getCalendarWeek(today);
    const weekTxns = this.getTransactionsForRange(week.start, week.end);
    const weekSum = this.calcSummary(weekTxns);

    const rollingStart = new Date();
    rollingStart.setDate(rollingStart.getDate() - 6);
    const rs = rollingStart.toISOString().slice(0, 10);
    const rollingTxns = this.getTransactionsForRange(rs, today);
    const rollingSum = this.calcSummary(rollingTxns);

    const monthRange = this.getMonthRange(today);
    const monthTxns = this.getTransactionsForRange(monthRange.start, monthRange.end);
    const monthSum = this.calcSummary(monthTxns);

    el.innerHTML = `
      <div class="rekap-grid" data-aos="fade-up" data-aos-delay="250">
        <div class="card rekap-card">
          <div class="card-header">
            <h3 class="card-title">Minggu Ini (Kalender)</h3>
            <span class="caption">${week.start} — ${week.end}</span>
          </div>
          ${this.renderRekapDetail(weekTxns)}
        </div>
        <div class="card rekap-card">
          <div class="card-header">
            <h3 class="card-title">7 Hari Terakhir</h3>
            <span class="caption">${rs} — ${today}</span>
          </div>
          ${this.renderRekapDetail(rollingTxns)}
        </div>
        <div class="card rekap-card">
          <div class="card-header">
            <h3 class="card-title">Bulan Ini</h3>
            <span class="caption">${monthRange.start} — ${monthRange.end}</span>
          </div>
          ${this.renderRekapDetail(monthTxns)}
        </div>
      </div>
    `;
  },

  renderRekapDetail(txns) {
    const sum = this.calcSummary(txns);

    const grouped = {};
    txns.forEach(t => {
      if (!grouped[t.categoryId]) {
        const cat = this.getCategory(t.categoryId);
        grouped[t.categoryId] = { name: cat ? cat.name : 'Unknown', type: t.type, total: 0 };
      }
      grouped[t.categoryId].total += t.amount;
    });

    const sorted = Object.values(grouped).sort((a, b) => b.total - a.total);

    return `
      <div class="rekap-summary-row">
        <span>Total</span>
        <span class="${sum.total < 0 ? 'text-danger' : 'text-accent'}">${this.formatCurrency(sum.total)}</span>
      </div>
      ${sorted.length > 0 ? `
        <ul class="rekap-cat-list">
          ${sorted.map(g => `
            <li class="rekap-cat-item">
              <span class="rekap-cat-name">${g.name}</span>
              <span class="rekap-cat-amount ${g.type === 'income' ? 'text-success' : 'text-danger'}">
                ${g.type === 'income' ? '+' : '-'}${this.formatCurrency(g.total)}
              </span>
            </li>
          `).join('')}
        </ul>
      ` : '<p class="text-muted" style="margin-top:var(--spacing-sm)">Belum ada data.</p>'}
    `;
  },

  renderSettingsUI() {
    const el = document.getElementById('finance-settings');
    if (!el) return;

    const s = this.data.settings;
    const incomeCats = this.getCategories('income');
    const expenseCats = this.getCategories('expense');

    el.innerHTML = `
      <div class="card settings-card" data-aos="fade-up" data-aos-delay="300">
        <div class="card-header">
          <h3 class="card-title">Pengaturan</h3>
        </div>

        <div class="settings-section">
          <h4 class="settings-section-title">Mata Uang</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="settings-currency">Kode Mata Uang</label>
              <select id="settings-currency" class="input-field">
                <option value="IDR" ${s.currency === 'IDR' ? 'selected' : ''}>IDR - Rupiah</option>
                <option value="USD" ${s.currency === 'USD' ? 'selected' : ''}>USD - Dollar</option>
                <option value="MYR" ${s.currency === 'MYR' ? 'selected' : ''}>MYR - Ringgit</option>
                <option value="SGD" ${s.currency === 'SGD' ? 'selected' : ''}>SGD - Dollar Singapore</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="settings-symbol">Simbol</label>
              <input type="text" id="settings-symbol" class="input-field" value="${s.currencySymbol}" maxlength="5">
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4 class="settings-section-title">Kategori Pemasukan</h4>
          <ul class="cat-list" id="income-cat-list">
            ${incomeCats.map(c => this.renderCategoryItem(c)).join('')}
          </ul>
          <div class="add-cat-row">
            <input type="text" id="new-income-cat" class="input-field" placeholder="Nama kategori baru">
            <button class="btn btn-primary add-cat-btn" data-type="income">Tambah</button>
          </div>
        </div>

        <div class="settings-section">
          <h4 class="settings-section-title">Kategori Pengeluaran</h4>
          <ul class="cat-list" id="expense-cat-list">
            ${expenseCats.map(c => this.renderCategoryItem(c)).join('')}
          </ul>
          <div class="add-cat-row">
            <input type="text" id="new-expense-cat" class="input-field" placeholder="Nama kategori baru">
            <button class="btn btn-primary add-cat-btn" data-type="expense">Tambah</button>
          </div>
        </div>
      </div>
    `;
  },

  renderCategoryItem(cat) {
    return `
      <li class="cat-list-item" data-id="${cat.id}">
        <span>${cat.name}</span>
        ${cat.isFixed ? '<span class="badge" style="opacity:0.5">default</span>' : `<button class="btn-icon cat-delete" data-id="${cat.id}" title="Hapus"><i data-lucide="x" width="14" height="14"></i></button>`}
      </li>
    `;
  },

  /* ── Events ── */

  bindEvents() {
    if (this._bound) return;
    this._bound = true;

    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]') || e.target;

      if (target.classList.contains('mode-btn')) {
        this.handleModeToggle(target);
      }

      if (target.classList.contains('type-btn')) {
        this.handleTypeToggle(target);
      }

      if (target.classList.contains('txn-delete') || target.closest('.txn-delete')) {
        const btn = target.classList.contains('txn-delete') ? target : target.closest('.txn-delete');
        this.handleDeleteTxn(btn.dataset.id);
      }

      if (target.classList.contains('add-cat-btn')) {
        this.handleAddCategory(target);
      }

      if (target.classList.contains('cat-delete') || target.closest('.cat-delete')) {
        const btn = target.classList.contains('cat-delete') ? target : target.closest('.cat-delete');
        this.handleDeleteCategory(btn.dataset.id);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'settings-currency' || e.target.id === 'settings-symbol') {
        this.handleSettingsChange();
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'transaction-form') {
        e.preventDefault();
        this.handleFormSubmit();
      }
    });
  },

  handleModeToggle(btn) {
    this.data.inputMode = btn.dataset.mode;
    this.save();
    this.renderForm();
    this.renderTransactions();
    this.renderRekap();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    this.bindEvents();
  },

  handleTypeToggle(btn) {
    const form = btn.closest('form') || document.getElementById('transaction-form');
    const container = form.querySelector('.type-toggle');
    container.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.updateCategorySelect(btn.dataset.type);
  },

  updateCategorySelect(type) {
    const select = document.getElementById('txn-category');
    if (!select) return;
    const cats = this.getCategories(type);
    select.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  },

  handleFormSubmit() {
    const mode = this.data.inputMode;

    if (mode === 'total') {
      this.handleTotalSubmit();
      return;
    }

    const typeEl = document.querySelector('.type-btn.active');
    const date = document.getElementById('txn-date').value;
    const categoryId = document.getElementById('txn-category').value;
    const amount = parseInt(document.getElementById('txn-amount').value) || 0;
    const description = document.getElementById('txn-desc').value;

    if (amount <= 0) return;
    if (!date) return;

    this.addTransaction({
      date,
      type: typeEl ? typeEl.dataset.type : 'expense',
      categoryId,
      amount,
      description,
    });

    document.getElementById('txn-amount').value = '';
    document.getElementById('txn-desc').value = '';
    this.render();
  },

  handleTotalSubmit() {
    const typeEl = document.querySelector('.type-btn.active');
    const type = typeEl ? typeEl.dataset.type : 'expense';
    const date = document.getElementById('total-date').value;
    if (!date) return;

    const inputs = document.querySelectorAll('.total-cat-amount');
    let hasAny = false;

    inputs.forEach(input => {
      const amount = parseInt(input.value) || 0;
      if (amount > 0) {
        hasAny = true;
        this.addTransaction({
          date,
          type,
          categoryId: input.dataset.catId,
          amount,
          description: '',
        });
      }
    });

    if (!hasAny) return;

    inputs.forEach(input => { input.value = ''; });
    this.render();
  },

  handleDeleteTxn(id) {
    if (!confirm('Hapus transaksi ini?')) return;
    this.deleteTransaction(id);
    this.render();
  },

  handleAddCategory(btn) {
    const type = btn.dataset.type;
    const input = document.getElementById(`new-${type}-cat`);
    const name = input.value.trim();
    if (!name) return;
    this.addCategory(name, type);
    input.value = '';
    this.render();
  },

  handleDeleteCategory(id) {
    if (!confirm('Hapus kategori ini? Semua transaksi dengan kategori ini juga akan dihapus.')) return;
    this.deleteCategory(id);
    this.render();
  },

  handleSettingsChange() {
    const currency = document.getElementById('settings-currency').value;
    const symbol = document.getElementById('settings-symbol').value;
    const localeMap = { IDR: 'id-ID', USD: 'en-US', MYR: 'ms-MY', SGD: 'en-SG' };
    const decimalsMap = { IDR: 0, USD: 2, MYR: 0, SGD: 2 };

    this.updateSettings({
      currency,
      currencySymbol: symbol,
      currencyLocale: localeMap[currency] || 'id-ID',
      currencyDecimals: decimalsMap[currency] !== undefined ? decimalsMap[currency] : 0,
    });

    this.render();
  },
};

window.financeInit = function () {
  Finance.init();
};
