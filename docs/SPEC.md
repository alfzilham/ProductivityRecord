# SPEC.md — Technical Specification

Dokumen ini berisi spesifikasi teknis fondasi yang berlaku lintas modul (struktur `localStorage`, konvensi kode). Spesifikasi detail per modul (skema data spesifik) ditambahkan ke dokumen ini secara bertahap saat fase modul tsb mulai dikerjakan (lihat `PRD.md`).

## 1. Strategi Penyimpanan Data

- Seluruh data disimpan di **`localStorage`** milik browser.
- Setiap modul punya **key `localStorage` sendiri**, berisi data dalam format JSON (`JSON.stringify` saat menulis, `JSON.parse` saat membaca).
- Akses ke `localStorage` **tidak dilakukan langsung** dari kode modul — selalu lewat wrapper `js/storage.js` supaya konsisten dan mudah diganti (mis. ke IndexedDB) di masa depan bila diperlukan.

## 2. Konvensi Penamaan Key `localStorage`

Format: `remindme:<modul>` (prefix tetap `remindme` untuk konsistensi, walau nama repo sudah berganti menjadi ProductivityRecord).

| Modul | Key |
|---|---|
| Finance | `remindme:finance` |
| To-Do List | `remindme:todo` |
| Habit Tracker | `remindme:habit` |
| Journal | `remindme:journal` |
| Gym & Workout | `remindme:gym` |

## 3. Wrapper Storage (`js/storage.js`)

Fungsi minimal yang disediakan:

```javascript
// Contoh kontrak fungsi (bukan implementasi final)
Storage.get(key)          // baca & parse JSON, return array/object kosong bila belum ada
Storage.set(key, data)    // stringify & simpan ke localStorage
Storage.remove(key)       // hapus key tertentu
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

*Ditambahkan bertahap seiring pengembangan tiap fase (lihat `PRD.md`). Setiap sub-bagian di bawah diisi saat fase modul tsb masuk tahap spec.*

### 6.1 Finance — *(belum dispesifikasikan, Fase 1)*
### 6.2 To-Do List — *(belum dispesifikasikan, Fase 2)*
### 6.3 Habit Tracker — *(belum dispesifikasikan, Fase 3)*
### 6.4 Journal — *(belum dispesifikasikan, Fase 4)*
### 6.5 Gym & Workout — *(belum dispesifikasikan, Fase 5)*
### 6.6 Dashboard — *(belum dispesifikasikan, Fase 6)*
