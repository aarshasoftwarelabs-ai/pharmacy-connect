import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:http/http.dart' as http;
import '../api/api_endpoints.dart';
import '../api/api_service.dart';
import 'barcode_medicine_service.dart';
import 'storage_service.dart';

class BoxOcrResult {
  final String? gtin;
  final String? medicineName;
  final String? genericName;
  final String? batchNumber;
  final String? mfgDate;
  final String? expiryDate;
  final String? rawExpiry;
  final int daysUntilExpiry;
  final String expiryStatus; // HEALTHY, NEAR_EXPIRY, EXPIRED
  final double mrp;
  final String? packSize;
  final String? strength;
  final String? mfgLicNo;
  final String? manufacturer;
  final double confidence;
  final Map<String, dynamic>? matchedMedicine;
  final bool hasRealData;

  BoxOcrResult({
    this.gtin,
    this.medicineName,
    this.genericName,
    this.batchNumber,
    this.mfgDate,
    this.expiryDate,
    this.rawExpiry,
    this.daysUntilExpiry = 999,
    this.expiryStatus = 'HEALTHY',
    this.mrp = 0.0,
    this.packSize,
    this.strength,
    this.mfgLicNo,
    this.manufacturer,
    this.confidence = 0.95,
    this.matchedMedicine,
    this.hasRealData = false,
  });

  factory BoxOcrResult.fromJson(Map<String, dynamic> json) {
    final rawExp = json['raw_expiry']?.toString();
    final isoExp = json['expiry_date']?.toString();
    final displayExp = (rawExp != null && rawExp.trim().isNotEmpty)
        ? _normalizeDate(rawExp) ?? rawExp.trim()
        : (isoExp != null && isoExp.trim().isNotEmpty ? _normalizeDate(isoExp) ?? isoExp.trim() : null);

    final mrpVal = (json['mrp'] as num?)?.toDouble() ?? 0.0;
    final hasAny = json['medicine_name'] != null ||
        json['batch_number'] != null ||
        json['mfg_date'] != null ||
        displayExp != null ||
        mrpVal > 0;

    return BoxOcrResult(
      gtin: json['gtin'],
      medicineName: json['medicine_name'],
      genericName: json['generic_name'],
      batchNumber: json['batch_number'],
      mfgDate: json['mfg_date'],
      expiryDate: displayExp,
      rawExpiry: rawExp ?? displayExp,
      daysUntilExpiry: (json['days_until_expiry'] as num?)?.toInt() ?? 999,
      expiryStatus: json['expiry_status'] ?? 'HEALTHY',
      mrp: mrpVal,
      packSize: json['pack_size'],
      strength: json['strength'] ?? json['dosage'],
      mfgLicNo: json['mfg_lic_no'],
      manufacturer: json['manufacturer'],
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.95,
      matchedMedicine: json['matched_medicine'] is Map
          ? Map<String, dynamic>.from(json['matched_medicine'] as Map)
          : null,
      hasRealData: hasAny,
    );
  }

  static String? _normalizeDate(String raw) {
    var clean = raw.trim().replaceAll('-', '/').replaceAll('.', '/');
    if (RegExp(r'^\d{4}\/\d{2}(?:\/\d{2})?$').hasMatch(clean)) {
      final p = clean.split('/');
      return '${p[1]}/${p[0]}';
    }
    return clean.isNotEmpty ? clean : null;
  }
}

