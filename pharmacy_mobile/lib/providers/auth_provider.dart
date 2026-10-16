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
  bool get isStaff => _user?.isStaff ?? false;
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
        if (cleanId.contains('@') && (userMap['email'] == null || userMap['email'].toString().isEmpty)) {
          userMap['email'] = cleanId;
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

  Future<bool> register({
    required String ownerName,
    required String pharmacyName,
    required String phone,
    required String email,
    required String password,
    required String address,
    String businessType = 'RETAIL',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post(ApiEndpoints.register, {
        'ownerName': ownerName.trim(),
        'pharmacyName': pharmacyName.trim(),
        'phone': phone.trim(),
        'email': email.trim().isEmpty ? '${phone.trim()}@davasetu.com' : email.trim(),
        'password': password.trim(),
        'address': address.trim().isEmpty ? 'India' : address.trim(),
        'businessType': businessType,
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
        if (email.trim().isNotEmpty) {
          userMap['email'] = email.trim();
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
        _errorMessage = response.message ?? 'Registration failed. Please try again.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'An error occurred during registration: $e';
      notifyListeners();
      return false;
    }
  }

  Future<bool> staffLogin({required String pharmacyPhone, required String pin}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post(ApiEndpoints.staffLogin, {
        'phone': pharmacyPhone.trim(),
        'pin': pin.trim(),
        'businessType': 'RETAIL',
      });

      _isLoading = false;

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token']?.toString() ?? '';
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
        userMap['isStaff'] = true;
        _user = UserModel.fromJson(userMap);
        await StorageService.setUser(_user!.toJson());

        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Staff PIN verification failed.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Staff login error: $e';
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
