class MedicineBatchModel {
  final String? id;
  final String batchNumber;
  final String? expiryDate;
  final int quantity;
  final double mrp;
  final double sellingPrice;
  final String? barcode;

  MedicineBatchModel({
    this.id,
    required this.batchNumber,
    this.expiryDate,
    required this.quantity,
    required this.mrp,
    required this.sellingPrice,
    this.barcode,
  });

  factory MedicineBatchModel.fromJson(Map<String, dynamic> json) {
    return MedicineBatchModel(
      id: json['id']?.toString(),
      batchNumber: json['batchNumber']?.toString() ?? json['batch_number']?.toString() ?? '',
      expiryDate: json['expiryDate']?.toString() ?? json['expiry_date']?.toString(),
      quantity: (json['availableQuantity'] is num)
          ? (json['availableQuantity'] as num).toInt()
          : (json['quantity'] is num)
              ? (json['quantity'] as num).toInt()
              : (int.tryParse(json['availableQuantity']?.toString() ?? json['quantity']?.toString() ?? '0') ?? 0),
      mrp: (json['mrp'] is num)
          ? (json['mrp'] as num).toDouble()
          : (double.tryParse(json['mrp']?.toString() ?? '0') ?? 0.0),
      sellingPrice: (json['sellingPrice'] is num)
          ? (json['sellingPrice'] as num).toDouble()
          : (json['selling_price'] is num)
              ? (json['selling_price'] as num).toDouble()
              : (double.tryParse(json['sellingPrice']?.toString() ?? json['selling_price']?.toString() ?? '0') ?? 0.0),
      barcode: json['barcode']?.toString(),
    );
  }
}

class MedicineModel {
  final String id;
  final int pharmacyId;
  final String name;
  final String? genericName;
  final String? manufacturer;
  final String? category;
  final String? sku;
  final String? batchNumber;
  final String? expiryDate;
  final double mrp;
  final double sellingPrice;
  final int stock;
  final int minStockAlert;
  final String? barcode;
  final String? storeBarcode;
  final List<MedicineBatchModel> batches;

  MedicineModel({
    required this.id,
    this.pharmacyId = 1,
    required this.name,
    this.genericName,
    this.manufacturer,
    this.category,
    this.sku,
    this.batchNumber,
    this.expiryDate,
    required this.mrp,
    required this.sellingPrice,
    required this.stock,
    this.minStockAlert = 10,
    this.barcode,
    this.storeBarcode,
    this.batches = const [],
  });

  bool get isLowStock => stock <= minStockAlert;
  bool get isOutOfStock => stock <= 0;

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    final idStr = json['id']?.toString() ?? '';
    final pharmId = (json['pharmacyId'] is num)
        ? (json['pharmacyId'] as num).toInt()
        : (json['pharmacy_id'] is num)
            ? (json['pharmacy_id'] as num).toInt()
            : int.tryParse(json['pharmacyId']?.toString() ?? json['pharmacy_id']?.toString() ?? '1') ?? 1;

    // Selling price resolution
    double parsedSellingPrice = 0.0;
    if (json['sellingPrice'] is num) {
      parsedSellingPrice = (json['sellingPrice'] as num).toDouble();
    } else if (json['selling_price'] is num) {
      parsedSellingPrice = (json['selling_price'] as num).toDouble();
    } else if (json['price'] is num) {
      parsedSellingPrice = (json['price'] as num).toDouble();
    } else {
      parsedSellingPrice = double.tryParse(
              json['sellingPrice']?.toString() ?? json['selling_price']?.toString() ?? json['price']?.toString() ?? '0') ??
          0.0;
    }

    // MRP resolution
    double parsedMrp = (json['mrp'] is num)
        ? (json['mrp'] as num).toDouble()
        : (double.tryParse(json['mrp']?.toString() ?? '0') ?? parsedSellingPrice);

    // Stock resolution
    int parsedStock = 0;
    if (json['currentStock'] is num) {
      parsedStock = (json['currentStock'] as num).toInt();
    } else if (json['current_stock'] is num) {
      parsedStock = (json['current_stock'] as num).toInt();
    } else if (json['stock'] is num) {
      parsedStock = (json['stock'] as num).toInt();
    } else {
      parsedStock = int.tryParse(
              json['currentStock']?.toString() ?? json['current_stock']?.toString() ?? json['stock']?.toString() ?? '0') ??
          0;
    }

    // Parse batches
    List<MedicineBatchModel> parsedBatches = [];
    final rawBatches = json['batches'];
    if (rawBatches is List) {
      for (final item in rawBatches) {
        if (item is Map<String, dynamic>) {
          parsedBatches.add(MedicineBatchModel.fromJson(item));
        }
      }
    }

    // Standard Store Barcode calculation (same algorithm as PC BarcodeStickerModal: 890 + 3-digit pharmacyId + 5-digit medicineId)
    final storeBarcodeCalc = idStr.isNotEmpty
        ? '890${pharmId.toString().padLeft(3, '0')}${idStr.padLeft(5, '0')}'
        : null;

    final primaryBarcode = json['barcode']?.toString() ?? storeBarcodeCalc;

    return MedicineModel(
      id: idStr,
      pharmacyId: pharmId,
      name: json['name'] ?? 'Unnamed Medicine',
      genericName: json['genericName'] ?? json['generic_name'],
      manufacturer: json['manufacturer'] ?? json['brand'],
      category: json['category'] ?? 'General',
      sku: json['sku']?.toString(),
      batchNumber: json['batchNumber'] ?? json['batch_number'] ?? (parsedBatches.isNotEmpty ? parsedBatches.first.batchNumber : null),
      expiryDate: json['expiryDate'] ?? json['expiry_date'] ?? (parsedBatches.isNotEmpty ? parsedBatches.first.expiryDate : null),
      mrp: parsedMrp,
      sellingPrice: parsedSellingPrice,
      stock: parsedStock,
      minStockAlert: (json['minimumStock'] is num)
          ? (json['minimumStock'] as num).toInt()
          : (json['minimum_stock'] is num)
              ? (json['minimum_stock'] as num).toInt()
              : 10,
      barcode: primaryBarcode,
      storeBarcode: storeBarcodeCalc,
      batches: parsedBatches,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'pharmacyId': pharmacyId,
      'name': name,
      'generic_name': genericName,
      'manufacturer': manufacturer,
      'category': category,
      'sku': sku,
      'batch_number': batchNumber,
      'expiry_date': expiryDate,
      'mrp': mrp,
      'sellingPrice': sellingPrice,
      'currentStock': stock,
      'barcode': barcode,
      'storeBarcode': storeBarcode,
    };
  }
}