class MedicineBoxOcrService {
  /// Universal Barcode & QR Code Decoder:
  /// Extracts ALL embedded data (GTIN, Batch No, MFG Date, Expiry Date, MRP, Medicine Name, Manufacturer)
  /// from ANY barcode or QR code format:
  /// - 2D GS1 DataMatrix (parenthesized or raw stream with FNC1 / group separators)
  /// - Pharma Verification URLs (e.g. Mankind, Sun Pharma, Cipla, me-qr, gov portals)
  /// - Delimited QR strings (pipe |, comma ,, semicolon ;, tab \t)
  /// - Key-Value multiline text (B.No:, EXP:, MFG:, MRP:)
  /// - JSON payloads ({"batch":..., "exp":...})
  /// - Standard 1D Barcodes (EAN-13, GTIN-14, UPC-A, Code 128)
  static BoxOcrResult parseUniversalBarcodeOrQr(String raw) {
    if (raw.trim().isEmpty) {
      return BoxOcrResult(hasRealData: false);
    }

    String clean = raw.trim();

    // Remove common scanner prefix symbology headers (e.g. ]d2 for DataMatrix, ]Q1 for QR, ]C1 for Code128, ~1)
    if (clean.startsWith(']d2') || clean.startsWith(']Q1') || clean.startsWith(']C1') || clean.startsWith(']e0')) {
      clean = clean.substring(3).trim();
    }
    if (clean.startsWith('~1')) {
      clean = clean.substring(2).trim();
    }

    String? gtin;
    String? batch;
    String? expFormatted;
    String? mfgFormatted;
    double mrp = 0.0;
    String? medicineName;
    String? genericName;
    String? manufacturer;

    // 1. Format A: JSON Encoded QR Code
    if (clean.startsWith('{') && clean.endsWith('}')) {
      try {
        final map = jsonDecode(clean);
        if (map is Map<String, dynamic>) {
          gtin = map['gtin']?.toString() ?? map['barcode']?.toString() ?? map['code']?.toString();
          batch = map['batch']?.toString() ?? map['bno']?.toString() ?? map['batchNumber']?.toString() ?? map['lot']?.toString();
          final rawExp = map['exp']?.toString() ?? map['expiry']?.toString() ?? map['expiryDate']?.toString();
          if (rawExp != null) expFormatted = _normalizeDate(rawExp);
          final rawMfg = map['mfg']?.toString() ?? map['mfgDate']?.toString() ?? map['mfd']?.toString();
          if (rawMfg != null) mfgFormatted = _normalizeDate(rawMfg);
          mrp = (map['mrp'] as num?)?.toDouble() ?? double.tryParse(map['price']?.toString() ?? '') ?? 0.0;
          medicineName = map['name']?.toString() ?? map['medicineName']?.toString() ?? map['product']?.toString();
          genericName = map['generic']?.toString() ?? map['genericName']?.toString();
          manufacturer = map['manufacturer']?.toString() ?? map['company']?.toString();

          if (batch != null || expFormatted != null || gtin != null || medicineName != null) {
            return BoxOcrResult(
              gtin: gtin,
              medicineName: medicineName,
              genericName: genericName,
              manufacturer: manufacturer,
              batchNumber: batch,
              mfgDate: mfgFormatted,
              expiryDate: expFormatted,
              rawExpiry: expFormatted,
              mrp: mrp,
              confidence: 1.0,
              hasRealData: true,
            );
          }
        }
      } catch (_) {}
    }

    // 2. Format B: URL QR Code (Pharma Traceability / Verification Portals)
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.contains('://')) {
      final uri = Uri.tryParse(clean);
      if (uri != null) {
        // Query parameters
        final qp = uri.queryParameters;
        if (qp.isNotEmpty) {
          gtin = qp['gtin'] ?? qp['barcode'] ?? qp['code'] ?? qp['item'] ?? qp['id'];
          batch = qp['batch'] ?? qp['bno'] ?? qp['b_no'] ?? qp['b'] ?? qp['lot'] ?? qp['lotno'] ?? qp['batchnumber'];
          final rawExp = qp['exp'] ?? qp['expiry'] ?? qp['expdate'] ?? qp['exp_date'] ?? qp['ed'];
          if (rawExp != null) expFormatted = _normalizeDate(rawExp);
          final rawMfg = qp['mfg'] ?? qp['mfd'] ?? qp['mfgdate'] ?? qp['mfg_date'] ?? qp['md'];
          if (rawMfg != null) mfgFormatted = _normalizeDate(rawMfg);
          final rawMrp = qp['mrp'] ?? qp['price'] ?? qp['rate'];
          if (rawMrp != null) mrp = double.tryParse(rawMrp.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
          medicineName = qp['name'] ?? qp['med'] ?? qp['medicine'] ?? qp['product'] ?? qp['itemname'];
          manufacturer = qp['mfgby'] ?? qp['company'] ?? qp['manufacturer'];
        }

        // Path segments (e.g. /verify/08901234567890/BT2401/270430)
        final segs = uri.pathSegments;
        for (final seg in segs) {
          if (gtin == null && RegExp(r'^\d{13,14}$').hasMatch(seg)) {
            gtin = seg;
          } else if (batch == null && RegExp(r'^[A-Za-z0-9\-\/]{3,16}$').hasMatch(seg) && !RegExp(r'^\d+$').hasMatch(seg)) {
            if (!_isCommonFalseBatch(seg) && !seg.toLowerCase().contains('verify') && !seg.toLowerCase().contains('trace')) {
              batch = seg;
            }
          } else if (expFormatted == null && RegExp(r'^\d{6}$').hasMatch(seg)) {
            final yy = seg.substring(0, 2);
            final mm = seg.substring(2, 4);
            expFormatted = '$mm/20$yy';
          }
        }

        if (batch != null || expFormatted != null || gtin != null || medicineName != null) {
          if (medicineName != null && manufacturer == null) {
            manufacturer = BarcodeMedicineService.deriveManufacturer(medicineName);
          }
          return BoxOcrResult(
            gtin: gtin,
            medicineName: medicineName,
            genericName: genericName,
            manufacturer: manufacturer,
            batchNumber: batch,
            mfgDate: mfgFormatted,
            expiryDate: expFormatted,
            rawExpiry: expFormatted,
            mrp: mrp,
            confidence: 1.0,
            hasRealData: true,
          );
        }
      }
    }

    // 3. Format C: Standard 2D GS1 DataMatrix (Parenthesized or Raw stream)
    final gs1 = parseGs1DataMatrix(clean);
    if (gs1 != null && (gs1.batchNumber != null || gs1.expiryDate != null || gs1.gtin != null)) {
      return gs1;
    }

    // 4. Format D: Key-Value / Multiline Text QR Code (e.g. B.No: ... Exp: ... MRP: ...)
    final lines = clean.split(RegExp(r'[\r\n]+')).map((l) => l.trim()).where((l) => l.isNotEmpty).toList();

    final bMatch = _extractBatchNumber(clean, lines);
    if (bMatch != null && bMatch.isNotEmpty) {
      batch = bMatch;
    }

    final dates = _extractMfgAndExpDates(clean, lines);
    if (dates['mfg'] != null) mfgFormatted = dates['mfg'];
    if (dates['exp'] != null) expFormatted = dates['exp'];

    final parsedMrp = _extractMrp(clean, lines);
    if (parsedMrp > 0) mrp = parsedMrp;

    final nameRes = _extractMedicineNameAndSalt(lines);
    if (nameRes['name'] != null && nameRes['name']!.isNotEmpty) {
      medicineName = nameRes['name'];
    }
    if (nameRes['generic'] != null && nameRes['generic']!.isNotEmpty) {
      genericName = nameRes['generic'];
    }
    if (nameRes['manufacturer'] != null && nameRes['manufacturer']!.isNotEmpty) {
      manufacturer = nameRes['manufacturer'];
    }

    // 5. Format E: Delimited values (e.g. GTIN|BATCH|EXP|MFG|MRP)
    if (clean.contains('|') || clean.contains(';') || clean.contains('\t')) {
      final parts = clean.split(RegExp(r'[|;\t]')).map((p) => p.trim()).toList();
      for (final p in parts) {
        if (gtin == null && RegExp(r'^\d{12,14}$').hasMatch(p)) {
          gtin = p;
        } else if (expFormatted == null && (RegExp(r'^\d{1,2}[\/\-\.]\d{2,4}$').hasMatch(p) || RegExp(r'^\d{6}$').hasMatch(p))) {
          expFormatted = _normalizeDate(p);
        } else if (mfgFormatted == null && RegExp(r'^\d{1,2}[\/\-\.]\d{2,4}$').hasMatch(p)) {
          mfgFormatted = _normalizeDate(p);
        } else if (mrp <= 0 && RegExp(r'^\d+(?:\.\d{1,2})?$').hasMatch(p)) {
          mrp = double.tryParse(p) ?? 0.0;
        } else if (batch == null && RegExp(r'^[A-Za-z0-9\-\/]{3,16}$').hasMatch(p) && !_isCommonFalseBatch(p)) {
          batch = p;
        } else if (medicineName == null && p.length >= 3 && p.length <= 40 && !RegExp(r'^\d+$').hasMatch(p)) {
          medicineName = p;
        }
      }
    }

    // 6. Format F: Standard 1D Barcode (EAN-13 / GTIN-14 / Code 128)
    if (gtin == null && RegExp(r'^\d{8,14}$').hasMatch(clean)) {
      gtin = clean;
    }

    if (medicineName != null && medicineName.isNotEmpty && (manufacturer == null || manufacturer.isEmpty)) {
      manufacturer = BarcodeMedicineService.deriveManufacturer(medicineName);
    }

    final hasRealData = gtin != null || batch != null || expFormatted != null || mfgFormatted != null || mrp > 0 || medicineName != null;

    return BoxOcrResult(
      gtin: gtin ?? clean,
      medicineName: medicineName,
      genericName: genericName,
      batchNumber: batch,
      mfgDate: mfgFormatted,
      expiryDate: expFormatted,
      rawExpiry: expFormatted,
      mrp: mrp,
      manufacturer: manufacturer,
      confidence: hasRealData ? 1.0 : 0.0,
      hasRealData: hasRealData,
    );
  }
  /// Parse 2D GS1 DataMatrix barcodes directly on device without any AI
  static BoxOcrResult? parseGs1DataMatrix(String raw) {
    if (raw.isEmpty) return null;
    var clean = raw.trim();

    // Standardize delimiters: replace GS (0x1D), RS (0x1E), and other separators with GS
    clean = clean.replaceAll(RegExp(r'[\x1d\x1e\u001d_]+'), '\x1d');

    String? gtin;
    String? batch;
    String? expFormatted;
    String? mfgFormatted;

    // Pattern 1: Parenthesized GS1, e.g. (01)08901234567890(17)280331(10)T260241
    if (clean.contains('(01)') || clean.contains('(17)') || clean.contains('(10)') || clean.contains('(11)')) {
      final gtinMatch = RegExp(r'\(01\)(\d{14})').firstMatch(clean);
      if (gtinMatch != null) gtin = gtinMatch.group(1);

      final expMatch = RegExp(r'\(17\)(\d{6})').firstMatch(clean);
      if (expMatch != null) {
        final d = expMatch.group(1)!;
        final yy = d.substring(0, 2);
        final mm = d.substring(2, 4);
        expFormatted = '$mm/20$yy';
      }

      final mfgMatch = RegExp(r'\(11\)(\d{6})').firstMatch(clean);
      if (mfgMatch != null) {
        final d = mfgMatch.group(1)!;
        final yy = d.substring(0, 2);
        final mm = d.substring(2, 4);
        mfgFormatted = '$mm/20$yy';
      }

      final batchMatch = RegExp(r'\(10\)([A-Za-z0-9\-\/]+?)(?:\(|$|\s|\x1d)').firstMatch(clean);
      if (batchMatch != null) batch = batchMatch.group(1);

      if (batch != null || expFormatted != null || gtin != null || mfgFormatted != null) {
        return BoxOcrResult(
          gtin: gtin,
          batchNumber: batch,
          mfgDate: mfgFormatted,
          expiryDate: expFormatted,
          rawExpiry: expFormatted,
          confidence: 1.0,
          hasRealData: true,
        );
      }
    }

    // Pattern 2: Raw GS1 stream starting with 01 + 14 digit GTIN
    if (clean.startsWith('01') && clean.length >= 16) {
      gtin = clean.substring(2, 16);
      int idx = 16;
      while (idx < clean.length) {
        if (clean[idx] == '\x1d') {
          idx++;
          continue;
        }
        if (idx + 2 > clean.length) break;
        final ai = clean.substring(idx, idx + 2);
        idx += 2;

        if (ai == '17' && idx + 6 <= clean.length) {
          final d = clean.substring(idx, idx + 6);
          final yy = d.substring(0, 2);
          final mm = d.substring(2, 4);
          expFormatted = '$mm/20$yy';
          idx += 6;
        } else if (ai == '11' && idx + 6 <= clean.length) {
          final d = clean.substring(idx, idx + 6);
          final yy = d.substring(0, 2);
          final mm = d.substring(2, 4);
          mfgFormatted = '$mm/20$yy';
          idx += 6;
        } else if (ai == '10') {
          final rest = clean.substring(idx);
          final sepIdx = rest.indexOf(RegExp(r'[\x1d\x1e\s]'));
          if (sepIdx != -1) {
            batch = rest.substring(0, sepIdx);
            idx += sepIdx + 1;
          } else {
            final sMatch = RegExp(r'^(.*?)21[A-Za-z0-9]+$').firstMatch(rest);
            if (sMatch != null && sMatch.group(1)!.isNotEmpty) {
              batch = sMatch.group(1);
            } else {
              batch = rest;
            }
            break;
          }
        } else if (ai == '21') {
          break;
        } else {
          idx += 2;
        }
      }

      return BoxOcrResult(
        gtin: gtin,
        batchNumber: batch,
        mfgDate: mfgFormatted,
        expiryDate: expFormatted,
        rawExpiry: expFormatted,
        confidence: 1.0,
        hasRealData: true,
      );
    }

    return null;
  }

