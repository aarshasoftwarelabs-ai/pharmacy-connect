import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/config/api_config.dart';

class AppNotification {
  final int id;
  final int recipientUserId;
  final int? pharmacyId;
  final String type;
  final String title;
  final String message;
  final String? referenceType;
  final int? referenceId;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.recipientUserId,
    this.pharmacyId,
    required this.type,
    required this.title,
    required this.message,
    this.referenceType,
    this.referenceId,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'],
      recipientUserId: json['recipient_user_id'],
      pharmacyId: json['pharmacy_id'],
      type: json['type'],
      title: json['title'],
      message: json['message'],
      referenceType: json['reference_type'],
      referenceId: json['reference_id'],
      isRead: json['is_read'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class NotificationService {
  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<List<AppNotification>> getNotifications({int limit = 50, int offset = 0}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/notifications?limit=$limit&offset=$offset');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => AppNotification.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load notifications');
    }
  }

  static Future<int> getUnreadCount() async {
    final url = Uri.parse('${ApiConfig.baseUrl}/notifications/unread-count');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = jsonDecode(response.body);
      return data['count'] ?? 0;
    } else {
      return 0;
    }
  }

  static Future<void> markAsRead(int id) async {
    final url = Uri.parse('${ApiConfig.baseUrl}/notifications/$id/read');
    final headers = await _getHeaders();
    await http.post(url, headers: headers);
  }

  static Future<void> markAllAsRead() async {
    final url = Uri.parse('${ApiConfig.baseUrl}/notifications/read-all');
    final headers = await _getHeaders();
    await http.post(url, headers: headers);
  }
}
