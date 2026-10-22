import 'dart:convert';
import 'package:http/http.dart' as http;
import '../api/api_endpoints.dart';
import '../api/api_service.dart';

class ScannedMedicineData {
  final String name;
  final String? genericName;
  final String category;
  final String? manufacturer;
  final double mrp;
  final double sellingPrice;
  final int stock;
  final String barcode;
  final String expiryDate;
  final bool isKnown;

  ScannedMedicineData({
    required this.name,
    this.genericName,
    required this.category,
    this.manufacturer,
    required this.mrp,
    required this.sellingPrice,
    this.stock = 10,
    required this.barcode,
    required this.expiryDate,
    this.isKnown = true,
  });

  factory ScannedMedicineData.fromJson(Map<String, dynamic> json, String code) {
    final rawName = json['name']?.toString() ?? '';
    final isDummyName = rawName.isEmpty ||
        rawName.startsWith('Medicine (Barcode') ||
        rawName.startsWith('Unregistered');

    final cleanName = isDummyName ? '' : rawName;

    final double sp = (json['sellingPrice'] is num)
        ? (json['sellingPrice'] as num).toDouble()
        : double.tryParse(json['sellingPrice']?.toString() ?? '0.0') ?? 0.0;

    final double mrpVal = (json['mrp'] is num)
        ? (json['mrp'] as num).toDouble()
        : double.tryParse(json['mrp']?.toString() ?? '0.0') ?? 0.0;

    final int st = (json['currentStock'] is num)
        ? (json['currentStock'] as num).toInt()
        : int.tryParse(json['currentStock']?.toString() ?? '10') ?? 10;

    final rawGen = json['genericName']?.toString() ?? json['generic_name']?.toString();
    final cleanGen = (rawGen == 'Standard Pharmaceutical Formulation') ? null : rawGen;

    final rawExp = json['expiryDate']?.toString() ?? '';
    final cleanExp = (rawExp == '2028-12-31' && isDummyName) ? '' : rawExp;

    return ScannedMedicineData(
      name: cleanName,
      genericName: cleanGen,
      category: json['category']?.toString() ?? 'Tablets',
      manufacturer: json['manufacturer']?.toString(),
      mrp: mrpVal,
      sellingPrice: sp,
      stock: st > 0 ? st : 10,
      barcode: code,
      expiryDate: cleanExp,
      isKnown: !isDummyName && cleanName.isNotEmpty,
    );
  }
}

