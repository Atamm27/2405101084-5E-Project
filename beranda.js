/* ===== Simpanin - beranda.js =====
   Form cari video, hasil (data contoh), dan pencatatan riwayat untuk pengguna yang login.
   Bergantung pada script.js (dimuat lebih dulu). */
(function () {
  'use strict';
  const S = window.Simpanin;
  if (!S) return;
  const $ = S.$;

  const form = $('form-unduh');
  const input = $('input-tautan');
  const kolom = $('kolom-input');
  const btnTempel = $('btn-tempel');
  const btnHapus = $('btn-hapus');
  const btnUnduh = $('btn-unduh');
  const pesanError = $('pesan-error');
  const status = $('status');
  const hasil = $('hasil');
  let sedangProses = false;

  function tampilGalat(teks) {
    pesanError.textContent = teks;
    pesanError.hidden = false;
    kolom.classList.add('salah');
    input.setAttribute('aria-invalid', 'true');
  }
  function bersihkanGalat() {
    pesanError.hidden = true;
    pesanError.textContent = '';
    kolom.classList.remove('salah');
    input.removeAttribute('aria-invalid');
  }
  function aturTombolHapus() {
    btnHapus.hidden = input.value.length === 0;
  }

  input.addEventListener('input', function () {
    bersihkanGalat();
    aturTombolHapus();
  });

  btnHapus.addEventListener('click', function () {
    input.value = '';
    bersihkanGalat();
    aturTombolHapus();
    input.focus();
  });

  btnTempel.addEventListener('click', async function () {
    try {
      const teks = await navigator.clipboard.readText();
      if (!teks) {
        S.tampilToast('Clipboard kosong. Salin tautan video terlebih dahulu.');
        return;
      }
      input.value = teks.trim();
      bersihkanGalat();
      aturTombolHapus();
      input.focus();
    } catch (e) {
      S.tampilToast('Browser tidak mengizinkan akses clipboard. Tempel manual dengan Ctrl+V.');
      input.focus();
    }
  });

  /* --- Proses utama (simulasi) --- */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (sedangProses) return;

    bersihkanGalat();
    status.textContent = '';
    hasil.hidden = true;

    const cek = periksaTautan(input.value);
    if (!cek.ok) {
      tampilGalat(cek.pesan);
      input.focus();
      return;
    }

    sedangProses = true;
    btnUnduh.disabled = true;
    btnUnduh.classList.add('memuat');
    btnUnduh.querySelector('.btn-label').textContent = 'Memproses...';

    status.textContent = 'Memeriksa tautan ' + PLATFORM[cek.platform].nama + '...';
    await tunggu(700);
    status.textContent = 'Mengambil informasi video...';
    await tunggu(900);

    tampilHasil(cek);
    status.textContent = 'Video ditemukan (data contoh).';

    // Riwayat hanya dicatat bila pengguna memilih untuk login.
    const pengguna = S.pengguna();
    if (pengguna) {
      catatRiwayat(pengguna.email, {
        jenis: 'cari',
        platform: cek.platform,
        judul: DATA_DEMO[cek.platform].judul,
        tautan: cek.url
      });
    }

    sedangProses = false;
    btnUnduh.disabled = false;
    btnUnduh.classList.remove('memuat');
    btnUnduh.querySelector('.btn-label').textContent = 'Cari Video';
  });

  /* --- Menampilkan hasil --- */
  function tampilHasil(cek) {
    const data = DATA_DEMO[cek.platform];

    $('thumb').dataset.platform = cek.platform;
    $('hasil-platform').textContent = PLATFORM[cek.platform].nama;
    $('hasil-durasi').textContent = data.durasi;
    $('hasil-judul').textContent = data.judul;
    $('hasil-pembuat').textContent = data.pembuat;
    $('hasil-tautan').textContent = cek.url;

    const daftar = $('daftar-opsi');
    daftar.textContent = '';

    data.opsi.forEach(function (o) {
      const li = S.buatEl('li', 'opsi');
      const teks = S.buatEl('div', 'opsi-teks');

      const judul = S.buatEl('span', 'opsi-judul', o.judul);
      if (o.tag) judul.appendChild(S.buatEl('span', 'tag', o.tag));

      teks.appendChild(judul);
      teks.appendChild(S.buatEl('span', 'opsi-detail', o.detail + ' · ' + o.ukuran));

      const tombol = S.buatEl('button', 'btn-simpan', 'Simpan');
      tombol.type = 'button';
      tombol.setAttribute('aria-label', 'Simpan ' + o.judul);
      tombol.addEventListener('click', function () {
        const pengguna = S.pengguna();
        if (pengguna) {
          catatRiwayat(pengguna.email, {
            jenis: 'unduh',
            platform: cek.platform,
            judul: data.judul,
            tautan: cek.url,
            format: o.judul,
            ukuran: o.ukuran
          });
          S.tampilToast('Sudah diSimpan, Tercatat di riwayat, Lihat di halaman Riwayat.');
        } else {
          S.tampilToast('Sudah diSimpan, Daftar/Login (opsional) jika ingin aktivitas tercatat.');
        }
      });

      li.appendChild(teks);
      li.appendChild(tombol);
      daftar.appendChild(li);
    });

    hasil.hidden = false;
    hasil.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('btn-ulang').addEventListener('click', function () {
    hasil.hidden = true;
    status.textContent = '';
    input.value = '';
    aturTombolHapus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    input.focus();
  });

  /* --- Tautan dari halaman Riwayat ("Gunakan lagi") lewat ?tautan=... --- */
  try {
    const params = new URLSearchParams(window.location.search);
    const tautan = params.get('tautan');
    if (tautan) {
      input.value = tautan;
      aturTombolHapus();
      input.focus();
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch (e) { /* abaikan */ }
})();
