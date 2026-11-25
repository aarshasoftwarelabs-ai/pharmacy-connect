import '../services/storage_service.dart';

class ApiEndpoints {
  // Live Cloud Server URL (Production Cloud Backend on Render + Supabase AWS)
  static const String liveCloudUrl = 'https://pharmacy-backend-e210.onrender.com/api';
  static const String _defaultUrl = liveCloudUrl;

  static String get baseUrl {
    final customUrl = StorageService.getBaseUrl();
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      final trimmed = customUrl.trim();
      // If it's a private LAN IP (10.x, 192.168.x, localhost, 127.x) that cannot be reached outside LAN,
      // reset to live cloud so mobile users on 5G/LTE never get stuck with TimeoutException
      if (trimmed.contains('10.66.') ||
          trimmed.contains('192.168.') ||
          trimmed.contains('localhost') ||
          trimmed.contains('127.0.0.1')) {
        StorageService.setBaseUrl(liveCloudUrl);
        return liveCloudUrl;
      }
      return trimmed;
    }
    return _defaultUrl;
  }

  // Auth
  static String get checkMobile => '$baseUrl/auth/check-mobile';
  static String get verifyOtp => '$baseUrl/auth/verify-otp';
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
  static String get staffLogin => '$baseUrl/auth/staff-login';
  static String get lookupCounterUser => '$baseUrl/auth/lookup-counter-user';

  // Medicines / Inventory
  static String get medicines => '$baseUrl/medicines';
  static String get scheduleH1 => '$baseUrl/schedule-h1';
  static String updateMedicine(String id) => '$baseUrl/medicines/$id';

  // Billing / POS
  static String pharmacyBills(int pharmacyId) => '$baseUrl/billing/pharmacy/$pharmacyId';
  static String get createBill => '$baseUrl/billing';
  static String get liveScanItem => '$baseUrl/billing/live-scan';

  // Customers & Suppliers
  static String get customers => '$baseUrl/customers';
  static String get suppliers => '$baseUrl/suppliers';

  // Reports
  static String salesReport(int pharmacyId) => '$baseUrl/reports/sales/$pharmacyId';

  // Subscriptions & License
  static String subscriptionStatus(int pharmacyId) => '$baseUrl/pharmacies/$pharmacyId/subscription-status';
  static String updateSubscription(int pharmacyId) => '$baseUrl/pharmacies/$pharmacyId/subscription';
  static String subscriptionPayments(int pharmacyId) => '$baseUrl/pharmacies/$pharmacyId/subscription-payments';

  // Messaging Gateway & Automated Invoicing
  static String get messagingSettings => '$baseUrl/messaging/settings';
  static String get sendTestMessage => '$baseUrl/messaging/test';
  static String resendBillMessage(int billId) => '$baseUrl/billing/$billId/send-message';
}
