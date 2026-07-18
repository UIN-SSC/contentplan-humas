/**
 * ============================================================================
 * GOOGLE APPS SCRIPT BACKEND - CONTENT PLAN HUMAS WEB APP
 * ============================================================================
 * Kode ini menangani request GET dan POST dari Web App Frontend untuk
 * melakukan operasi CRUD (Create, Read, Update, Delete) serta pembuatan
 * sheet bulanan otomatis (contoh: "Juli", "Agustus").
 * 
 * CARA PASANG:
 * 1. Buka Google Sheets Anda -> Ekstensi (Extensions) -> Apps Script
 * 2. Hapus semua kode default dan tempelkan (paste) kode ini ke Code.gs
 * 3. Klik Simpan (Save) -> Terapkan (Deploy) -> Deployment baru (New deployment)
 * 4. Pilih jenis: Aplikasi Web (Web app)
 * 5. Akses (Who has access): Siapa saja (Anyone) -> Klik Terapkan (Deploy)
 * 6. Salin URL Web App yang dihasilkan ke dalam aplikasi web Content Plan Humas!
 * ============================================================================
 */

// Header standar untuk Sheet Content Plan
const DEFAULT_HEADERS = [
  "ID",
  "Tanggal",
  "Content Pillar",
  "Value",
  "PIC",
  "SKP/KKN",
  "Judul",
  "Isi",
  "CTA",
  "Caption",
  "Hashtag",
  "Platform",
  "Status",
  "Link Publikasi"
];

/**
 * Menangani HTTP GET Request dari Web App (Ambil data & daftar Sheet)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "read";
    const sheetName = (e && e.parameter && e.parameter.sheetName) || "Juli";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "list_sheets") {
      const sheets = ss.getSheets().map(s => s.getName());
      return createResponse({
        status: "success",
        action: "list_sheets",
        data: sheets
      });
    }

    // Default action: read content plan dari sheet yang dipilih
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Jika sheet (misal: "Juli") belum ada, buat otomatis
      sheet = ss.insertSheet(sheetName);
    }
    // Selalu sinkronisasi header agar kolom baru otomatis ditambahkan di sheet lama
    setupSheetHeaders(sheet);

    const data = getSheetDataAsObjects(sheet);
    const sheetsList = ss.getSheets().map(s => s.getName());

    return createResponse({
      status: "success",
      action: "read",
      sheetName: sheetName,
      sheets: sheetsList,
      data: data
    });

  } catch (error) {
    return createResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Menangani HTTP POST Request dari Web App (CRUD: Create, Update, Delete, Create Sheet)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.payload) {
      payload = JSON.parse(e.parameter.payload);
    } else {
      payload = e.parameter;
    }

    const action = payload.action;
    const sheetName = payload.sheetName || "Juli";
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. BUAT SHEET BARU
    if (action === "create_sheet") {
      const newSheetName = payload.sheetName;
      if (!newSheetName) {
        throw new Error("Nama sheet baru tidak boleh kosong");
      }
      let sheet = ss.getSheetByName(newSheetName);
      if (!sheet) {
        sheet = ss.insertSheet(newSheetName);
        setupSheetHeaders(sheet);
      }
      return createResponse({
        status: "success",
        action: "create_sheet",
        sheetName: newSheetName,
        message: `Sheet "${newSheetName}" berhasil dibuat atau sudah ada.`
      });
    }

    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    // Selalu sinkronisasi header sebelum CRUD beroperasi
    setupSheetHeaders(sheet);

    // Peta kolom saat ini
    const headerMap = getHeaderMap(sheet);

    // 2. CREATE (TAMBAH KONTEN BARU)
    if (action === "create") {
      const item = payload.data || {};
      const newId = "CP-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
      item.ID = newId;

      const rowData = [];
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      headers.forEach(h => {
        const key = h ? h.toString().trim() : "";
        if (key) {
          rowData.push(item[key] !== undefined ? item[key] : "");
        } else {
          rowData.push("");
        }
      });

      sheet.appendRow(rowData);
      
      return createResponse({
        status: "success",
        action: "create",
        message: "Rencana konten berhasil ditambahkan",
        data: item
      });
    }

    // 3. UPDATE (UBAH KONTEN)
    if (action === "update") {
      const item = payload.data || {};
      const targetId = item.ID;
      if (!targetId) throw new Error("ID konten tidak ditemukan untuk diubah");

      const idColIndex = headerMap["ID"];
      if (idColIndex === undefined) throw new Error("Kolom ID tidak ditemukan di sheet");

      const lastRow = sheet.getLastRow();
      if (lastRow < 2) throw new Error("Data konten tidak ditemukan");

      const idValues = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;
      for (let i = 0; i < idValues.length; i++) {
        if (idValues[i][0].toString() === targetId.toString()) {
          rowIndex = i + 2; // +2 karena row 1 header dan array 0-indexed
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Konten dengan ID ${targetId} tidak ditemukan`);
      }

      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const rowData = [];
      headers.forEach(h => {
        const key = h ? h.toString().trim() : "";
        if (key) {
          rowData.push(item[key] !== undefined ? item[key] : "");
        } else {
          rowData.push("");
        }
      });

      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);

      return createResponse({
        status: "success",
        action: "update",
        message: "Rencana konten berhasil diperbarui",
        data: item
      });
    }

    // 4. DELETE (HAPUS KONTEN)
    if (action === "delete") {
      const targetId = payload.ID || (payload.data ? payload.data.ID : null);
      if (!targetId) throw new Error("ID konten tidak ditemukan untuk dihapus");

      const idColIndex = headerMap["ID"];
      if (idColIndex === undefined) throw new Error("Kolom ID tidak ditemukan di sheet");

      const lastRow = sheet.getLastRow();
      if (lastRow < 2) throw new Error("Data konten tidak ditemukan");

      const idValues = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
      let rowIndex = -1;
      for (let i = 0; i < idValues.length; i++) {
        if (idValues[i][0].toString() === targetId.toString()) {
          rowIndex = i + 2;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error(`Konten dengan ID ${targetId} tidak ditemukan`);
      }

      sheet.deleteRow(rowIndex);

      return createResponse({
        status: "success",
        action: "delete",
        message: "Rencana konten berhasil dihapus",
        ID: targetId
      });
    }

    throw new Error("Action tidak dikenali: " + action);

  } catch (error) {
    return createResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Mengubah data Sheet menjadi Array of Objects berdasarkan header baris pertama
 */