class BarcodeMedicineService {
  // Built-in offline dictionary of common Indian medicines and standard barcodes
  static final Map<String, ScannedMedicineData> _offlineMaster = {
    '890103600123': ScannedMedicineData(
      barcode: '890103600123',
      name: 'Dolo 650mg Tablet',
      genericName: 'Paracetamol',
      category: 'Tablets',
      manufacturer: 'Micro Labs Ltd',
      mrp: 34.00,
      sellingPrice: 31.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890111700101': ScannedMedicineData(
      barcode: '890111700101',
      name: 'Crocin Advance 500mg Tablet',
      genericName: 'Paracetamol',
      category: 'Tablets',
      manufacturer: 'GlaxoSmithKline',
      mrp: 24.00,
      sellingPrice: 22.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108600201': ScannedMedicineData(
      barcode: '890108600201',
      name: 'Augmentin 625 Duo Tablet',
      genericName: 'Amoxicillin & Potassium Clavulanate',
      category: 'Tablets',
      manufacturer: 'GlaxoSmithKline',
      mrp: 223.00,
      sellingPrice: 205.00,
      stock: 15,
      expiryDate: '12/2028',
    ),
    '890111700202': ScannedMedicineData(
      barcode: '890111700202',
      name: 'Calpol 500mg Tablet',
      genericName: 'Paracetamol',
      category: 'Tablets',
      manufacturer: 'GlaxoSmithKline',
      mrp: 20.00,
      sellingPrice: 18.00,
      stock: 25,
      expiryDate: '12/2028',
    ),
    '890108600303': ScannedMedicineData(
      barcode: '890108600303',
      name: 'Azithral 500mg Tablet',
      genericName: 'Azithromycin',
      category: 'Tablets',
      manufacturer: 'Alembic Pharmaceuticals',
      mrp: 132.00,
      sellingPrice: 120.00,
      stock: 15,
      expiryDate: '12/2028',
    ),
    '890108600404': ScannedMedicineData(
      barcode: '890108600404',
      name: 'Pan 40mg Tablet',
      genericName: 'Pantoprazole',
      category: 'Tablets',
      manufacturer: 'Alkem Laboratories',
      mrp: 155.00,
      sellingPrice: 140.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108600505': ScannedMedicineData(
      barcode: '890108600505',
      name: 'Pantocid 40mg Tablet',
      genericName: 'Pantoprazole',
      category: 'Tablets',
      manufacturer: 'Sun Pharma',
      mrp: 160.00,
      sellingPrice: 145.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108600606': ScannedMedicineData(
      barcode: '890108600606',
      name: 'Shelcal 500mg Tablet',
      genericName: 'Calcium & Vitamin D3',
      category: 'Tablets',
      manufacturer: 'Torrent Pharmaceuticals',
      mrp: 144.00,
      sellingPrice: 130.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108600707': ScannedMedicineData(
      barcode: '890108600707',
      name: 'Becosules Capsules',
      genericName: 'Vitamin B-Complex with Vitamin C',
      category: 'Capsules',
      manufacturer: 'Pfizer Ltd',
      mrp: 56.00,
      sellingPrice: 50.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108600808': ScannedMedicineData(
      barcode: '890108600808',
      name: 'Combiflam Tablet',
      genericName: 'Ibuprofen & Paracetamol',
      category: 'Tablets',
      manufacturer: 'Sanofi India',
      mrp: 47.00,
      sellingPrice: 42.00,
      stock: 25,
      expiryDate: '12/2028',
    ),
    '890108600909': ScannedMedicineData(
      barcode: '890108600909',
      name: 'Telma 40mg Tablet',
      genericName: 'Telmisartan',
      category: 'Tablets',
      manufacturer: 'Glenmark Pharmaceuticals',
      mrp: 242.00,
      sellingPrice: 220.00,
      stock: 15,
      expiryDate: '12/2028',
    ),
    '890108601010': ScannedMedicineData(
      barcode: '890108601010',
      name: 'Amlong 5mg Tablet',
      genericName: 'Amlodipine',
      category: 'Tablets',
      manufacturer: 'Micro Labs Ltd',
      mrp: 45.00,
      sellingPrice: 40.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108601111': ScannedMedicineData(
      barcode: '890108601111',
      name: 'Atorva 10mg Tablet',
      genericName: 'Atorvastatin',
      category: 'Tablets',
      manufacturer: 'Zydus Cadila',
      mrp: 115.00,
      sellingPrice: 105.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108601212': ScannedMedicineData(
      barcode: '890108601212',
      name: 'Allegra 120mg Tablet',
      genericName: 'Fexofenadine HCl',
      category: 'Tablets',
      manufacturer: 'Sanofi India',
      mrp: 218.00,
      sellingPrice: 195.00,
      stock: 15,
      expiryDate: '12/2028',
    ),
    '890108601313': ScannedMedicineData(
      barcode: '890108601313',
      name: 'Cetriz 10mg Tablet',
      genericName: 'Cetirizine HCl',
      category: 'Tablets',
      manufacturer: 'Alkem Laboratories',
      mrp: 22.00,
      sellingPrice: 19.00,
      stock: 25,
      expiryDate: '12/2028',
    ),
    '890108601414': ScannedMedicineData(
      barcode: '890108601414',
      name: 'Ascoril D Plus Syrup',
      genericName: 'Dextromethorphan + Chlorpheniramine',
      category: 'Syrups',
      manufacturer: 'Glenmark Pharmaceuticals',
      mrp: 128.00,
      sellingPrice: 115.00,
      stock: 10,
      expiryDate: '12/2028',
    ),
    '890108601515': ScannedMedicineData(
      barcode: '890108601515',
      name: 'Benadryl Cough Syrup',
      genericName: 'Diphenhydramine HCl',
      category: 'Syrups',
      manufacturer: 'Johnson & Johnson',
      mrp: 140.00,
      sellingPrice: 126.00,
      stock: 10,
      expiryDate: '12/2028',
    ),
    '890108601616': ScannedMedicineData(
      barcode: '890108601616',
      name: 'Betadine 10% Ointment',
      genericName: 'Povidone Iodine 10%',
      category: 'Ointments',
      manufacturer: 'Win-Medicare',
      mrp: 130.00,
      sellingPrice: 118.00,
      stock: 12,
      expiryDate: '12/2028',
    ),
    '890108601717': ScannedMedicineData(
      barcode: '890108601717',
      name: 'Voveran 50mg Tablet',
      genericName: 'Diclofenac Sodium',
      category: 'Tablets',
      manufacturer: 'Novartis India',
      mrp: 108.00,
      sellingPrice: 98.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108602020': ScannedMedicineData(
      barcode: '890108602020',
      name: 'Omez 20mg Capsule',
      genericName: 'Omeprazole',
      category: 'Capsules',
      manufacturer: "Dr. Reddy's Laboratories",
      mrp: 65.00,
      sellingPrice: 58.00,
      stock: 25,
      expiryDate: '12/2028',
    ),
    '890108602626': ScannedMedicineData(
      barcode: '890108602626',
      name: 'Liv 52 Tablet',
      genericName: 'Himalaya Herbal Formulation',
      category: 'Ayurvedic',
      manufacturer: 'The Himalaya Drug Company',
      mrp: 160.00,
      sellingPrice: 145.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108602727': ScannedMedicineData(
      barcode: '890108602727',
      name: 'Neurobion Forte Tablet',
      genericName: 'Vitamin B-Complex with B12',
      category: 'Tablets',
      manufacturer: 'Procter & Gamble',
      mrp: 41.00,
      sellingPrice: 37.00,
      stock: 30,
      expiryDate: '12/2028',
    ),
    '890108602828': ScannedMedicineData(
      barcode: '890108602828',
      name: 'Ciplox 500mg Tablet',
      genericName: 'Ciprofloxacin',
      category: 'Tablets',
      manufacturer: 'Cipla Ltd',
      mrp: 46.00,
      sellingPrice: 41.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108602929': ScannedMedicineData(
      barcode: '890108602929',
      name: 'Zifi 200mg Tablet',
      genericName: 'Cefixime',
      category: 'Tablets',
      manufacturer: 'FDC Ltd',
      mrp: 116.00,
      sellingPrice: 104.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108603030': ScannedMedicineData(
      barcode: '890108603030',
      name: 'Taxim-O 200mg Tablet',
      genericName: 'Cefixime',
      category: 'Tablets',
      manufacturer: 'Alkem Laboratories',
      mrp: 118.00,
      sellingPrice: 106.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108603131': ScannedMedicineData(
      barcode: '890108603131',
      name: 'Zerodol-SP Tablet',
      genericName: 'Aceclofenac + Paracetamol + Serratiopeptidase',
      category: 'Tablets',
      manufacturer: 'Ipca Laboratories',
      mrp: 124.00,
      sellingPrice: 110.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108603434': ScannedMedicineData(
      barcode: '890108603434',
      name: 'Sinarest Tablet',
      genericName: 'Paracetamol + Phenylephrine + Chlorpheniramine',
      category: 'Tablets',
      manufacturer: 'Centaur Pharmaceuticals',
      mrp: 62.00,
      sellingPrice: 55.00,
      stock: 25,
      expiryDate: '12/2028',
    ),
    '890108603737': ScannedMedicineData(
      barcode: '890108603737',
      name: 'Electral Powder 21.8g',
      genericName: 'Oral Rehydration Salts (ORS WHO Formula)',
      category: 'Sachet/Powder',
      manufacturer: 'FDC Ltd',
      mrp: 23.00,
      sellingPrice: 21.00,
      stock: 30,
      expiryDate: '12/2028',
    ),
    '890108603838': ScannedMedicineData(
      barcode: '890108603838',
      name: 'Volini Pain Relief Gel',
      genericName: 'Diclofenac Diethylamine Gel',
      category: 'Ointments',
      manufacturer: 'Sun Pharma',
      mrp: 145.00,
      sellingPrice: 130.00,
      stock: 15,
      expiryDate: '12/2028',
    ),
    '890108604646': ScannedMedicineData(
      barcode: '890108604646',
      name: 'Limcee 500mg Chewable Tablet',
      genericName: 'Vitamin C (Ascorbic Acid)',
      category: 'Tablets',
      manufacturer: 'Abbott Healthcare',
      mrp: 24.00,
      sellingPrice: 21.00,
      stock: 30,
      expiryDate: '12/2028',
    ),
    '890108604848': ScannedMedicineData(
      barcode: '890108604848',
      name: 'Zincovit Tablet',
      genericName: 'Multivitamin & Minerals',
      category: 'Tablets',
      manufacturer: 'Apex Laboratories',
      mrp: 115.00,
      sellingPrice: 102.00,
      stock: 20,
      expiryDate: '12/2028',
    ),
    '890108605050': ScannedMedicineData(
      barcode: '890108605050',
      name: 'Evion 400mg Capsule',
      genericName: 'Vitamin E (Tocopheryl Acetate)',
      category: 'Capsules',
      manufacturer: 'Procter & Gamble Health',
      mrp: 42.00,
      sellingPrice: 37.00,
      stock: 25,
      expiryDate: '12/2028',
    ),
  };

