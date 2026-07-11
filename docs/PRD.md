# PRD.md — Product Requirements Document

## 1. Ringkasan Produk

Web platform personal, murni frontend, untuk mencatat dan merekap produktivitas sehari-hari: keuangan, to-do list, kebiasaan, jurnal, dan olahraga — disatukan dalam satu dashboard, tanpa login dan tanpa server.

## 2. Tujuan Produk

- Menyediakan satu tempat terpusat untuk mencatat aktivitas produktivitas harian
- Memberikan gambaran (insight) yang jelas lewat dashboard gabungan
- Bisa langsung dipakai dari browser tanpa hambatan (tanpa login, tanpa setup)

## 3. Pengguna

Single-user (pemilik proyek), diakses dari satu browser/device. Tidak ada sistem akun.

## 4. Modul & Fase Pengembangan

Setiap modul dibangun sebagai fase terpisah, melalui siklus brainstorming → spec → plan → implementasi masing-masing. Seluruh data disimpan di `localStorage`.

### Fase 1 — Finance
**Tujuan**: mencatat dan merekap keuangan pribadi (bukan pembukuan transaksi detail).
- Catat pemasukan & pengeluaran harian
- Rekap total per hari, per minggu, per bulan
- Ringkasan saldo berjalan

### Fase 2 — To-Do List
**Tujuan**: mengelola tugas harian secara lengkap.
- CRUD task (judul, deskripsi, deadline)
- Prioritas task (mis. low/medium/high)
- Kategori/tag task
- Sub-task di dalam sebuah task
- Recurring task (harian/mingguan/bulanan)
- Reminder in-app (tanpa notifikasi push, karena tanpa backend)
- Tampilan kalender untuk melihat task per tanggal

### Fase 3 — Habit Tracker
**Tujuan**: memantau kebiasaan harian.
- Daftar habit yang ingin dilacak
- Check-in harian per habit
- Perhitungan streak (berturut-turut)

### Fase 4 — Journal
**Tujuan**: mencatat jurnal/catatan harian.
- Entri jurnal dengan timestamp
- Mood tag per entri
- Riwayat entri kronologis

### Fase 5 — Gym & Workout
**Tujuan**: mencatat sesi latihan dan progress.
- Log sesi latihan (jenis latihan, set, rep, berat)
- Riwayat progress per jenis latihan dari waktu ke waktu

### Fase 6 — Dashboard
**Tujuan**: merangkum data dari seluruh modul dalam satu tampilan.
- Ringkasan keuangan (hari/minggu/bulan berjalan)
- Jumlah task selesai/pending
- Streak habit aktif
- Ringkasan aktivitas gym terbaru
- Entri jurnal terbaru

## 5. Requirement Lintas Modul

- **Tanpa autentikasi**: aplikasi langsung bisa diakses dan dipakai
- **Penyimpanan**: seluruh data lewat `localStorage`, tidak ada request ke server
- **Desain**: seluruh modul mengikuti design system di `DESIGN.md` (dark theme, silver accent, Montserrat, Lucide icon, AOS animation)
- **Responsif**: dapat digunakan dengan nyaman di desktop maupun mobile browser

## 6. Success Criteria

- Setiap fase modul selesai dibangun dan dapat digunakan end-to-end (input data → tersimpan di `localStorage` → tampil kembali dengan benar setelah reload halaman)
- Data konsisten dan tidak hilang antar sesi selama browser/data tidak dibersihkan
- Dashboard menampilkan data real dari seluruh modul yang sudah dibangun

## 7. Out of Scope (Versi Awal)

- Backend, database eksternal, dan autentikasi
- Sinkronisasi data lintas device/browser
- Export/import (backup manual) data
- Multi-user/kolaborasi
- Native mobile app
- Integrasi pihak ketiga
- Notifikasi push
