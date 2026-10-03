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
          phone: json['phone']?.toString() ?? '+919876543210',
          latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) ?? 23.0225 : 23.0225,
          longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) ?? 72.5714 : 72.5714,
          isConnected: true, // We can assume any pharmacy returned is connected
          isOpenNow: DateTime.now().hour > 8 && DateTime.now().hour < 22, // roughly open from 8 AM to 10 PM
        )).toList();
      } else {
        throw Exception('Received an invalid response from the server.');
      }
    } else {
      throw Exception('Unable to load pharmacies.');
    }
  }
}
