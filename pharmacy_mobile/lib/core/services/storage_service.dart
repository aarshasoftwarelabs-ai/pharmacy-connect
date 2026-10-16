import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';
  static const String _pharmacyKey = 'pharmacy_data';
  static const String _baseUrlKey = 'custom_base_url';

  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  // Token
  static Future<void> setToken(String token) async {
    await _prefs?.setString(_tokenKey, token);
  }

  static String? getToken() {
    return _prefs?.getString(_tokenKey);
  }

  static Future<void> removeToken() async {
    await _prefs?.remove(_tokenKey);
  }

  // User
  static Future<void> setUser(Map<String, dynamic> user) async {
    await _prefs?.setString(_userKey, jsonEncode(user));
  }

  static Map<String, dynamic>? getUser() {
    final str = _prefs?.getString(_userKey);
    if (str == null) return null;
    try {
      return jsonDecode(str) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Pharmacy
  static Future<void> setPharmacy(Map<String, dynamic> pharmacy) async {
    await _prefs?.setString(_pharmacyKey, jsonEncode(pharmacy));
  }

  static Map<String, dynamic>? getPharmacy() {
    final str = _prefs?.getString(_pharmacyKey);
    if (str == null) return null;
    try {
      return jsonDecode(str) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Custom Base URL (e.g. for testing with physical phone over Wi-Fi)
  static Future<void> setBaseUrl(String url) async {
    await _prefs?.setString(_baseUrlKey, url);
  }

  static String? getBaseUrl() {
    return _prefs?.getString(_baseUrlKey);
  }

  static const String _appModeKey = 'app_operation_mode';

  // App Mode: 'STANDALONE' (No PC needed) or 'PC_SYNC' (Live Wi-Fi PC mirror)
  static Future<void> setAppMode(String mode) async {
    await _prefs?.setString(_appModeKey, mode);
  }

  static String getAppMode() {
    return _prefs?.getString(_appModeKey) ?? 'STANDALONE';
  }

  static Future<void> clearAll() async {
    await init();
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
    await _prefs?.remove(_pharmacyKey);
    await _prefs?.reload();
  }
}
