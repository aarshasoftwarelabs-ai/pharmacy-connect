class MedicineModel {
  final String id;
  final String name;
  final String? genericName;
  final String? manufacturer;
  final String? category;
  final String? batchNumber;
  final String? expiryDate;
  final double mrp;
  final double sellingPrice;
  final int stock;
  final int minStockAlert;
  final String? barcode;

  MedicineModel({
    required this.id,
    required this.name,
    this.genericName,
    this.manufacturer,
    this.category,
    this.batchNumber,
    this.expiryDate,
    required this.mrp,
    required this.sellingPrice,
    required this.stock,
    this.minStockAlert = 10,
    this.barcode,
  });

  bool get isLowStock => stock <= minStockAlert;
  bool get isOutOfStock => stock <= 0;

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    return MedicineModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Unnamed Medicine',
      genericName: json['generic_name'] ?? json['genericName'],
      manufacturer: json['manufacturer'] ?? json['brand'],
      category: json['category'] ?? 'General',
      batchNumber: json['batch_number'] ?? json['batchNumber'] ?? 'B101',
      expiryDate: json['expiry_date'] ?? json['expiryDate'],
      mrp: (json['mrp'] is num) ? (json['mrp'] as num).toDouble() : (double.tryParse(json['mrp']?.toString() ?? '0') ?? 0.0),
      sellingPrice: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : (json['selling_price'] is num)
              ? (json['selling_price'] as num).toDouble()
              : (double.tryParse(json['price']?.toString() ?? '0') ?? 0.0),
      stock: (json['stock'] is num) ? (json['stock'] as num).toInt() : (int.tryParse(json['stock']?.toString() ?? '0') ?? 0),
      minStockAlert: (json['min_stock_alert'] is num) ? (json['min_stock_alert'] as num).toInt() : 10,
      barcode: json['barcode']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'generic_name': genericName,
      'manufacturer': manufacturer,
      'category': category,
      'batch_number': batchNumber,
      'expiry_date': expiryDate,
      'mrp': mrp,
      'price': sellingPrice,
      'stock': stock,
      'barcode': barcode,
    };
  }
}
