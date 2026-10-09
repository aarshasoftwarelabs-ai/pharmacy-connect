import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/api_config.dart';

class AuthService {
  // Send OTP
  Future<Map<String, dynamic>> sendOtp({String? email, String? phone}) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/user/auth/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          if (email != null && email.isNotEmpty) 'email': email,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        }),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      return _handleException(e);
    }
  }

  // Verify OTP
  Future<Map<String, dynamic>> verifyOtp({
    String? email,
    String? phone,
    required String otp,
    String? name,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/user/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          if (email != null && email.isNotEmpty) 'email': email,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          'otp': otp,
          if (name != null && name.isNotEmpty) 'name': name,
        }),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(response.body);
    } catch (e) {
      return _handleException(e);
    }
  }
  
  Map<String, dynamic> _handleException(dynamic e) {
    String errorMessage = 'An unexpected error occurred. Please try again later.';
    final errorString = e.toString();
    
    if (errorString.contains('SocketException') || errorString.contains('Failed host lookup')) {
      errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else if (errorString.contains('TimeoutException')) {
      errorMessage = 'Connection timed out. Please try again.';
    }
    
    return {'success': false, 'message': errorMessage};
  }
}
