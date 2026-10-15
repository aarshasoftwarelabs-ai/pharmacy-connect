import 'package:flutter/material.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../models/supplier_model.dart';

class SuppliersScreen extends StatefulWidget {
  const SuppliersScreen({super.key});

  @override
  State<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends State<SuppliersScreen> {
  List<SupplierModel> _suppliers = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchSuppliers();
  }

  Future<void> _fetchSuppliers() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.get(ApiEndpoints.suppliers);
      if (res.success && res.data != null) {
        final list = (res.data is List)
            ? res.data as List
            : (res.data['data'] as List? ?? []);
        setState(() {
          _suppliers = list.map((s) => SupplierModel.fromJson(s as Map<String, dynamic>)).toList();
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    setState(() {
      _suppliers = [
        SupplierModel(
          id: 1,
          supplierName: 'Gujarat Pharma Distributors',
          mobile: '9825012345',
          city: 'Ahmedabad',
          address: 'GIDC Naroda',
        ),
        SupplierModel(
          id: 2,
          supplierName: 'Mediswift Healthcare Agency',
          mobile: '9879054321',
          city: 'Surat',
          address: 'Ring Road Market',
        ),
        SupplierModel(
          id: 3,
          supplierName: 'Apotheke Lifesciences Wholesale',
          mobile: '9712398765',
          city: 'Vadodara',
          address: 'Alkapuri',
        ),
      ];
      _isLoading = false;
    });
  }

  void _showAddSupplierDialog() {
    final nameCtrl = TextEditingController();
    final mobileCtrl = TextEditingController();
    final cityCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Supplier', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Supplier Name *', hintText: 'e.g. Medico Dist'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: mobileCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Mobile Number', hintText: 'e.g. 9876543210'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: cityCtrl,
              decoration: const InputDecoration(labelText: 'City', hintText: 'e.g. Ahmedabad'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              final newSup = SupplierModel(
                id: DateTime.now().millisecondsSinceEpoch,
                supplierName: nameCtrl.text.trim(),
                mobile: mobileCtrl.text.trim().isNotEmpty ? mobileCtrl.text.trim() : null,
                city: cityCtrl.text.trim().isNotEmpty ? cityCtrl.text.trim() : null,
              );
              setState(() => _suppliers.insert(0, newSup));
              await ApiService.post(ApiEndpoints.suppliers, newSup.toJson());
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Save Supplier', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final list = _suppliers.where((s) {
      return _searchQuery.isEmpty ||
          s.supplierName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (s.city?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Suppliers & Vendors'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchSuppliers,
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: const InputDecoration(
                hintText: 'Search by supplier name or city...',
                prefixIcon: Icon(Icons.search_rounded, color: AppColors.textMuted),
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : list.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.business_outlined, size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            const Text('No suppliers found', style: TextStyle(color: AppColors.textSecondary)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: list.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) {
                          final s = list[idx];
                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: AppColors.accent.withValues(alpha: 0.1),
                                  child: const Icon(Icons.apartment_rounded, color: AppColors.accent),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        s.supplierName,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                                      ),
                                      if (s.mobile != null)
                                        Text(
                                          'Phone: ${s.mobile}',
                                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                        ),
                                      if (s.city != null)
                                        Text(
                                          'City: ${s.city}',
                                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddSupplierDialog,
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Supplier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
