# CONTEXT.md

## 1. Latar Belakang

Saat ini pencatatan produktivitas pribadi (keuangan, to-do, kebiasaan, jurnal, olahraga) tersebar di berbagai aplikasi/catatan terpisah. Proyek ini dibuat untuk menyatukan semua pencatatan tersebut dalam satu platform pribadi yang ringan dan bisa langsung dipakai tanpa hambatan (tanpa login, tanpa server).

## 2. Tujuan

Membangun web platform personal untuk mencatat dan merekap produktivitas sehari-hari, mencakup:

- Pengelolaan keuangan (pemasukan, pengeluaran, rekap harian/mingguan/bulanan)
- To-do list dan manajemen tugas
- Fitur produktivitas pendukung lainnya (habit tracker, journal, gym/workout tracker)
- Dashboard yang merangkum semua data di atas dalam satu tampilan

## 3. Target Pengguna

Single-user — dibangun dan digunakan oleh pemilik proyek sendiri, di browser miliknya sendiri. Tidak ada kebutuhan multi-tenant, multi-device sync, atau kolaborasi antar pengguna.

## 4. Mengapa Murni Frontend (Tanpa Backend/Database)

- Kebutuhan sebenarnya cukup sederhana: mencatat & merekap data pribadi di satu device/browser
- Menghindari kompleksitas & biaya operasional server, database, dan autentikasi
- Deploy dan maintenance jauh lebih ringan — cukup static hosting (GitHub Pages)
- Data cukup tersimpan lokal di browser (`localStorage`), tidak perlu diakses dari device lain

## 5. Prinsip yang Dipegang

- **Simpel dulu, kompleks belakangan** — tiap modul dibangun bertahap per fase, mulai dari fitur inti
- **Personal-first** — desain dan fitur dioptimalkan untuk satu pengguna di satu browser, bukan skala besar
- **Zero-friction** — tidak ada login, tidak ada setup server; buka browser, langsung pakai

## 6. Non-Goals (Di Luar Cakupan)

- Tidak ada sinkronisasi data lintas device/browser
- Tidak ada backend, database eksternal, atau autentikasi
- Tidak ada fitur backup/export otomatis di versi awal
- Tidak ada fitur sosial (share, comment, follow, dst)
- Tidak menargetkan native mobile app — cukup web app yang responsif di browser mobile