  /// Sync scanned box item directly to PC billing POS table in real-time
  static Future<bool> syncBoxItemToPc({
    required int pharmacyId,
    required String medicineName,
    required String? batchNumber,
    required String? expiryDate,
    String? mfgDate,
    required double mrp,
    required double unitPrice,
    int quantity = 1,
    String? genericName,
    String? strength,
    String? packSize,
    String scannedBy = 'Mobile Staff/Owner',
  }) async {
    try {
      final token = StorageService.getToken();
      if (token == null || token.isEmpty || pharmacyId <= 0) {
        return false;
      }

      final response = await http.post(
        Uri.parse(ApiEndpoints.liveScanItem),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'pharmacyId': pharmacyId,
          'medicineName': medicineName,
          'batchNumber': batchNumber,
          'expiryDate': expiryDate,
          'mfgDate': mfgDate,
          'packSize': packSize,
          if (strength != null && strength.isNotEmpty) 'strength': strength,
          'mrp': mrp,
          'unitPrice': unitPrice > 0 ? unitPrice : mrp,
          'quantity': quantity,
          'genericName': genericName,
          'isOcrScan': true,
          'scannedBy': scannedBy,
        }),
      ).timeout(const Duration(seconds: 10));
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  /// 100% Free On-Device Box OCR using Google ML Kit (No Gemini API Key Needed)
  static Future<BoxOcrResult> scanBoxImageOnDevice({
    required String imagePath,
    required int pharmacyId,
    bool syncToPc = false,
  }) async {
    final file = File(imagePath);
    if (!await file.exists()) {
      throw Exception('ઇમેજ ફાઈલ ઉપલબ્ધ નથી');
    }

    final inputImage = InputImage.fromFilePath(imagePath);
    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

    try {
      final recognizedText = await textRecognizer.processImage(inputImage);
      final rawText = recognizedText.text;

      if (rawText.trim().isEmpty) {
        return BoxOcrResult(hasRealData: false, confidence: 0.0);
      }

      // Collect all lines
      final lines = <String>[];
      for (final block in recognizedText.blocks) {
        for (final line in block.lines) {
          final t = line.text.trim();
          if (t.isNotEmpty) lines.add(t);
        }
      }

      final now = DateTime.now();

      // 1. Extract Medicine Name, Generic Salt & Manufacturer
      final nameResult = _extractMedicineNameAndSalt(lines);
      String? medicineName = nameResult['name']?.trim();
      String? genericName = nameResult['generic']?.trim();
      String? manufacturer = nameResult['manufacturer']?.trim();

      // Auto-derive generic salt if not printed on strip
      if ((genericName == null || genericName.isEmpty) && medicineName != null && medicineName.isNotEmpty) {
        genericName = BarcodeMedicineService.deriveGenericSalt(medicineName);
      }

      // 2. Extract Batch Number (exact scanned truth - NO fake fabrication)
      String? batchNumber = _extractBatchNumber(rawText, lines);

      // 3. Extract MFG and Expiry Dates
      final dates = _extractMfgAndExpDates(rawText, lines);
      String? mfgDate = dates['mfg'];
      String? expiryDate = dates['exp'];

      // 4. Extract MRP
      double mrp = _extractMrp(rawText, lines);

      // 5. Extract Pack Size
      String? packSize = _extractPackSize(rawText, lines);

      // 6. Extract Mfg Lic No
      String? mfgLicNo = _extractMfgLicNo(rawText, lines);

      // 7. Extract Strength / Power (e.g. 500 mg, 650 mg, 40 mg, 100 ml)
      String? strength = _extractStrength(rawText, lines, medicineName);

      // Expiry Health Status
      String expiryStatus = 'HEALTHY';
      int daysUntilExpiry = 999;
      if (expiryDate != null && expiryDate.isNotEmpty) {
        final parsed = _parseDateForHealth(expiryDate);
        if (parsed != null) {
          daysUntilExpiry = parsed.difference(now).inDays;
          if (daysUntilExpiry <= 0) {
            expiryStatus = 'EXPIRED';
          } else if (daysUntilExpiry <= 90) {
            expiryStatus = 'NEAR_EXPIRY';
          }
        }
      }

      final hasData = (medicineName != null && medicineName.isNotEmpty) ||
          (batchNumber != null && batchNumber.isNotEmpty) ||
          (mfgDate != null && mfgDate.isNotEmpty) ||
          (expiryDate != null && expiryDate.isNotEmpty) ||
          mrp > 0;

      final result = BoxOcrResult(
        medicineName: medicineName,
        genericName: genericName,
        batchNumber: batchNumber,
        expiryDate: expiryDate,
        rawExpiry: expiryDate,
        mfgDate: mfgDate,
        mrp: mrp,
        packSize: packSize,
        strength: strength,
        mfgLicNo: mfgLicNo,
        manufacturer: manufacturer,
        daysUntilExpiry: daysUntilExpiry,
        expiryStatus: expiryStatus,
        confidence: hasData ? 0.95 : 0.0,
        hasRealData: hasData,
      );

      // Sync to PC Billing table if requested and valid data exists
      if (syncToPc && hasData && (medicineName != null || (batchNumber != null && batchNumber.isNotEmpty))) {
        await syncBoxItemToPc(
          pharmacyId: pharmacyId,
          medicineName: medicineName ?? 'Scanned Medicine',
          batchNumber: batchNumber,
          expiryDate: expiryDate,
          mfgDate: mfgDate,
          mrp: mrp,
          unitPrice: mrp,
          genericName: genericName,
          strength: strength,
          packSize: packSize,
        );
      }

      return result;
    } finally {
      await textRecognizer.close();
    }
  }

