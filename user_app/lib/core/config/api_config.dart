/// Centralized API Configuration
class ApiConfig {
  static String? _customUrl;

  static void setCustomUrl(String? url) {
    _customUrl = url;
  }

  /// Current backend URL.
  /// Can be overridden via --dart-define=API_URL=... or setCustomUrl(...)
  static String get baseUrl {
    if (_customUrl != null && _customUrl!.isNotEmpty) {
      return _customUrl!;
    }
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }
    return 'http://10.66.48.99:3000/api';
  }
}

