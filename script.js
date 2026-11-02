/* ===== Simpanin - script.js (tahap UTS) =====
   Berkas bersama untuk semua halaman: logika murni, penyimpanan, akun, dan menu akun.
   Skrip per halaman: beranda.js, riwayat.js, lapor.js (dimuat setelah berkas ini).
   Catatan: tahap ini hanya front-end.
   - Validasi tautan dan deteksi platform sudah berjalan.
   - Hasil video memakai DATA CONTOH (demo), bukan data asli.
   - Tombol simpan belum mengunduh apa pun; akan disambungkan ke server pada tahap UAS.
   - Login bersifat OPSIONAL. Akun dan riwayat disimpan di localStorage browser (demo).
     Pada tahap UAS, autentikasi dan riwayat dipindahkan ke server dan basis data.
*/

'use strict';

/* ---------- Konfigurasi platform ---------- */
const PLATFORM = {
  tiktok: {
    nama: 'TikTok',
    host: ['tiktok.com'],
    // /@akun/video/123..., /t/xxxx, /v/123...; tautan pendek vm./vt.tiktok.com ditangani terpisah
    pola: [/^\/@[^/]+\/video\/\d+/i, /^\/t\/[\w-]+/i, /^\/v\/\d+/i]
  },
  instagram: {
    nama: 'Instagram',
    host: ['instagram.com', 'instagr.am'],
    pola: [/^\/(p|reel|reels|tv)\/[\w-]+/i, /^\/[^/]+\/(p|reel)\/[\w-]+/i]
  },
  youtube: {
    nama: 'YouTube',
    host: ['youtube.com', 'youtu.be'],
    // youtu.be/ID dan /watch?v=ID ditangani terpisah
    pola: [/^\/shorts\/[\w-]+/i, /^\/embed\/[\w-]+/i, /^\/live\/[\w-]+/i]
  }
};

/* ---------- Data contoh (demo) ---------- */
const DATA_DEMO = {
  tiktok: {
    judul: 'Contoh video TikTok (data demo)',
    pembuat: '@akun_contoh',
    durasi: '0:24',
    opsi: [
      { judul: 'MP4 tanpa watermark', detail: '720p, ada audio', ukuran: '4,2 MB', tag: 'Disarankan' },
      { judul: 'MP4 dengan watermark', detail: '720p, ada audio', ukuran: '4,5 MB' },
      { judul: 'MP3 (audio saja)', detail: '128 kbps', ukuran: '0,4 MB' }
    ]
  },
  instagram: {
    judul: 'Contoh Reels Instagram (data demo)',
    pembuat: '@akun_contoh',
    durasi: '0:18',
    opsi: [
      { judul: 'MP4 1080p', detail: 'Ada audio', ukuran: '9,8 MB', tag: 'Disarankan' },
      { judul: 'MP4 720p', detail: 'Ada audio', ukuran: '5,1 MB' },
      { judul: 'MP3 (audio saja)', detail: '128 kbps', ukuran: '0,3 MB' }
    ]
  },
  youtube: {
    judul: 'Contoh video YouTube (data demo)',
    pembuat: 'Kanal Contoh',
    durasi: '3:42',
    opsi: [
      { judul: 'MP4 1080p', detail: 'Ada audio', ukuran: '38,2 MB', tag: 'Disarankan' },
      { judul: 'MP4 720p', detail: 'Ada audio', ukuran: '21,7 MB' },
      { judul: 'MP4 480p', detail: 'Ada audio', ukuran: '12,4 MB' },
      { judul: 'MP4 360p', detail: 'Ada audio', ukuran: '8,0 MB' },
      { judul: 'MP3 (audio saja)', detail: '128 kbps', ukuran: '3,4 MB' }
    ]
  }
};

/* =====================================================
   FUNGSI MURNI (mudah diuji)
   ===================================================== */

/**
 * Memeriksa tautan dan mendeteksi platform.
 * Mengembalikan { ok: true, platform, url } atau { ok: false, pesan }.
 */
