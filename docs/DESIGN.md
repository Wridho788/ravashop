# Design — RavaShop

Status: rancangan M0. Arah visual terinspirasi dari referensi Dribbble di README; semua aset, warna, dan ilustrasi dibuat ulang untuk proyek ini.

## Arah visual

- Latar hangat terang `#F6F4EF`, kartu putih, teks utama `#1F1B16`, teks sekunder `#6F675E`, aksen oranye bata `#D9572B`, sukses `#2F7D4F`, error `#B3261E`.
- Kartu produk bersudut 20dp dengan latar ilustrasi berwarna lembut per kategori; harga tebal dan nama produk maksimal dua baris.
- Tombol utama penuh lebar, tinggi minimal 52dp; semua target sentuh minimal 48dp.
- Ikon Material Design Icons (sama seperti RavaPOS). Ilustrasi produk original dibuat dengan skrip `scripts/generate-product-art.py`.

## Navigasi

Tab bawah: **Beranda** (katalog), **Wishlist**, **Keranjang** (badge jumlah item), **Pesanan**, **Profil**.

Stack di atas tab: Detail produk, Checkout, Daftar alamat, Form alamat (tambah/ubah), Detail pesanan. Android Back menutup stack teratas; di tab selain Beranda, Back kembali ke Beranda.

## Layar dan state

| Layar | Isi | State khusus |
|---|---|---|
| Beranda | Pencarian, chip kategori (Semua + 5 kategori), pilihan urutan (Rekomendasi, Harga termurah, Harga termahal), grid produk 2 kolom | Loading awal, hasil kosong dengan tombol **Hapus pencarian**, badge "Stok habis" |
| Detail produk | Gambar, kategori, nama, harga, stok, deskripsi, tombol wishlist, **Tambah ke keranjang** | Stok habis: tombol nonaktif bertuliskan "Stok habis"; error stok saat jumlah keranjang sudah maksimum |
| Wishlist | Daftar produk favorit, hapus favorit, buka detail | Kosong dengan ajakan ke Beranda |
| Keranjang | Baris produk, stepper jumlah, hapus, subtotal, **Lanjut ke checkout** | Kosong: checkout nonaktif; batas stok di stepper |
| Checkout | Label "Simulasi — tidak ada pembayaran nyata", alamat terpilih, item, subtotal, ongkir Rp15.000, total, **Buat pesanan simulasi** | Tanpa alamat, sedang memproses (tombol nonaktif), error checkout + retry |
| Daftar alamat | Alamat tersimpan, tambah, ubah, hapus (dengan konfirmasi); mode pilih dari checkout | Kosong |
| Form alamat | Nama penerima, nomor kontak, alamat lengkap | Error per field, keyboard aktif, sedang menyimpan, gagal simpan |
| Pesanan | Riwayat pesanan terbaru di atas, status confirmed/cancelled | Kosong |
| Detail pesanan | Label simulasi, nomor, status, waktu, snapshot alamat, item, total, **Batalkan pesanan** | Sudah dibatalkan: tombol hilang, waktu batal tampil |
| Profil | Profil demo lokal, Alamat saya, **Reset data demo** (konfirmasi), versi seed | Panel uji E2E hanya pada build E2E |
| Pemulihan | Pesan error database/migrasi dan **Coba lagi** | Tidak menghapus data otomatis |

## Konvensi testID

`<layar>.<elemen>` dengan ID entitas bila perlu, misalnya `catalog.search`, `catalog.category.cat-bag`, `catalog.sort.price-asc`, `product.product-bag`, `detail.add-to-cart`, `cart.item.product-bag.quantity`, `checkout.confirm`, `order.detail`, `settings.reset`. Label aksesibilitas memakai kalimat untuk pengguna, bukan ID.
