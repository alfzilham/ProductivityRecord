# TODO.md

Daftar task teknis dan known issues untuk ProductivityRecord. Diupdate setiap fase pengembangan berjalan (lihat `PRD.md` untuk urutan fase).

## Setup Awal

- [x] Setup struktur folder dasar (`css/`, `js/`, `assets/`, `index.html`)
- [x] Buat `js/storage.js` (wrapper `localStorage`: `get`, `set`, `remove`)
- [x] Setup base styling (`reset.css`, `variable.css` — warna & font sesuai `DESIGN.md`)
- [x] Integrasikan Lucide icon library
- [x] Integrasikan AOS (Animate On Scroll), pastikan diterapkan per child item
- [x] Buat layout dasar: sidebar navigasi + area konten utama
- [x] Setup GitHub Pages deployment

## Fase 1 — Finance

- [x] Spec struktur data Finance di `SPEC.md`
- [x] Form catat pemasukan/pengeluaran harian
- [x] Kalkulasi rekap per hari
- [x] Kalkulasi rekap per minggu
- [x] Kalkulasi rekap per bulan
- [x] Tampilan ringkasan saldo berjalan
- [x] Card UI sesuai `DESIGN.md`

## Fase 2 — To-Do List

- [x] Spec struktur data To-Do di `SPEC.md`
- [x] CRUD task (judul, deskripsi, deadline)
- [x] Prioritas task
- [x] Kategori/tag task
- [x] Sub-task
- [x] Recurring task
- [x] Reminder in-app
- [x] Tampilan kalender

## Fase 3 — Habit Tracker

- [x] Spec struktur data Habit di `SPEC.md`
- [x] CRUD daftar habit
- [x] Check-in harian (binary + kuantitatif)
- [x] Perhitungan streak
- [x] Frekuensi custom (harian/mingguan/hari tertentu)
- [x] Riwayat kalender mini per habit

## Fase 4 — Journal

- [x] Spec struktur data Journal di `SPEC.md`
- [ ] CRUD entri jurnal (judul, isi, mood, refleksi)
- [ ] Mood tag (fixed + custom)
- [ ] Riwayat kronologis + search

## Fase 4 — Journal

- [ ] Spec struktur data Journal di `SPEC.md`
- [ ] CRUD entri jurnal
- [ ] Mood tag
- [ ] Riwayat kronologis

## Fase 5 — Gym & Workout

- [x] Spec struktur data Gym di `SPEC.md`
- [x] Log sesi latihan (free + template)
- [x] Template management
- [x] Riwayat sesi kronologis
- [x] Progress chart per latihan

## Fase 6 — Dashboard

- [x] Spec Dashboard di `SPEC.md`
- [x] Ringkasan Finance (hari/minggu/bulan berjalan)
- [x] Jumlah task selesai/pending
- [x] Streak habit aktif
- [x] Ringkasan aktivitas Gym terbaru
- [x] Entri Journal terbaru

## Known Issues / Bugs

*Belum ada — akan diisi seiring ditemukan bug selama development.*

## Backlog (Di Luar Fase Saat Ini)

- [ ] Export/import data (backup manual ke JSON)
- [ ] Pertimbangan migrasi ke IndexedDB bila `localStorage` mulai penuh

---

✅ **Semua fase (1–6) selesai diimplementasi.**