function periksaTautan(masukan) {
  let teks = String(masukan || '').trim();
  if (!teks) {
    return { ok: false, pesan: 'Tempel tautan video terlebih dahulu.' };
  }
  if (/\s/.test(teks)) {
    return { ok: false, pesan: 'Tautan tidak boleh mengandung spasi. Pastikan hanya satu tautan yang ditempel.' };
  }

  // Izinkan tautan tanpa "https://" (mis. "tiktok.com/...")
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(teks)) {
    teks = 'https://' + teks;
  }

  let url;
  try {
    url = new URL(teks);
  } catch (e) {
    return { ok: false, pesan: 'Format tautan tidak valid. Contoh: https://www.youtube.com/watch?v=...' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, pesan: 'Hanya tautan http atau https yang didukung.' };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const kunci = Object.keys(PLATFORM).find(function (k) {
    return PLATFORM[k].host.some(function (h) {
      return host === h || host.endsWith('.' + h);
    });
  });

  if (!kunci) {
    return { ok: false, pesan: 'Tautan ini bukan dari TikTok, Instagram, atau YouTube. Platform lain belum didukung.' };
  }

  if (!mengarahKeVideo(kunci, host, url)) {
    return {
      ok: false,
      pesan: 'Tautan ' + PLATFORM[kunci].nama + ' ini tidak mengarah ke sebuah video (mungkin beranda atau profil). Salin tautan langsung dari video.'
    };
  }

  return { ok: true, platform: kunci, url: url.href };
}

function mengarahKeVideo(kunci, host, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (path === '/') return false;

  if (kunci === 'youtube') {
    if (host === 'youtu.be') return /^\/[\w-]{11}$/.test(path);
    if (/^\/watch$/i.test(path)) return /^[\w-]{11}$/.test(url.searchParams.get('v') || '');
    return PLATFORM.youtube.pola.some(function (p) { return p.test(path); });
  }

  if (kunci === 'tiktok') {
    // Tautan pendek memakai subdomain vm. atau vt.
    if (/^(vm|vt)\./.test(host)) return /^\/[\w-]{5,}$/.test(path);
    return PLATFORM.tiktok.pola.some(function (p) { return p.test(path); });
  }

  return PLATFORM[kunci].pola.some(function (p) { return p.test(path); });
}

function validasiEmail(nilai) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(nilai || '').trim());
}

function validasiLaporan(data) {
  const galat = {};
  if (!data.nama || data.nama.trim().length < 3) galat.nama = 'Nama minimal 3 karakter.';
  if (!validasiEmail(data.email)) galat.email = 'Masukkan alamat email yang valid.';

  if (!data.tautan || !data.tautan.trim()) {
    galat.tautan = 'Tautan konten wajib diisi.';
  } else {
    const hasil = periksaTautan(data.tautan);
    if (!hasil.ok) galat.tautan = hasil.pesan;
  }

  if (!data.alasan) galat.alasan = 'Pilih alasan laporan.';
  if (!data.keterangan || data.keterangan.trim().length < 15) galat.ket = 'Keterangan minimal 15 karakter.';
  if (!data.setuju) galat.setuju = 'Centang pernyataan ini untuk melanjutkan.';
  return galat;
}

function tunggu(ms) {
  return new Promise(function (selesai) { setTimeout(selesai, ms); });
}

/* =====================================================
   PENYIMPANAN (localStorage, dengan cadangan memori)
   ===================================================== */

const KUNCI = {
  pengguna: 'simpanin_pengguna',
  riwayat: 'simpanin_riwayat',
  sesi: 'simpanin_sesi'
};
const BATAS_RIWAYAT = 100;

