/* ===== Simpanin - riwayat.js =====
   Halaman Riwayat: daftar, filter, hapus. Hanya berisi data bila pengguna login.
   Bergantung pada script.js (dimuat lebih dulu). */
(function () {
  'use strict';
  const S = window.Simpanin;
  if (!S) return;
  const $ = S.$;

  const daftarRiwayat = $('daftar-riwayat');
  const riwayatKosong = $('riwayat-kosong');
  const btnHapusSemua = $('btn-hapus-semua');
  const NAMA_JENIS = { unduh: 'Unduhan', cari: 'Pencarian', masuk: 'Akun' };
  let filterAktif = 'semua';

  function render() {
    const pengguna = S.pengguna();
    if (!pengguna) return;

    const semua = ambilRiwayat(pengguna.email);
    const jmlUnduh = semua.filter(function (x) { return x.jenis === 'unduh'; }).length;
    const jmlCari = semua.filter(function (x) { return x.jenis === 'cari'; }).length;
    $('riwayat-ringkasan').textContent = jmlUnduh + ' unduhan · ' + jmlCari + ' pencarian';
    btnHapusSemua.hidden = semua.length === 0;

    const tampil = semua.filter(function (x) {
      return filterAktif === 'semua' || x.jenis === filterAktif;
    });

    daftarRiwayat.textContent = '';
    riwayatKosong.hidden = tampil.length > 0;
    if (!tampil.length) {
      riwayatKosong.textContent = semua.length === 0
        ? 'Belum ada aktivitas. Cari sebuah video di Beranda dan aktivitasnya akan muncul di sini.'
        : 'Tidak ada aktivitas pada filter ini.';
    }

    tampil.forEach(function (x) {
      const li = S.buatEl('li', 'item-riwayat');

      const atas = S.buatEl('div', 'item-atas');
      atas.appendChild(S.buatEl('span', 'lencana-jenis jenis-' + x.jenis, NAMA_JENIS[x.jenis] || 'Aktivitas'));
      if (x.platform && PLATFORM[x.platform]) {
        atas.appendChild(S.buatEl('span', 'item-platform', PLATFORM[x.platform].nama));
      }
      atas.appendChild(S.buatEl('span', 'item-waktu', formatWaktu(x.waktu)));
      li.appendChild(atas);

      li.appendChild(S.buatEl('p', 'item-judul', x.judul || 'Aktivitas'));
      if (x.format) {
        li.appendChild(S.buatEl('p', 'item-detail', x.format + (x.ukuran ? ' · ' + x.ukuran : '')));
      }
      if (x.tautan) {
        li.appendChild(S.buatEl('p', 'item-tautan', x.tautan));
      }

      const aksi = S.buatEl('div', 'item-aksi');
      if (x.tautan) {
        // Membuka Beranda dengan tautan terisi.
        const ulang = S.buatEl('a', 'btn-mini', 'Gunakan lagi');
        ulang.href = 'beranda.html?tautan=' + encodeURIComponent(x.tautan);
        aksi.appendChild(ulang);
      }
      const hapus = S.buatEl('button', 'btn-mini bahaya', 'Hapus');
      hapus.type = 'button';
      hapus.addEventListener('click', function () {
        hapusRiwayat(pengguna.email, x.id);
        render();
      });
      aksi.appendChild(hapus);
      li.appendChild(aksi);

      daftarRiwayat.appendChild(li);
    });
  }

  $('filter-riwayat').addEventListener('click', function (e) {
    const tombol = e.target.closest('.filter');
    if (!tombol) return;
    filterAktif = tombol.dataset.filter;
    document.querySelectorAll('#filter-riwayat .filter').forEach(function (b) {
      const aktif = b === tombol;
      b.classList.toggle('aktif', aktif);
      b.setAttribute('aria-pressed', String(aktif));
    });
    render();
  });

  btnHapusSemua.addEventListener('click', function () {
    const pengguna = S.pengguna();
    if (!pengguna) return;
    if (window.confirm('Hapus seluruh riwayat aktivitas Anda? Tindakan ini tidak dapat dibatalkan.')) {
      hapusSemuaRiwayat(pengguna.email);
      render();
      S.tampilToast('Riwayat dihapus.');
    }
  });

  // Dipanggil sekarang dan setiap kali pengguna masuk/keluar.
  S.pasang(function () {
    filterAktif = 'semua';
    document.querySelectorAll('#filter-riwayat .filter').forEach(function (b) {
      const aktif = b.dataset.filter === 'semua';
      b.classList.toggle('aktif', aktif);
      b.setAttribute('aria-pressed', String(aktif));
    });
    render();
  });
})();
