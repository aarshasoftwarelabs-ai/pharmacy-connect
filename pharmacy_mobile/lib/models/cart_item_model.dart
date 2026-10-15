import 'medicine_model.dart';

class CartItemModel {
  final MedicineModel medicine;
  int quantity;
  double discountPercent;

  CartItemModel({
    required this.medicine,
    this.quantity = 1,
    this.discountPercent = 0.0,
  });

  double get unitPrice => medicine.sellingPrice;
  double get grossTotal => unitPrice * quantity;
  double get discountAmount => grossTotal * (discountPercent / 100);
  double get netTotal => grossTotal - discountAmount;

  Map<String, dynamic> toJson() {
    return {
      'medicine_id': medicine.id,
      'medicine_name': medicine.name,
      'quantity': quantity,
      'unit_price': unitPrice,
      'discount_percent': discountPercent,
      'discount_amount': discountAmount,
      'total': netTotal,
    };
  }
}
