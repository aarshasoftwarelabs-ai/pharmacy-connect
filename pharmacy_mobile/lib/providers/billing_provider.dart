import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../models/cart_item_model.dart';
import '../models/medicine_model.dart';
import '../core/services/storage_service.dart';
import '../core/services/offline_sync_service.dart';

class BillingProvider extends ChangeNotifier {
  final List<CartItemModel> _cartItems = [];
  final List<Map<String, dynamic>> _recentBills = [];
  double _todaySales = 0.0;
  int _todayBillsCount = 0;
  double _yesterdaySales = 0.0;
  bool _isLoadingBills = false;

  String _customerName = '';
  String _customerPhone = '';
  String _doctorName = '';
  String _paymentMode = 'CASH'; // CASH, UPI, CARD, CREDIT
  double _generalDiscountPercent = 0.0;
  bool _isProcessing = false;
  String? _errorMessage;
  Map<String, dynamic>? _lastBill;

  List<CartItemModel> get cartItems => _cartItems;
  List<Map<String, dynamic>> get recentBills => _recentBills;
  Map<String, dynamic>? get lastBill => _lastBill;
  double get todaySales => _todaySales;
  int get todayBillsCount => _todayBillsCount;
  double get yesterdaySales => _yesterdaySales;
  bool get isLoadingBills => _isLoadingBills;
  String get customerName => _customerName;
  String get customerPhone => _customerPhone;
  String get doctorName => _doctorName;
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

  void setCustomerInfo({String? name, String? phone, String? doctorName}) {
    if (name != null) _customerName = name;
    if (phone != null) _customerPhone = phone;
    if (doctorName != null) _doctorName = doctorName;
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
      final int effectivePharmacyId = StorageService.getCurrentPharmacyId();
      if (effectivePharmacyId <= 0) return;

      final userData = StorageService.getUser();
      final String rawName = userData?['name']?.toString() ?? 'Counter Staff';
      final String rawRole = userData?['role']?.toString() ?? 'STAFF';
      final String scannedBy = '$rawName ($rawRole)';

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
        'scannedBy': scannedBy,
      };

      final response = await ApiService.post(ApiEndpoints.liveScanItem, payload);
      debugPrint('Live scan sync to PC [${medicine.name}] result: ${response.statusCode}');
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

  void toggleLooseTablet(String medicineId) {
    final index = _cartItems.indexWhere((item) => item.medicine.id == medicineId);
    if (index >= 0) {
      _cartItems[index].isLooseTablet = !_cartItems[index].isLooseTablet;
      notifyListeners();
    }
  }

  void clearCart() {
    _cartItems.clear();
    _customerName = '';
    _customerPhone = '';
    _doctorName = '';
    _generalDiscountPercent = 0.0;
    _paymentMode = 'CASH';
    _errorMessage = null;
    notifyListeners();
  }

  void clearSessionData() {
    clearCart();
    _recentBills.clear();
    _todaySales = 0.0;
    _todayBillsCount = 0;
    _yesterdaySales = 0.0;
    _lastBill = null;
    notifyListeners();
  }

  Future<bool> processCheckout() async {
    if (_cartItems.isEmpty) {
      _errorMessage = 'Cart is empty';
      notifyListeners();
      return false;
    }

    final int effectivePharmacyId = StorageService.getCurrentPharmacyId();
    if (effectivePharmacyId <= 0) {
      _errorMessage = 'Authenticated pharmacy store context required';
      notifyListeners();
      return false;
    }

    _isProcessing = true;
    _errorMessage = null;
    notifyListeners();

    final billPayload = {
      'pharmacy_id': effectivePharmacyId,
      'pharmacyId': effectivePharmacyId,
      'customer_name': _customerName.isEmpty ? 'Walk-in Customer' : _customerName,
      'customerName': _customerName.isEmpty ? 'Walk-in Customer' : _customerName,
      'customer_phone': _customerPhone,
      'customerPhone': _customerPhone,
      'doctor_name': _doctorName.trim().isEmpty ? null : _doctorName.trim(),
      'doctorName': _doctorName.trim().isEmpty ? null : _doctorName.trim(),
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

    try {
      final response = await ApiService.post(ApiEndpoints.createBill, billPayload);
      _isProcessing = false;

      if (response.success) {
        final serverData = response.data is Map ? Map<String, dynamic>.from(response.data as Map) : null;
        final billNum = serverData?['billNumber']?.toString() ??
            serverData?['bill_number']?.toString() ??
            'PC-${DateTime.now().year}-${(100000 + _recentBills.length + 1).toString().substring(1)}';
        final billRecord = {
          'id': serverData?['id'],
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
        _todaySales += grandTotal;
        _todayBillsCount += 1;
        clearCart();
        return true;
      } else if (response.statusCode == 0) {
        // Network unreachable / timeout: auto-queue offline for later sync
        debugPrint('[BillingProvider] Server unreachable (statusCode 0). Queuing bill offline.');
        final offlineItem = await OfflineSyncService.instance.queueBill(billPayload);
        final billNum = offlineItem['bill_number']?.toString() ?? 'OFFLINE-${DateTime.now().millisecondsSinceEpoch % 100000}';
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
          'is_offline': true,
        };
        _lastBill = billRecord;
        _recentBills.insert(0, billRecord);
        _todaySales += grandTotal;
        _todayBillsCount += 1;
        clearCart();
        notifyListeners();
        return true;
      } else {
        // Server rejected request (4xx/5xx): keep cart intact and surface error
        _errorMessage = response.message ?? 'Checkout failed (HTTP ${response.statusCode})';
        notifyListeners();
        return false;
      }
    } catch (e) {
      // Network failure or server unreachable: Auto-queue offline!
      debugPrint('[BillingProvider] Network unreachable during checkout. Queuing bill offline for auto-sync: $e');
      final offlineItem = await OfflineSyncService.instance.queueBill(billPayload);

      _isProcessing = false;
      final billNum = offlineItem['bill_number']?.toString() ?? 'OFFLINE-${DateTime.now().millisecondsSinceEpoch % 100000}';
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
        'is_offline': true,
      };
      _lastBill = billRecord;
      _recentBills.insert(0, billRecord);
      _todaySales += grandTotal;
      _todayBillsCount += 1;
      clearCart();
      notifyListeners();
      return true;
    }
  }

