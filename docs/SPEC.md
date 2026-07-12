# SPEC.md — Technical Specification

Dokumen ini berisi spesifikasi teknis fondasi yang berlaku lintas modul (struktur `localStorage`, konvensi kode). Spesifikasi detail per modul (skema data spesifik) ditambahkan ke dokumen ini secara bertahap saat fase modul tsb mulai dikerjakan (lihat `PRD.md`).

## 1. Strategi Penyimpanan Data

- Seluruh data disimpan di **`localStorage`** milik browser.
- Setiap modul punya **key `localStorage` sendiri**, berisi data dalam format JSON (`JSON.stringify` saat menulis, `JSON.parse` saat membaca).
- Akses ke `localStorage` **tidak dilakukan langsung** dari kode modul — selalu lewat wrapper `js/storage.js` supaya konsisten dan mudah diganti (mis. ke IndexedDB) di masa depan bila diperlukan.

## 2. Konvensi Penamaan Key `localStorage`

Format: `remindme:<modul>` (prefix tetap `remindme` untuk konsistensi, walau nama repo sudah berganti menjadi ProductivityRecord).

| Modul         | Key                |
| ------------- | ------------------ |
| Finance       | `remindme:finance` |
| To-Do List    | `remindme:todo`    |
| Habit Tracker | `remindme:habit`   |
| Journal       | `remindme:journal` |
| Gym & Workout | `remindme:gym`     |

## 3. Wrapper Storage (`js/storage.js`)

Fungsi minimal yang disediakan:

```javascript
// Contoh kontrak fungsi (bukan implementasi final)
Storage.get(key); // baca & parse JSON, return array/object kosong bila belum ada
Storage.set(key, data); // stringify & simpan ke localStorage
Storage.remove(key); // hapus key tertentu
```

Semua modul (`finance.js`, `todo.js`, dst) memanggil fungsi ini, tidak pernah memanggil `window.localStorage` secara langsung.

## 4. Konvensi Data

- Setiap record (transaksi, task, habit entry, dll) punya field umum:
  - `id` (string, generate lewat `crypto.randomUUID()` atau timestamp+random)
  - `createdAt` (ISO timestamp)
  - `updatedAt` (ISO timestamp)
- Tanggal disimpan dalam format ISO 8601 (`YYYY-MM-DD` untuk tanggal saja, `YYYY-MM-DDTHH:mm:ss.sssZ` untuk timestamp lengkap) agar mudah di-sort dan difilter.

## 5. Konvensi Kode JS

- Satu file modul (`js/modules/<nama>.js`) menangani: baca data dari storage, render ke DOM, handle interaksi user, tulis balik ke storage.
- Tidak ada state management library — state cukup disimpan sebagai variabel JS in-memory yang disinkronkan ke `localStorage` setiap kali berubah.

## 6. Spesifikasi per Modul

_Ditambahkan bertahap seiring pengembangan tiap fase (lihat `PRD.md`). Setiap sub-bagian di bawah diisi saat fase modul tsb masuk tahap spec._

### 6.1 Finance

**Key localStorage**: `remindme:finance`

#### 6.1.1 Struktur Data

```javascript
{
  // Pengaturan user
  settings: {
    currency: "IDR",             // kode mata uang (IDR, USD, dll)
    currencySymbol: "Rp",        // simbol untuk tampilan
    currencyLocale: "id-ID",     // locale Intl.NumberFormat
    currencyDecimals: 0,         // jumlah desimal (0 untuk IDR, 2 untuk USD)
  },

  // Daftar kategori (fixed default + custom tambahan user)
  categories: [
    {
      id: "cat_xxx",            // crypto.randomUUID()
      name: "Makan & Minum",    // nama kategori
      type: "expense",          // "income" | "expense"
      isFixed: true,            // true = default bawaan (tidak bisa dihapus)
      createdAt: "2026-07-12T10:00:00.000Z",
    }
  ],

  // Semua transaksi
  transactions: [
    {
      id: "txn_xxx",            // crypto.randomUUID()
      date: "2026-07-12",       // YYYY-MM-DD (tanggal transaksi)
      type: "expense",          // "income" | "expense"
      categoryId: "cat_makan",  // referensi ke categories[].id
      amount: 25000,            // integer, dalam satuan mata uang
      description: "Makan siang di warteg",
      createdAt: "2026-07-12T12:30:00.000Z",
      updatedAt: null,
    }
  ],

  // Mode input per hari (default "transaction", bisa "total" untuk total per kategori)
  inputMode: "transaction",     // "transaction" | "total"
}
```

#### 6.1.2 Default Categories (Fixed)

| Tipe    | Kategori                                                                             |
| ------- | ------------------------------------------------------------------------------------ |
| Income  | Gaji, Freelance, Investasi, Hadiah, Lain-lain                                        |
| Expense | Makan & Minum, Transportasi, Belanja, Hiburan, Tagihan & Bayar, Kesehatan, Lain-lain |

Default categories memiliki `isFixed: true` dan tidak bisa dihapus, tapi user bisa menambah kategori custom sendiri (`isFixed: false`).

#### 6.1.3 Ringkasan & Rekap

Semua rekap dihitung **on-the-fly** dari data `transactions` — tidak ada precomputed values yang disimpan:

- **Saldo berjalan**: `sum(income) - sum(expense)` dari seluruh transaksi
- **Rekap hari ini**: filter transaksi dengan `date === today`
- **Rekap minggu ini (calendar)**: filter transaksi dalam rentang Senin–Minggu minggu ini
- **Rekap 7 hari terakhir (rolling)**: filter transaksi `today - 6` sampai `today`
- **Rekap bulan ini**: filter transaksi dalam bulan berjalan

#### 6.1.4 Mode Input

User bisa memilih dua mode input:

