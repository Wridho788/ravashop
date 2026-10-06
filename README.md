# RavaShop

**Status: aplikasi Android sudah dikodekan (M2). Unit/integration test dan build APK lulus; flow E2E Maestro sudah ditulis tetapi belum dijalankan di perangkat.** Lihat [Verification](docs/VERIFICATION.md).

Nama kerja untuk aplikasi e-commerce mobile berbasis React Native CLI dan TypeScript, dengan Android sebagai target MVP pertama. Pengguna dapat mencari produk contoh, mengelola wishlist dan keranjang, menyimpan alamat lokal, lalu melakukan checkout simulasi dan melihat pesanan.

Inspirasi: [Ecommerce App — Rakib Kowshar / Orizon](https://dribbble.com/shots/25304102-Ecommerce-App). Layout detail, branding, aset, dan alur akan dirancang untuk proyek ini. Referensi bukan lisensi untuk menyalin aset.

## Lokasi

`C:\Users\Hp\Documents\example-project\mobile\react-native-cli\RavaShop`

## Keputusan awal

- React Native CLI; Android dahulu. Build iOS memerlukan macOS dan verifikasi tersendiri.
- Produk dan stok dummy, gambar dibundel agar alur utama dapat digunakan tanpa jaringan.
- CRUD keranjang, wishlist, dan alamat disimpan di perangkat; checkout menghasilkan pesanan simulasi lokal.
- SQLite lewat native module Kotlin sendiri (pola RavaPOS) untuk checkout atomik.
- Tidak ada akun, backend, pembayaran uang asli, atau pengiriman barang.
- Unit, integration, dan E2E pada aplikasi Android terpasang menjadi syarat rilis.

## Dokumen

- [PRD](docs/PRD.md) — pengguna, scope, aturan produk, acceptance criteria.
- [Architecture](docs/ARCHITECTURE.md) — modul, data flow, batas sistem.
- [TRD](docs/TRD.md) — data, aturan integritas, kontrak teknis.
- [Milestones](docs/MILESTONES.md) — urutan kerja, checklist, gerbang rilis.
- [Development](docs/DEVELOPMENT.md) — panduan implementasi dan verifikasi.
- [E2E test plan](docs/E2E_TEST_PLAN.md) — skenario Given/When/Then, fixture, dan bukti pengujian.

Perintah build, test, dan E2E ada di [Development](docs/DEVELOPMENT.md). Mulai dengan `npm install`, `npm test`, lalu `npm run build:android:e2e`.

## Aset dan lisensi

| Aset | Sumber | Lisensi |
|---|---|---|
| Ikon UI (tab, tombol) | Material Design Icons dari Pictogrammers (`@mdi/font` 7.4.47) lewat `@react-native-vector-icons/material-design-icons` 13.1.4 | Font: Apache-2.0 (metadata npm `@mdi/font`); paket pembungkus: MIT |
| Ilustrasi produk (`assets/products/`) | Dibuat untuk proyek ini dengan `scripts/generate-product-art.py` | Original, milik proyek |
| Icon aplikasi (launcher, `assets/brand/ravashop-icon.png`) | Dibuat untuk proyek ini dengan `scripts/generate-app-icon.py` | Original, milik proyek |

Referensi Dribbble hanya dipakai sebagai arah visual; tidak ada aset yang disalin.
