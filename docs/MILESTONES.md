# Milestones — RavaShop

Tanggal awal: 2026-10-05. **Status: M1 sebagian terbukti (unit/integration dan build APK); M2 sudah dikodekan dan flow Maestro ditulis, tetapi belum dijalankan di perangkat.** Bukti ada di [VERIFICATION.md](VERIFICATION.md).

## M0 — Spesifikasi

- [x] Buat README, PRD, architecture, TRD, development guide, dan rencana E2E.
- [x] Tentukan scope lokal, simulasi checkout, dan fixture dengan hasil yang dapat dihitung.
- [x] Tinjau visual referensi dan buat rancangan screen/state serta aset original/berlisensi ([DESIGN.md](DESIGN.md), `assets/products/`).
- [ ] Finalisasi nama aplikasi dan identitas visual sebelum publikasi.

Gate: alur, aturan total/stok, dan skenario E2E dapat ditelusuri ke requirement.

## M1 — Fondasi

- [x] Scaffold React Native CLI; kunci versi, application ID, dan Android SDK.
- [ ] Verifikasi build pada emulator/perangkat; catat command yang benar di Development. (Build APK lulus; instalasi di perangkat belum.)
- [x] Implementasikan schema, seed, migrasi, dan repository SQLite.
- [x] Buktikan rollback dan idempotensi checkout lewat integration test.
- [ ] Jalankan satu smoke flow Maestro pada aplikasi terpasang untuk memastikan toolchain E2E bekerja sejak awal.

## M2 — Alur produk

- [ ] Katalog/detail/pencarian/filter dan wishlist. (Dikodekan; menunggu E2E.)
- [ ] Keranjang, alamat, validasi, dan checkout simulasi. (Dikodekan; menunggu E2E.)
- [ ] Detail/riwayat pesanan, pembatalan, dan reset demo. (Dikodekan; menunggu E2E.)
- [ ] Loading, empty, error, aksesibilitas, serta testID terverifikasi.
- [ ] Tambahkan flow E2E bersamaan dengan setiap perjalanan yang selesai. (Flow smoke dan E01�E15 ditulis; belum dijalankan.)

## M3 — Verifikasi v1

- [ ] Typecheck, lint, unit, dan integration lulus.
- [ ] Semua skenario P0 dalam E2E_TEST_PLAN lulus; simpan log, screenshot, serta build/device ID.
- [ ] Uji relaunch tanpa clear data, offline, double-submit, rollback, dan reset.
- [ ] Review layar kecil/besar, font scale, Android Back, keyboard, dan TalkBack.
- [ ] Smoke APK release; pastikan tidak ada test hook pada artifact distribusi.

Gate: tidak ada P0 gagal atau unverified. P1 yang belum selesai dicatat sebagai keterbatasan.

## M4 — Handoff dan publikasi

- [ ] Dokumentasikan hasil nyata di docs/VERIFICATION.md; jangan menandai gate berdasarkan kode saja.
- [ ] Buat screenshot/video, case study, dan petunjuk instalasi APK.
- [ ] Siapkan source serta rilis artifact dengan signing yang sesuai.
- [ ] Publikasikan source/APK dan tautkan dari portofolio pada tahap rilis.

Pekerjaan berikutnya: pasang APK E2E di Galaxy A12, jalankan smoke dan E01�E15, perbaiki selector/temuan, lalu tutup M2.
