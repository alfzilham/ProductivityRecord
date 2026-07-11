# TODO.md

Daftar task teknis dan known issues untuk ProductivityRecord. Diupdate setiap fase pengembangan berjalan (lihat `PRD.md` untuk urutan fase).

## Setup Awal

- [ ] Setup struktur folder dasar (`css/`, `js/`, `assets/`, `index.html`)
- [ ] Buat `js/storage.js` (wrapper `localStorage`: `get`, `set`, `remove`)
- [ ] Setup base styling (`reset.css`, `variable.css` — warna & font sesuai `DESIGN.md`)
- [ ] Integrasikan Lucide icon library
- [ ] Integrasikan AOS (Animate On Scroll), pastikan diterapkan per child item
- [ ] Buat layout dasar: sidebar navigasi + area konten utama
- [ ] Setup GitHub Pages deployment

## Fase 1 — Finance

- [ ] Spec struktur data Finance di `SPEC.md`
- [ ] Form catat pemasukan/pengeluaran harian
- [ ] Kalkulasi rekap per hari
- [ ] Kalkulasi rekap per minggu
- [ ] Kalkulasi rekap per bulan
- [ ] Tampilan ringkasan saldo berjalan
- [ ] Card UI sesuai `DESIGN.md`

## Fase 2 — To-Do List

- [ ] Spec struktur data To-Do di `SPEC.md`
- [ ] CRUD task (judul, deskripsi, deadline)
- [ ] Prioritas task
- [ ] Kategori/tag task
- [ ] Sub-task
- [ ] Recurring task
- [ ] Reminder in-app
- [ ] Tampilan kalender

## Fase 3 — Habit Tracker

- [ ] Spec struktur data Habit di `SPEC.md`
- [ ] CRUD daftar habit
- [ ] Check-in harian
- [ ] Perhitungan streak

## Fase 4 — Journal

- [ ] Spec struktur data Journal di `SPEC.md`
- [ ] CRUD entri jurnal
- [ ] Mood tag
- [ ] Riwayat kronologis

## Fase 5 — Gym & Workout

- [ ] Spec struktur data Gym di `SPEC.md`
- [ ] Log sesi latihan (set, rep, berat)
- [ ] Riwayat progress per latihan

## Fase 6 — Dashboard

- [ ] Ringkasan Finance (hari/minggu/bulan berjalan)
- [ ] Jumlah task selesai/pending
- [ ] Streak habit aktif
- [ ] Ringkasan aktivitas Gym terbaru
- [ ] Entri Journal terbaru

## Known Issues / Bugs

*Belum ada — akan diisi seiring ditemukan bug selama development.*

## Backlog (Di Luar Fase Saat Ini)

- [ ] Export/import data (backup manual ke JSON)
- [ ] Pertimbangan migrasi ke IndexedDB bila `localStorage` mulai penuh
