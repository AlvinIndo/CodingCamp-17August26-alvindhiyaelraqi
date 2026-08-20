# Implementation Plan: Expense and Budget Visualizer

## Overview

Membangun aplikasi web client-side menggunakan HTML, CSS, dan Vanilla JavaScript murni. Implementasi dibagi menjadi tahap-tahap inkremental: struktur HTML, styling CSS, modul-modul JS (Storage → Validator → State → Render → Event), wiring keseluruhan, lalu error handling. Setiap modul JS diimplementasikan dan diuji secara mandiri sebelum diintegrasikan.

## Tasks

- [x] 1. Buat struktur proyek dan file HTML dasar
  - Buat direktori `css/` dan `js/` di root proyek
  - Tulis `index.html` dengan struktur semantik lengkap: `<header>` untuk Balance_Display, `<main>` dengan tiga `<section>` (form, chart, list)
  - Sertakan semua elemen HTML sesuai desain: `#balance-amount`, `#transaction-form`, field input (`#item-name`, `#amount`, `#category`), span error (`#error-item-name`, `#error-amount`, `#error-category`), `#expense-chart` canvas, `#chart-empty-msg`, `#transaction-list`, `#list-empty-msg`
  - Tambahkan tag `<script>` untuk Chart.js CDN (`https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js`) dan `js/app.js`
  - Tambahkan `<link>` untuk `css/style.css`
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 5.1, 6.2, 6.3, 6.4_

- [x] 2. Implementasikan CSS styling
  - [x] 2.1 Tulis layout utama dan komponen dasar di `css/style.css`
    - Implementasikan CSS Grid dua kolom (`"form chart" / "list list"`) untuk desktop ≥ 768px
    - Tambahkan `@media (max-width: 767px)` untuk layout satu kolom pada mobile
    - Style `<header>` dengan `position: sticky; top: 0` untuk Balance_Display
    - Style `#transaction-list` dengan `max-height: 400px; overflow-y: auto` agar scrollable
    - Gunakan `box-sizing: border-box` dan `font-size` berbasis `rem`
    - _Requirements: 3.3, 4.2, 6.3, 7.1, 7.2, 7.3_

  - [x] 2.2 Tambahkan feedback visual dan styling interaktif
    - Style tombol submit (`btn-submit`) dan tombol hapus (`btn-delete`) dengan warna berbeda
    - Implementasikan hover/active states: `btn-submit:hover` (background gelap, `translateY(-1px)`), `btn-delete:hover` (merah lebih gelap)
    - Tambahkan `outline: 2px solid #3498db` pada `input:focus` dan `select:focus`
    - Style `.error-msg` dengan warna merah dan `font-size: 0.8rem`
    - _Requirements: 7.2, 7.4, 7.5_

- [x] 3. Implementasikan StorageModule di `js/app.js`
  - [x] 3.1 Tulis StorageModule dengan method `isAvailable`, `load`, dan `save`
    - `isAvailable()`: coba set/get/remove item test di localStorage, tangkap exception, kembalikan boolean
    - `load()`: baca key `"ebv_transactions"`, parse JSON, kembalikan `Transaction[]`; jika kosong kembalikan `[]`; jika parse gagal kembalikan `[]` dan hapus key yang korup
    - `save(transactions)`: serialisasi array ke JSON dan tulis ke key `"ebv_transactions"`
    - Bungkus seluruh operasi dalam `try/catch`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Implementasikan ValidatorModule di `js/app.js`
  - [x] 4.1 Tulis ValidatorModule dengan method `isNonEmpty`, `isPositiveNumber`, `isValidCategory`, dan `validate`
    - `isNonEmpty(str)`: trim string, cek panjang > 0
    - `isPositiveNumber(val)`: parse ke float, cek `isFinite` dan nilai > 0
    - `isValidCategory(cat)`: cek apakah `cat` termasuk dalam `VALID_CATEGORIES` (`["Food", "Transport", "Fun"]`)
    - `validate(itemName, amount, category)`: panggil ketiga helper, kumpulkan error per field, kembalikan `{ valid: boolean, errors: ErrorMap }`
    - _Requirements: 2.5, 2.6_
- [x] 5. Implementasikan StateModule di `js/app.js`
  - [x] 5.1 Tulis StateModule dengan seluruh method state management
    - Deklarasikan array `transactions` sebagai private state di dalam closure/module scope
    - `init(data)`: assign `transactions` dari parameter
    - `getAll()`: kembalikan shallow copy array (`[...transactions]`)
    - `addTransaction(t)`: push transaction ke array
    - `removeTransaction(id)`: filter array, hapus elemen dengan `id` yang cocok
    - `getTotalBalance()`: reduce array, jumlahkan semua `amount`
    - `getCategoryTotals()`: reduce array ke `{ Food: 0, Transport: 0, Fun: 0 }`, akumulasikan amount per kategori
    - _Requirements: 2.4, 3.1, 3.6, 4.1, 4.4, 5.1, 5.2_


- [ ] 6. Checkpoint — Pastikan semua unit dan property test untuk modul logika lulus
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

