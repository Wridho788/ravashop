# TRD — RavaShop

Status: rancangan teknis v0.1. Versi dependensi belum dipilih atau diverifikasi.

## Stack dan target

React Native Community CLI, TypeScript strict, navigasi native yang kompatibel, SQLite dengan dukungan transaksi, Jest/React Native Testing Library, dan Maestro. Pilih serta kunci versi setelah spike kompatibilitas Android, native module, dan toolchain. Android minimum/target SDK ditetapkan dari scaffold dan dicatat sebelum gate M1. Tidak mengasumsikan paket RavaPOS dapat langsung disalin.

## Model data

| Entitas | Field utama dan constraint |
|---|---|
| Product | `id`, `name`, `categoryId`, `description`, `assetKey`, `priceRupiah`, `stock`; harga integer positif, stok integer nonnegatif. |
| Wishlist | `productId` unik. |
| CartItem | `productId` unik, `quantity` integer positif. |
| Address | `id`, `recipient`, `phone`, `addressText`; trim input, field wajib dan panjang dibatasi. |
| Order | `id`, `operationId` unik, `status`, `createdAt`, `cancelledAt?`, `addressSnapshot`, `subtotalRupiah`, `shippingRupiah`, `totalRupiah`. |
| OrderItem | `orderId`, `productId`, `nameSnapshot`, `unitPriceRupiah`, `quantity`, `lineTotalRupiah`. |
| Metadata | `schemaVersion`, `seedVersion`. |

Gunakan ID stabil; foreign keys aktif. Nomor kontak disimpan sebagai string. Validasi menerima digit, spasi, tanda `+`, dan tanda hubung; wajib memiliki 8–15 digit setelah normalisasi. Alamat 10–300 karakter; nama penerima 2–80 karakter. UI menampilkan error per field.

## Aturan integritas

- `subtotal = sum(unitPrice × quantity)`; ongkir Rp15.000; `total = subtotal + shipping`.
- Semua nominal dan hasil perhitungan berada dalam batas safe integer JavaScript; operasi di luar batas ditolak.
- Validasi jumlah, stok, alamat, dan total dilakukan lagi dalam checkout, bukan hanya pada formulir.
- Tulis order, item, stok, dan keranjang dalam satu transaksi SQLite. Error di titik mana pun menyebabkan rollback.
- Tombol konfirmasi dinonaktifkan saat proses berjalan; constraint operation ID tetap wajib untuk mencegah duplikasi.
- Harga dan alamat order adalah snapshot immutable. Pembatalan hanya boleh `confirmed -> cancelled`.
- Seed tidak berjalan ulang bila database sudah berisi metadata valid. Versi schema tidak dikenal menghasilkan error pemulihan, bukan reset otomatis.

## Kontrak repository

Repository menyediakan read catalog, wishlist mutation, cart mutation, address CRUD, `checkout(operationId, addressId)`, `cancelOrder(orderId)`, dan `resetDemo()`. API async mengembalikan hasil commit atau error terstruktur: validation, stock, storage, migration. Komponen menampilkan error dan menyediakan retry yang sesuai.

## Fixture pengujian

Seed versi `shop-v1`: `product-bag` Rp250.000 stok 3, `product-bottle` Rp100.000 stok 5, `product-sold-out` stok 0. Keranjang, wishlist, alamat, dan order mula-mula kosong. Dua tas + satu botol menghasilkan subtotal Rp600.000 dan total Rp615.000. Checkout menyisakan stok tas 1 dan botol 4; cancel mengembalikannya ke 3 dan 5.

Katalog lengkap `shop-v1` (urutan default = urutan tabel). Tiga produk pertama adalah produk acuan E2E; ID, harga, dan stoknya tidak boleh diubah tanpa menaikkan versi seed.

