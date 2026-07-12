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

### 6.2 To-Do List — _(belum dispesifikasikan, Fase 2)_

### 6.3 Habit Tracker — _(belum dispesifikasikan, Fase 3)_

### 6.4 Journal — _(belum dispesifikasikan, Fase 4)_

### 6.5 Gym & Workout — _(belum dispesifikasikan, Fase 5)_

### 6.6 Dashboard — _(belum dispesifikasikan, Fase 6)_
