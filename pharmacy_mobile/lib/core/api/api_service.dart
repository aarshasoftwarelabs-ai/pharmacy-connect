import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/storage_service.dart';

class ApiResponse {
  final bool success;
  final dynamic data;
  final String? message;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    required this.statusCode,
  });
}

class ApiService {
  static Map<String, String> _headers() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    final token = StorageService.getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<ApiResponse> get(String url) async {
    try {
      final response = await http
          .get(Uri.parse(url), headers: _headers())
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        statusCode: 0,
      );
    }
  }

  static Future<ApiResponse> post(String url, Map<String, dynamic> body) async {
    try {
      final response = await http
          .post(
            Uri.parse(url),
            headers: _headers(),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        statusCode: 0,
      );
    }
  }

  static Future<ApiResponse> put(String url, Map<String, dynamic> body) async {
    try {
      final response = await http
          .put(
            Uri.parse(url),
            headers: _headers(),
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        statusCode: 0,
      );
    }
  }

  static Future<ApiResponse> delete(String url) async {
    try {
      final response = await http
          .delete(Uri.parse(url), headers: _headers())
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'Network error: $e',
        statusCode: 0,
      );
    }
  }

  static ApiResponse _processResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      body = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body is Map<String, dynamic>) {
        return ApiResponse(
          success: body['success'] ?? true,
          data: body['data'] ?? body,
          message: body['message'],
          statusCode: response.statusCode,
        );
      }
      return ApiResponse(
        success: true,
        data: body,
        statusCode: response.statusCode,
      );
    } else {
      String? errorMessage;
      if (body is Map<String, dynamic>) {
        errorMessage = body['message'] ?? body['error'] ?? 'Server error';
      } else {
        errorMessage = 'Request failed with code ${response.statusCode}';
      }
      return ApiResponse(
        success: false,
        message: errorMessage,
        statusCode: response.statusCode,
      );
    }
  }
}