- [ ] 7. Implementasikan RenderModule di `js/app.js`
  - [ ] 7.1 Tulis method `formatCurrency`, `renderBalance`, dan `renderList`
    - `formatCurrency(amount)`: format angka ke string `"Rp X.XXX"` menggunakan `toLocaleString("id-ID")` dengan prefix `"Rp "`
    - `renderBalance(total)`: update `textContent` pada `#balance-amount` menggunakan `formatCurrency`; tampilkan `"Rp 0"` jika total = 0
    - `renderList(transactions)`: clear `<ul>#transaction-list`, render satu `<li>` per transaction dengan nama item, amount (formatted), category badge, dan tombol hapus (`btn-delete`) dengan `data-id` attribute; toggle visibility `#list-empty-msg`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.5_

  - [ ] 7.2 Tulis method `renderChart` dengan integrasi Chart.js v4
    - Deklarasikan `chartInstance = null` di module scope
    - Implementasikan logika filter: ambil hanya kategori dengan total > 0 menggunakan `CATEGORY_COLORS` (`Food: "#FF6384"`, `Transport: "#36A2EB"`, `Fun: "#FFCE56"`)
    - Jika data kosong: toggle `#chart-empty-msg` visible, sembunyikan canvas, destroy `chartInstance` jika ada
    - Jika ada data: sembunyikan `#chart-empty-msg`, tampilkan canvas; jika `chartInstance` ada — update `data.labels`, `data.datasets[0].data`, `data.datasets[0].backgroundColor`, panggil `chartInstance.update()`; jika belum ada — buat instance `new Chart(ctx, config)` baru
    - Konfigurasi tooltip: tampilkan `"Rp X.XXX (XX.X%)"` menggunakan `toLocaleString("id-ID")`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 7.3 Tulis method `renderAll`
    - Panggil `StateModule.getTotalBalance()`, `StateModule.getAll()`, `StateModule.getCategoryTotals()`
    - Teruskan hasil ke `renderBalance()`, `renderList()`, `renderChart()` secara berurutan
    - _Requirements: 3.4, 4.3, 5.3_

- [ ] 8. Implementasikan EventModule dan App.init() di `js/app.js`
  - [ ] 8.1 Tulis EventModule dengan handler `onFormSubmit` dan `onDeleteClick`
    - `onFormSubmit(event)`: `preventDefault()`, ambil nilai dari `#item-name`, `#amount`, `#category`; panggil `ValidatorModule.validate()`; jika tidak valid — tampilkan pesan error di span `#error-*` yang sesuai dan return; jika valid — bersihkan error, buat objek Transaction (dengan `crypto.randomUUID()` atau `Date.now().toString()` sebagai id, `new Date().toISOString()` sebagai `createdAt`), panggil `StateModule.addTransaction()`, `StorageModule.save()`, `RenderModule.renderAll()`, reset form dengan `form.reset()`
    - `onDeleteClick(event)`: gunakan event delegation pada `<ul>`; cek apakah `event.target` memiliki class `btn-delete`; ambil `data-id`; panggil `StateModule.removeTransaction(id)`, `StorageModule.save()`, `RenderModule.renderAll()`
    - `bindAll()`: pasang event listener `"submit"` pada `#transaction-form` dan `"click"` pada `#transaction-list`
    - _Requirements: 2.4, 2.6, 2.7, 3.6, 4.3, 4.4_

  - [ ] 8.2 Tulis `App.init()` dan pasang ke `DOMContentLoaded`
    - Urutan inisialisasi: (1) `StorageModule.load()`, (2) `StateModule.init(data)`, (3) `RenderModule.renderAll()`, (4) `EventModule.bindAll()`
    - Pasang `document.addEventListener("DOMContentLoaded", App.init)`
    - _Requirements: 1.3, 6.6_

- [ ] 9. Implementasikan error handling
  - [ ] 9.1 Tambahkan penanganan Local Storage tidak tersedia
    - Di `App.init()`, panggil `StorageModule.isAvailable()` sebelum `load()`
    - Jika tidak tersedia: render banner peringatan di atas `<main>` dengan pesan bahwa data tidak akan tersimpan secara permanen; lanjutkan inisialisasi dengan array kosong
    - _Requirements: 1.4_

  - [ ] 9.2 Tambahkan penanganan kegagalan CDN Chart.js
    - Tambahkan `window.onerror` atau event listener `"error"` pada tag `<script>` Chart.js CDN
    - Jika Chart.js gagal dimuat: tampilkan pesan informatif di dalam `#chart-container` bahwa visualisasi tidak tersedia; pastikan fitur lain (form, list, balance) tetap berfungsi normal
    - _Requirements: 5.7, 6.1_

- [ ] 10. Checkpoint akhir — Verifikasi integrasi keseluruhan
  - Pastikan semua tests pass, tanyakan ke user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Property tests menggunakan [fast-check](https://fast-check.io/) — perlu diinstal sebagai dev dependency jika menggunakan test runner
- Unit tests untuk RenderModule memerlukan lingkungan DOM (misalnya jsdom via Vitest atau Jest)
- Chart.js dimuat via CDN — tidak diperlukan npm install untuk library ini
- Tasks bertanda `*` diimplementasikan oleh developer secara manual, bukan oleh coding agent otomatis

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3"] },
    { "id": 7, "tasks": ["7.4", "8.1"] },
    { "id": 8, "tasks": ["8.2"] },
    { "id": 9, "tasks": ["9.1", "9.2"] }
  ]
}
```
