import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/storage_service.dart';

import 'api_endpoints.dart';

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
  static const Duration _timeout = Duration(seconds: 35);

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

  static String _cleanErrorMessage(dynamic e) {
    final str = e.toString().toLowerCase();
    if (str.contains('timeoutexception') ||
        str.contains('future not completed') ||
        str.contains('timed out')) {
      return 'Cloud server is waking up or connection is slow. Please tap Reload to try again.';
    }
    if (str.contains('socketexception') ||
        str.contains('connection refused') ||
        str.contains('failed host lookup') ||
        str.contains('network is unreachable')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    return 'Connection issue: $e';
  }

  static Future<ApiResponse> get(String url) async {
    try {
      final response = await http
          .get(Uri.parse(url), headers: _headers())
          .timeout(_timeout);
      return _processResponse(response);
    } catch (e) {
      // Auto-fallback: if request was on an unreachable LAN IP, try live cloud URL
      if (!url.startsWith(ApiEndpoints.liveCloudUrl) && url.contains('/api/')) {
        try {
          final cloudUrl = url.replaceRange(
            0,
            url.indexOf('/api/') + 5,
            '${ApiEndpoints.liveCloudUrl}/',
          );
          final response = await http
              .get(Uri.parse(cloudUrl), headers: _headers())
              .timeout(_timeout);
          if (response.statusCode >= 200 && response.statusCode < 400) {
            await StorageService.setBaseUrl(ApiEndpoints.liveCloudUrl);
            return _processResponse(response);
          }
        } catch (_) {}
      }

      return ApiResponse(
        success: false,
        message: _cleanErrorMessage(e),
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
          .timeout(_timeout);
      return _processResponse(response);
    } catch (e) {
      if (!url.startsWith(ApiEndpoints.liveCloudUrl) && url.contains('/api/')) {
        try {
          final cloudUrl = url.replaceRange(
            0,
            url.indexOf('/api/') + 5,
            '${ApiEndpoints.liveCloudUrl}/',
          );
          final response = await http
              .post(
                Uri.parse(cloudUrl),
                headers: _headers(),
                body: jsonEncode(body),
              )
              .timeout(_timeout);
          if (response.statusCode >= 200 && response.statusCode < 400) {
            await StorageService.setBaseUrl(ApiEndpoints.liveCloudUrl);
            return _processResponse(response);
          }
        } catch (_) {}
      }

      return ApiResponse(
        success: false,
        message: _cleanErrorMessage(e),
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
          .timeout(_timeout);
      return _processResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _cleanErrorMessage(e),
        statusCode: 0,
      );
    }
  }

  static Future<ApiResponse> delete(String url) async {
    try {
      final response = await http
          .delete(Uri.parse(url), headers: _headers())
          .timeout(_timeout);
      return _processResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: _cleanErrorMessage(e),
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
