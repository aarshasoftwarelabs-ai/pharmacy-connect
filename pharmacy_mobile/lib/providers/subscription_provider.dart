import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../models/subscription_model.dart';

class SubscriptionProvider extends ChangeNotifier {
  SubscriptionModel? _subscription;
  bool _isLoading = false;
  String? _errorMessage;

  SubscriptionModel? get subscription => _subscription;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  bool get isExpired => _subscription?.isExpired ?? false;
  bool get isExpiringSoon => _subscription?.isExpiringSoon ?? false;
  bool get canBill => _subscription?.canBill ?? true;
  int get daysRemaining => _subscription?.daysRemaining ?? 14;

  Future<void> fetchSubscription(int pharmacyId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.get(ApiEndpoints.subscriptionStatus(pharmacyId));
      if (response.success && response.data != null) {
        final Map<String, dynamic> data = response.data is Map
            ? Map<String, dynamic>.from(response.data as Map)
            : <String, dynamic>{};
        final Map<String, dynamic> payload = data['data'] is Map
            ? Map<String, dynamic>.from(data['data'] as Map)
            : data;
        _subscription = SubscriptionModel.fromJson(payload);
      } else {
        _subscription ??= SubscriptionModel.defaultFallback(pharmacyId, 'Store');
      }
    } catch (e) {
      debugPrint('Failed to load subscription status: $e');
      _subscription ??= SubscriptionModel.defaultFallback(pharmacyId, 'Store');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Map<String, dynamic>? _lastPaymentReceipt;
  List<Map<String, dynamic>> _paymentHistory = [];

  Map<String, dynamic>? get lastPaymentReceipt => _lastPaymentReceipt;
  List<Map<String, dynamic>> get paymentHistory => _paymentHistory;

  Future<void> fetchPaymentHistory(int pharmacyId) async {
    try {
      final response = await ApiService.get(ApiEndpoints.subscriptionPayments(pharmacyId));
      if (response.success && response.data is List) {
        _paymentHistory = List<Map<String, dynamic>>.from(
          (response.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to load payment history: $e');
    }
  }

  Future<bool> renewMobilePlan(
    int pharmacyId, {
    int durationMonths = 12,
    double amount = 1499.00,
    String paymentMethod = 'UPI',
    String? transactionId,
    String? upiId = 'lodaliya@ptyes',
    String? agentNote,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = {
        'planType': 'MOBILE_YEARLY',
        'durationMonths': durationMonths,
        'amount': amount,
        'paymentMethod': paymentMethod,
        'transactionId': transactionId ?? (paymentMethod == 'UPI' ? 'UPI-${DateTime.now().millisecondsSinceEpoch}' : 'CASH-${DateTime.now().millisecondsSinceEpoch}'),
        'upiId': upiId ?? 'lodaliya@ptyes',
        'agentNote': agentNote,
      };

      final response = await ApiService.post(
        ApiEndpoints.updateSubscription(pharmacyId),
        payload,
      );

      if (response.success) {
        if (response.data is Map && (response.data as Map)['payment'] != null) {
          _lastPaymentReceipt = Map<String, dynamic>.from((response.data as Map)['payment'] as Map);
        } else {
          _lastPaymentReceipt = {
            'receipt_number': 'DS-SUB-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
            'amount': amount,
            'payment_method': paymentMethod,
            'transaction_id': payload['transactionId'],
            'paid_at': DateTime.now().toIso8601String(),
          };
        }
        // Refetch fresh status with updated expiration date & payment history
        await fetchSubscription(pharmacyId);
        await fetchPaymentHistory(pharmacyId);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Failed to renew subscription.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error activating plan: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
