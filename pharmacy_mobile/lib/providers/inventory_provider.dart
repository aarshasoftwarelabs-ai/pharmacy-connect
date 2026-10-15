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

    // 1. Exact barcode match
    for (final med in _medicines) {
      if (med.barcode?.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }
    // 2. Exact SKU / ID match
    for (final med in _medicines) {
      if (med.id.toLowerCase() == cleanCode) {
        return med;
      }
    }
    // 3. Exact Batch number match
    for (final med in _medicines) {
      if (med.batchNumber?.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }
    // 4. Exact name match
    for (final med in _medicines) {
      if (med.name.trim().toLowerCase() == cleanCode) {
        return med;
      }
    }
    // 5. Partial barcode or name substring
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
          (med.barcode?.contains(_searchQuery) ?? false);

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
        notifyListeners();
      } else {
        _errorMessage = response.message ?? 'Failed to load medicines';
        // Provide mock data if backend not reachable for demo
        _loadFallbackMedicines();
        notifyListeners();
      }
    } catch (e) {
      _isLoading = false;
      _errorMessage = 'Network error: $e';
      _loadFallbackMedicines();
      notifyListeners();
    }
  }

  void _loadFallbackMedicines() {
    if (_medicines.isEmpty) {
      _medicines = [
        MedicineModel(
          id: '1',
          name: 'Paracetamol 500mg',
          genericName: 'Acetaminophen',
          manufacturer: 'Cipla Ltd',
          category: 'Analgesics',
          batchNumber: 'PCM-890',
          expiryDate: '12/2026',
          mrp: 35.0,
          sellingPrice: 30.0,
          stock: 145,
          barcode: '8901234567890',
        ),
        MedicineModel(
          id: '2',
          name: 'Amoxicillin 250mg',
          genericName: 'Amoxicillin Trihydrate',
          manufacturer: 'Sun Pharma',
          category: 'Antibiotics',
          batchNumber: 'AMX-442',
          expiryDate: '09/2026',
          mrp: 85.0,
          sellingPrice: 75.0,
          stock: 8, // Low stock
          minStockAlert: 15,
          barcode: '8901234567891',
        ),
        MedicineModel(
          id: '3',
          name: 'Cetirizine 10mg',
          genericName: 'Cetirizine HCl',
          manufacturer: 'Dr. Reddy',
          category: 'Antihistamines',
          batchNumber: 'CTZ-119',
          expiryDate: '04/2027',
          mrp: 45.0,
          sellingPrice: 40.0,
          stock: 62,
          barcode: '8901234567892',
        ),
        MedicineModel(
          id: '4',
          name: 'Pantoprazole 40mg',
          genericName: 'Pantoprazole Sodium',
          manufacturer: 'Alkem Labs',
          category: 'Antacids',
          batchNumber: 'PAN-772',
          expiryDate: '01/2027',
          mrp: 120.0,
          sellingPrice: 105.0,
          stock: 5, // Low stock
          minStockAlert: 10,
          barcode: '8901234567893',
        ),
      ];
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
        'generic_name': genericName,
        'category': category,
        'manufacturer': manufacturer,
        'mrp': mrp,
        'selling_price': sellingPrice,
        'stock': stock,
        'barcode': barcode,
        'expiry_date': expiryDate,
      };
      final res = await ApiService.post(ApiEndpoints.medicines, payload);
      if (res.success && res.data != null && res.data is Map) {
        final newMed = MedicineModel.fromJson(res.data as Map<String, dynamic>);
        _medicines.insert(0, newMed);
      } else {
        final localMed = MedicineModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: name,
          genericName: genericName,
          category: category,
          manufacturer: manufacturer,
          mrp: mrp,
          sellingPrice: sellingPrice,
          stock: stock,
          barcode: barcode,
          expiryDate: expiryDate,
        );
        _medicines.insert(0, localMed);
      }
      notifyListeners();
      return true;
    } catch (_) {
      final localMed = MedicineModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: name,
        genericName: genericName,
        category: category,
        manufacturer: manufacturer,
        mrp: mrp,
        sellingPrice: sellingPrice,
        stock: stock,
        barcode: barcode,
        expiryDate: expiryDate,
      );
      _medicines.insert(0, localMed);
      notifyListeners();
      return true;
    }
  }

  Future<bool> deleteMedicine(String id) async {
    try {
      await ApiService.delete(ApiEndpoints.medicineById(id));
      _medicines.removeWhere((m) => m.id == id);
      notifyListeners();
      return true;
    } catch (_) {
      _medicines.removeWhere((m) => m.id == id);
      notifyListeners();
      return true;
    }
  }
}
