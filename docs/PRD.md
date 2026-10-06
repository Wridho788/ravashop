# PRD — RavaShop

Tanggal: 2026-10-05. Versi: 0.1. Status: spesifikasi awal, belum diimplementasikan.

## Tujuan dan pengguna

Memberikan pengalaman belanja mobile dari pencarian produk sampai pesanan simulasi yang dapat ditinjau ulang. Target demo adalah calon pengguna dan reviewer portofolio yang ingin mencoba alur pembeli tanpa registrasi atau pembayaran nyata.

Keberhasilan MVP berarti satu perjalanan belanja dapat diselesaikan di perangkat Android, tersimpan setelah restart, dan terbukti melalui E2E. Tidak ada klaim pengguna aktif atau penjualan nyata.

## Lingkup MVP

| ID | Kemampuan | Kriteria penerimaan |
|---|---|---|
| SHOP-01 | Katalog | Produk dummy tampil; pencarian nama, filter kategori, dan urutan harga bekerja; hasil kosong memberi jalan kembali. |
| SHOP-02 | Detail produk | Nama, gambar, harga rupiah, stok, dan deskripsi konsisten dengan katalog; produk stok nol tidak dapat dibeli. |
| SHOP-03 | Wishlist | Tambah/hapus produk tanpa duplikasi; daftar bertahan setelah aplikasi dibuka ulang. |
| SHOP-04 | Keranjang | Tambah, lihat, ubah jumlah, hapus; jumlah bilangan bulat 1 sampai stok; produk sama digabung menjadi satu baris. |
| SHOP-05 | Alamat | Tambah, baca, ubah, hapus alamat lokal; nama penerima, nomor kontak, dan alamat wajib; satu alamat dipilih saat checkout. |
| SHOP-06 | Checkout simulasi | Tampilkan item, alamat, subtotal, ongkir dummy, dan total sebelum konfirmasi; konfirmasi sukses menghasilkan tepat satu pesanan, mengurangi stok, dan mengosongkan keranjang secara atomik. |
| SHOP-07 | Pesanan | Detail menyimpan snapshot produk, harga, dan alamat saat checkout. Pesanan berstatus confirmed dapat dibatalkan sekali; stok kembali tepat sekali. Riwayat pesanan tidak dihapus. |
| SHOP-08 | Persistensi | Wishlist, keranjang, alamat, stok, dan pesanan bertahan setelah proses aplikasi ditutup dan dibuka tanpa menghapus data. |
| SHOP-09 | Kegagalan | Input tidak valid ditolak; kegagalan simpan/checkout tidak menampilkan sukses atau meninggalkan perubahan parsial. |
| SHOP-10 | Reset demo | Memerlukan konfirmasi; batal mempertahankan data; setuju memulihkan fixture awal dan menghapus perubahan lokal. |
| SHOP-11 | Usability | Navigasi Android Back, keyboard, font lebih besar, empty state, dan label aksesibilitas diperiksa pada layar kecil dan besar. |

## Perjalanan utama

1. Buka katalog, cari produk, lalu baca detailnya.
2. Tambahkan produk ke wishlist atau keranjang; ubah jumlah jika diperlukan.
3. Isi dan pilih alamat; tinjau total, lalu konfirmasi **Buat pesanan simulasi**.
4. Lihat detail pesanan, tutup aplikasi, dan buka kembali untuk memastikan riwayat tetap ada.
5. Batalkan pesanan confirmed jika diperlukan; pembatalan mengembalikan stok sekali.

## Aturan produk

- Harga dan ongkir adalah integer rupiah. Ongkir dummy tetap Rp15.000 per pesanan.
- Keranjang kosong tidak dapat checkout. Stok diperiksa ulang saat konfirmasi.
- Tidak ada promo, pajak, atau kupon pada v1; rincian total tidak menyebut komponen yang tidak diterapkan.
- Status pesanan hanya `confirmed` dan `cancelled`. Tidak ada tracking pengiriman seolah-olah nyata.
- Alamat yang diedit/dihapus kemudian tidak mengubah snapshot pesanan lama.
- Label simulasi terlihat pada checkout dan detail pesanan. Profil adalah profil demo lokal.

## Di luar MVP

Backend, autentikasi, penjual/admin, payment gateway, logistik, refund uang asli, chat, ulasan pengguna, produk varian, promo, dan sinkronisasi antarperangkat. Website pemasaran dan App Store/Play Store bukan keluaran tahap dokumentasi ini.

## Desain dan evaluasi

Gunakan referensi Dribbble untuk arah visual katalog dan detail. Buat state yang tidak tersedia pada referensi: keyboard aktif, loading penyimpanan, error, keranjang kosong, stok habis, dan checkout gagal. Desain harus tetap terbaca dengan harga panjang dan nama produk panjang.

Mapping requirement ke pengujian ada di [E2E test plan](E2E_TEST_PLAN.md). Semua requirement P0 di atas harus dibuktikan sebelum v1 dianggap selesai.
