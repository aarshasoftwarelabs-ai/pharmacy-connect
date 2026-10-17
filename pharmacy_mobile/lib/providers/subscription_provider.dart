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

  Future<bool> renewMobilePlan(int pharmacyId, {int durationMonths = 12}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post(
        ApiEndpoints.updateSubscription(pharmacyId),
        {
          'planType': 'MOBILE_YEARLY',
          'durationMonths': durationMonths,
        },
      );

      if (response.success) {
        // Refetch fresh status with updated expiration date
        await fetchSubscription(pharmacyId);
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