function getSheetDataAsObjects(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow < 2 || lastCol < 1) {
    return [];
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(h => h.toString().trim());
  const results = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Abaikan baris yang sepenuhnya kosong
    if (row.every(cell => cell.toString().trim() === "")) continue;

    const obj = {};
    headers.forEach((h, colIdx) => {
      let val = row[colIdx];
      // Format tanggal ke string YYYY-MM-DD jika bertipe Date
      if (val instanceof Date && !isNaN(val)) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      obj[h] = val !== undefined && val !== null ? val.toString() : "";
    });

    // Pastikan setiap baris punya ID, kalau tidak ada kita generate sementara & simpan
    if (!obj.ID || obj.ID.trim() === "") {
      obj.ID = "CP-" + new Date().getTime() + "-" + i;
      const idColIdx = headers.indexOf("ID");
      if (idColIdx !== -1) {
        sheet.getRange(i + 1, idColIdx + 1).setValue(obj.ID);
      }
    }

    results.push(obj);
  }

  return results;
}

/**
 * Mengambil peta indeks kolom (Header Name -> Column Index 0-based)
 */
function getHeaderMap(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((h, idx) => {
    map[h.toString().trim()] = idx;
  });
  return map;
}

/**
 * Setup format & header untuk sheet baru, atau sinkronisasi header untuk sheet lama
 */
function setupSheetHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  let currentHeaders = [];

  if (sheet.getLastRow() === 0 || lastCol === 0) {
    // Sheet benar-benar kosong
    sheet.appendRow(DEFAULT_HEADERS);
  } else {
    // Ambil header saat ini
    currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => h ? h.toString().trim() : "");
    if (currentHeaders.join("") === "") {
      // Baris pertama kosong tapi ada baris lain? Timpa baris pertama.
      sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length).setValues([DEFAULT_HEADERS]);
    } else {
      // Cari header yang hilang dari DEFAULT_HEADERS
      const missingHeaders = [];
      DEFAULT_HEADERS.forEach(defHeader => {
        if (!currentHeaders.includes(defHeader)) {
          missingHeaders.push(defHeader);
        }
      });
      // Jika ada yang hilang (misal: "Link Publikasi", "Content Pillar"), tambahkan di ujung kanan
      if (missingHeaders.length > 0) {
        sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
      }
    }
  }

  // Desain & Pembekuan Baris Header agar rapi di Google Sheets
  const finalLastCol = sheet.getLastColumn();
  if (finalLastCol > 0) {
    const headerRange = sheet.getRange(1, 1, 1, finalLastCol);
    headerRange.setBackground("#1E3A8A"); // Biru tua elegan
    headerRange.setFontColor("#FFFFFF");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    
    // Auto-resize
    try {
      for (let c = 1; c <= finalLastCol; c++) {
        sheet.autoResizeColumn(c);
        if (c === 6 || c === 7 || c === 9) {
          sheet.setColumnWidth(c, 220);
        } else {
          const width = sheet.getColumnWidth(c);
          if (width < 100) sheet.setColumnWidth(c, 110);
        }
      }
    } catch (e) {}
  }
}

/**
 * Pembungkus Respon JSON dengan dukungan CORS untuk Web App
 */
function createResponse(dataObject) {
  return ContentService
    .createTextOutput(JSON.stringify(dataObject))
    .setMimeType(ContentService.MimeType.JSON);
}