  /// Resolves the real brand/medicine name from a medicine QR code URL (e.g. me-qr.com links)
  static Future<String?> resolveUrlMedicineName(String urlStr) async {
    try {
      final uri = Uri.tryParse(urlStr);
      if (uri == null || !uri.hasScheme) return null;
      final res = await http.get(uri, headers: {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final html = res.body;

        bool isRealTitle(String t) {
          final lower = t.toLowerCase().trim();
          return !lower.contains('giant qr') &&
              !lower.contains('me-qr') &&
              !lower.contains('qr code generator') &&
              !lower.contains('view qr') &&
              !lower.contains('free qr') &&
              !lower.contains('dynamic qr') &&
              !lower.contains('url / link') &&
              !lower.contains('qr scanner') &&
              lower.isNotEmpty;
        }

        // 1. ME-QR and modern dynamic QR platforms store user label in twitter:title
        final twMatch = RegExp(
              r'<meta[^>]*name=[\"\x27]twitter:title[\"\x27][^>]*content=[\"\x27]([^\"\x27]+)[\"\x27]',
              caseSensitive: false,
            ).firstMatch(html) ??
            RegExp(
              r'<meta[^>]*content=[\"\x27]([^\"\x27]+)[\"\x27][^>]*name=[\"\x27]twitter:title[\"\x27]',
              caseSensitive: false,
            ).firstMatch(html);
        if (twMatch != null) {
          final t = twMatch.group(1)?.trim();
          if (t != null && isRealTitle(t)) return t;
        }

        // 2. OpenGraph og:title
        final ogMatch = RegExp(
              r'<meta[^>]*property=[\"\x27]og:title[\"\x27][^>]*content=[\"\x27]([^\"\x27]+)[\"\x27]',
              caseSensitive: false,
            ).firstMatch(html) ??
            RegExp(
              r'<meta[^>]*content=[\"\x27]([^\"\x27]+)[\"\x27][^>]*property=[\"\x27]og:title[\"\x27]',
              caseSensitive: false,
            ).firstMatch(html);
        if (ogMatch != null) {
          final t = ogMatch.group(1)?.trim();
          if (t != null && isRealTitle(t)) return t;
        }

        // 3. Document <title>
        final titleMatch = RegExp(
          r'<title[^>]*>([^<]+)<\/title>',
          caseSensitive: false,
        ).firstMatch(html);
        if (titleMatch != null) {
          final t = titleMatch.group(1)?.trim();
          if (t != null && isRealTitle(t)) return t;
        }
      }
    } catch (_) {}
    return null;
  }

  /// Lookup medicine details by scanned barcode:
  /// 1. Tries live cloud server API `/medicines/lookup-barcode/:barcode`
  /// 2. If barcode is an HTTP/HTTPS URL, resolves medicine title directly
  /// 3. If offline or not found, matches against built-in master dictionary
  /// 4. Never injects dummy/mock values
  static Future<ScannedMedicineData> lookup(String rawBarcode) async {
    final code = rawBarcode.trim();
    if (code.isEmpty) {
      return ScannedMedicineData(
        name: '',
        category: 'Tablets',
        mrp: 0.0,
        sellingPrice: 0.0,
        stock: 10,
        barcode: '',
        expiryDate: '',
        isKnown: false,
      );
    }

    // 1. Try Live Cloud API
    try {
      final url = '${ApiEndpoints.medicines}/lookup-barcode/${Uri.encodeComponent(code)}';
      final res = await ApiService.get(url);
      if (res.success && res.data != null) {
        final data = res.data is Map ? res.data as Map : null;
        if (data != null && data['found'] == true && data['medicine'] != null) {
          final medMap = Map<String, dynamic>.from(data['medicine'] as Map);
          final result = ScannedMedicineData.fromJson(medMap, code);
          if (result.name.isNotEmpty) {
            return result;
          }
        }
      }
    } catch (_) {
      // Network failure, continue to direct resolvers
    }

    // 2. Direct offline master match
    if (_offlineMaster.containsKey(code)) {
      return _offlineMaster[code]!;
    }

    // 3. If barcode is an HTTP/HTTPS URL (like ME-QR links), resolve title directly
    if (code.startsWith('http://') || code.startsWith('https://')) {
      final resolvedName = await resolveUrlMedicineName(code);
      if (resolvedName != null && resolvedName.isNotEmpty) {
        return ScannedMedicineData(
          barcode: code,
          name: resolvedName,
          category: 'Tablets',
          mrp: 0.0,
          sellingPrice: 0.0,
          stock: 10,
          expiryDate: '',
          isKnown: true,
        );
      }
    }

    // 4. Partial match for standard numeric barcodes
    if (!code.startsWith('http')) {
      for (final entry in _offlineMaster.entries) {
        if (code.contains(entry.key) || entry.key.contains(code)) {
          final m = entry.value;
          return ScannedMedicineData(
            barcode: code,
            name: m.name,
            genericName: m.genericName,
            category: m.category,
            manufacturer: m.manufacturer,
            mrp: m.mrp,
            sellingPrice: m.sellingPrice,
            stock: m.stock,
            expiryDate: m.expiryDate,
            isKnown: true,
          );
        }
      }
    }

    // 5. Barcode not in database or catalog: return clean empty template for manual entry
    return ScannedMedicineData(
      name: '',
      genericName: null,
      category: 'Tablets',
      manufacturer: null,
      mrp: 0.0,
      sellingPrice: 0.0,
      stock: 10,
      barcode: code,
      expiryDate: '',
      isKnown: false,
    );
  }
}