const memori = {};
const LOKAL = (function () {
  try {
    const k = '__simpanin_uji';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
})();

const gudang = {
  baca: function (kunci, bawaan) {
    try {
      const mentah = LOKAL ? localStorage.getItem(kunci) : memori[kunci];
      return mentah ? JSON.parse(mentah) : bawaan;
    } catch (e) {
      return bawaan;
    }
  },
  tulis: function (kunci, nilai) {
    const teks = JSON.stringify(nilai);
    try {
      if (LOKAL) localStorage.setItem(kunci, teks); else memori[kunci] = teks;
    } catch (e) {
      memori[kunci] = teks;
    }
  },
  hapus: function (kunci) {
    try {
      if (LOKAL) localStorage.removeItem(kunci);
    } catch (e) { /* abaikan */ }
    delete memori[kunci];
  }
};

/* =====================================================
   AKUN (opsional) - versi demo di browser
   ===================================================== */

function normalEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function buatGaram() {
  const bita = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bita);
  } else {
    for (let i = 0; i < bita.length; i++) bita[i] = Math.floor(Math.random() * 256);
  }
  return Array.prototype.map.call(bita, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function hashSandi(sandi, garam) {
  const teks = garam + ':' + sandi;
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(teks));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }
  // Cadangan sederhana bila crypto.subtle tidak tersedia (hanya untuk demo).
  let h = 5381;
  for (let i = 0; i < teks.length; i++) h = ((h * 33) ^ teks.charCodeAt(i)) >>> 0;
  return 'demo-' + h.toString(16);
}

function validasiDaftar(d) {
  const galat = {};
  if (!d.nama || d.nama.trim().length < 3) galat.nama = 'Nama minimal 3 karakter.';
  if (!validasiEmail(d.email)) galat.email = 'Masukkan alamat email yang valid.';

  const sandi = String(d.sandi || '');
  if (sandi.length < 8) galat.sandi = 'Kata sandi minimal 8 karakter.';
  else if (!/[A-Za-z]/.test(sandi) || !/\d/.test(sandi)) galat.sandi = 'Kata sandi harus mengandung huruf dan angka.';

  if (!galat.sandi && sandi !== String(d.ulang || '')) galat.ulang = 'Kata sandi tidak sama.';
  else if (galat.sandi && !d.ulang) galat.ulang = 'Ulangi kata sandi Anda.';
  return galat;
}

function validasiMasuk(d) {
  const galat = {};
  if (!validasiEmail(d.email)) galat.email = 'Masukkan alamat email yang valid.';
  if (!d.sandi) galat.sandi = 'Kata sandi wajib diisi.';
  return galat;
}

/** Mengembalikan { ok:true, pengguna } atau { ok:false, galat?, pesan? } */
async function daftarAkun(d) {
  const galat = validasiDaftar(d);
  if (Object.keys(galat).length) return { ok: false, galat: galat };

  const email = normalEmail(d.email);
  const semua = gudang.baca(KUNCI.pengguna, {});
  if (semua[email]) {
    return { ok: false, pesan: 'Email ini sudah terdaftar. Silakan masuk.' };
  }

  const garam = buatGaram();
  semua[email] = {
    nama: d.nama.trim(),
    email: email,
    garam: garam,
    hash: await hashSandi(d.sandi, garam),
    dibuat: new Date().toISOString()
  };
  gudang.tulis(KUNCI.pengguna, semua);
  return { ok: true, pengguna: { nama: semua[email].nama, email: email } };
}

async function masukAkun(d) {
  const galat = validasiMasuk(d);
  if (Object.keys(galat).length) return { ok: false, galat: galat };

  const email = normalEmail(d.email);
  const akun = gudang.baca(KUNCI.pengguna, {})[email];
  const salah = { ok: false, pesan: 'Email atau kata sandi salah.' };
  if (!akun) return salah;

  const cek = await hashSandi(d.sandi, akun.garam);
  if (cek !== akun.hash) return salah;
  return { ok: true, pengguna: { nama: akun.nama, email: email } };
}

function simpanSesi(email) { gudang.tulis(KUNCI.sesi, email); }
function hapusSesi() { gudang.hapus(KUNCI.sesi); }

