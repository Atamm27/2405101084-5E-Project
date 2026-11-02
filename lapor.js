/* ===== Simpanin - lapor.js =====
   Form lapor konten. Bila pengguna login, nama dan email terisi otomatis dari akunnya.
   Tanpa login, form tetap bisa dipakai dengan mengetik manual.
   Bergantung pada script.js (dimuat lebih dulu). */
(function () {
  'use strict';
  const S = window.Simpanin;
  if (!S) return;
  const $ = S.$;

  const formLapor = $('form-lapor');
  const lapNama = $('lap-nama');
  const lapEmail = $('lap-email');
  const lapKet = $('lap-ket');
  const hitung = $('hitung-ket');
  const sukses = $('lap-sukses');
  const infoOtomatis = $('lap-otomatis');

  const petaLapor = {
    nama: 'lap-nama', email: 'lap-email', tautan: 'lap-tautan',
    alasan: 'lap-alasan', ket: 'lap-ket', setuju: 'lap-setuju'
  };

  /** Mengisi nama dan email dari akun yang login; mengosongkannya lagi saat keluar. */
  function isiOtomatis() {
    const pengguna = S.pengguna();
    if (pengguna) {
      lapNama.value = pengguna.nama;
      lapEmail.value = pengguna.email;
      lapNama.readOnly = true;
      lapEmail.readOnly = true;
      infoOtomatis.hidden = false;
      S.terapkanGalat({ nama: 'lap-nama', email: 'lap-email' }, {});
    } else {
      if (lapNama.readOnly) {
        // Kosongkan hanya bila isiannya berasal dari akun sebelumnya.
        lapNama.value = '';
        lapEmail.value = '';
      }
      lapNama.readOnly = false;
      lapEmail.readOnly = false;
      infoOtomatis.hidden = true;
    }
  }

  lapKet.addEventListener('input', function () {
    hitung.textContent = String(lapKet.value.length);
  });

  formLapor.addEventListener('submit', function (e) {
    e.preventDefault();
    sukses.hidden = true;

    const galat = validasiLaporan({
      nama: lapNama.value,
      email: lapEmail.value,
      tautan: $('lap-tautan').value,
      alasan: $('lap-alasan').value,
      keterangan: lapKet.value,
      setuju: $('lap-setuju').checked
    });

    const pertama = S.terapkanGalat(petaLapor, galat);
    if (pertama) {
      $(petaLapor[pertama]).focus();
      return;
    }

    // Tahap UTS: belum dikirim ke server.
    sukses.textContent = 'Terima kasih. Laporan Anda tercatat pada tampilan ini (demo) dan belum dikirim ke server.';
    sukses.hidden = false;
    formLapor.reset();
    hitung.textContent = '0';
    isiOtomatis(); // reset() mengosongkan nama dan email; isi lagi bila sedang login
  });

  S.pasang(isiOtomatis);
})();
