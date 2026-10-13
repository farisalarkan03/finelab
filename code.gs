/**
 * ============================================================================
 * FineLab — Google Apps Script (GAS) untuk Database Email
 * ============================================================================
 * 
 * CARA MENGGUNAKAN:
 * 1. Buka Google Sheets baru di https://sheets.google.com
 * 2. Beri nama spreadsheet Anda (misal: "FineLab — Database Email")
 * 3. Buka menu: Ekstensi (Extensions) > Apps Script
 * 4. Hapus semua kode default di Apps Script, lalu COPY & PASTE seluruh isi file ini.
 * 5. Klik ikon Simpan (Save / Ctrl+S atau Cmd+S).
 * 
 * CARA DEPLOY (AGAR BISA MENERIMA DATA DARI WEB):
 * 1. Di pojok kanan atas Apps Script, klik tombol biru "Deploy" > "New deployment" (Penerapan baru).
 * 2. Klik ikon gerigi (Select type) > pilih "Web app".
 * 3. Isi konfigurasi berikut:
 *    - Description: "FineLab Email Webhook"
 *    - Execute as  : "Me (email_anda@gmail.com)"
 *    - Who has access: "Anyone" (Siapa saja)  <-- PENTING! Harus "Anyone" agar form web bisa mengirim data.
 * 4. Klik tombol "Deploy".
 * 5. Jika muncul permintaan izin akses (Authorize access), klik Akun Google Anda > Advanced (Lanjutan) > Go to FineLab (Aman).
 * 6. Salin "Web App URL" yang diberikan (berakhiran /exec).
 * 7. Tempel URL tersebut ke konfigurasi di file index.html FineLab.
 * ============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Mencegah bentrok data jika ada beberapa submit bersamaan

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Buat header otomatis di baris 1 jika spreadsheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal & Waktu (WIB)", "Email", "Plugin / Sumber"]);
      var headerRange = sheet.getRange(1, 1, 1, 3);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f0f4f9");
    }

    // Ambil data yang dikirim (bisa format JSON atau URL-encoded Form)
    var email = "";
    var plugin = "SlideZoom";

    if (e.postData && e.postData.contents) {
      try {
        var json = JSON.parse(e.postData.contents);
        email = json.email || "";
        plugin = json.plugin || plugin;
      } catch (err) {
        // Fallback jika dikirim lewat FormData
        email = e.parameter.email || "";
        plugin = e.parameter.plugin || plugin;
      }
    } else if (e.parameter) {
      email = e.parameter.email || "";
      plugin = e.parameter.plugin || plugin;
    }

    email = email.toString().trim();

    // Validasi sederhana: pastikan email tidak kosong
    if (!email) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: "Email wajib diisi" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Format waktu sekarang (WIB: GMT+7)
    var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd-MM-yyyy HH:mm:ss");

    // Tulis baris baru ke spreadsheet
    sheet.appendRow([now, email, plugin]);

    // Beri response sukses kembali ke website
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Email berhasil disimpan" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

// Handler doGet untuk tes apakah Web App sudah aktif jika dibuka langsung di browser
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "FineLab Email Webhook is running!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