  /// 2-Step Front & Back Strip Scan on device:
  /// Step 1 (Front Side): Extracts Brand Name, Generic Composition, Manufacturer.
  /// Step 2 (Back Side): Extracts Batch Number, MFG Date, Expiry Date, MRP, Pack Size.
  /// Merges both results into a single comprehensive BoxOcrResult.
  static Future<BoxOcrResult> scanTwoStepStripOnDevice({
    required String frontImagePath,
    String? backImagePath,
    required int pharmacyId,
    bool syncToPc = false,
  }) async {
    final frontFile = File(frontImagePath);
    if (!await frontFile.exists()) {
      throw Exception('આગળની ઇમેજ ફાઈલ ઉપલબ્ધ નથી');
    }

    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
    try {
      // 1. Process Front Side
      final frontInput = InputImage.fromFilePath(frontImagePath);
      final frontRecognized = await textRecognizer.processImage(frontInput);
      final frontRawText = frontRecognized.text;
      final frontLines = <String>[];
      for (final block in frontRecognized.blocks) {
        for (final line in block.lines) {
          final t = line.text.trim();
          if (t.isNotEmpty) frontLines.add(t);
        }
      }

      final frontNameRes = _extractMedicineNameAndSalt(frontLines);
      String? medicineName = frontNameRes['name']?.trim();
      String? genericName = frontNameRes['generic']?.trim();
      String? manufacturer = frontNameRes['manufacturer']?.trim();

      String? batchNumber = _extractBatchNumber(frontRawText, frontLines);
      final frontDates = _extractMfgAndExpDates(frontRawText, frontLines);
      String? mfgDate = frontDates['mfg'];
      String? expiryDate = frontDates['exp'];
      double mrp = _extractMrp(frontRawText, frontLines);
      String? packSize = _extractPackSize(frontRawText, frontLines);
      String? mfgLicNo = _extractMfgLicNo(frontRawText, frontLines);

      // 2. Process Back Side (if provided)
      String backRawText = '';
      List<String> backLines = <String>[];
      if (backImagePath != null && backImagePath.isNotEmpty) {
        final backFile = File(backImagePath);
        if (await backFile.exists()) {
          final backInput = InputImage.fromFilePath(backImagePath);
          final backRecognized = await textRecognizer.processImage(backInput);
          backRawText = backRecognized.text;
          for (final block in backRecognized.blocks) {
            for (final line in block.lines) {
              final t = line.text.trim();
              if (t.isNotEmpty) backLines.add(t);
            }
          }

          // Back side takes priority for Batch Number
          final backBatch = _extractBatchNumber(backRawText, backLines);
          if (backBatch != null && backBatch.isNotEmpty) {
            batchNumber = backBatch;
          }

          // Back side takes priority for Dates
          final backDates = _extractMfgAndExpDates(backRawText, backLines);
          if (backDates['mfg'] != null && backDates['mfg']!.isNotEmpty) {
            mfgDate = backDates['mfg'];
          }
          if (backDates['exp'] != null && backDates['exp']!.isNotEmpty) {
            expiryDate = backDates['exp'];
          }

          // Back side takes priority for MRP
          final backMrp = _extractMrp(backRawText, backLines);
          if (backMrp > 0) {
            mrp = backMrp;
          }

          final backPack = _extractPackSize(backRawText, backLines);
          if (backPack != null && backPack.isNotEmpty) {
            packSize ??= backPack;
          }

          final backLic = _extractMfgLicNo(backRawText, backLines);
          if (backLic != null && backLic.isNotEmpty) {
            mfgLicNo ??= backLic;
          }

          // Back side can fill in missing Manufacturer or Medicine Name
          final backNameRes = _extractMedicineNameAndSalt(backLines);
          if (manufacturer == null || manufacturer.isEmpty) {
            manufacturer = backNameRes['manufacturer']?.trim();
          }
          if (medicineName == null || medicineName.isEmpty) {
            medicineName = backNameRes['name']?.trim();
          }
          if (genericName == null || genericName.isEmpty) {
            genericName = backNameRes['generic']?.trim();
          }
        }
      }

      // Auto-derive missing values
      if (medicineName != null && medicineName.isNotEmpty) {
        if (manufacturer == null || manufacturer.isEmpty) {
          manufacturer = BarcodeMedicineService.deriveManufacturer(medicineName);
        }
        if (genericName == null || genericName.isEmpty) {
          genericName = BarcodeMedicineService.deriveGenericSalt(medicineName);
        }
      }

      final now = DateTime.now();

      // Expiry Health Status
      String expiryStatus = 'HEALTHY';
      int daysUntilExpiry = 999;
      if (expiryDate != null && expiryDate.isNotEmpty) {
        final parsed = _parseDateForHealth(expiryDate);
        if (parsed != null) {
          daysUntilExpiry = parsed.difference(now).inDays;
          if (daysUntilExpiry <= 0) {
            expiryStatus = 'EXPIRED';
          } else if (daysUntilExpiry <= 90) {
            expiryStatus = 'NEAR_EXPIRY';
          }
        }
      }

      final hasData = (medicineName != null && medicineName.isNotEmpty) ||
          (batchNumber != null && batchNumber.isNotEmpty) ||
          (mfgDate != null && mfgDate.isNotEmpty) ||
          (expiryDate != null && expiryDate.isNotEmpty) ||
          mrp > 0;

      final combinedRaw = '$frontRawText\n$backRawText';
      final combinedLines = [...frontLines, ...backLines];
      final strength = _extractStrength(combinedRaw, combinedLines, medicineName);

      final result = BoxOcrResult(
        medicineName: medicineName,
        genericName: genericName,
        batchNumber: batchNumber,
        expiryDate: expiryDate,
        rawExpiry: expiryDate,
        mfgDate: mfgDate,
        mrp: mrp > 0 ? mrp : 0.0,
        packSize: packSize,
        strength: strength,
        mfgLicNo: mfgLicNo,
        manufacturer: manufacturer,
        daysUntilExpiry: daysUntilExpiry,
        expiryStatus: expiryStatus,
        confidence: hasData ? 0.98 : 0.0,
        hasRealData: hasData,
      );

      if (syncToPc && hasData && (medicineName != null || batchNumber != null)) {
        await syncBoxItemToPc(
          pharmacyId: pharmacyId,
          medicineName: medicineName ?? 'Scanned Medicine',
          batchNumber: batchNumber,
          expiryDate: expiryDate,
          mfgDate: mfgDate,
          mrp: mrp > 0 ? mrp : 0.0,
          unitPrice: mrp > 0 ? mrp : 0.0,
          genericName: genericName,
          strength: strength,
          packSize: packSize,
        );
      }

      return result;
    } finally {
      await textRecognizer.close();
    }
  }