| ID | Nama | Kategori | Harga | Stok |
|---|---|---|---|---|
| `product-bag` | Tas Ransel Kanvas | `cat-bag` Tas | Rp250.000 | 3 |
| `product-bottle` | Botol Minum Baja 750 ml | `cat-drink` Botol & Tumbler | Rp100.000 | 5 |
| `product-sold-out` | Topi Bucket Edisi Terbatas | `cat-accessory` Aksesori | Rp175.000 | 0 |
| `product-tote` | Tote Bag Serbaguna | `cat-bag` Tas | Rp180.000 | 8 |
| `product-sneakers` | Sepatu Lari Ringan | `cat-shoes` Sepatu | Rp650.000 | 4 |
| `product-sandal` | Sandal Kasual Busa | `cat-shoes` Sepatu | Rp120.000 | 10 |
| `product-headphone` | Headphone Nirkabel | `cat-audio` Audio | Rp850.000 | 2 |
| `product-earbuds` | Earbuds Mini | `cat-audio` Audio | Rp320.000 | 6 |
| `product-tumbler` | Tumbler Kopi 450 ml | `cat-drink` Botol & Tumbler | Rp135.000 | 7 |
| `product-watch` | Jam Tangan Minimalis | `cat-accessory` Aksesori | Rp450.000 | 3 |

Pencarian adalah substring nama tanpa membedakan huruf besar/kecil. Kata `ransel` hanya cocok dengan `product-bag`. Kategori `Tas` berisi `product-bag` dan `product-tote`; urutan harga termurah di kategori itu adalah tote (Rp180.000) lalu tas ransel (Rp250.000). Gambar produk adalah ilustrasi original yang dibundel di `assets/products/`.

## Aturan tepi

- Jumlah keranjang diubah dengan stepper; minimum 1 (hapus memakai aksi terpisah), maksimum stok saat ini. Domain dan repository tetap menolak nol, negatif, pecahan, dan melebihi stok.
- Menambah produk yang sudah ada di keranjang menaikkan jumlah baris yang sama; bila jumlah sudah sama dengan stok, operasi ditolak dengan error stok.
- Produk stok nol dapat masuk wishlist tetapi tidak dapat masuk keranjang.
- Bila saat checkout jumlah baris melebihi stok terbaru, checkout ditolak dengan error stok dan tidak ada data yang berubah.
- Checkout memilih otomatis alamat yang paling baru disimpan bila ada; pengguna dapat menggantinya. Alamat yang dihapus hilang dari pilihan; tanpa alamat, konfirmasi menampilkan permintaan memilih/menambah alamat.
- Operation ID dibuat saat layar checkout dibuka dan dipakai ulang untuk retry sampai checkout sukses.

## Kontrak UI dan build

Gunakan testID stabil pada screen, field, item, dan CTA. Nama aksesibilitas menjelaskan aksi; jangan menggantinya dengan ID teknis. Validasi selector melalui hierarchy Android sesudah UI dibuat. Target sentuh minimal 48dp; uji font scale 1.3 dan layar 360dp tanpa konten terpotong.

Build debug untuk pengembangan, build E2E untuk kontrol fixture/kegagalan, dan release untuk distribusi.

Penyimpanan memakai native module Kotlin `RavaShopSqlite` (pola sama dengan RavaPOS) di atas `android.database.sqlite`: `execute(sql, params)` dan `executeBatch(statements)` dalam satu transaksi. Statement batch boleh membawa `expectChanges`; jumlah perubahan yang berbeda membatalkan seluruh transaksi. Integration test Jest memakai driver `node:sqlite` dengan kontrak yang sama.

Build E2E dibundel dengan `RAVASHOP_E2E=1`; Metro lalu menukar setiap modul di `src/e2e/` dengan pasangan `.e2e`-nya (`faults.e2e.ts`, `E2EPanel.e2e.tsx`), sedangkan build lain hanya memuat stub kosong. `scripts/build-android.js` memeriksa bundle release agar tidak memuat panel. Panel Profil pada build E2E dapat memasang kegagalan sekali-pakai untuk checkout atau simpan alamat/keranjang. Kegagalan disisipkan sebagai statement yang melanggar constraint di tengah batch asli, sehingga rollback terjadi di SQLite perangkat. Fixture bersih untuk E2E dibuat dengan `clearState` Maestro sehingga seed berjalan pada database baru. Simpan build ID/hash, application ID, dependency lockfile, dan versi perangkat pada laporan. Kontrol fault injection tidak boleh ada pada release. Jangan mencatat alamat atau nomor kontak di log produksi.

## Quality gate

Typecheck, lint, unit, integration SQLite, E2E P0, visual review, serta smoke APK release harus lulus. Detail traceability dan bukti ada di [E2E test plan](E2E_TEST_PLAN.md). UI flow lewat mock repository saja tidak memenuhi pengujian persistensi atau checkout atomik.
