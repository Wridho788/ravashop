# Development — RavaShop

Status pekerjaan ada di [Milestones](MILESTONES.md); skenario pengujian di [E2E test plan](E2E_TEST_PLAN.md); hasil eksekusi nyata di [Verification](VERIFICATION.md).

## Lingkungan yang dipakai

| Item | Nilai |
|---|---|
| Node / npm | 22.13.0 / 11.8.0 (`engines.node >= 22.11`) |
| JDK | 17.0.12 |
| React Native | 0.87.1 (sama dengan RavaPOS), React 19.2.3, TypeScript 6 |
| Android | application ID `com.ravashop`, minSdk 24, compileSdk 37, targetSdk 36, Gradle 9.4.1, NDK 27.1 |
| Perangkat uji | Samsung Galaxy A12 `SM-A125F`, serial `RR8R20BRP4P`, Android 12 (API 31), 720×1600 @300dpi (~384dp), arm64-v8a |
| Maestro | CLI 2.6.1 |

Dependensi runtime dikunci tanpa caret di `package.json` dan `package-lock.json`: React Navigation 7 (native-stack, bottom-tabs), react-native-screens 4.28.0, safe-area-context 5.10.1, Material Design Icons 13.1.4. SQLite memakai native module sendiri (`android/app/src/main/java/com/ravashop/RavaShopSqliteModule.kt`), tanpa library pihak ketiga.

`android/local.properties` (tidak masuk source) berisi `sdk.dir` ke Android SDK lokal.

## Struktur

```text
src/
  app/         # ShopContext (repository, refresh, toast), navigation
  features/    # catalog, wishlist, cart, addresses, checkout, orders, profile
  domain/      # types, errors, money, validation, totals
  data/        # driver contract, native driver, schema/migrations, fixtures, repository
  e2e/         # faults.ts (stub) dan faults.e2e.ts (hanya build E2E)
  shared/      # theme, UI components, format, useLoad
assets/products/   # ilustrasi original (scripts/generate-product-art.py)
__tests__/         # unit + integration SQLite (node:sqlite)
.maestro/          # flow E2E dan subflows
scripts/           # build-android.js, generate-product-art.py
```

## Perintah

| Tujuan | Perintah |
|---|---|
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit + integration | `npm test` |
| APK debug (butuh Metro: `npm start`) | `npm run build:android:debug` |
| APK release tanpa hook E2E | `npm run build:android:release` |
| APK E2E (release + panel fault) | `npm run build:android:e2e` |
| Pasang APK | `adb -s RR8R20BRP4P install -r build/RavaShop-<mode>-arm64-v8a-<tanggal>.apk` |
| Semua flow E2E | `maestro --device RR8R20BRP4P test .maestro/` |

`scripts/build-android.js` menyalin APK ke `build/` dengan nama bertanggal dan mencetak SHA-256. Untuk release/e2e, task bundle JS selalu dijalankan ulang lalu bundle diperiksa: build release gagal bila memuat panel fault, build E2E gagal bila tidak memuatnya.

**Batas path Windows.** Di folder proyek yang dalam ini, folder CMake bawaan `android/app/.cxx` membuat path object C++ (misalnya dari `react-native-safe-area-context`) melebihi `CMAKE_OBJECT_PATH_MAX` 250. CMake lalu berhenti memendekkan nama object, dan ninja di NDK menolak path lebih dari 260 karakter. Karena itu, `android/app/build.gradle` memindahkan staging CMake ke `%USERPROFILE%\.rscxx` di Windows (dapat diganti lewat `RAVASHOP_CXX_DIR`). Folder itu hanya berisi cache build dan aman dihapus.

## Cara kerja

- UI tidak mengakses database. Semua baca/tulis lewat `createRepository(driver)`; setiap tulis berjalan dalam satu batch transaksi, dan UI menampilkan sukses hanya sesudah batch commit, lalu `refresh()` memuat ulang dari SQLite.
- Integration test memakai `node:sqlite` dengan kontrak driver yang sama (`__tests__/helpers/nodeDriver.ts`), termasuk `expectChanges` dan rollback.
- Fixture `shop-v1` deterministik; aset dibundel; tidak ada akses jaringan.
- Build E2E (`RAVASHOP_E2E=1`) membuat Metro memakai `src/e2e/faults.e2e.ts`. Panel di Profil memasang fault sekali-pakai yang disisipkan di tengah batch SQLite asli.

## Menjalankan E2E

1. `adb devices` harus menampilkan perangkat; `maestro --version` 2.6.1.
2. `npm run build:android:e2e`, lalu pasang APK E2E. Flow E10 dan E15 membutuhkan build ini; flow lain dapat dijalankan pada build E2E atau release.
3. `maestro --device RR8R20BRP4P test .maestro/ --test-output-dir build/maestro/<tanggal>`. Screenshot `takeScreenshot` disimpan relatif terhadap direktori kerja (`evidence/`, diabaikan git).
4. Setiap flow mulai dari `clearState` (seed baru). Flow persistensi memakai `subflows/relaunch.yaml` (stop + launch tanpa clear data).

Jangan menganggap retry hijau sebagai pengganti diagnosis tes flaky. Catat hasil nyata di `docs/VERIFICATION.md`.

## Rilis

Jalankan gate M3 pada build kandidat rilis. Release saat ini masih ditandatangani debug keystore (sama seperti template); keystore distribusi disiapkan di M4 dan tidak disimpan di source.
