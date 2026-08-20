# Design Document — Expense and Budget Visualizer

## Overview

Expense and Budget Visualizer adalah web application client-side yang dibangun sepenuhnya dengan HTML, CSS, dan Vanilla JavaScript. Tidak ada server, tidak ada build tool, tidak ada framework — aplikasi dibuka langsung via file protocol di browser modern.

Arsitektur mengikuti pola **Module Pattern** satu file JS: setiap tanggung jawab dikelompokkan dalam object/modul literal yang saling berkomunikasi melalui pemanggilan fungsi langsung. State aplikasi disimpan dalam satu array `transactions` yang hidup di memori, disinkronkan ke Local Storage setiap kali ada perubahan, dan dirender ulang ke DOM secara imperatif.

Pie chart dirender menggunakan [Chart.js v4 via CDN](https://cdn.jsdelivr.net/npm/chart.js) karena:
- Tidak memerlukan build step, cukup satu tag `<script>`.
- API-nya stabil dan tersedia bebas di jsDelivr / cdnjs.
- Mendukung pie chart dengan legend, tooltip, dan animasi bawaan.

```
┌─────────────────────────────────────────────────────┐
│                     Browser Tab                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                  index.html                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐  │   │
│  │  │ Balance  │  │  Chart   │  │   Form    │  │   │
│  │  │ Display  │  │ (canvas) │  │           │  │   │
│  │  └──────────┘  └──────────┘  └───────────┘  │   │
│  │  ┌─────────────────────────────────────────┐ │   │
│  │  │          Transaction List               │ │   │
│  │  └─────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ app.js  │  │ style.css│  │ Chart.js (CDN)    │  │
│  └─────────┘  └──────────┘  └───────────────────┘  │
│                                                      │
│         Local Storage (key: "ebv_transactions")      │
└─────────────────────────────────────────────────────┘
```

---

## Architecture

### Pola Desain

Aplikasi menggunakan **Module Object Pattern** dalam satu file `app.js`. Setiap modul adalah plain object dengan method-method terkait. Urutan inisialisasi:

1. DOM selesai dimuat (`DOMContentLoaded`)
2. `StorageModule.load()` → mengambil data dari Local Storage
3. `StateModule.init(data)` → mengisi array `transactions`
4. `RenderModule.renderAll()` → render list, balance, dan chart secara lengkap
5. Event listeners dipasang untuk form submit dan klik hapus

### Alur Data (Data Flow)

```
Pengguna mengisi form
        │
        ▼
ValidatorModule.validate(formData)
        │ valid? tidak → tampilkan error, stop
        │ valid? ya ↓
        ▼
StateModule.addTransaction(transaction)
        │
        ├──► StorageModule.save(transactions)  → Local Storage
        │
        └──► RenderModule.renderAll()
                    │
                    ├──► renderBalance()   → Balance_Display
                    ├──► renderList()      → Transaction_List
                    └──► renderChart()     → Chart (canvas)
```

```
Pengguna klik tombol hapus
        │
        ▼
StateModule.removeTransaction(id)
        │
        ├──► StorageModule.save(transactions)  → Local Storage
        │
        └──► RenderModule.renderAll()
```

```
Halaman dimuat
        │
        ▼
StorageModule.load() → parse JSON dari localStorage["ebv_transactions"]
        │
        ├── Local Storage tersedia & ada data → kembalikan array Transaction[]
        ├── Local Storage tersedia & kosong   → kembalikan []
        └── Local Storage tidak tersedia       → tampilkan warning, kembalikan []
```

### Dependency antara Modul

```
DOMContentLoaded
    │
    └── App.init()
            ├── StorageModule.load()         (tanpa dependency)
            ├── StateModule.init()           (depends: StorageModule)
            ├── RenderModule.renderAll()     (depends: StateModule)
            └── EventModule.bindAll()        (depends: RenderModule, StateModule)
```

---

## Components and Interfaces

### HTML Layout (Struktur Semantik)

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expense & Budget Visualizer</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <!-- 1. Header / Balance -->
  <header class="app-header">
    <h1>Expense Tracker</h1>
    <div id="balance-display" class="balance-display">
      <span class="balance-label">Total Pengeluaran</span>
      <span id="balance-amount" class="balance-amount">Rp 0</span>
    </div>
  </header>

  <main class="app-main">
    <!-- 2. Form -->
    <section class="form-section" aria-label="Tambah Transaksi">
      <h2>Tambah Transaksi</h2>
      <form id="transaction-form" novalidate>
        <div class="form-group">
          <label for="item-name">Nama Item</label>
          <input type="text" id="item-name" name="itemName"
                 placeholder="Contoh: Nasi Goreng" autocomplete="off" />
          <span class="error-msg" id="error-item-name" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label for="amount">Jumlah (Rp)</label>
          <input type="number" id="amount" name="amount"
                 min="1" step="any" placeholder="Contoh: 25000" />
          <span class="error-msg" id="error-amount" aria-live="polite"></span>
        </div>
        <div class="form-group">
          <label for="category">Kategori</label>
          <select id="category" name="category">
            <option value="">-- Pilih Kategori --</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Fun">Fun</option>
          </select>
          <span class="error-msg" id="error-category" aria-live="polite"></span>
        </div>
        <button type="submit" class="btn-submit">Tambah</button>
      </form>
    </section>

    <!-- 3. Chart -->
    <section class="chart-section" aria-label="Distribusi Pengeluaran">
      <h2>Distribusi per Kategori</h2>
      <div id="chart-container" class="chart-container">
        <canvas id="expense-chart"></canvas>
        <p id="chart-empty-msg" class="chart-empty" hidden>
          Belum ada transaksi. Tambahkan transaksi untuk melihat grafik.
        </p>
      </div>
    </section>

    <!-- 4. Transaction List -->
    <section class="list-section" aria-label="Daftar Transaksi">
      <h2>Daftar Transaksi</h2>
      <ul id="transaction-list" class="transaction-list" aria-live="polite">
        <!-- Transaction items dirender oleh JS -->
      </ul>
      <p id="list-empty-msg" class="list-empty" hidden>
        Belum ada transaksi tercatat.
      </p>
    </section>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

### Modul-Modul JavaScript (`js/app.js`)

#### `StorageModule`

| Method | Parameter | Return | Deskripsi |
|---|---|---|---|
| `isAvailable()` | — | `boolean` | Cek apakah localStorage dapat diakses |
| `load()` | — | `Transaction[]` | Baca dan parse data dari localStorage |
| `save(transactions)` | `Transaction[]` | `void` | Serialisasi dan tulis ke localStorage |

#### `ValidatorModule`

| Method | Parameter | Return | Deskripsi |
|---|---|---|---|
| `validate(itemName, amount, category)` | `string, string, string` | `ValidationResult` | Periksa semua field; kembalikan `{ valid: boolean, errors: ErrorMap }` |
| `isNonEmpty(str)` | `string` | `boolean` | Cek string bukan kosong/whitespace saja |
| `isPositiveNumber(val)` | `string` | `boolean` | Cek nilai numerik positif (> 0) |
| `isValidCategory(cat)` | `string` | `boolean` | Cek apakah kategori termasuk `Food`, `Transport`, `Fun` |

#### `StateModule`

| Method | Parameter | Return | Deskripsi |
|---|---|---|---|
| `init(transactions)` | `Transaction[]` | `void` | Inisialisasi state dengan data dari storage |
| `getAll()` | — | `Transaction[]` | Kembalikan salinan array transactions |
| `addTransaction(t)` | `Transaction` | `void` | Tambahkan transaction ke state |
| `removeTransaction(id)` | `string` | `void` | Hapus transaction berdasarkan id |
| `getTotalBalance()` | — | `number` | Jumlahkan semua amount |
| `getCategoryTotals()` | — | `CategoryTotals` | Hitung total per kategori |

#### `RenderModule`

| Method | Parameter | Return | Deskripsi |
|---|---|---|---|
| `renderAll()` | — | `void` | Panggil renderBalance, renderList, renderChart |
| `renderBalance(total)` | `number` | `void` | Update teks di `#balance-amount` |
| `renderList(transactions)` | `Transaction[]` | `void` | Render ulang seluruh `<ul>` |
| `renderChart(categoryTotals)` | `CategoryTotals` | `void` | Update atau buat instance Chart.js |
| `formatCurrency(amount)` | `number` | `string` | Format angka ke string "Rp X.XXX" |

#### `EventModule`

| Method | Parameter | Return | Deskripsi |
|---|---|---|---|
| `bindAll()` | — | `void` | Pasang semua event listener |
| `onFormSubmit(event)` | `Event` | `void` | Handler submit form |
| `onDeleteClick(event)` | `Event` | `void` | Handler klik hapus (event delegation pada `<ul>`) |

---

## Data Models

### `Transaction`

```javascript
/**
 * @typedef {Object} Transaction
 * @property {string}   id        - ID unik, dibuat dengan crypto.randomUUID() atau Date.now().toString()
 * @property {string}   itemName  - Nama item; string non-kosong
 * @property {number}   amount    - Jumlah pengeluaran; number > 0
 * @property {Category} category  - Salah satu dari: "Food" | "Transport" | "Fun"
 * @property {string}   createdAt - ISO 8601 timestamp saat transaksi dicatat
 */
```

### `Category`

```javascript
/**
 * @typedef {"Food" | "Transport" | "Fun"} Category
 */
const VALID_CATEGORIES = ["Food", "Transport", "Fun"];
```

### `ValidationResult`

```javascript
/**
 * @typedef {Object} ValidationResult
 * @property {boolean}  valid  - true jika semua field lolos validasi
 * @property {ErrorMap} errors - object berisi pesan error per field
 */

/**
 * @typedef {Object} ErrorMap
 * @property {string} [itemName]  - pesan error untuk field itemName
 * @property {string} [amount]    - pesan error untuk field amount
 * @property {string} [category]  - pesan error untuk field category
 */
```

### `CategoryTotals`

```javascript
/**
 * @typedef {Object} CategoryTotals
 * @property {number} Food      - total amount kategori Food
 * @property {number} Transport - total amount kategori Transport
 * @property {number} Fun       - total amount kategori Fun
 */
```

### Format Local Storage

- **Key**: `"ebv_transactions"`
- **Value**: JSON string dari `Transaction[]`

Contoh:
```json
[
  {
    "id": "1720000000000",
    "itemName": "Nasi Goreng",
    "amount": 25000,
    "category": "Food",
    "createdAt": "2024-07-03T08:00:00.000Z"
  }
]
```

---

## Integrasi Chart.js

Chart.js dimuat via CDN sebelum `app.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
```

### Konfigurasi Pie Chart

```javascript
// Palet warna per kategori — konsisten di chart dan legend
const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56"
};

// Instance Chart.js disimpan agar bisa di-update tanpa recreate
let chartInstance = null;

function renderChart(categoryTotals) {
  const labels    = Object.keys(categoryTotals).filter(k => categoryTotals[k] > 0);
  const dataValues = labels.map(k => categoryTotals[k]);
  const colors     = labels.map(k => CATEGORY_COLORS[k]);

  const isEmpty = dataValues.length === 0;
  document.getElementById("chart-empty-msg").hidden = !isEmpty;
  document.getElementById("expense-chart").hidden   = isEmpty;

  if (isEmpty) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  const config = {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data:            dataValues,
        backgroundColor: colors,
        borderColor:     "#ffffff",
        borderWidth:     2,
        hoverOffset:     8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { padding: 16, font: { size: 13 } }
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const val   = ctx.parsed;
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((val / total) * 100).toFixed(1);
              return ` Rp ${val.toLocaleString("id-ID")} (${pct}%)`;
            }
          }
        }
      }
    }
  };

  if (chartInstance) {
    // Update data in-place untuk menghindari flicker
    chartInstance.data.labels           = labels;
    chartInstance.data.datasets[0].data = dataValues;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.update();
  } else {
    const ctx = document.getElementById("expense-chart").getContext("2d");
    chartInstance = new Chart(ctx, config);
  }
}
```

### Keputusan Desain: Update vs Recreate

Chart instance di-**update** (bukan destroy/recreate) setiap kali data berubah. Hal ini menghindari flickering animasi yang mengganggu pada penambahan/penghapusan transaksi yang sering. Instance hanya di-destroy jika list menjadi kosong.

---

## Struktur File dan Folder

```
expense-budget-visualizer/
├── index.html          ← satu-satunya HTML file
├── css/
│   └── style.css       ← satu-satunya CSS file (Req 6.3)
└── js/
    └── app.js          ← satu-satunya JS file (Req 6.4)
```

Chart.js dimuat dari CDN, bukan disimpan lokal — sesuai dengan Requirement 6 (no server needed; CDN bekerja baik dengan file protocol kecuali dalam kasus offline).

> **Catatan**: Jika dibutuhkan mode offline penuh, Chart.js dapat diunduh dan diletakkan di `js/chart.umd.min.js` dan path di `<script>` diubah. Keputusan ini diserahkan ke developer.

---

## Strategi CSS

### Layout Utama

Menggunakan CSS Grid dua kolom pada layar lebar (≥ 768px) dan satu kolom pada layar sempit.

```css
/* Desktop ≥ 768px */
.app-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "form  chart"
    "list  list";
  gap: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
}

/* Mobile < 768px */
@media (max-width: 767px) {
  .app-main {
    grid-template-columns: 1fr;
    grid-template-areas:
      "form"
      "chart"
      "list";
  }
}
```

### Komponen Utama

| Komponen | Strategi CSS |
|---|---|
| `Balance_Display` | `position: sticky; top: 0` di dalam `<header>` — selalu terlihat |
| `Transaction_List` | `max-height: 400px; overflow-y: auto` — scrollable (Req 3.3) |
| `Chart` canvas | `max-width: 320px; margin: 0 auto` — center di kolom kanan |
| Tombol hapus | Merah (#e74c3c), hover darker — feedback visual jelas (Req 7.4) |
| Error messages | Warna merah, `font-size: 0.8rem`, `aria-live="polite"` |

### Responsivitas

- Breakpoint utama: **768px** (mobile) dan **1024px** (desktop standar)
- Minimum lebar yang didukung: **360px** (Req 7.3)
- Font-size dasar: `16px`; menggunakan `rem` untuk skala yang konsisten
- Semua gambar/element menggunakan `box-sizing: border-box`

### Feedback Visual (Req 7.4)

```css
.btn-submit:hover    { background-color: #2980b9; transform: translateY(-1px); }
.btn-submit:active   { transform: translateY(0); }
.btn-delete:hover    { background-color: #c0392b; }
select:focus,
input:focus          { outline: 2px solid #3498db; outline-offset: 2px; }
```

---

## Error Handling

| Skenario | Penanganan |
|---|---|
| Local Storage tidak tersedia | `StorageModule.isAvailable()` mengembalikan `false`; banner peringatan ditampilkan di atas halaman (Req 1.4) |
| Local Storage data korup | `try/catch` di `StorageModule.load()`; jika parse gagal, kembalikan `[]` dan reset key |
| Field kosong/tidak valid | `ValidatorModule.validate()` mengembalikan error per field; pesan ditampilkan secara inline (Req 2.6) |
| Amount bukan angka atau ≤ 0 | Ditangkap oleh `isPositiveNumber()`; pesan error ditampilkan |
| Kategori tidak valid | Ditangkap oleh `isValidCategory()`; UI dropdown seharusnya sudah membatasi, tapi validasi tetap ada di layer JS |
| Chart.js CDN gagal dimuat | Bagian chart tidak tampil; error dicatat via `window.onerror`; fitur lain tetap berjalan |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

> **Catatan Reflection**: Setelah prework analysis, beberapa kriteria yang redundan digabungkan:
> - Req 1.1, 1.2, 1.3 dicakup secara transitif oleh Property 1 (round-trip).
> - Req 3.4 dan 4.3 (update otomatis setelah tambah) dicakup oleh Property 4.
> - Req 4.4 (update balance setelah hapus) dicakup oleh Property 5.
> - Req 5.3 dan 5.4 (update chart setelah tambah/hapus) dicakup oleh Property 6.
> - Req 3.1 (count list) dan 3.2 (isi item) digabung menjadi satu Property 4 komprehensif.

---

### Property 1: Serialisasi round-trip Transaction

*For any* array Transaction yang valid (termasuk array kosong, array satu elemen, dan array banyak elemen), menyimpannya ke Local Storage lalu membacanya kembali harus menghasilkan array yang ekuivalen secara struktural — setiap field `id`, `itemName`, `amount`, `category`, dan `createdAt` pada setiap elemen harus bernilai sama persis dengan array aslinya.

**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

---

### Property 2: Validasi menolak semua input itemName yang hanya whitespace

*For any* string yang seluruh karakternya adalah whitespace (spasi, tab, newline, atau kombinasinya), `ValidatorModule.validate()` harus mengembalikan `{ valid: false }` dengan error pada field `itemName`, dan tidak boleh ada Transaction yang ditambahkan ke state.

**Validates: Requirements 2.5, 2.6**

---

### Property 3: Validasi menolak semua Amount yang tidak positif

*For any* nilai numerik yang ≤ 0 (termasuk nol, negatif, dan nilai sangat kecil), atau nilai non-numerik (NaN, string), `ValidatorModule.validate()` harus mengembalikan `{ valid: false }` dengan error pada field `amount`, dan tidak boleh ada Transaction yang ditambahkan ke state.

**Validates: Requirements 2.5, 2.6**

---

### Property 4: Penambahan transaksi valid memperbarui list secara konsisten

*For any* daftar transaksi awal (termasuk daftar kosong) dan satu Transaction baru yang valid, setelah penambahan: (a) `StateModule.getAll()` mengembalikan array dengan panjang tepat satu lebih banyak, (b) Transaction baru terdapat di dalamnya dengan semua field yang benar, dan (c) form dikosongkan kembali.

**Validates: Requirements 2.4, 2.7, 3.1, 3.2, 3.4**

---

### Property 5: Penghapusan transaksi memperbarui list dan balance secara konsisten

*For any* daftar transaksi yang tidak kosong, setelah satu Transaction dihapus berdasarkan id-nya: (a) `StateModule.getAll()` mengembalikan array dengan panjang tepat satu lebih sedikit, (b) Transaction dengan id tersebut tidak lagi ada dalam list, dan (c) `StateModule.getTotalBalance()` sama persis dengan total sebelumnya dikurangi amount Transaction yang dihapus.

**Validates: Requirements 3.6, 4.1, 4.4**

---

### Property 6: getCategoryTotals konsisten dengan total balance dan chart data

*For any* daftar transaksi, jumlah dari semua nilai dalam `CategoryTotals` (Food + Transport + Fun) yang dikembalikan `StateModule.getCategoryTotals()` harus sama persis dengan `StateModule.getTotalBalance()`, dan hanya kategori dengan total > 0 yang boleh muncul sebagai segmen dalam chart data.

**Validates: Requirements 4.1, 5.1, 5.2, 5.3, 5.4**

---

## Testing Strategy

### Dual Testing Approach

Aplikasi ini adalah kombinasi logika murni (Validator, State, Storage serialization) dan operasi UI/DOM. Pendekatan pengujian dibagi:

**Unit Tests** (contoh konkret, example-based):
- Render DOM untuk konfigurasi tertentu (balance nol, list kosong, chart kosong)
- Error messages muncul dengan teks yang benar untuk field yang salah
- Chart memperbarui label dan data setelah tambah/hapus
- Peringatan Local Storage tidak tersedia ditampilkan

**Property-Based Tests** (menggunakan [fast-check](https://fast-check.io/) — library PBT untuk JavaScript):
- Setiap Correctness Property di atas diimplementasikan sebagai satu property test
- Minimum 100 iterasi per property (default fast-check)
- Setiap test diberi komentar tag:
  ```javascript
  // Feature: expense-budget-visualizer, Property 1: Serialisasi round-trip Transaction
  fc.assert(fc.property(arbitraryTransactionArray, (transactions) => { ... }));
  ```

**Konfigurasi fast-check yang direkomendasikan:**
- `numRuns: 100` (default)
- Arbitrary untuk Transaction: generate `itemName` (non-empty string), `amount` (float > 0), `category` (pilih dari `VALID_CATEGORIES`)

**Integration / Manual Tests**:
- Buka `index.html` langsung di browser (file protocol) — verifikasi semua fitur berjalan
- Refresh halaman setelah menambah transaksi — verifikasi data tetap ada (Req 1.3)
- Tutup dan buka kembali tab browser — verifikasi persistensi
- Uji di Chrome, Firefox, Edge, Safari (Req 6.1)
- Uji di lebar 360px dan 1024px (Req 7.3)
