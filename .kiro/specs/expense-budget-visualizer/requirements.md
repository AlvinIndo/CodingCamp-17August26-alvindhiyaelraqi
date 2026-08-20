# Requirements Document

## Introduction

Expense and Budget Visualizer adalah sebuah web application berbasis client-side yang memungkinkan pengguna untuk mencatat, mengelola, dan memvisualisasikan pengeluaran harian mereka. Aplikasi ini dibangun menggunakan HTML, CSS, dan Vanilla JavaScript murni tanpa framework, dengan data yang tersimpan sepenuhnya di browser melalui Local Storage API. Antarmuka menyediakan form input transaksi, daftar transaksi yang dapat dihapus, tampilan total saldo, serta pie chart interaktif yang memperlihatkan distribusi pengeluaran per kategori.

---

## Glossary

- **App**: Aplikasi web Expense and Budget Visualizer secara keseluruhan
- **Transaction**: Satu catatan pengeluaran yang terdiri dari nama item, jumlah (amount), dan kategori
- **Transaction_Form**: Komponen form HTML yang menyediakan field input untuk menambahkan transaksi baru
- **Transaction_List**: Komponen UI yang menampilkan seluruh daftar transaksi yang telah dicatat
- **Transaction_Item**: Satu baris entri dalam Transaction_List yang merepresentasikan satu Transaction
- **Balance_Display**: Komponen UI yang menampilkan total saldo pengeluaran terkini
- **Chart**: Komponen pie chart yang memvisualisasikan distribusi pengeluaran berdasarkan kategori
- **Storage**: Mekanisme penyimpanan data menggunakan browser Local Storage API
- **Category**: Klasifikasi pengeluaran; nilai valid adalah `Food`, `Transport`, dan `Fun`
- **Amount**: Nilai numerik positif yang merepresentasikan jumlah pengeluaran dalam satuan mata uang
- **Validator**: Komponen logika yang memeriksa validitas data input sebelum transaksi disimpan

---

## Requirements

### Requirement 1: Manajemen Data Transaksi via Local Storage

**User Story:** As a pengguna, I want semua transaksi yang saya catat disimpan secara otomatis di browser, so that data saya tidak hilang saat halaman di-refresh atau browser ditutup dan dibuka kembali.

#### Acceptance Criteria

1. WHEN pengguna menambahkan Transaction baru, THE Storage SHALL menyimpan seluruh daftar Transaction ke Local Storage dalam format JSON.
2. WHEN pengguna menghapus sebuah Transaction_Item, THE Storage SHALL memperbarui data di Local Storage sehingga Transaction yang dihapus tidak lagi tersimpan.
3. WHEN App dimuat di browser, THE Storage SHALL memuat seluruh Transaction yang tersimpan di Local Storage dan meneruskannya ke Transaction_List serta Chart untuk ditampilkan.
4. IF Local Storage tidak tersedia atau tidak dapat diakses, THEN THE App SHALL menampilkan pesan peringatan kepada pengguna bahwa data tidak akan tersimpan secara permanen.
5. THE Storage SHALL menyimpan data Transaction dalam format yang dapat dibaca kembali (round-trip), sehingga hasil parse dari data yang disimpan menghasilkan objek Transaction yang ekuivalen dengan objek aslinya.

---

### Requirement 2: Input Transaksi Baru

**User Story:** As a pengguna, I want mengisi form untuk menambahkan pengeluaran baru, so that saya dapat mencatat setiap transaksi dengan cepat dan mudah.

#### Acceptance Criteria

1. THE Transaction_Form SHALL menyediakan field teks untuk nama item (Item Name).
2. THE Transaction_Form SHALL menyediakan field numerik untuk jumlah pengeluaran (Amount).
3. THE Transaction_Form SHALL menyediakan dropdown atau selector dengan pilihan kategori: `Food`, `Transport`, dan `Fun`.
4. WHEN pengguna menekan tombol submit pada Transaction_Form dengan semua field terisi dan valid, THE Transaction_Form SHALL menambahkan Transaction baru ke Transaction_List dan meneruskan data ke Storage untuk disimpan.
5. WHEN pengguna menekan tombol submit pada Transaction_Form, THE Validator SHALL memeriksa bahwa field Item Name tidak kosong, field Amount berisi angka positif lebih besar dari nol, dan field Category memiliki nilai yang dipilih.
6. IF Validator menemukan bahwa satu atau lebih field tidak memenuhi syarat validasi, THEN THE Transaction_Form SHALL menampilkan pesan error yang menjelaskan field mana yang tidak valid, dan SHALL mencegah penambahan Transaction.
7. WHEN sebuah Transaction berhasil ditambahkan, THE Transaction_Form SHALL mengosongkan seluruh field input agar siap menerima entri berikutnya.

---

### Requirement 3: Tampilan Daftar Transaksi

**User Story:** As a pengguna, I want melihat semua transaksi yang telah saya catat dalam sebuah daftar, so that saya dapat memantau riwayat pengeluaran saya.

#### Acceptance Criteria