  /// Cloud Gemini Vision OCR call (handles dot-matrix, bilingual & column-misaligned flaps accurately)
  static Future<BoxOcrResult?> _cloudScanBox({
    required String frontImagePath,
    String? backImagePath,
    bool syncToPc = false,
  }) async {
    try {
      final token = StorageService.getToken();
      if (token == null || token.isEmpty) return null;

      final frontFile = File(frontImagePath);
      if (!await frontFile.exists()) return null;
      final frontBytes = await frontFile.readAsBytes();
      if (frontBytes.isEmpty) return null;

      final body = <String, dynamic>{
        'image': 'data:image/jpeg;base64,${base64Encode(frontBytes)}',
        'syncToPc': syncToPc,
      };

      if (backImagePath != null && backImagePath.isNotEmpty) {
        final backFile = File(backImagePath);
        if (await backFile.exists()) {
          final backBytes = await backFile.readAsBytes();
          if (backBytes.isNotEmpty) {
            body['backImage'] = 'data:image/jpeg;base64,${base64Encode(backBytes)}';
          }
        }
      }

      final res = await ApiService.post(ApiEndpoints.scanBox, body);
      if (res.success && res.data is Map && res.data['data'] is Map) {
        return BoxOcrResult.fromJson(
          Map<String, dynamic>.from(res.data['data'] as Map),
        );
      }
    } catch (_) {
      // Silently fall back to on-device ML Kit OCR
    }
    return null;
  }

  static String? _pickNonEmpty(String? primary, String? fallback) {
    if (primary != null && primary.trim().isNotEmpty && primary.trim() != 'Scanned Medicine') {
      return primary.trim();
    }
    if (fallback != null && fallback.trim().isNotEmpty && fallback.trim() != 'Scanned Medicine') {
      return fallback.trim();
    }
    return null;
  }

  static BoxOcrResult mergeOcrResults(BoxOcrResult? primary, BoxOcrResult secondary) {
    if (primary == null || !primary.hasRealData) return secondary;
    if (!secondary.hasRealData) return primary;
    final name = _pickNonEmpty(primary.medicineName, secondary.medicineName);
    final generic = _pickNonEmpty(primary.genericName, secondary.genericName);
    final batch = _pickNonEmpty(primary.batchNumber, secondary.batchNumber);
    final mfg = _pickNonEmpty(primary.mfgDate, secondary.mfgDate);
    final exp = _pickNonEmpty(primary.expiryDate, secondary.expiryDate);
    final mrpVal = primary.mrp > 0 ? primary.mrp : secondary.mrp;

    return BoxOcrResult(
      gtin: _pickNonEmpty(primary.gtin, secondary.gtin),
      medicineName: name,
      genericName: generic,
      batchNumber: batch,
      mfgDate: mfg,
      expiryDate: exp,
      rawExpiry: _pickNonEmpty(primary.rawExpiry, secondary.rawExpiry) ?? exp,
      daysUntilExpiry: primary.expiryDate != null ? primary.daysUntilExpiry : secondary.daysUntilExpiry,
      expiryStatus: primary.expiryDate != null ? primary.expiryStatus : secondary.expiryStatus,
      mrp: mrpVal,
      packSize: _pickNonEmpty(primary.packSize, secondary.packSize),
      strength: _pickNonEmpty(primary.strength, secondary.strength),
      mfgLicNo: _pickNonEmpty(primary.mfgLicNo, secondary.mfgLicNo),
      manufacturer: _pickNonEmpty(primary.manufacturer, secondary.manufacturer),
      confidence: primary.confidence > 0 ? primary.confidence : secondary.confidence,
      matchedMedicine: primary.matchedMedicine ?? secondary.matchedMedicine,
      hasRealData: name != null || batch != null || mfg != null || exp != null || mrpVal > 0,
    );
  }

  /// Fast live-camera frame scanner: uses ML Kit to gate empty frames in ~120ms,
  /// then verifies printed text with Gemini Vision AI and merges cleanly.
  static Future<BoxOcrResult> scanLiveCameraFrame({
    required String imagePath,
    required int pharmacyId,
  }) async {
    final file = File(imagePath);
    if (!await file.exists()) {
      return BoxOcrResult(hasRealData: false, confidence: 0.0);
    }

    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
    bool hasReadableText = false;
    try {
      final recognizedText = await textRecognizer.processImage(InputImage.fromFilePath(imagePath));
      hasReadableText = recognizedText.text.trim().length >= 5;
    } catch (_) {
      hasReadableText = false;
    } finally {
      await textRecognizer.close();
    }

    if (!hasReadableText) {
      return BoxOcrResult(hasRealData: false, confidence: 0.0);
    }

    return scanBoxImageHybrid(
      imagePath: imagePath,
      pharmacyId: pharmacyId,
      syncToPc: false,
    );
  }

  /// Hybrid Single-Image Scanner: runs Gemini Vision AI + On-Device ML Kit in parallel & merges
  static Future<BoxOcrResult> scanBoxImageHybrid({
    required String imagePath,
    required int pharmacyId,
    bool syncToPc = false,
  }) async {
    final results = await Future.wait<dynamic>([
      _cloudScanBox(frontImagePath: imagePath, syncToPc: syncToPc),
      scanBoxImageOnDevice(
        imagePath: imagePath,
        pharmacyId: pharmacyId,
        syncToPc: false,
      ),
    ]);
    return mergeOcrResults(results[0] as BoxOcrResult?, results[1] as BoxOcrResult);
  }

