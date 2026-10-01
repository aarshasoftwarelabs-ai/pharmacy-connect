import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/api_config.dart';
import '../features/medicines/models/medicine_request.dart';

class MedicineRequestService {
  
  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<int?> _getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('user_id');
  }

  /// Create a new medicine request
  static Future<MedicineRequest> createMedicineRequest({
    required int pharmacyId,
    String? medicineName,
    String? imageReference,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/medicine-requests');
    final userId = await _getUserId();
    
    if (userId == null) throw Exception('User not logged in');

    final body = {
      'userId': userId,
      'pharmacyId': pharmacyId,
      'medicineName': medicineName,
      'imageReference': imageReference,
    };

    final headers = await _getHeaders();

    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        return MedicineRequest.fromJson(jsonResponse['data']);
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      final jsonResponse = jsonDecode(response.body);
      throw Exception(jsonResponse['message'] ?? 'Unable to connect to PharmacyConnect. Please check your internet or try again.');
    }
  }

  /// Get all medicine requests for the current user
  static Future<List<MedicineRequest>> getUserMedicineRequests() async {
    final userId = await _getUserId();
    if (userId == null) throw Exception('User not logged in');

    final url = Uri.parse('${ApiConfig.baseUrl}/medicine-requests/user/$userId');
    final headers = await _getHeaders();

    final response = await http.get(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        final List<dynamic> data = jsonResponse['data'];
        return data.map((json) => MedicineRequest.fromJson(json)).toList();
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      throw Exception('Unable to load your requests.');
    }
  }

  /// Get a single request by ID
  static Future<MedicineRequest> getMedicineRequestById(int requestId) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/medicine-requests/$requestId');
    final headers = await _getHeaders();

    final response = await http.get(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        return MedicineRequest.fromJson(jsonResponse['data']);
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      final jsonResponse = jsonDecode(response.body);
      throw Exception(jsonResponse['message'] ?? 'Unable to connect to PharmacyConnect.');
    }
  }

  /// Confirm a medicine request
  static Future<MedicineRequest> confirmRequest(int requestId) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/medicine-requests/$requestId/confirm');
    final headers = await _getHeaders();

    final response = await http.post(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        return MedicineRequest.fromJson(jsonResponse['data']);
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      final jsonResponse = jsonDecode(response.body);
      throw Exception(jsonResponse['message'] ?? 'Unable to confirm request.');
    }
  }

  /// Cancel a medicine request
  static Future<MedicineRequest> cancelRequest(int requestId) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/medicine-requests/$requestId/cancel');
    final headers = await _getHeaders();

    final response = await http.post(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        return MedicineRequest.fromJson(jsonResponse['data']);
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      final jsonResponse = jsonDecode(response.body);
      throw Exception(jsonResponse['message'] ?? 'Unable to cancel request.');
    }
  }
}
