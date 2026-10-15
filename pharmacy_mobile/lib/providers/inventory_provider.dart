import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../models/medicine_model.dart';

class InventoryProvider extends ChangeNotifier {
  List<MedicineModel> _medicines = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _searchQuery = '';
  String _selectedCategory = 'All';

  InventoryProvider() {
    fetchMedicines();
  }

  List<MedicineModel> get allMedicines => _medicines;

  MedicineModel? findByBarcode(String code) {
    if (code.trim().isEmpty) return null;
    final cleanCode = code.trim().toLowerCase();

    // 1. Exact primary barcode match
    for (final med in _medicines) {
      if (med.barcode?.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }

    // 2. Calculated Store Barcode match (from BarcodeStickerModal / PC sticker)
    // E.g. Sticker code: 890008004715 vs Store Barcode: 89000800471
    for (final med in _medicines) {
      if (med.storeBarcode != null) {
        final sb = med.storeBarcode!.toLowerCase();
        if (cleanCode == sb || cleanCode.startsWith(sb) || sb.startsWith(cleanCode)) {
          return med;
        }
      }
    }

    // 3. Match any Batch Barcode or Batch Number
    for (final med in _medicines) {
      for (final batch in med.batches) {
        if (batch.barcode != null && batch.barcode!.trim().toLowerCase() == cleanCode) {
          return med;
        }
        if (batch.batchNumber.trim().toLowerCase() == cleanCode) {
          return med;
        }
      }
    }

    // 4. Exact SKU match
    for (final med in _medicines) {
      if (med.sku != null && med.sku!.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }

    // 5. Exact ID match (or if code ends with padded ID)
    for (final med in _medicines) {
      if (med.id.toLowerCase() == cleanCode) {
        return med;
      }
      final paddedId = med.id.padLeft(5, '0');
      if (cleanCode.contains(paddedId)) {
        return med;
      }
    }

    // 6. Exact Batch number match
    for (final med in _medicines) {
      if (med.batchNumber?.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }

    // 7. Exact name match
    for (final med in _medicines) {
      if (med.name.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }

    // 8. Partial barcode or name substring
    for (final med in _medicines) {
      if ((med.barcode != null && med.barcode!.toLowerCase().contains(cleanCode)) ||
          med.name.toLowerCase().contains(cleanCode) ||
          (med.genericName?.toLowerCase().contains(cleanCode) ?? false)) {
        return med;
      }
    }
    return null;
  }

  List<MedicineModel> get medicines {
    return _medicines.where((med) {
      final matchesSearch = _searchQuery.isEmpty ||
          med.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (med.genericName?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          (med.barcode?.contains(_searchQuery) ?? false) ||
          (med.sku?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);

      final matchesCategory = _selectedCategory == 'All' ||
          med.category?.toLowerCase() == _selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    }).toList();
  }

  List<MedicineModel> get lowStockMedicines =>
      _medicines.where((m) => m.isLowStock).toList();

  int get totalStockCount => _medicines.fold(0, (sum, m) => sum + m.stock);
  int get lowStockCount => lowStockMedicines.length;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> fetchMedicines() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.get(ApiEndpoints.medicines);
      _isLoading = false;

      if (response.success && response.data != null) {
        final list = (response.data is List)
            ? response.data as List
            : (response.data['medicines'] as List? ?? []);

        _medicines = list
            .map((item) => MedicineModel.fromJson(item as Map<String, dynamic>))
            .toList();
        _errorMessage = null;
        notifyListeners();
      } else {
        _errorMessage = response.message ?? 'Failed to load medicines from server';
        notifyListeners();
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Network connection error. Check Wi-Fi & PC IP: $e';
      notifyListeners();
    }
  }

  Future<bool> addMedicine({
    required String name,
    String? genericName,
    String? category,
    String? manufacturer,
    required double mrp,
    required double sellingPrice,
    required int stock,
    String? barcode,
    String? expiryDate,
  }) async {
    try {
      final payload = {
        'name': name,
        'genericName': genericName,
        'category': category ?? 'General',
        'manufacturer': manufacturer,
        'mrp': mrp,
        'sellingPrice': sellingPrice,
        'currentStock': stock,
        'barcode': barcode,
        'expiryDate': expiryDate,
      };

      final response = await ApiService.post(ApiEndpoints.medicines, payload);

      if (response.success && response.data != null) {
        final newMed = MedicineModel.fromJson(response.data as Map<String, dynamic>);
        _medicines.insert(0, newMed);
        notifyListeners();
        return true;
      } else {
        // If API fails, also refresh to keep real database in sync
        await fetchMedicines();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Error adding medicine: $e';
      notifyListeners();
      return false;
    }
  }

  void updateStockLocal(String id, int quantityDeducted) {
    final index = _medicines.indexWhere((m) => m.id == id);
    if (index != -1) {
      final old = _medicines[index];
      final newStock = (old.stock - quantityDeducted).clamp(0, 999999);
      _medicines[index] = MedicineModel(
        id: old.id,
        pharmacyId: old.pharmacyId,
        name: old.name,
        genericName: old.genericName,
        manufacturer: old.manufacturer,
        category: old.category,
        sku: old.sku,
        batchNumber: old.batchNumber,
        expiryDate: old.expiryDate,
        mrp: old.mrp,
        sellingPrice: old.sellingPrice,
        stock: newStock,
        minStockAlert: old.minStockAlert,
        barcode: old.barcode,
        storeBarcode: old.storeBarcode,
        batches: old.batches,
      );
      notifyListeners();
    }
  }
}
