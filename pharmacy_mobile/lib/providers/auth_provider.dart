import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../core/services/storage_service.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null || StorageService.getToken() != null;

  String get pharmacyName => _user?.pharmacyName ?? 'DavaSetu Pharmacy';
  String get userName => _user?.name ?? 'Pharmacist';
  String get role => _user?.role ?? 'Pharmacist';
  int get pharmacyId => int.tryParse(_user?.pharmacyId ?? '1') ?? 1;

  AuthProvider() {
    _loadSavedUser();
  }

  void _loadSavedUser() {
    final userData = StorageService.getUser();
    if (userData != null) {
      _user = UserModel.fromJson(userData);
      notifyListeners();
    }
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final cleanId = identifier.trim();
      final response = await ApiService.post(ApiEndpoints.login, {
        'phone': cleanId,
        'email': cleanId,
        'identifier': cleanId,
        'password': password.trim(),
      });

      _isLoading = false;

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token']?.toString() ?? data['accessToken']?.toString() ?? '';
        final userMap = Map<String, dynamic>.from((data['user'] as Map<String, dynamic>?) ?? {});
        final pharmacyMap = data['pharmacy'] as Map<String, dynamic>?;

        if (token.isNotEmpty) {
          await StorageService.setToken(token);
        }
        if (pharmacyMap != null) {
          await StorageService.setPharmacy(pharmacyMap);
          if (pharmacyMap['name'] != null) {
            userMap['pharmacyName'] = pharmacyMap['name'];
          }
          if (pharmacyMap['id'] != null) {
            userMap['pharmacyId'] = pharmacyMap['id'].toString();
          }
        }
        _user = UserModel.fromJson(userMap);
        await StorageService.setUser(_user!.toJson());

        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Login failed. Please check credentials.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'An unexpected error occurred: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    await StorageService.clearAll();
    notifyListeners();
  }
}
