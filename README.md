# Pengumpulan UTS Pemrograman Web Dasar

## Identitas Mahasiswa

- Nama: Gustam Nasyid Sutiansah
- NIM: 2405101083
- Kelas: 5E
- Program Studi: Teknik Informatika
- Mata Kuliah: Pemrograman Web Dasar
- Tahun Akademik: 2026

## Deskripsi

Repository ini berisi source code, dokumentasi hasil pengerjaan Ujian Tengah Semester (UTS)
mata kuliah Pemrograman Web Dasar.

## Deskripsi Pengerjaan UTS

**Simpanin** adalah website untuk menyimpan video dari TikTok, Instagram, dan YouTube.
Pengguna menempelkan tautan video, aplikasi memeriksa tautan dan mengenali platformnya,
lalu menampilkan pilihan format dan kualitas untuk disimpan.

Aplikasi dibuat dengan HTML, CSS, dan JavaScript murni (tanpa framework dan tanpa server).
Pada tahap UTS ini hanya sisi tampilan (front-end) yang dikerjakan:

- Validasi tautan dan deteksi platform sudah berjalan sungguhan.
- Informasi video dan pilihan format memakai **data contoh (demo)**.
- Tombol "Simpan" belum mengunduh file; proses unduhan akan disambungkan ke server pada tahap berikutnya (UAS).
- Akun dan riwayat disimpan di `localStorage` browser, belum di server.

Aplikasi terdiri dari beberapa halaman:

| Halaman | Isi |
| --- | --- |
| `Landing Page/sapaan.html` | Halaman sapaan sesuai waktu dan pengenalan singkat |
| `beranda.html` | Form cari video, hasil pencarian, Tentang Simpanin, Cara Pakai, Fitur, dan FAQ |
| `riwayat.html` | Riwayat pencarian dan unduhan (untuk pengguna yang login) |
| `lapor.html` | Form lapor konten (bisa dipakai tanpa login) |
| `index.html` | Pintu masuk, mengalihkan ke `beranda.html` |

## Fitur yang Diimplementasikan

1. **Cari video dari tautan**: validasi tautan, deteksi platform (TikTok, Instagram, YouTube), pesan kesalahan yang jelas, tombol tempel dari clipboard, dan daftar format hasil pencarian.
2. **Akun opsional (masuk, daftar, keluar)**: validasi form, kata sandi di-hash (SHA-256 dengan garam), dan sesi tersimpan di browser. Setelah login, menu menampilkan sapaan singkat, misalnya "Halo, GN".
3. **Menu akun (dropdown)**: Riwayat, Lapor Konten, dan Keluar ada di dalam menu nama. Sebelum login ditampilkan ikon profil kosong dengan Lapor Konten, Masuk, dan Daftar, sehingga lapor konten tetap bisa diakses tanpa login.
4. **Riwayat aktivitas**: pencarian dan unduhan tercatat per akun, dengan filter, hapus satu entri, hapus semua, dan tombol "Gunakan lagi".
5. **Lapor konten**: validasi form lengkap; nama dan email terisi otomatis dari akun bila sudah login.
6. **Konten informasi di beranda**: Tentang Simpanin, Cara Pakai, Fitur, dan FAQ.
7. **Responsif dan aksesibel**: tampilan menyesuaikan layar HP dan desktop, menu hamburger di layar kecil, tautan "Lewati ke konten utama", dan atribut ARIA pada menu, dialog, dan form.

## Struktur Folder

- `uts/`: Source code dan file pendukung UTS.
  - `index.html`, `beranda.html`, `riwayat.html`, `lapor.html`: halaman aplikasi.
  - `Landing Page/`: halaman sapaan (`sapaan.html`, `sapaan.js`, `style.css`).
  - `style.css`: gaya tampilan bersama.
  - `script.js`: logika bersama (validasi, penyimpanan, akun, menu akun).
  - `beranda.js`, `riwayat.js`, `lapor.js`: skrip khusus tiap halaman.
- `uts/screenshots/`: Bukti visual hasil implementasi.

## Cara Menjalankan Aplikasi

Tidak perlu instalasi apa pun.

1. Unduh atau clone repository ini.
2. Buka folder `uts/`.
3. Buka `index.html` (atau `beranda.html`) dengan browser modern seperti Chrome, Edge, atau Firefox. Cukup klik dua kali berkas tersebut. Untuk melihat sapaan terlebih dahulu, buka `Landing Page/sapaan.html`.
4. Opsional: bisa dijalankan lewat server lokal, misalnya `python -m http.server` di folder `uts/`, lalu buka `http://localhost:8000`.

Catatan: akun dan riwayat tersimpan di browser yang dipakai. Jika data browser dihapus, akun dan riwayat ikut hilang.

## Referensi

- MDN Web Docs: HTML, CSS, JavaScript, elemen `<dialog>`, `localStorage`, dan Web Crypto API (`crypto.subtle`). https://developer.mozilla.org
- WAI-ARIA Authoring Practices untuk pola menu dan dialog yang aksesibel. https://www.w3.org/WAI/ARIA/apg/
