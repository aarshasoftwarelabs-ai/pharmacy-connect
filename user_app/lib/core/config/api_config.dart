/// Centralized API Configuration
class ApiConfig {
  /// Production backend URL. 
  /// Can be overridden during build using --dart-define=API_URL=https://api.davasetu.com/api
  static const String baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.152.62.99:3000/api');
}
