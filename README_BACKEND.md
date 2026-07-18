# Panduan Pemasangan Backend Google Apps Script & Google Sheets

Backend untuk **Content Plan Humas Web App** menggunakan **Google Apps Script** dan **Google Sheets**. Dengan cara ini, Anda tidak perlu sewa database atau server backend berbayar—semua data aman di Google Spreadsheet milik Anda sendiri!

---

## 1️⃣ Langkah-Langkah Pasang di Google Sheets

1. **Buat Google Sheet Baru**:
   - Buka [Google Sheets](https://sheets.google.com) di browser Anda.
   - Klik **+ Blank / Kosong** untuk membuat spreadsheet baru.
   - Beri nama spreadsheet Anda, misalnya: `Content Plan Humas - Database`.

2. **Buka Google Apps Script Editor**:
   - Pada menu di bagian atas Google Sheet, klik **Ekstensi (Extensions)** $\rightarrow$ **Apps Script**.
   - Tab baru berisi editor kode Apps Script akan terbuka.

3. **Tempelkan Kode `Code.gs`**:
   - Di panel kiri, klik berkas `Code.gs`.
   - Hapus semua kode default yang ada di sana (`function myFunction() { ... }`).
   - Salin seluruh isi berkas [backend/Code.gs](file:///Users/yuyunwulandari/Documents/contentplan-humas/backend/Code.gs) dan tempelkan (paste) ke dalam editor Apps Script.
   - Klik ikon **Simpan (Save)** 💾 (atau tekan `Ctrl + S` / `Cmd + S`).

---

## 2️⃣ Langkah-Langkah Deploy Web App API

Agar Aplikasi Web yang kita buat bisa bertukar data dengan Google Sheet ini dari HP atau Komputer Anda:

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Terapkan (Deploy)** $\rightarrow$ **Deployment baru (New deployment)**.
2. Di sebelah kiri tulisan *"Pilih jenis (Select type)"*, klik ikon gerigi ⚙️ $\rightarrow$ pilih **Aplikasi Web (Web app)**.
3. Isi kolom pengaturan sebagai berikut:
   - **Deskripsi (Description)**: `Content Plan API v1`
   - **Jalankan sebagai (Execute as)**: `Satu-satunya pengguna yang mengakses web app / Anda (Me - emailanda@gmail.com)`
   - **Siapa yang memiliki akses (Who has access)**: `Siapa saja (Anyone)`  *(⚠️ SANGAT PENTING: Pilih 'Anyone' agar web app kita di HP bisa mengakses API tanpa error CORS atau harus login akun Google di iframe!)*
4. Klik tombol **Terapkan (Deploy)**.
5. *(Jika pertama kali)* Google akan meminta izin akses:
   - Klik **Beri akses (Authorize access)**.
   - Pilih akun Gmail Anda.
   - Klik **Lanjutan (Advanced)** (tulisan kecil di kiri bawah).
   - Klik **Buka Untitled project (tidak aman) / Go to Untitled project (unsafe)**.
   - Scroll ke bawah dan klik **Izinkan (Allow)**.
6. **Selesai!** Anda akan melihat **URL Aplikasi Web (Web app URL)** yang dimulai dengan `https://script.google.com/macros/s/..../exec`.
   - **Salin (Copy)** URL tersebut!

---

## 3️⃣ Masukkan URL ke dalam Web App

1. Buka aplikasi **Content Plan Humas Web App** di HP atau browser Anda.
2. Klik ikon/menu **Pengaturan Google Sheets (⚙️)** di pojok kanan atas atau di Bottom Bar mobile.
3. Tempelkan (Paste) **Web app URL** yang sudah Anda salin tadi ke dalam kolom **URL Google Apps Script**.
4. Pilih atau ketik nama Bulan Sheet (misalnya: `Juli`, `Agustus`, atau `September`).
5. Klik **Simpan & Hubungkan**.

Selamat! Web App Anda sekarang terhubung secara live 100% dengan Google Spreadsheet Anda! Setiap kali Anda atau tim menambah, mengubah status, atau menghapus konten di Web App ini, otomatis tercatat rapi di Spreadsheet Anda!
