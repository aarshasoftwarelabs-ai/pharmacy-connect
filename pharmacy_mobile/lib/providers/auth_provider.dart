import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../core/services/offline_sync_service.dart';
import '../core/services/storage_service.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;
  VoidCallback? onSessionCleared;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null || StorageService.getToken() != null;

  String get pharmacyName => _user?.pharmacyName ?? 'DavaSetu Pharmacy';
  String get userName => _user?.name ?? 'Pharmacist';
  String get role => _user?.role ?? 'Pharmacist';
  bool get isStaff => _user?.isStaff ?? false;
  int get pharmacyId => int.tryParse(_user?.pharmacyId ?? '0') ?? 0;

  AuthProvider() {
    _loadSavedUser();
    ApiService.onUnauthorized = () async {
      await logout();
    };
  }

  void _loadSavedUser() {
    final userData = StorageService.getUser();
    if (userData != null) {
      _user = UserModel.fromJson(userData);
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> checkMobile(String phone, String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post(ApiEndpoints.checkMobile, {
        'phone': phone.trim(),
        'email': email.trim(),
        'businessType': 'RETAIL',
      });

      _isLoading = false;

      if (response.success && response.data != null) {
        notifyListeners();
        return Map<String, dynamic>.from(response.data as Map<String, dynamic>);
      } else {
        _errorMessage = response.message ?? 'Verification failed';
        notifyListeners();
        return null;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Connection error: $e';
      notifyListeners();
      return null;
    }
  }

  Future<bool> verifyOtp({required String phone, required String otp}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post(ApiEndpoints.verifyOtp, {
        'phone': phone.trim(),
        'otp': otp.trim(),
      });

      _isLoading = false;

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token']?.toString() ?? '';
        final userMap = data['user'] != null ? Map<String, dynamic>.from(data['user'] as Map<String, dynamic>) : null;
        final pharmacyMap = data['pharmacy'] as Map<String, dynamic>?;

        if (token.isNotEmpty) {
          await StorageService.setToken(token);
        }
        if (pharmacyMap != null) {
          await StorageService.setPharmacy(pharmacyMap);
          if (pharmacyMap['name'] != null && userMap != null) {
            userMap['pharmacyName'] = pharmacyMap['name'];
          }
          if (pharmacyMap['id'] != null && userMap != null) {
            userMap['pharmacyId'] = pharmacyMap['id'].toString();
          }
        }
        if (userMap != null) {
          _user = UserModel.fromJson(userMap);
          await StorageService.setUser(_user!.toJson());
        }
        await OfflineSyncService.instance.refreshForCurrentStore();

        notifyListeners();
        return true;
      } else {
        _errorMessage = response.message ?? 'Invalid OTP';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'OTP verification error: $e';
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String ownerName,
    required String pharmacyName,
    required String phone,
    required String email,
    String? password,
    required String address,
    String businessType = 'RETAIL',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final cleanPassword = password?.trim();
      final response = await ApiService.post(ApiEndpoints.register, {
        'ownerName': ownerName.trim(),
        'pharmacyName': pharmacyName.trim(),
        'phone': phone.trim(),
        'email': email.trim().isEmpty ? '${phone.trim()}@davasetu.com' : email.trim(),
        if (cleanPassword != null && cleanPassword.isNotEmpty) 'password': cleanPassword,
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
        await OfflineSyncService.instance.refreshForCurrentStore();

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
        await OfflineSyncService.instance.refreshForCurrentStore();

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

  Future<Map<String, dynamic>?> lookupCounterUser(String phone) async {
    try {
      final cleanPhone = phone.trim();
      final response = await ApiService.post(ApiEndpoints.lookupCounterUser, {
        'phone': cleanPhone,
      });

      if (response.success && response.data != null) {
        final data = response.data as Map<String, dynamic>;
        if (data['found'] == true && data['user'] != null) {
          return Map<String, dynamic>.from(data['user'] as Map<String, dynamic>);
        }
      }
      return null;
    } catch (e) {
      debugPrint('lookupCounterUser error: $e');
      return null;
    }
  }

  Future<bool> deleteAccount() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.delete(ApiEndpoints.deleteAccount);
      _isLoading = false;
      if (response.success) {
        await logout();
        return true;
      }
      _errorMessage = response.message ?? 'Could not delete account.';
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Account deletion error: $e';
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    await StorageService.clearAll();
    await OfflineSyncService.instance.refreshForCurrentStore();
    onSessionCleared?.call();
    notifyListeners();
  }
}