function pulihkanSesi() {
  const email = gudang.baca(KUNCI.sesi, null);
  if (!email) return null;
  const akun = gudang.baca(KUNCI.pengguna, {})[email];
  return akun ? { nama: akun.nama, email: email } : null;
}

/* =====================================================
   RIWAYAT AKTIVITAS (hanya untuk pengguna yang login)
   jenis: 'cari' | 'unduh' | 'masuk'
   ===================================================== */

function ambilRiwayat(email) {
  const semua = gudang.baca(KUNCI.riwayat, {});
  return Array.isArray(semua[normalEmail(email)]) ? semua[normalEmail(email)] : [];
}

function catatRiwayat(email, entri) {
  const kunci = normalEmail(email);
  const semua = gudang.baca(KUNCI.riwayat, {});
  const daftar = Array.isArray(semua[kunci]) ? semua[kunci] : [];
  const baru = Object.assign({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    waktu: new Date().toISOString()
  }, entri);
  daftar.unshift(baru);
  semua[kunci] = daftar.slice(0, BATAS_RIWAYAT);
  gudang.tulis(KUNCI.riwayat, semua);
  return baru;
}

function hapusRiwayat(email, id) {
  const kunci = normalEmail(email);
  const semua = gudang.baca(KUNCI.riwayat, {});
  semua[kunci] = (semua[kunci] || []).filter(function (e) { return e.id !== id; });
  gudang.tulis(KUNCI.riwayat, semua);
}

function hapusSemuaRiwayat(email) {
  const semua = gudang.baca(KUNCI.riwayat, {});
  semua[normalEmail(email)] = [];
  gudang.tulis(KUNCI.riwayat, semua);
}