- **Per transaksi** (default): Tambah transaksi satu per satu (amount, kategori, deskripsi)
- **Total per kategori**: Dalam satu hari, input total per kategori (lebih cepat untuk catatan massal)

Perubahan mode hanya memengaruhi tampilan form input — data tetap disimpan sebagai array `transactions`.

### 6.2 To-Do List

**Key localStorage**: `remindme:todo`

#### 6.2.1 Struktur Data

```javascript
{
  categories: [
    {
      id: "cat_xxx",
      name: "Pekerjaan",
      color: "#4ADE80",
      createdAt: "...",
    }
  ],
  tasks: [
    {
      id: "task_xxx",
      title: "Belajar JavaScript",
      description: "Selesaikan bab 5",
      deadlineDate: "2026-07-15",      // YYYY-MM-DD
      deadlineTime: "17:00",           // HH:mm (opsional, null jika tanpa jam)
      priority: "medium",              // "low" | "medium" | "high"
      categoryId: "cat_xxx",           // opsional, null jika tanpa kategori
      isRecurring: false,              // true = recurring task
      recurringType: null,             // "daily" | "weekly" | "monthly"
      recurringEnd: null,              // YYYY-MM-DD (opsional, batas akhir recurring)
      completed: false,
      completedAt: null,
      subtasks: [
        {
          id: "sub_xxx",
          title: "Baca dokumentasi",
          completed: false,
        }
      ],
      createdAt: "2026-07-10T10:00:00.000Z",
      updatedAt: null,
    }
  ]
}
```

#### 6.2.2 Prioritas

| Level | Visual |
|---|---|
| High | Badge merah (`badge-danger`) |
| Medium | Badge kuning (`badge-warning`) |
| Low | Badge hijau (`badge-success`) |

#### 6.2.3 Kategori / Tag

User bisa membuat kategori custom dengan nama dan warna. Tidak ada fixed/default categories (beda dengan Finance). Kategori bisa diedit/dihapus. Penghapusan kategori menghapus referensi `categoryId` di task terkait (task tetap ada, kategori jadi null).

#### 6.2.4 Sub-task

- Setiap task bisa memiliki 0+ sub-task
- Sub-task punya: `id`, `title`, `completed`
- Task otomatis ter-centang selesai jika semua sub-task selesai

#### 6.2.5 Recurring Task

- Task dengan `isRecurring: true` memiliki `recurringType: "daily" | "weekly" | "monthly"`
- Saat task di-centang selesai, **task baru** digenerate dengan tanggal deadline berikutnya
- Jika task tidak selesai di periode sebelumnya, task **tetap muncul** (tidak skip) sampai di-centang — user harus centang task lama dulu, baru task baru terbuat
- `recurringEnd` adalah batas akhir (opsional); jika terlewat, task tidak di-recur lagi

#### 6.2.6 In-App Reminder

- Task dengan deadline dalam 24 jam ke depan (dari waktu sekarang) ditandai dengan ikon/teks "Hampir deadline"
- Task yang deadline-nya sudah terlewat (overdue) ditandai dengan teks merah "Terlewat"
- Semua visual indicator — tidak ada notifikasi push/system

#### 6.2.7 Tampilan

- **List View** (default): Group task dalam 4 section — Hari Ini, Mendatang, Terlewat, Selesai
- **Kalender View**: Grid kalender mini (seperti kalender bulanan), menampilkan jumlah task per tanggal

### 6.3 Habit Tracker

**Key localStorage**: `remindme:habit`

#### 6.3.1 Struktur Data

```javascript
{
  habits: [
    {
      id: "habit_xxx",
      name: "Minum Air",
      description: "Minum 8 gelas air putih",
      frequency: "daily",           // "daily" | "weekly" | "custom"
      customDays: null,              // ["mon","wed","fri"] jika frequency="custom"
      weeklyTarget: null,            // 3 jika frequency="weekly" (target 3x seminggu)
      hasTarget: false,              // true = kuantitatif
      targetValue: null,             // misal 8 untuk "8 gelas"
      targetUnit: null,              // misal "gelas"
      sortOrder: 0,
      createdAt: "...",
    }
  ],
  entries: [
    {
      id: "entry_xxx",
      habitId: "habit_xxx",
      date: "2026-07-12",           // YYYY-MM-DD
      value: null,                   // angka untuk kuantitatif; null untuk binary
      completed: true,               // binary flag
      createdAt: "...",
    }
  ]
}
```

#### 6.3.2 Frekuensi

| Value | Deskripsi |
|---|---|
| `daily` | Setiap hari — check-in required setiap hari |
| `weekly` | X kali seminggu (ditentukan `weeklyTarget`) — tidak terikat hari spesifik |
| `custom` | Hari-hari tertentu dalam seminggu (`customDays`: `["mon","wed","fri"]`) |

#### 6.3.3 Streak

- **Current streak**: jumlah hari berturut-turut (consecutive days) habit di-check-in sampai hari ini
- **Longest streak**: streak terpanjang yang pernah dicapai
- Streak dihitung dari data `entries`:
  - Urutkan entries descending by date
  - Hitung consecutive days dari hari ini ke belakang (atau dari entry terakhir)
  - Jika ada gap (hari terlewat), streak putus

#### 6.3.4 Kalender Mini

- Setiap habit menampilkan 30 hari terakhir dalam bentuk grid kalender mini
- Hari yang ter-check-in diwarnai (hijau), yang terlewat abu-abu/kosong
- Hari ini ditandai khusus

### 6.4 Journal — _(belum dispesifikasikan, Fase 4)_

### 6.5 Gym & Workout — _(belum dispesifikasikan, Fase 5)_

### 6.6 Dashboard — _(belum dispesifikasikan, Fase 6)_
