# ARCHITECTURE.md

## 1. Overview

Platform produktivitas personal berbasis web, **murni frontend (static site)**, single-user, tanpa backend/server, tanpa database eksternal, dan tanpa autentikasi. Seluruh data disimpan di browser pengguna lewat `localStorage`.

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript (tanpa framework) |
| Penyimpanan Data | `localStorage` (browser) |
| Hosting | GitHub Pages |
| Icon | Lucide |
| Animasi | AOS (Animate On Scroll) |

Tidak ada backend, tidak ada database server, tidak ada layer autentikasi.

## 3. Diagram Alur Sistem

```
[ Browser ]
    |
    | baca/tulis langsung
    v
[ localStorage (per-browser) ]
```

Semua logika — CRUD data, kalkulasi rekap, rendering UI — berjalan sepenuhnya di sisi client (browser), tanpa request ke server mana pun selain memuat file statis (HTML/CSS/JS) dari GitHub Pages.

## 4. Struktur Folder (Rencana)

```
/
├── css/
│   ├── base.css
│   ├── component.css
│   ├── layout.css
│   ├── reset.css
│   ├── responsive.css
│   └── variable.css
├── js/
│   ├── main.js
│   ├── storage.js         # wrapper akses localStorage (get/set/remove per modul)
│   └── modules/            # 1 file per modul (finance.js, todo.js, habit.js, dst)
├── assets/
│   ├── favicon/
│   └── image/
│       ├── banner/
│       └── logo/
├── docs/
│   ├── AGENT.md
│   ├── ARCHITECTURE.md
│   ├── CONTEXT.md
│   ├── DESIGN.md
│   ├── PRD.md
│   ├── SPEC.md
│   └── TODO.md
├── index.html
└── README.md
```

## 5. Data Flow

1. User membuka platform langsung (tanpa login) → `main.js` memuat data awal dari `localStorage` per modul.
2. Setiap aksi (tambah transaksi, tandai task selesai, dll) langsung menulis ke `localStorage` lewat `storage.js`, lalu UI di-update ulang (re-render) secara langsung tanpa reload halaman.
3. Rekap (harian/mingguan/bulanan untuk Finance, statistik gabungan di Dashboard) dihitung on-the-fly di JS dari data yang ada di `localStorage`, tidak ada precomputed value yang disimpan terpisah.

## 6. Deployment

- Repository di-deploy ke **GitHub Pages** langsung dari branch (mis. `main` atau `gh-pages`).
- Tidak ada build step wajib (vanilla JS/CSS/HTML bisa langsung di-serve apa adanya). Kalau nanti dibutuhkan minifikasi, bisa ditambahkan sebagai langkah opsional.
- Tidak ada environment variable yang dibutuhkan karena tidak ada backend/kredensial.

## 7. Batasan Arsitektur (Trade-off yang Disadari)

- Data **tidak sync** antar device/browser — tersimpan hanya di browser tempat data diinput.
- Data bisa **hilang** kalau cache/data browser dibersihkan oleh user atau browser.
- Kapasitas `localStorage` terbatas (umumnya ~5–10MB per origin) — cukup untuk data teks/angka dalam skala personal, tapi perlu diperhatikan jika riwayat data bertambah besar dalam jangka panjang.
