# Verification — RavaShop

Hanya berisi hasil eksekusi nyata. Bagian yang belum dijalankan ditandai **belum dijalankan**.

## 2026-10-05 — fondasi M1 dan kode M2

Lingkungan: Windows 11, Node 22.13.0, JDK 17.0.12, RN 0.87.1, Gradle 9.4.1. Source belum di bawah git, sehingga belum ada commit hash.

| Gate | Perintah | Hasil |
|---|---|---|
| Typecheck | `npm run typecheck` | Lulus |
| Lint | `npm run lint` | Lulus, 0 warning |
| Unit + integration SQLite | `npm test` | Lulus: 3 suite, 44 test (28 integration pada `node:sqlite` 3.47.2) |
| APK E2E | `npm run build:android:e2e` | Lulus, `build/RavaShop-e2e-arm64-v8a-2026-10-05.apk`, SHA-256 `ea235ec9a530f4a7295ca771a58122807bbb25d3d51b9890f10c9839b65abc39`, panel E2E ada |
| APK release | `npm run build:android:release` | Lulus, `build/RavaShop-release-arm64-v8a-2026-10-05.apk`, SHA-256 `628ac41bd5ae118b6256ab520335da2b28df224aa0654c32020694de6f294d71`, panel E2E tidak ada (diperiksa skrip) |
| Smoke + E01–E15 Maestro pada Galaxy A12 `RR8R20BRP4P` | `maestro --device RR8R20BRP4P test .maestro/` | **Belum dijalankan.** Perangkat terputus dari adb sebelum APK terpasang. |
| Review visual, font scale 1.3, TalkBack (E16) | manual | **Belum dijalankan** |

Integration test membuktikan pada SQLite sungguhan: seed sekali dan persistensi setelah file database dibuka ulang, penolakan schema/seed yang tidak dikenal tanpa mengubah data, pencarian/filter/urutan, wishlist tanpa duplikat, batas jumlah keranjang, CRUD dan validasi alamat, totals checkout referensi (Rp600.000 + Rp15.000 = Rp615.000; stok 1/4), idempotensi operation ID (berurutan dan bersamaan), rollback saat fault di tengah transaksi dan saat driver gagal di statement 0/1/3/4/6, penolakan stok yang berubah, snapshot order tetap, pembatalan tepat sekali termasuk dua pembatalan bersamaan, fault tulis alamat/keranjang tanpa perubahan, dan reset demo.

Temuan selama build:
- Path object CMake melebihi batas ninja di Windows. Diperbaiki dengan memindah staging CMake ke `%USERPROFILE%\.rscxx` (`android/app/build.gradle`).
- Pemeriksaan bundle mendeteksi string panel E2E di build release. Diperbaiki dengan memindah panel ke `src/e2e/E2EPanel(.e2e).tsx`; build release sesudahnya lulus pemeriksaan.
