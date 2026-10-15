import '../services/storage_service.dart';

class ApiEndpoints {
  // Default URL: local computer Wi-Fi IP for physical mobile phone connection
  static const String _defaultUrl = 'http://10.66.48.99:3000/api';

  static String get baseUrl {
    final customUrl = StorageService.getBaseUrl();
    if (customUrl != null && customUrl.trim().isNotEmpty) {
      return customUrl.trim();
    }
    return _defaultUrl;
  }

  // Auth
  static String get login => '$baseUrl/auth/login';
  static String get me => '$baseUrl/auth/me';

  // Medicines / Inventory
  static String get medicines => '$baseUrl/medicines';
  static String medicineById(String id) => '$baseUrl/medicines/$id';

  // Billing / POS
  static String get bills => '$baseUrl/billing';
  static String get createBill => '$baseUrl/billing';

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
}
