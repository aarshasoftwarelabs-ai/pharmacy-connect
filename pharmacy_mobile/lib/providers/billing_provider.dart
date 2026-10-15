import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../models/cart_item_model.dart';
import '../models/medicine_model.dart';

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

  void addToCart(MedicineModel medicine) {
    final index = _cartItems.indexWhere((item) => item.medicine.id == medicine.id);
    if (index >= 0) {
      if (_cartItems[index].quantity < medicine.stock) {
        _cartItems[index].quantity++;
      }
    } else {
      _cartItems.add(CartItemModel(medicine: medicine, quantity: 1));
    }
    notifyListeners();
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
      final billPayload = {
        'customer_name': _customerName.isEmpty ? 'Walk-in Customer' : _customerName,
        'customer_phone': _customerPhone,
        'payment_method': _paymentMode,
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