  /// Hybrid 2-Step Strip/Box Scanner (Front & Back): runs Gemini Vision AI + On-Device ML Kit
  static Future<BoxOcrResult> scanTwoStepStripHybrid({
    required String frontImagePath,
    String? backImagePath,
    required int pharmacyId,
    bool syncToPc = false,
  }) async {
    final results = await Future.wait<dynamic>([
      _cloudScanBox(
        frontImagePath: frontImagePath,
        backImagePath: backImagePath,
        syncToPc: syncToPc,
      ),
      scanTwoStepStripOnDevice(
        frontImagePath: frontImagePath,
        backImagePath: backImagePath,
        pharmacyId: pharmacyId,
        syncToPc: false,
      ),
    ]);
    return mergeOcrResults(results[0] as BoxOcrResult?, results[1] as BoxOcrResult);
  }

  /// Compatibility wrapper for existing calls passing imageBytes
  static Future<BoxOcrResult> scanBoxImage({
    required List<int> imageBytes,
    required int pharmacyId,
    bool syncToPc = false,
  }) async {
    final tempDir = Directory.systemTemp;
    final tempFile = File('${tempDir.path}/box_scan_${DateTime.now().millisecondsSinceEpoch}.jpg');
    try {
      await tempFile.writeAsBytes(imageBytes);
      return await scanBoxImageHybrid(
        imagePath: tempFile.path,
        pharmacyId: pharmacyId,
        syncToPc: syncToPc,
      );
    } finally {
      if (await tempFile.exists()) {
        await tempFile.delete().catchError((_) => tempFile);
      }
    }
  }

  // -------------------------------------------------------------
  // REGEX PARSERS FOR INDIAN MEDICINE PACKAGING & LABELS
  // -------------------------------------------------------------

  static String? _extractStrength(String rawText, List<String> lines, String? medicineName) {
    // 1. If brand name already has standard power suffix (e.g. "Dolo 650", "Telma 40", "Augmentin 625", "Pan 40", "Azee 500", "Calpol 250", "Azithral 500")
    if (medicineName != null && medicineName.isNotEmpty) {
      final matchSuffix = RegExp(r'\b([0-9]{2,4})\s*(?:mg|ml|gm)?\b', caseSensitive: false).firstMatch(medicineName);
      if (matchSuffix != null && matchSuffix.group(1) != null) {
        final numVal = int.tryParse(matchSuffix.group(1)!);
        if (numVal != null && (numVal == 5 || numVal == 10 || numVal == 20 || numVal == 25 || numVal == 40 || numVal == 50 || numVal == 75 || numVal == 100 || numVal == 150 || numVal == 200 || numVal == 250 || numVal == 300 || numVal == 375 || numVal == 400 || numVal == 500 || numVal == 625 || numVal == 650 || numVal == 800 || numVal == 1000)) {
          return '$numVal mg';
        }
      }
    }

    // 2. Explicit strength patterns on packaging lines (e.g. "650 mg", "500 mg", "40 mg", "10 mg", "250 mg", "100 ml", "5 mg")
    final regexStrength = RegExp(
      r'\b([0-9]+(?:\.[0-9]+)?)\s*(mg|mcg|gm|g|ml|iu)\b',
      caseSensitive: false,
    );

    for (final line in lines) {
      if (RegExp(r'(?:MRP|RS|\b202[0-9]\b|EXP|MFG|BATCH|B\.NO)', caseSensitive: false).hasMatch(line) && !line.toLowerCase().contains('mg')) {
        continue;
      }
      final match = regexStrength.firstMatch(line);
      if (match != null && match.group(1) != null && match.group(2) != null) {
        final val = match.group(1)!;
        final unit = match.group(2)!.toLowerCase();
        return '$val $unit';
      }
    }

    final rawMatch = regexStrength.firstMatch(rawText);
    if (rawMatch != null && rawMatch.group(1) != null && rawMatch.group(2) != null) {
      return '${rawMatch.group(1)} ${rawMatch.group(2)!.toLowerCase()}';
    }

    return null;
  }

  static String? _extractBatchNumber(String rawText, List<String> lines) {
    // Pattern 1: Same line match: "B.No. T260241", "B.No: CO92604", "B.NO.-24A102", "Batch: 24B01", "B.N0.: XYZ"
    final regexSameLine = RegExp(
      r'(?:B\.?\s*N[o0]\.?|Batch(?:\s*N[o0]\.?)?|Lot(?:\s*N[o0]\.?)?|B\.?\s*Num(?:ber)?|B\/N[o0]?|B\.N\.)[ \t:.\-\/]*([A-Za-z0-9\-\/]{2,18})',
      caseSensitive: false,
    );
    final matches = regexSameLine.allMatches(rawText);
    for (final match in matches) {
      if (match.group(1) != null) {
        var val = match.group(1)!.trim().toUpperCase();
        val = val.replaceAll(RegExp(r'(?:MFG|MFD|EXP|MRP|USE|DT|DATE).*$', caseSensitive: false), '');
        val = val.replaceAll(RegExp(r'[\s.\-\/]+$'), '');
        if (val.length >= 2 && !_isCommonFalseBatch(val)) {
          return val;
        }
      }
    }

    // Pattern 2: Look across adjacent lines where label and value are on separate lines
    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      final isBatchLabel = RegExp(
        r'^(?:B\.?\s*N[o0]\.?|Batch(?:\s*N[o0]\.?)?|Lot(?:\s*N[o0]\.?)?|B\/N[o0]?|B\.N\.)[ \t:.\-\/]*$',
        caseSensitive: false,
      ).hasMatch(line);

      if (isBatchLabel && i + 1 < lines.length) {
        final nextLine = lines[i + 1].trim();
        final tokens = nextLine.split(RegExp(r'[\s,]+'));
        for (var token in tokens) {
          token = token.trim().toUpperCase();
          token = token.replaceAll(RegExp(r'(?:MFG|MFD|EXP|MRP|USE|DT|DATE).*$', caseSensitive: false), '');
          token = token.replaceAll(RegExp(r'[\s.\-\/]+$'), '');
          if (RegExp(r'^[A-Za-z0-9\-\/]{2,18}$').hasMatch(token) && !_isCommonFalseBatch(token)) {
            return token;
          }
        }
      }
    }

    // Pattern 3: Common dot-matrix & printed batch formats
    final loosePatterns = [
      RegExp(r'\b([A-Z]{1,3}\d{3,9}[A-Z]?)\b'),
      RegExp(r'\b(\d{2}[A-Z]{1,2}\d{2,7})\b'),
      RegExp(r'\b([A-Z0-9]{2,4}\/\d{2,6})\b'),
    ];
    for (final p in loosePatterns) {
      final match = p.firstMatch(rawText);
      if (match != null && match.group(1) != null) {
        final val = match.group(1)!.trim().toUpperCase();
        if (!_isCommonFalseBatch(val)) return val;
      }
    }