function formatWaktu(iso) {
  const t = new Date(iso);
  if (isNaN(t.getTime())) return '';
  return t.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Inisial untuk tampilan di menu: 2 huruf.
 * "Gustam Nasyid Sutiansah" -> "GN", "Gustam" -> "GU".
 */
function inisial(nama) {
  const bagian = String(nama || '').trim().split(/\s+/).filter(Boolean);
  if (!bagian.length) return '';
  const huruf = Array.from(bagian[0]);
  const hasil = bagian.length > 1
    ? huruf[0] + Array.from(bagian[1])[0]
    : huruf.slice(0, 2).join('');
  return hasil.toUpperCase();
}

/* =====================================================
   BAGIAN ANTARMUKA BERSAMA (dipakai semua halaman)
   Header/menu akun, dialog masuk/daftar, toast, status login.
   Skrip khusus halaman (beranda.js, riwayat.js, lapor.js) memakai
   objek window.Simpanin yang dibuat di sini.
   ===================================================== */

const HTML_DIALOG_AKUN = [
  '<dialog class="dialog" id="dialog-akun" aria-labelledby="judul-dialog">',
  '  <div class="dialog-isi">',
  '    <button type="button" class="dialog-tutup" id="btn-tutup-dialog" aria-label="Tutup">&times;</button>',
  '    <h2 id="judul-dialog">Masuk ke Simpanin</h2>',
  '    <p class="dialog-pengantar">Akun bersifat opsional. Tanpa akun semua fitur tetap bisa dipakai.</p>',
  '    <div class="tab" role="tablist" aria-label="Masuk atau daftar">',
  '      <button type="button" class="tab-btn" role="tab" id="tab-masuk" aria-selected="true" aria-controls="form-masuk">Masuk</button>',
  '      <button type="button" class="tab-btn" role="tab" id="tab-daftar" aria-selected="false" aria-controls="form-daftar">Daftar</button>',
  '    </div>',
  '    <form id="form-masuk" class="form-akun" role="tabpanel" aria-labelledby="tab-masuk" novalidate>',
  '      <p class="galat-umum" id="err-masuk-umum" role="alert" hidden></p>',
  '      <div class="field"><label for="masuk-email">Email</label>',
  '        <input type="email" id="masuk-email" autocomplete="email">',
  '        <p class="field-error" id="err-masuk-email" hidden></p></div>',
  '      <div class="field"><label for="masuk-sandi">Kata sandi</label>',
  '        <input type="password" id="masuk-sandi" autocomplete="current-password">',
  '        <p class="field-error" id="err-masuk-sandi" hidden></p></div>',
  '      <button type="submit" class="btn-utama">Masuk</button>',
  '    </form>',
  '    <form id="form-daftar" class="form-akun" role="tabpanel" aria-labelledby="tab-daftar" novalidate hidden>',
  '      <p class="galat-umum" id="err-daftar-umum" role="alert" hidden></p>',
  '      <div class="field"><label for="daftar-nama">Nama</label>',
  '        <input type="text" id="daftar-nama" autocomplete="name">',
  '        <p class="field-error" id="err-daftar-nama" hidden></p></div>',
  '      <div class="field"><label for="daftar-email">Email</label>',
  '        <input type="email" id="daftar-email" autocomplete="email">',
  '        <p class="field-error" id="err-daftar-email" hidden></p></div>',
  '      <div class="field"><label for="daftar-sandi">Kata sandi</label>',
  '        <input type="password" id="daftar-sandi" autocomplete="new-password">',
  '        <p class="field-bantu kiri">Minimal 8 karakter, mengandung huruf dan angka.</p>',
  '        <p class="field-error" id="err-daftar-sandi" hidden></p></div>',
  '      <div class="field"><label for="daftar-ulang">Ulangi kata sandi</label>',
  '        <input type="password" id="daftar-ulang" autocomplete="new-password">',
  '        <p class="field-error" id="err-daftar-ulang" hidden></p></div>',
  '      <button type="submit" class="btn-utama">Buat akun</button>',
  '    </form>',
  '    <p class="catatan dialog-catatan">Versi UTS: akun dan riwayat hanya tersimpan di browser ini, belum di server. Jangan memakai kata sandi yang sama dengan akun penting lain.</p>',
  '  </div>',
  '</dialog>',
  '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>'
].join('\n');

function mulai() {
  const $ = function (id) { return document.getElementById(id); };

  // Dialog dan toast disisipkan oleh skrip agar tidak diulang di tiap file HTML.
  if (!$('dialog-akun')) {
    document.body.insertAdjacentHTML('beforeend', HTML_DIALOG_AKUN);
  }

  const toast = $('toast');
  let timerToast = null;
  let pengguna = pulihkanSesi(); // null = belum login (tidak wajib)
  const pendengar = [];

  /* --- Menu mobile --- */
  const btnMenu = $('btn-menu');
  const menu = $('menu-nav');
  btnMenu.addEventListener('click', function () {
    const buka = menu.classList.toggle('terbuka');
    btnMenu.setAttribute('aria-expanded', String(buka));
  });

  /* --- Toast --- */
  function tampilToast(teks) {
    toast.textContent = teks;
    toast.hidden = false;
    clearTimeout(timerToast);
    timerToast = setTimeout(function () { toast.hidden = true; }, 4200);
  }

  function buatEl(tag, kelas, teks) {
    const el = document.createElement(tag);
    if (kelas) el.className = kelas;
    if (teks !== undefined) el.textContent = teks;
    return el;
  }

  /* --- Util galat form (dipakai lapor konten, masuk, daftar) --- */
  function terapkanGalat(peta, galat) {
    Object.keys(peta).forEach(function (k) {
      const el = $(peta[k]);
      const err = $('err-' + peta[k]);
      if (galat[k]) {
        err.textContent = galat[k];
        err.hidden = false;
        el.classList.add('salah');
        el.setAttribute('aria-invalid', 'true');
      } else {
        err.hidden = true;
        el.classList.remove('salah');
        el.removeAttribute('aria-invalid');
      }
    });
    return Object.keys(peta).find(function (k) { return galat[k]; });
  }

  /* =====================================================
     MENU AKUN (dropdown pada nama / ikon profil)
     ===================================================== */
  const btnProfil = $('btn-profil');
  const menuAkun = $('menu-akun');

  function bukaMenuAkun(buka) {
    menuAkun.hidden = !buka;
    btnProfil.setAttribute('aria-expanded', String(buka));
  }

  btnProfil.addEventListener('click', function (e) {
    e.stopPropagation();
    bukaMenuAkun(menuAkun.hidden);
  });

  // Klik di luar menu menutupnya; klik pada item menu juga menutupnya.
  document.addEventListener('click', function (e) {
    if (!menuAkun.hidden && (!menuAkun.contains(e.target) || e.target.closest('a, button'))) bukaMenuAkun(false);
    if (menu.classList.contains('terbuka') && e.target.closest('#menu-nav a, #menu-akun button')) {
      menu.classList.remove('terbuka');
      btnMenu.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menuAkun.hidden) {
      bukaMenuAkun(false);
      btnProfil.focus();
    }
  });

  /** Mengatur tampilan sesuai status login. */
  function perbaruiAkunUI() {
    const masuk = Boolean(pengguna);
    document.querySelectorAll('[data-hanya]').forEach(function (el) {
      el.hidden = (el.dataset.hanya === 'masuk') !== masuk;
    });

    if (masuk) {
      $('nama-akun').textContent = inisial(pengguna.nama);
      $('akun-nama-penuh').textContent = pengguna.nama;
      $('akun-email').textContent = pengguna.email;
      btnProfil.setAttribute('aria-label', 'Menu akun ' + pengguna.nama);
      btnProfil.title = pengguna.nama;
    } else {
      btnProfil.setAttribute('aria-label', 'Menu akun');
      btnProfil.title = 'Menu akun';
    }
    bukaMenuAkun(false);
    pendengar.forEach(function (fn) { fn(pengguna); });
  }

  /* =====================================================
     AKUN OPSIONAL: dialog masuk/daftar
     ===================================================== */
  const dialog = $('dialog-akun');
  const tabMasuk = $('tab-masuk');
  const tabDaftar = $('tab-daftar');
  const formMasuk = $('form-masuk');
  const formDaftar = $('form-daftar');
  const petaMasuk = { email: 'masuk-email', sandi: 'masuk-sandi' };
  const petaDaftar = { nama: 'daftar-nama', email: 'daftar-email', sandi: 'daftar-sandi', ulang: 'daftar-ulang' };
  let pemicuDialog = null;

  function pilihTab(tab) {
    const masuk = tab !== 'daftar';
    tabMasuk.setAttribute('aria-selected', String(masuk));
    tabDaftar.setAttribute('aria-selected', String(!masuk));
    formMasuk.hidden = !masuk;
    formDaftar.hidden = masuk;
    $('judul-dialog').textContent = masuk ? 'Masuk ke Simpanin' : 'Buat akun Simpanin';
  }

  function resetFormAkun() {
    formMasuk.reset();
    formDaftar.reset();
    terapkanGalat(petaMasuk, {});
    terapkanGalat(petaDaftar, {});
    $('err-masuk-umum').hidden = true;
    $('err-daftar-umum').hidden = true;
  }

  function bukaDialog(tab) {
    pemicuDialog = document.activeElement;
    resetFormAkun();
    pilihTab(tab);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    (tab === 'daftar' ? $('daftar-nama') : $('masuk-email')).focus();
  }

  function tutupDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    // Pemicu di dalam dropdown sudah tertutup; kembalikan fokus ke tombol profil.
    const tujuan = pemicuDialog && pemicuDialog.offsetParent !== null ? pemicuDialog : btnProfil;
    if (document.contains(tujuan)) tujuan.focus();
  }

  // Delegasi klik: tombol mana pun dengan data-buka-akun membuka dialog.
  document.addEventListener('click', function (e) {
    const pemicu = e.target.closest('[data-buka-akun]');
    if (pemicu) bukaDialog(pemicu.dataset.bukaAkun);
  });
  $('btn-tutup-dialog').addEventListener('click', tutupDialog);
  dialog.addEventListener('click', function (e) { if (e.target === dialog) tutupDialog(); });
  tabMasuk.addEventListener('click', function () { pilihTab('masuk'); $('masuk-email').focus(); });
  tabDaftar.addEventListener('click', function () { pilihTab('daftar'); $('daftar-nama').focus(); });

  function selesaiMasuk(p, pesanSambutan) {
    pengguna = p;
    simpanSesi(p.email);
    catatRiwayat(p.email, { jenis: 'masuk', judul: 'Masuk ke akun' });
    perbaruiAkunUI();
    tutupDialog();
    tampilToast(pesanSambutan);
  }

  formMasuk.addEventListener('submit', async function (e) {
    e.preventDefault();
    const umum = $('err-masuk-umum');
    umum.hidden = true;

    const hasilMasuk = await masukAkun({ email: $('masuk-email').value, sandi: $('masuk-sandi').value });
    if (!hasilMasuk.ok) {
      const pertama = terapkanGalat(petaMasuk, hasilMasuk.galat || {});
      if (hasilMasuk.pesan) {
        umum.textContent = hasilMasuk.pesan;
        umum.hidden = false;
      }
      if (pertama) $(petaMasuk[pertama]).focus();
      return;
    }
    terapkanGalat(petaMasuk, {});
    selesaiMasuk(hasilMasuk.pengguna, 'Selamat datang kembali, ' + hasilMasuk.pengguna.nama + '.');
  });

  formDaftar.addEventListener('submit', async function (e) {
    e.preventDefault();
    const umum = $('err-daftar-umum');
    umum.hidden = true;

    const hasilDaftar = await daftarAkun({
      nama: $('daftar-nama').value,
      email: $('daftar-email').value,
      sandi: $('daftar-sandi').value,
      ulang: $('daftar-ulang').value
    });
    if (!hasilDaftar.ok) {
      const pertama = terapkanGalat(petaDaftar, hasilDaftar.galat || {});
      if (hasilDaftar.pesan) {
        umum.textContent = hasilDaftar.pesan;
        umum.hidden = false;
      }
      if (pertama) $(petaDaftar[pertama]).focus();
      return;
    }
    terapkanGalat(petaDaftar, {});
    selesaiMasuk(hasilDaftar.pengguna, 'Akun dibuat. Selamat datang, ' + hasilDaftar.pengguna.nama + '.');
  });

  $('btn-keluar').addEventListener('click', function () {
    pengguna = null;
    hapusSesi();
    perbaruiAkunUI();
    tampilToast('Anda sudah keluar. Riwayat tetap tersimpan dan muncul lagi saat Anda masuk.');
  });

  if (!LOKAL) {
    // Penyimpanan browser tidak tersedia: data hanya bertahan selama halaman terbuka.
    console.warn('Simpanin: localStorage tidak tersedia, akun dan riwayat tidak akan bertahan setelah halaman ditutup.');
  }

  /* --- API untuk skrip khusus halaman --- */
  window.Simpanin = {
    $: $,
    buatEl: buatEl,
    tampilToast: tampilToast,
    terapkanGalat: terapkanGalat,
    pengguna: function () { return pengguna; },
    // Mendaftarkan fungsi yang dipanggil sekarang dan setiap status login berubah.
    pasang: function (fn) { pendengar.push(fn); fn(pengguna); }
  };

  perbaruiAkunUI();
}

if (typeof document !== 'undefined') {
  mulai();
}

// Untuk pengujian di Node (tidak berpengaruh di browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    periksaTautan, validasiEmail, validasiLaporan, inisial,
    validasiDaftar, validasiMasuk, daftarAkun, masukAkun, pulihkanSesi, simpanSesi, hapusSesi,
    ambilRiwayat, catatRiwayat, hapusRiwayat, hapusSemuaRiwayat, formatWaktu, gudang, KUNCI, BATAS_RIWAYAT
  };
}
