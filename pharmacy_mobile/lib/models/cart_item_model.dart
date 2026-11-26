import 'medicine_model.dart';

class CartItemModel {
  final MedicineModel medicine;
  int quantity;
  double discountPercent;
  bool isLooseTablet;

  CartItemModel({
    required this.medicine,
    this.quantity = 1,
    this.discountPercent = 0.0,
    this.isLooseTablet = false,
  });

  /// Extracts pack unit count from packSize (handles "1 x 10 Tablets", "10 tablets", "15 caps"), default 10
  int get packCount {
    if (medicine.packSize != null && medicine.packSize!.isNotEmpty) {
      final raw = medicine.packSize!;
      final multMatch = RegExp(r'(?:x|\*)\s*(\d+)', caseSensitive: false).firstMatch(raw);
      if (multMatch != null) {
        final parsed = int.tryParse(multMatch.group(1)!);
        if (parsed != null && parsed > 0) return parsed;
      }
      final unitMatch = RegExp(r'(\d+)\s*(?:tab|cap|unit|pcs|pc)', caseSensitive: false).firstMatch(raw);
      if (unitMatch != null) {
        final parsed = int.tryParse(unitMatch.group(1)!);
        if (parsed != null && parsed > 1) return parsed;
      }
      final matches = RegExp(r'\b(\d+)\b').allMatches(raw).toList();
      if (matches.isNotEmpty) {
        final parsed = int.tryParse(matches.last.group(1)!);
        if (parsed != null && parsed > 1) return parsed;
      }
    }
    return 10; // Standard Indian tablet strip packaging default
  }

  /// Single tablet unit price if loose tablet, else strip selling price
  double get unitPrice {
    if (isLooseTablet) {
      return double.parse((medicine.sellingPrice / packCount).toStringAsFixed(2));
    }
    return medicine.sellingPrice;
  }

  double get grossTotal => unitPrice * quantity;
  double get discountAmount => grossTotal * (discountPercent / 100);
  double get netTotal => grossTotal - discountAmount;

  double taxableAmount([double generalDiscountPercent = 0.0, bool isMrpInclusive = true]) {
    final netAfterGeneral = netTotal * (1 - (generalDiscountPercent / 100.0));
    if (isMrpInclusive) {
      return medicine.gstRate > 0 ? netAfterGeneral / (1.0 + medicine.gstRate / 100.0) : netAfterGeneral;
    }
    return netAfterGeneral;
  }

  double gstAmount([double generalDiscountPercent = 0.0, bool isMrpInclusive = true]) {
    final netAfterGeneral = netTotal * (1 - (generalDiscountPercent / 100.0));
    final taxable = taxableAmount(generalDiscountPercent, isMrpInclusive);
    if (isMrpInclusive) {
      return (netAfterGeneral - taxable).clamp(0.0, double.infinity);
    }
    return taxable * (medicine.gstRate / 100.0);
  }

  double cgstAmount([double generalDiscountPercent = 0.0, bool isMrpInclusive = true]) =>
      gstAmount(generalDiscountPercent, isMrpInclusive) / 2.0;

  double sgstAmount([double generalDiscountPercent = 0.0, bool isMrpInclusive = true]) =>
      gstAmount(generalDiscountPercent, isMrpInclusive) / 2.0;

  String get displayName {
    if (isLooseTablet) {
      return '${medicine.name} (Loose $quantity Tab${quantity > 1 ? 's' : ''})';
    }
    return medicine.name;
  }

  Map<String, dynamic> toJson([double generalDiscountPercent = 0.0, bool isMrpInclusive = true]) {
    final taxable = double.parse(taxableAmount(generalDiscountPercent, isMrpInclusive).toStringAsFixed(2));
    final cgst = double.parse(cgstAmount(generalDiscountPercent, isMrpInclusive).toStringAsFixed(2));
    final sgst = double.parse(sgstAmount(generalDiscountPercent, isMrpInclusive).toStringAsFixed(2));
    return {
      'medicine_id': medicine.id,
      'medicineId': medicine.id,
      'medicine_name': displayName,
      'medicineName': displayName,
      'is_loose_tablet': isLooseTablet,
      'isLooseTablet': isLooseTablet,
      'pack_size': medicine.packSize,
      'packSize': medicine.packSize,
      'pack_count': packCount,
      'packCount': packCount,
      'quantity': quantity,
      'unit_price': unitPrice,
      'unitPrice': unitPrice,
      'discount_percent': discountPercent,
      'discount_amount': discountAmount,
      'hsnCode': medicine.hsnCode,
      'gstRate': medicine.gstRate,
      'taxableAmount': taxable,
      'cgst': cgst,
      'sgst': sgst,
      'igst': 0.0,
      'total': netTotal,
      'barcode': medicine.barcode,
    };
  }
}
