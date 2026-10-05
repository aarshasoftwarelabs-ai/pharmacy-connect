/// Centralized API Configuration
class ApiConfig {
  /// Development backend URL. 
  /// 10.0.2.2 is used for Android emulator to access host localhost.
  /// Note: For physical devices, replace with your PC's local IP (e.g., 192.168.x.x:3000)
  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Local IP for Android Emulator

  /// Temporary development user ID since authentication is not implemented yet.
  /// Real authenticated user identity will replace this later.
  static const int devUserId = 1;
}
