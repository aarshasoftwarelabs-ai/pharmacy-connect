import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../models/cart_item_model.dart';
import '../models/medicine_model.dart';
import '../core/services/storage_service.dart';

class BillingProvider extends ChangeNotifier {
  final List<CartItemModel> _cartItems = [];
  final List<Map<String, dynamic>> _recentBills = [
    {
      'bill_number': 'PC-2026-000001',
      'customer_name': 'Walk-in Customer',
      'items_count': 1,
      'total': 31.36,
      'date': '10/13/2026 at 09:49 AM',
      'payment_mode': 'POS',
    },
  ];
  String _customerName = '';
  String _customerPhone = '';
  String _paymentMode = 'CASH'; // CASH, UPI, CARD, CREDIT
  double _generalDiscountPercent = 0.0;
  bool _isProcessing = false;
  String? _errorMessage;
  Map<String, dynamic>? _lastBill;

  List<CartItemModel> get cartItems => _cartItems;
  List<Map<String, dynamic>> get recentBills => _recentBills;
  Map<String, dynamic>? get lastBill => _lastBill;
  String get customerName => _customerName;
  String get customerPhone => _customerPhone;
  String get paymentMode => _paymentMode;
  double get generalDiscountPercent => _generalDiscountPercent;
  bool get isProcessing => _isProcessing;
  String? get errorMessage => _errorMessage;

  int get itemCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal =>
      _cartItems.fold(0.0, (sum, item) => sum + item.grossTotal);

  double get itemDiscounts =>
      _cartItems.fold(0.0, (sum, item) => sum + item.discountAmount);

  double get generalDiscountAmount =>
      (subtotal - itemDiscounts) * (_generalDiscountPercent / 100);

  double get totalDiscount => itemDiscounts + generalDiscountAmount;

  double get taxAmount => (subtotal - totalDiscount) * 0.05; // 5% GST on medicines

  double get grandTotal => (subtotal - totalDiscount) + taxAmount;

  void setCustomerInfo({String? name, String? phone}) {
    if (name != null) _customerName = name;
    if (phone != null) _customerPhone = phone;
    notifyListeners();
  }

  void setPaymentMode(String mode) {
    _paymentMode = mode;
    notifyListeners();
  }

  void setGeneralDiscount(double percent) {
    _generalDiscountPercent = percent;
    notifyListeners();
  }

  void addToCart(MedicineModel medicine, {int quantity = 1}) {
    final index = _cartItems.indexWhere((item) => 
      item.medicine.id == medicine.id || 
      (medicine.barcode != null && medicine.barcode!.isNotEmpty && item.medicine.barcode == medicine.barcode) ||
      item.medicine.name.trim().toLowerCase() == medicine.name.trim().toLowerCase()
    );
    if (index >= 0) {
      _cartItems[index].quantity += quantity;
    } else {
      _cartItems.add(CartItemModel(medicine: medicine, quantity: quantity));
    }
    notifyListeners();

    // Auto-sync item to PC POS Counter in real-time
    syncScannedItemToPc(medicine, quantity: quantity);
  }

  Future<void> syncScannedItemToPc(MedicineModel medicine, {int quantity = 1}) async {
    try {
      final pharmacyData = StorageService.getPharmacy();
      final userData = StorageService.getUser();
      final int effectivePharmacyId = int.tryParse(pharmacyData?['id']?.toString() ?? '') ??
          int.tryParse(userData?['pharmacyId']?.toString() ?? '') ??
          int.tryParse(userData?['pharmacy_id']?.toString() ?? '') ??
          1;

      final String userName = userData?['name']?.toString() ?? 'Mobile App';

      final payload = {
        'pharmacy_id': effectivePharmacyId,
        'pharmacyId': effectivePharmacyId,
        'medicineName': medicine.name,
        'quantity': quantity,
        'unitPrice': medicine.sellingPrice,
        'barcode': medicine.barcode ?? '',
        'hsnCode': '30049099',
        'gstRate': 5.0,
        'mrp': medicine.mrp,
        'scannedBy': userName,
      };

      await ApiService.post(ApiEndpoints.liveScanItem, payload);
    } catch (e) {
      debugPrint('Live scan sync to PC error: $e');
    }
  }

  void updateQuantity(String medicineId, int newQuantity) {
    final index = _cartItems.indexWhere((item) => item.medicine.id == medicineId);
    if (index >= 0) {
      if (newQuantity <= 0) {
        _cartItems.removeAt(index);
      } else {
        _cartItems[index].quantity = newQuantity;
      }
      notifyListeners();
    }
  }

  void removeFromCart(String medicineId) {
    _cartItems.removeWhere((item) => item.medicine.id == medicineId);
    notifyListeners();
  }

  void clearCart() {
    _cartItems.clear();
    _customerName = '';
    _customerPhone = '';
    _generalDiscountPercent = 0.0;
    _paymentMode = 'CASH';
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> processCheckout() async {
    if (_cartItems.isEmpty) {
      _errorMessage = 'Cart is empty';
      notifyListeners();
      return false;
    }

    _isProcessing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final pharmacyData = StorageService.getPharmacy();
      final userData = StorageService.getUser();
      final int effectivePharmacyId = int.tryParse(pharmacyData?['id']?.toString() ?? '') ??
          int.tryParse(userData?['pharmacyId']?.toString() ?? '') ??
          int.tryParse(userData?['pharmacy_id']?.toString() ?? '') ??
          1;

      final billPayload = {
        'pharmacy_id': effectivePharmacyId,
        'pharmacyId': effectivePharmacyId,
        'customer_name': _customerName.isEmpty ? 'Walk-in Customer' : _customerName,
        'customerName': _customerName.isEmpty ? 'Walk-in Customer' : _customerName,
        'customer_phone': _customerPhone,
        'customerPhone': _customerPhone,
        'payment_method': _paymentMode,
        'paymentMethod': _paymentMode,
        'bill_type': 'OFFLINE',
        'billType': 'OFFLINE',
        'subtotal': subtotal,
        'discount': totalDiscount,
        'tax': taxAmount,
        'total': grandTotal,
        'items': _cartItems.map((item) => item.toJson()).toList(),
      };

      final response = await ApiService.post(ApiEndpoints.createBill, billPayload);
      _isProcessing = false;

      final billNum = 'PC-2026-${(100000 + _recentBills.length + 1).toString().substring(1)}';
      final billRecord = {
        'bill_number': billNum,
        'customer_name': _customerName.isEmpty ? 'Walk-in Customer' : _customerName,
        'customer_phone': _customerPhone,
        'items_count': itemCount,
        'subtotal': subtotal,
        'discount': totalDiscount,
        'tax': taxAmount,
        'total': grandTotal,
        'date': 'Today, ${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}',
        'payment_mode': _paymentMode,
        'items_summary': _cartItems.map((e) => '• ${e.medicine.name} x${e.quantity} = ₹${e.netTotal.toStringAsFixed(2)}').join('\n'),
      };
      _lastBill = billRecord;
      _recentBills.insert(0, billRecord);

      if (response.success) {
        clearCart();
        return true;
      } else {
        _errorMessage = response.message;
        clearCart();
        return true;
      }
    } catch (e) {
      _isProcessing = false;
      _errorMessage = 'Checkout failed: $e';
      notifyListeners();
      return false;
    }
  }
}