    return null;
  }

  static bool _isCommonFalseBatch(String text) {
    final upper = text.toUpperCase();
    if (upper.length < 2) return true;
    if (RegExp(r'^\d+$').hasMatch(upper) && upper.length > 8) return true;
    return upper.contains('TABLET') ||
        upper.contains('CAPSULE') ||
        upper.contains('STRIP') ||
        upper.contains('PRICE') ||
        upper.contains('EXPIRY') ||
        upper.contains('TAXES') ||
        upper.contains('ONLY') ||
        upper.contains('INCL') ||
        upper.contains('M.R.P') ||
        upper.contains('MRP') ||
        upper.contains('MFG') ||
        upper.contains('DATE') ||
        upper.contains('EACH') ||
        upper.contains('STORE') ||
        upper.contains('DOSAGE') ||
        upper.contains('WARNING');
  }

  static Map<String, String?> _extractMfgAndExpDates(String rawText, List<String> lines) {
    String? mfg;
    String? exp;

    // 1. Explicit labeled matches
    final mfgRegex = RegExp(
      r'(?:Mfg\.?\s*(?:Dt\.?|Date)?|Mfd\.?|M\.F\.G\.)[ \t:]*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,4}[\s\/\-\.]*[0-9]{2,4})',
      caseSensitive: false,
    );
    final mMatch = mfgRegex.firstMatch(rawText);
    if (mMatch != null && mMatch.group(1) != null) {
      mfg = _normalizeDate(mMatch.group(1)!);
    }

    final expRegex = RegExp(
      r'(?:Exp\.?\s*(?:Dt\.?|Date)?|Expiry|Exp\b|Use\s*Before)[ \t:]*([0-9]{1,2}[\/\-\.][0-9]{2,4}|[A-Za-z]{3,4}[\s\/\-\.]*[0-9]{2,4})',
      caseSensitive: false,
    );
    final eMatch = expRegex.firstMatch(rawText);
    if (eMatch != null && eMatch.group(1) != null) {
      exp = _normalizeDate(eMatch.group(1)!);
    }

    // 2. Check multi-line where label is on one line and date on next
    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      if (mfg == null && RegExp(r'^(?:Mfg\.?|Mfd\.?|Mfg\s*Date)$', caseSensitive: false).hasMatch(line) && i + 1 < lines.length) {
        mfg = _normalizeDate(lines[i + 1].trim());
      }
      if (exp == null && RegExp(r'^(?:Exp\.?|Expiry|Exp\s*Date)$', caseSensitive: false).hasMatch(line) && i + 1 < lines.length) {
        exp = _normalizeDate(lines[i + 1].trim());
      }
    }

    // 3. Fallback: Standalone MM/YYYY or MM/YY dates
    if (mfg == null || exp == null) {
      final standaloneRegex = RegExp(r'\b(0[1-9]|1[0-2])[\/\-\.](20[2-3][0-9]|[2-3][0-9])\b');
      final allMatches = standaloneRegex.allMatches(rawText).map((m) => m.group(0)!).toList();
      final normalized = allMatches.map(_normalizeDate).whereType<String>().toSet().toList();

      if (normalized.length >= 2) {
        // If two standalone dates are found, the earlier is MFG, the later is EXP
        normalized.sort((a, b) {
          final da = _parseDateForHealth(a) ?? DateTime(2000);
          final db = _parseDateForHealth(b) ?? DateTime(2000);
          return da.compareTo(db);
        });
        mfg ??= normalized.first;
        exp ??= normalized.last;
      } else if (normalized.length == 1) {
        // One date: if year >= 2026, it's EXP; otherwise MFG
        final d = _parseDateForHealth(normalized.first);
        if (d != null && d.year >= 2026) {
          exp ??= normalized.first;
        } else {
          mfg ??= normalized.first;
        }
      }
    }

    return {'mfg': mfg, 'exp': exp};
  }

  static String? _normalizeDate(String raw) {
    var clean = raw.trim().replaceAll('-', '/').replaceAll('.', '/');

    final monthMap = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12',
    };
    for (final entry in monthMap.entries) {
      if (clean.toUpperCase().contains(entry.key)) {
        clean = clean.toUpperCase().replaceAll(entry.key, entry.value);
        break;
      }
    }
    clean = clean.replaceAll(' ', '');

    // MM/YYYY (e.g. 05/2024)
    if (RegExp(r'^\d{1,2}\/\d{4}$').hasMatch(clean)) {
      final parts = clean.split('/');
      final mm = parts[0].padLeft(2, '0');
      return '$mm/${parts[1]}';
    }
    // MM/YY (e.g. 05/24) -> 05/2024
    if (RegExp(r'^\d{1,2}\/\d{2}$').hasMatch(clean)) {
      final parts = clean.split('/');
      final mm = parts[0].padLeft(2, '0');
      return '$mm/20${parts[1]}';
    }
    // DD/MM/YYYY (e.g. 15/05/2024) -> 05/2024
    if (RegExp(r'^\d{1,2}\/\d{1,2}\/\d{4}$').hasMatch(clean)) {
      final parts = clean.split('/');
      final mm = parts[1].padLeft(2, '0');
      return '$mm/${parts[2]}';
    }
    // DD/MM/YY (e.g. 15/05/24) -> 05/2024
    if (RegExp(r'^\d{1,2}\/\d{1,2}\/\d{2}$').hasMatch(clean)) {
      final parts = clean.split('/');
      final mm = parts[1].padLeft(2, '0');
      return '$mm/20${parts[2]}';
    }
    return clean.isNotEmpty ? clean : null;
  }

  static DateTime? _parseDateForHealth(String expStr) {
    try {
      final parts = expStr.split('/');
      if (parts.length == 2) {
        final mm = int.parse(parts[0]);
        final yy = int.parse(parts[1]);
        return DateTime(yy, mm + 1, 0); // End of the month
      }
    } catch (_) {}
    return null;
  }

  static double _extractMrp(String rawText, List<String> lines) {
    // Pattern 1: "M.R.P. Rs. 74.99" or "MRP ₹ 120.00"
    final mrpRegex = RegExp(
      r'(?:M\.?R\.?P\.?|Price)[ \t:]*(?:Rs\.?|INR|₹)?[ \t:]*([0-9]+(?:\.[0-9]{1,2})?)',
      caseSensitive: false,
    );
    final match = mrpRegex.firstMatch(rawText);
    if (match != null && match.group(1) != null) {
      return double.tryParse(match.group(1)!) ?? 0.0;
    }

    // Pattern 2: ₹ or Rs. prefix
    final currencyRegex = RegExp(r'(?:Rs\.?|₹)[ \t:]*([0-9]+(?:\.[0-9]{1,2})?)', caseSensitive: false);
    final cMatch = currencyRegex.firstMatch(rawText);
    if (cMatch != null && cMatch.group(1) != null) {
      return double.tryParse(cMatch.group(1)!) ?? 0.0;
    }

    // Pattern 3: Misaligned two-column flap where MRP label & stamped price (e.g. 360.00) sit in separate blocks
    final hasMrpContext = RegExp(r'(?:M\.?\s*R\.?\s*P|INCLUSIVE|ALL\s+TAXES)', caseSensitive: false).hasMatch(rawText);
    if (hasMrpContext) {
      final decimalMatches = RegExp(r'\b([1-9][0-9]{0,4}\.[0-9]{2})\b').allMatches(rawText);
      for (final m in decimalMatches) {
        final val = double.tryParse(m.group(1) ?? '');
        if (val != null && val > 0 && val < 50000) {
          return val;
        }
      }
    }

    return 0.0;
  }

  static String? _extractPackSize(String rawText, List<String> lines) {
    final packRegex = RegExp(
      r'\b([0-9]+\s*(?:Tablets?|Tabs?|Capsules?|Caps?|ml|mg|gm|Vial|Ampoule|Strip))\b',
      caseSensitive: false,
    );
    final match = packRegex.firstMatch(rawText);
    if (match != null && match.group(1) != null) {
      return match.group(1)!.trim();
    }
    return null;
  }

  static String? _extractMfgLicNo(String rawText, List<String> lines) {
    final licRegex = RegExp(
      r'(?:Mfg\.?\s*Lic\.?\s*No\.?|Lic\.?\s*No\.?|M\.L\.)[ \t:]*([A-Za-z0-9\/\-\.]{4,20})',
      caseSensitive: false,
    );
    final match = licRegex.firstMatch(rawText);
    if (match != null && match.group(1) != null) {
      return match.group(1)!.trim();
    }
    return null;
  }

  static Map<String, String?> _extractMedicineNameAndSalt(List<String> lines) {
    String? brandName;
    String? genericSalt;
    String? manufacturer;

    final companyPrefixRegex = RegExp(
      r'^(?:Mfg\.?\s*(?:in\s+India\s*)?by|Marketed\s*by|Mfd\.?\s*(?:in\s+India\s*)?by|Mkt\.?\s*by|Manufactured\s*(?:in\s+India\s*)?by|Packed\s*by)[ \t:]*',
      caseSensitive: false,
    );

    final companyRegex = RegExp(
      r'\b(?:PVT\.?\s*LTD\.?|PRIVATE\s+LIMITED|LTD\.?|LIMITED|PHARMA(?:CEUTICALS)?|LABORATORIES|LABS?|REMEDIES|HEALTHCARE|LIFE\s*SCIENCES|FORMULATIONS|BIOTECH|THERAPEUTICS|MFG\.?\s*BY|MKT\.?\s*BY|MARKETED\s+BY|MANUFACTURED\s+BY|LLP|INC)\b',
      caseSensitive: false,
    );

    final boilerplatePatterns = [
      RegExp(r'SCHEDULE\s+[A-Z]', caseSensitive: false),
      RegExp(r'PRESCRIPTION\s+DRUG', caseSensitive: false),
      RegExp(r'WARNING|CAUTION|DIRECTION', caseSensitive: false),
      RegExp(r'KEEP\s+OUT\s+OF\s+REACH', caseSensitive: false),
      RegExp(r'STORE\s+(?:IN|AT|BELOW)', caseSensitive: false),
      RegExp(r'FOR\s+ORAL\s+USE|FOR\s+EXTERNAL\s+USE', caseSensitive: false),
      RegExp(r'BATCH|EXPIRY|EXP\.?\s*DATE|MFG\.?\s*DATE|M\.?\s*R\.?\s*P|B\.?\s*NO|LIC\.?\s*NO', caseSensitive: false),
      RegExp(r'INCL\.?\s*OF\s+ALL\s+TAXES|INCLUSIVE\s+OF\s+ALL\s+TAXES|MAXIMUM\s+RETAIL\s+PRICE', caseSensitive: false),
      RegExp(r'DOSAGE|COMPOSITION|NOT\s+FOR|EXPORT', caseSensitive: false),
      RegExp(r'EACH\s+(?:FILM|UNCOATED|ENTERIC|SUSTAINED)?\s*(?:TABLET|CAPSULE)\s+CONTAINS', caseSensitive: false),
      RegExp(r'COLOUR|TITANIUM\s+DIOXIDE|EXCIPIENTS|Q\.S\.', caseSensitive: false),
      RegExp(r'AS\s+DIRECTED\s+BY\s+THE\s+PHYSICIAN', caseSensitive: false),
      RegExp(r'PROTECT\s+FROM\s+(?:LIGHT|MOISTURE)', caseSensitive: false),
      RegExp(r'PHYSICIAN|OVERDOSAGE|SWALLOW\s+WHOLE', caseSensitive: false),
    ];

    final compositionKeywords = RegExp(
      r'\b(?:IP|BP|USP|Tablets?|Capsules?|Injection|Syrup|Suspension|Ointment|Gel|Domperidone|Pantoprazole|Paracetamol|Amoxicillin|Rabeprazole|Omeprazole|Cefixime|Azithromycin|Montelukast|Levocetirizine|Sustained\s*Release|Gastro-resistant|Hydrochloride|Potassium|Clavulanate)\b',
      caseSensitive: false,
    );

    for (int i = 0; i < lines.length; i++) {
      final trimmed = lines[i].trim();
      if (trimmed.length < 3) continue;

      // Check if it's a manufacturer / company line
      if (companyPrefixRegex.hasMatch(trimmed) || companyRegex.hasMatch(trimmed)) {
        String cleanMfg = trimmed.replaceFirst(companyPrefixRegex, '').trim();
        final addrIdx = cleanMfg.indexOf(RegExp(r',\s*(?:At|Plot|Phase|Sipcot|Industrial|Regd|Vill|Dist|Tal)\b', caseSensitive: false));
        if (addrIdx != -1) {
          cleanMfg = cleanMfg.substring(0, addrIdx).trim();
        }
        if (cleanMfg.isNotEmpty && cleanMfg.length >= 3 && cleanMfg.length <= 60) {
          manufacturer ??= cleanMfg;
        }
        continue; // NEVER treat company line as generic salt or brand name!
      }

      // Check boilerplate
      if (boilerplatePatterns.any((p) => p.hasMatch(trimmed))) continue;

      // Skip isolated numeric/date/price/batch-like stamps (e.g. 07/2026, 360.00, SAE26057) or non-ASCII label lines
      if (!RegExp(r'[A-Za-z]{2,}').hasMatch(trimmed) ||
          RegExp(r'^[0-9\s\/\.\-\₹]+$').hasMatch(trimmed) ||
          RegExp(r'^[A-Z]{1,4}\d{3,10}[A-Z]?$').hasMatch(trimmed.replaceAll(' ', ''))) {
        continue;
      }

      // Check if line describes chemical composition / generic salt
      if (compositionKeywords.hasMatch(trimmed)) {
        if (genericSalt == null) {
          genericSalt = trimmed;
          continue;
        }
      }

      // Candidate for medicine brand name
      if (brandName == null) {
        String cleaned = trimmed.replaceAll(RegExp(r'[®™:.]'), '').trim();
        // If it looks like a suffix (e.g. "h-DSR" or "-DSR"), check if previous line had the prefix
        if (cleaned.startsWith('h-') || cleaned.startsWith('-')) {
          if (i > 0 && lines[i - 1].trim().length >= 3 && !companyRegex.hasMatch(lines[i - 1])) {
            cleaned = '${lines[i - 1].trim().replaceAll(RegExp(r'[®™:.]'), '')}$cleaned';
          }
        }
        if (cleaned.isNotEmpty && cleaned.length >= 3 && cleaned.length <= 40) {
          brandName = cleaned;
        }
      }
    }

    // Auto-derive manufacturer from Indian brand master if not captured in OCR
    if (manufacturer == null && brandName != null && brandName.isNotEmpty) {
      manufacturer = BarcodeMedicineService.deriveManufacturer(brandName);
    }

    return {'name': brandName, 'generic': genericSalt, 'manufacturer': manufacturer};
  }
}
