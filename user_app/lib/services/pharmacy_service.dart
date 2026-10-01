import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/api_config.dart';
import '../features/pharmacy/models/pharmacy.dart';

class PharmacyService {
  static Future<List<Pharmacy>> getPharmacies() async {
    final url = Uri.parse('${ApiConfig.baseUrl}/pharmacies');
    
    // We may not need auth for this endpoint, but passing it just in case
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    final response = await http.get(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final jsonResponse = jsonDecode(response.body);
      if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
        final List<dynamic> data = jsonResponse['data'];
        
        return data.map((json) => Pharmacy(
          id: json['id'].toString(), // Convert int to string for Pharmacy model
          name: json['name'] ?? 'Unknown Pharmacy',
          address: json['address'] ?? 'No address provided',
          isConnected: true, // We can assume any pharmacy returned is connected
        )).toList();
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      throw Exception('Unable to load pharmacies.');
    }
  }
}
