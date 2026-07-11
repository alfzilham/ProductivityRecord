# DESIGN.md

Design system UI/UX untuk platform. Dokumen ini fokus pada tampilan visual — untuk arsitektur teknis lihat `ARCHITECTURE.md`, untuk spesifikasi data lihat `SPEC.md`.

## 1. Tema

**Dark mode saja** (tidak ada light mode/toggle di versi awal).

## 2. Palet Warna

| Peran                 | Warna                                           | Contoh Hex (acuan awal) |
| --------------------- | ----------------------------------------------- | ----------------------- |
| Background utama      | Hitam/abu sangat gelap                          | `#0D0D0D` – `#121212`   |
| Surface/card          | Abu gelap, sedikit lebih terang dari background | `#1A1A1A` – `#1E1E1E`   |
| Aksen utama           | Silver/metallic                                 | `#C0C0C8` – `#D9D9E0`   |
| Teks utama            | Putih/abu sangat terang                         | `#F5F5F5`               |
| Teks sekunder         | Abu redup                                       | `#9A9A9E`               |
| Border/divider        | Abu gelap tipis                                 | `#2A2A2E`               |
| Status sukses         | Hijau muted                                     | `#4ADE80`               |
| Status warning/bahaya | Merah/oranye muted                              | `#F87171` / `#FBBF24`   |

_Hex di atas adalah acuan awal, bisa disesuaikan saat implementasi selama tetap dalam nuansa dark + silver metallic._

## 3. Tipografi

- **Font**: Montserrat (Google Fonts)
- **Heading**: Montserrat SemiBold/Bold
- **Body**: Montserrat Regular/Medium
- **Skala ukuran** (acuan):
  - H1: 28–32px
  - H2: 22–24px
  - H3: 18px
  - Body: 14–15px
  - Caption/label: 12px

## 4. Ikon

- Menggunakan **Lucide** icon library secara konsisten di seluruh platform (sidebar, tombol aksi, status, dsb).
- Ukuran default 20–24px, warna mengikuti konteks (silver untuk aktif, abu redup untuk inactive).

## 5. Layout & Navigasi

- **Sidebar navigasi vertikal di kiri**, berisi ikon-ikon per modul (Finance, To-Do, Habit, Journal, Gym, Dashboard).
- Sidebar collapsible/icon-only untuk hemat ruang, dengan tooltip nama modul saat hover.
- Konten utama mengisi area kanan, dengan header ringan (judul halaman, aksi utama) di bagian atas.

## 6. Pola Tampilan per Modul

Tidak seragam — disesuaikan dengan sifat datanya:

| Modul         | Pola Tampilan                                                           |
| ------------- | ----------------------------------------------------------------------- |
| Finance       | Card-based (ringkasan saldo, rekap harian/mingguan/bulanan, grafik)     |
| Dashboard     | Card-based (statistik gabungan semua modul, progress ring)              |
| Gym & Workout | Card-based (riwayat sesi, progress per latihan)                         |
| To-Do List    | List-based (daftar task, grouping per prioritas/tanggal, calendar view) |
| Journal       | List-based (daftar entri kronologis)                                    |
| Habit Tracker | Kombinasi: grid/list harian untuk check-in + card ringkasan streak      |

## 7. Komponen UI Umum

- **Card**: rounded corners (mis. 16–20px radius), sedikit elevasi/shadow halus, background surface lebih terang dari base.
- **Progress ring/chart**: dipakai untuk metrik seperti habit streak, ringkasan rekap keuangan, dsb.
- **Tombol primer**: warna aksen silver dengan teks gelap kontras, rounded.
- **Input field**: background surface gelap, border tipis, focus state pakai warna aksen silver.

## 8. Animasi

- Menggunakan **AOS (Animate On Scroll)**.
- Diterapkan **per child item**, bukan per container — setiap card/elemen di dalam sebuah section punya animasi entrance sendiri (staggered fade-in/slide-up), bukan section-nya sekaligus muncul bersamaan.
- Gunakan delay bertahap antar child (mis. kelipatan 50–100ms) untuk efek staggered yang halus.

## 9. Responsivitas

- Layout harus tetap fungsional di mobile: sidebar bisa berubah jadi bottom navigation atau collapsible drawer di layar sempit.
- Card-based grid menyesuaikan jadi 1 kolom di mobile, 2–3 kolom di desktop.