  /// Sync all pending offline bills to cloud database
  Future<int> syncOfflineQueue() async {
    final synced = await OfflineSyncService.instance.syncQueue();
    if (synced > 0) {
      await fetchBills();
    }
    return synced;
  }

  Future<void> fetchBills([int? pharmacyId]) async {
    final int effectivePharmacyId = pharmacyId ?? StorageService.getCurrentPharmacyId();
    if (effectivePharmacyId <= 0) {
      _recentBills.clear();
      _todaySales = 0.0;
      _todayBillsCount = 0;
      _yesterdaySales = 0.0;
      _isLoadingBills = false;
      notifyListeners();
      return;
    }

    _isLoadingBills = true;
    notifyListeners();

    try {
      final response = await ApiService.get(ApiEndpoints.pharmacyBills(effectivePharmacyId));
      if (response.success && response.data != null) {
        final List list = response.data is List ? response.data as List : [];
        final now = DateTime.now();
        final todayStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
        final yesterday = now.subtract(const Duration(days: 1));
        final yesterdayStr = '${yesterday.year}-${yesterday.month.toString().padLeft(2, '0')}-${yesterday.day.toString().padLeft(2, '0')}';

        double todayTotal = 0.0;
        int todayCount = 0;
        double yesterdayTotal = 0.0;

        final List<Map<String, dynamic>> parsedBills = [];

        for (final item in list) {
          if (item is Map) {
            final billMap = Map<String, dynamic>.from(item);
            final rawDate = billMap['createdAt']?.toString() ?? billMap['billDate']?.toString() ?? '';
            final total = double.tryParse(billMap['total']?.toString() ?? '0') ?? 0.0;
            final isCancelled = billMap['paymentStatus']?.toString().toUpperCase() == 'CANCELLED';

            if (!isCancelled) {
              DateTime? billDt;
              try {
                if (rawDate.isNotEmpty) {
                  billDt = DateTime.parse(rawDate).toLocal();
                }
              } catch (_) {}

              if (billDt != null) {
                if (billDt.year == now.year && billDt.month == now.month && billDt.day == now.day) {
                  todayTotal += total;
                  todayCount += 1;
                } else if (billDt.year == yesterday.year && billDt.month == yesterday.month && billDt.day == yesterday.day) {
                  yesterdayTotal += total;
                }
              } else {
                if (rawDate.startsWith(todayStr)) {
                  todayTotal += total;
                  todayCount += 1;
                } else if (rawDate.startsWith(yesterdayStr)) {
                  yesterdayTotal += total;
                }
              }
            }

            final itemsList = billMap['items'] is List ? (billMap['items'] as List) : [];
            final itemsSummary = itemsList.map((e) {
              if (e is Map) {
                return '• ${e['medicineName'] ?? e['medicine_name'] ?? 'Medicine'} x${e['quantity'] ?? 1}';
              }
              return '• Item';
            }).join('\n');

            parsedBills.add({
              'id': billMap['id'],
              'bill_number': billMap['billNumber']?.toString() ?? 'PC-${billMap['id']}',
              'customer_name': billMap['customerName']?.toString() ?? 'Walk-in Customer',
              'customer_phone': billMap['customerPhone']?.toString() ?? '',
              'items_count': itemsList.isNotEmpty ? itemsList.length : 1,
              'subtotal': double.tryParse(billMap['subtotal']?.toString() ?? '0') ?? total,
              'discount': double.tryParse(billMap['discount']?.toString() ?? '0') ?? 0.0,
              'total': total,
              'date': _formatBillDate(rawDate),
              'raw_date': rawDate,
              'payment_mode': billMap['billType']?.toString() ?? 'POS',
              'payment_status': billMap['paymentStatus']?.toString() ?? 'PAID',
              'items_summary': itemsSummary,
            });
          }
        }

        _recentBills.clear();
        _recentBills.addAll(parsedBills);
        _todaySales = todayTotal;
        _todayBillsCount = todayCount;
        _yesterdaySales = yesterdayTotal;
      }
    } catch (e) {
      debugPrint('Failed to load real bills: $e');
    } finally {
      _isLoadingBills = false;
      notifyListeners();
    }
  }

  static String _formatBillDate(String rawDate) {
    if (rawDate.isEmpty) return 'Recent';
    try {
      final dt = DateTime.parse(rawDate).toLocal();
      final now = DateTime.now();
      final timeStr = DateFormat('hh:mm a').format(dt);
      if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
        return 'Today, $timeStr';
      }
      final yesterday = now.subtract(const Duration(days: 1));
      if (dt.year == yesterday.year && dt.month == yesterday.month && dt.day == yesterday.day) {
        return 'Yesterday, $timeStr';
      }
      return DateFormat('dd MMM, hh:mm a').format(dt);
    } catch (_) {
      return rawDate;
    }
  }
}