1. THE Transaction_List SHALL menampilkan seluruh Transaction yang tersimpan, masing-masing sebagai satu Transaction_Item.
2. THE Transaction_Item SHALL menampilkan nama item, jumlah Amount, dan Category dari Transaction yang direpresentasikannya.
3. THE Transaction_List SHALL dapat discroll secara vertikal ketika jumlah Transaction_Item melebihi tinggi area yang tersedia.
4. WHEN pengguna menambahkan Transaction baru, THE Transaction_List SHALL memperbarui tampilannya secara langsung tanpa memerlukan reload halaman.
5. THE Transaction_Item SHALL menyediakan tombol atau kontrol hapus untuk setiap entri.
6. WHEN pengguna mengklik kontrol hapus pada sebuah Transaction_Item, THE Transaction_List SHALL menghapus Transaction_Item tersebut dari tampilan secara langsung.

---

### Requirement 4: Tampilan Total Saldo

**User Story:** As a pengguna, I want melihat total keseluruhan pengeluaran saya di tempat yang mudah dilihat, so that saya selalu tahu berapa total yang telah saya keluarkan.

#### Acceptance Criteria

1. THE Balance_Display SHALL menampilkan nilai total dari semua Amount pada seluruh Transaction yang ada dalam Transaction_List.
2. THE Balance_Display SHALL ditempatkan pada area yang menonjol di bagian atas halaman sehingga selalu terlihat.
3. WHEN sebuah Transaction baru ditambahkan, THE Balance_Display SHALL memperbarui nilai total secara otomatis dan langsung.
4. WHEN sebuah Transaction_Item dihapus, THE Balance_Display SHALL memperbarui nilai total secara otomatis dan langsung dengan mengurangkan Amount dari Transaction yang dihapus.
5. WHILE tidak ada Transaction dalam Transaction_List, THE Balance_Display SHALL menampilkan nilai nol.

---

### Requirement 5: Visualisasi Pie Chart per Kategori

**User Story:** As a pengguna, I want melihat pie chart yang menunjukkan proporsi pengeluaran per kategori, so that saya dapat memahami distribusi pengeluaran saya secara visual dengan cepat.

#### Acceptance Criteria

1. THE Chart SHALL menampilkan pie chart yang memvisualisasikan total Amount pengeluaran per Category (`Food`, `Transport`, `Fun`).
2. THE Chart SHALL merepresentasikan setiap Category yang memiliki total Amount lebih dari nol sebagai satu segmen pada pie chart.
3. WHEN sebuah Transaction baru ditambahkan, THE Chart SHALL memperbarui tampilan pie chart secara otomatis dan langsung tanpa memerlukan reload halaman.
4. WHEN sebuah Transaction_Item dihapus, THE Chart SHALL memperbarui tampilan pie chart secara otomatis dan langsung.
5. THE Chart SHALL menggunakan warna berbeda untuk setiap Category agar mudah dibedakan secara visual.
6. THE Chart SHALL menampilkan legenda atau label yang mengidentifikasi Category dan proporsi atau nilai Amount untuk setiap segmen.
7. WHILE tidak ada Transaction dalam Transaction_List, THE Chart SHALL menampilkan kondisi kosong atau pesan informatif, bukan pie chart kosong yang ambigu.

---

### Requirement 6: Kompatibilitas Browser dan Struktur Proyek

**User Story:** As a pengguna, I want aplikasi berjalan dengan baik di browser modern tanpa instalasi apapun, so that saya dapat langsung menggunakannya tanpa setup yang rumit.

#### Acceptance Criteria

1. THE App SHALL dapat dijalankan pada browser modern terkini, mencakup Chrome, Firefox, Edge, dan Safari, tanpa memerlukan instalasi plugin atau ekstensi tambahan.
2. THE App SHALL dapat dioperasikan sebagai standalone web app yang diakses langsung melalui file HTML di browser (file protocol) tanpa memerlukan backend server.
3. THE App SHALL hanya menggunakan satu file CSS yang berada di dalam direktori `css/`.
4. THE App SHALL hanya menggunakan satu file JavaScript yang berada di dalam direktori `js/`.
5. THE App SHALL tidak menggunakan JavaScript framework seperti React, Vue, atau Angular; seluruh logika ditulis dalam Vanilla JavaScript.
6. WHEN App dimuat, THE App SHALL selesai merender tampilan awal dan data dari Storage dalam waktu yang tidak terasa lambat bagi pengguna (tidak ada jeda loading yang terlihat pada kondisi normal).

---

### Requirement 7: Desain Visual dan Antarmuka Pengguna

**User Story:** As a pengguna, I want antarmuka yang bersih dan mudah dipahami, so that saya dapat menggunakan aplikasi ini tanpa perlu mempelajari cara penggunaannya terlebih dahulu.

#### Acceptance Criteria

1. THE App SHALL menerapkan hierarki visual yang jelas sehingga komponen Balance_Display, Transaction_Form, Chart, dan Transaction_List dapat dibedakan dan diidentifikasi tanpa instruksi tambahan.
2. THE App SHALL menggunakan tipografi yang terbaca dengan kontras warna yang memadai antara teks dan latar belakang pada semua komponen.
3. THE App SHALL menampilkan tampilan yang responsif sehingga seluruh konten dapat digunakan dan terbaca pada lebar layar desktop modern (minimal 1024px) maupun layar yang lebih sempit (minimal 360px).
4. THE App SHALL memberikan feedback visual yang jelas ketika pengguna berinteraksi dengan elemen interaktif seperti tombol submit dan tombol hapus (contoh: perubahan warna saat hover atau klik).
5. THE App SHALL menampilkan antarmuka yang bersih dan minimal tanpa elemen dekoratif yang tidak relevan dengan fungsi utama aplikasi.
