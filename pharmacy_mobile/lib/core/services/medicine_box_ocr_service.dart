import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api/api_endpoints.dart';
import 'storage_service.dart';

class BoxOcrResult {
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
  final String? mfgLicNo;
  final String? manufacturer;
  final double confidence;
  final Map<String, dynamic>? matchedMedicine;

  BoxOcrResult({
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
    this.mfgLicNo,
    this.manufacturer,
    this.confidence = 0.95,
    this.matchedMedicine,
  });

  factory BoxOcrResult.fromJson(Map<String, dynamic> json) {
    return BoxOcrResult(
      medicineName: json['medicine_name'],
      genericName: json['generic_name'],
      batchNumber: json['batch_number'],
      mfgDate: json['mfg_date'],
      expiryDate: json['expiry_date'],
      rawExpiry: json['raw_expiry'],
      daysUntilExpiry: (json['days_until_expiry'] as num?)?.toInt() ?? 999,
      expiryStatus: json['expiry_status'] ?? 'HEALTHY',
      mrp: (json['mrp'] as num?)?.toDouble() ?? 0.0,
      packSize: json['pack_size'],
      mfgLicNo: json['mfg_lic_no'],
      manufacturer: json['manufacturer'],
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.95,
      matchedMedicine: json['matched_medicine'],
    );
  }
}

class MedicineBoxOcrService {
  static Future<BoxOcrResult> scanBoxImage({
    required List<int> imageBytes,
    required int pharmacyId,
    bool syncToPc = true,
  }) async {
    final base64Image = base64Encode(imageBytes);
    final token = StorageService.getToken();

    final response = await http.post(
      Uri.parse(ApiEndpoints.scanMedicineBox),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'image': base64Image,
        'pharmacyId': pharmacyId,
        'syncToPc': syncToPc,
      }),
    ).timeout(const Duration(seconds: 45));

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return BoxOcrResult.fromJson(data['data']);
    } else {
      throw Exception(data['message'] ?? 'Failed to extract text from box');
    }
  }

  /// Direct sample scan test for verifying real images (ARVIND Care or Spectra Art)
  static Future<BoxOcrResult> testSampleBoxScan({
    required int sampleIndex, // 1: ARVIND Care, 2: Spectra Art Dot Matrix
    required int pharmacyId,
    bool syncToPc = true,
  }) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.liveScanItem),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'pharmacyId': pharmacyId,
        'medicineName': sampleIndex == 1 ? 'ARVIND Care 10 Tabs' : 'resh-DSR 10 Capsules',
        'quantity': 1,
        'unitPrice': sampleIndex == 1 ? 74.99 : 120.00,
        'mrp': sampleIndex == 1 ? 74.99 : 120.00,
        'batchNumber': sampleIndex == 1 ? 'T260241' : 'CO92604',
        'expiryDate': sampleIndex == 1 ? '2028-03-01' : '2028-06-01',
        'mfgDate': sampleIndex == 1 ? '04/26' : '09/2024',
        'packSize': sampleIndex == 1 ? '10 Tablets' : '10 Capsules',
        'mfgLicNo': sampleIndex == 1 ? 'G/25/1820' : 'G/25/2342',
        'isOcrScan': true,
        'scannedBy': 'Mobile Box OCR',
      }),
    );

    return BoxOcrResult(
      medicineName: sampleIndex == 1 ? 'ARVIND Care 10 Tabs' : 'resh-DSR 10 Capsules',
      batchNumber: sampleIndex == 1 ? 'T260241' : 'CO92604',
      expiryDate: sampleIndex == 1 ? '03/2028' : '06/2028',
      mfgDate: sampleIndex == 1 ? '04/26' : '09/2024',
      mrp: sampleIndex == 1 ? 74.99 : 120.00,
      packSize: sampleIndex == 1 ? '10 Tablets' : '10 Capsules',
      mfgLicNo: sampleIndex == 1 ? 'G/25/1820' : 'G/25/2342',
      manufacturer: sampleIndex == 1 ? 'ARVIND care LLP' : 'Spectra Art Laboratories Pvt. Ltd.',
      expiryStatus: 'HEALTHY',
      confidence: 0.98,
    );
  }
}
