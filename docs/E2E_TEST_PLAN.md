# E2E test plan — RavaShop

**Status:** flow executable tersedia di `.maestro/` (`smoke.yaml`, `e01-�` sampai `e15-�`). Hasil run nyata dicatat di [VERIFICATION.md](VERIFICATION.md); dokumen ini tetap menjadi spesifikasi.

## Tujuan dan tingkat pengujian

Maestro mengendalikan aplikasi lewat UI dari katalog sampai pesanan. Unit menguji uang dan validasi; integration SQLite menguji rollback, constraint, migrasi, dan idempotensi; device E2E membuktikan perilaku yang terlihat pengguna. Ketiganya diperlukan untuk alur checkout.

## Fixture dan isolasi

- Gunakan fixture `shop-v1` dari TRD; kondisi awal sama untuk setiap skenario independen.
- Tas Rp250.000 stok 3, botol Rp100.000 stok 5, produk habis stok 0; ongkir Rp15.000.
- Alamat uji fiktif: Pengguna Demo, 081234567890, Jalan Contoh 10, Kota Demo. Tidak memakai data pengguna nyata.
- Seed/reset tersedia lewat mekanisme E2E deterministik. Jangan memakai database pribadi pengguna.
- Pada persistence journey, hentikan proses dan relaunch tanpa menghapus data. Clear data di tengah journey akan membatalkan bukti persistensi.

## Matriks Given / When / Then

| ID | Prioritas / requirement | Given | When | Then |
|---|---|---|---|---|
| SHOP-E01 | P0 / 01–02 | Seed bersih | Buka katalog, cari tas, filter kategori, urutkan harga, buka detail | Hasil, harga, stok, dan urutan sesuai fixture; detail produk yang benar terbuka. |
| SHOP-E02 | P0 / 01 | Katalog tersedia | Cari teks yang tidak cocok, lalu hapus pencarian | Empty state tampil, lalu daftar kembali. |
| SHOP-E03 | P0 / 03,08 | Wishlist kosong | Favoritkan tas, relaunch, buka wishlist, hapus favorit | Satu tas bertahan setelah relaunch; setelah dihapus wishlist kosong. |
| SHOP-E04 | P0 / 04 | Keranjang kosong | Tambah tas dua kali, ubah jumlah menjadi 3, lalu hapus | Satu baris quantity 2 lalu 3; setelah hapus keranjang kosong dan checkout tidak aktif. |
| SHOP-E05 | P0 / 02,04,09 | Stok tas 3, satu produk stok 0 | Coba jumlah 4, nol, pecahan, serta beli produk habis | Operasi ditolak/dibatasi, pesan jelas, data tidak berubah di luar aturan. |
| SHOP-E06 | P0 / 05,09 | Alamat kosong | Simpan field wajib kosong; lalu tambah, baca, edit, dan hapus alamat valid | Error per field; CRUD tersimpan; alamat terhapus tidak dapat dipilih saat checkout. |
| SHOP-E07 | P0 / 06 | Dua tas, satu botol, alamat valid | Tinjau dan konfirmasi checkout simulasi | Subtotal Rp600.000, ongkir Rp15.000, total Rp615.000; tepat satu order, stok 1/4, cart kosong. |
| SHOP-E08 | P0 / 05–06,09 | Cart berisi item tanpa alamat | Coba konfirmasi | Tidak ada order/stok berubah; pengguna diminta memilih alamat. |
| SHOP-E09 | P0 / 06,09 | Checkout valid | Ketuk konfirmasi cepat dua kali; ulang request operation ID di integration test | UI hanya satu hasil; database satu order dan satu pengurangan stok. |
| SHOP-E10 | P0 / 06,09 | Fixture checkout + fault pada write tengah transaksi di build E2E | Konfirmasi lalu retry setelah fault dilepas | Error tampil; cart/stok/order sebelum retry utuh; retry sukses tepat sekali. |
| SHOP-E11 | P0 / 07–08 | Order confirmed | Edit/hapus alamat asal, stop/relaunch, lihat order | Snapshot alamat/harga order tidak berubah; order dan stok bertahan. |
| SHOP-E12 | P0 / 07 | Order E07 confirmed | Batalkan order, lalu coba batalkan lagi | Status cancelled; stok 3/5 tepat sekali; order tetap ada dalam riwayat. |
| SHOP-E13 | P0 / 08 | Cart, alamat, dan wishlist tersimpan | Matikan jaringan, stop/relaunch, lanjut checkout | Data dan gambar lokal tersedia, alur simulasi tetap selesai tanpa jaringan. |
| SHOP-E14 | P0 / 10 | Ada perubahan lokal | Buka reset, batal; lalu konfirmasi reset dan relaunch | Batal mempertahankan data; konfirmasi mengembalikan fixture satu kali tanpa duplikasi. |
| SHOP-E15 | P0 / 09 | Write alamat/cart ditolak oleh fault terkontrol | Simpan perubahan | Error terlihat, tidak ada sukses palsu; relaunch menunjukkan data terakhir yang committed. |
| SHOP-E16 | P1 / 11 | Layar kecil/besar, font scale 1.3 | Navigasi, isi form dengan keyboard, Android Back, dan pemeriksaan TalkBack | Kontrol terjangkau, fokus/label benar, data input tidak hilang tanpa alasan; tidak ada teks terpotong kritis. |

Fault injection E10/E15 harus memicu kegagalan pada repository asli, bukan mengganti seluruh UI dengan mock sukses/error. Atomicity dan request replay juga diperiksa di integration test agar kesimpulan tidak hanya berdasarkan layar.

## Selector dan evidence

Konvensi testID dijelaskan di [DESIGN.md](DESIGN.md), misalnya `catalog.search`, `product.<id>`, `cart.item.<id>.quantity`, `checkout.confirm`, `order.detail`, dan `settings.reset`. Flow memakai selector `id:` dan memverifikasi teks yang terlihat pengguna (harga, stok, status). Label aksesibilitas dibuat terpisah dari testID. Fault E10/E15 dipasang lewat panel `e2e.fault.*` di Profil, yang hanya ada pada build E2E.

Catat untuk tiap run: requirement/case ID, commit atau source hash, APK hash, app ID, seed version, emulator/device/API, runner version, command, timestamp, status pass/fail/blocked, log, serta screenshot pada titik penting dan saat gagal. Bukti tidak boleh memuat alamat nyata.

## Gate

Semua P0 lulus tanpa kegagalan yang disembunyikan retry. Jalankan core journey pada APK release tanpa hook pengujian; fault suite memakai build E2E yang ditandai. Catat perangkat fisik/iOS yang belum diuji sebagai unverified. Uji TalkBack manual dicatat terpisah dari otomatisasi Maestro.

Referensi runner: [React Native](https://docs.maestro.dev/get-started/supported-platform/react-native), [CLI](https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options).
