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
  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
  static String get staffLogin => '$baseUrl/auth/staff-login';
  static String get me => '$baseUrl/auth/me';

  // Medicines / Inventory
  static String get medicines => '$baseUrl/medicines';
  static String medicineById(String id) => '$baseUrl/medicines/$id';
  static String updateMedicine(String id) => '$baseUrl/medicines/$id';

  // Billing / POS
  static String get bills => '$baseUrl/billing';
  static String get createBill => '$baseUrl/billing';
  static String get liveScanItem => '$baseUrl/billing/live-scan';
  static String pendingScans(int pharmacyId) => '$baseUrl/billing/pending-scans/$pharmacyId';

  // Dashboard / Reports
  static String get dashboardSummary => '$baseUrl/reports/dashboard';

  // Refills & Prescriptions
  static String get refills => '$baseUrl/refills';
  static String get prescriptions => '$baseUrl/prescriptions';

  // Customers
  static String get customers => '$baseUrl/customers';
  static String customerById(int id) => '$baseUrl/customers/$id';

  // Suppliers & Purchases
  static String get suppliers => '$baseUrl/suppliers';
  static String supplierById(int id) => '$baseUrl/suppliers/$id';
  static String get purchases => '$baseUrl/purchases';

  // Reports
  static String salesReport(int pharmacyId) => '$baseUrl/reports/sales/$pharmacyId';
  static String customerReport(int pharmacyId) => '$baseUrl/reports/customers/$pharmacyId';

  // Pharma Sponsored Banners & Deals
  static String get sponsoredBanners => '$baseUrl/promotions/banners';
  static String trackBannerClick(int id) => '$baseUrl/promotions/banners/$id/click';
  static String trackBannerImpression(int id) => '$baseUrl/promotions/banners/$id/impression';
}
