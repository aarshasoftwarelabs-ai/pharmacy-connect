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
        if (mounted) {
          setState(() {
            _suppliers = list
                .map((s) => SupplierModel.fromJson(s as Map<String, dynamic>))
                .toList();
            _isLoading = false;
          });
        }
        return;
      }
    } catch (e) {
      debugPrint('Error fetching suppliers: $e');
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showSupplierDetailsSheet(SupplierModel s) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        s.supplierName.isNotEmpty ? s.supplierName[0].toUpperCase() : 'S',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          s.supplierName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (s.contactPerson != null)
                          Text(
                            'Contact: ${s.contactPerson}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(),
              const SizedBox(height: 12),
              const Text(
                'COMPLIANCE & DRUG LICENSES (DAVASETU)',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),
              _buildDetailRow('GSTIN', s.gstin ?? 'Not Available'),
              _buildDetailRow('D.L. 20B / 21B', s.drugLicenseNumber ?? 'Not Available'),
              if (s.panNumber != null) _buildDetailRow('PAN Number', s.panNumber!),
              if (s.fssaiNumber != null) _buildDetailRow('FSSAI No.', s.fssaiNumber!),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              const Text(
                'CREDIT & SETTLEMENT',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),
              _buildDetailRow(
                'Credit Terms',
                '${s.creditPeriodDays ?? 21} Days Net',
              ),
              if (s.currentBalance != null)
                _buildDetailRow(
                  'Current Outstanding',
                  '₹${s.currentBalance!.toStringAsFixed(2)}',
                ),
              if (s.bankName != null)
                _buildDetailRow(
                  'Bank & Account',
                  '${s.bankName} - A/C: ${s.accountNumber ?? "N/A"} (IFSC: ${s.ifscCode ?? "N/A"})',
                ),
              if (s.upiId != null) _buildDetailRow('UPI VPA', s.upiId!),
              if (s.dealsInBrands != null) ...[
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                const Text(
                  'PHARMA BRANDS DISTRIBUTED',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  s.dealsInBrands!,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
              if (s.address != null || s.city != null) ...[
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                const Text(
                  'PREMISES ADDRESS',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  [s.address, s.city, s.state, s.pincode]
                      .where((part) => part != null && part.isNotEmpty)
                      .join(', '),
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Close Dossier', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddSupplierDialog() {
    final nameCtrl = TextEditingController();
    final contactCtrl = TextEditingController();
    final mobileCtrl = TextEditingController();
    final cityCtrl = TextEditingController(text: 'Surat');
    final gstinCtrl = TextEditingController();
    final dlCtrl = TextEditingController();
    final creditDaysCtrl = TextEditingController(text: '21');
    final brandsCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Pharma Supplier', style: TextStyle(fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Supplier / Firm Name *',
                  hintText: 'e.g. Shree Ganesh Medicine Dist',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: contactCtrl,
                decoration: const InputDecoration(
                  labelText: 'Contact Person',
                  hintText: 'e.g. Hasmukhbhai Shah',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: mobileCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Mobile Number',
                  hintText: 'e.g. 9825123456',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: cityCtrl,
                decoration: const InputDecoration(
                  labelText: 'City',
                  hintText: 'e.g. Surat / Ahmedabad',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: gstinCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'GSTIN (15 Chars)',
                  hintText: 'e.g. 24AAGCS1234F1Z8',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: dlCtrl,
                decoration: const InputDecoration(
                  labelText: 'Drug License (20B / 21B)',
                  hintText: 'e.g. 20B-GJ-SUR-142512',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: creditDaysCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Credit Period (Days)',
                  hintText: '21',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: brandsCtrl,
                decoration: const InputDecoration(
                  labelText: 'Brands Dealt In',
                  hintText: 'e.g. Sun Pharma, Cipla, Zydus',
                ),
              ),
            ],
          ),
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
                contactPerson: contactCtrl.text.trim().isNotEmpty ? contactCtrl.text.trim() : null,
                mobile: mobileCtrl.text.trim().isNotEmpty ? mobileCtrl.text.trim() : null,
                city: cityCtrl.text.trim().isNotEmpty ? cityCtrl.text.trim() : null,
                gstin: gstinCtrl.text.trim().isNotEmpty ? gstinCtrl.text.trim().toUpperCase() : null,
                drugLicenseNumber: dlCtrl.text.trim().isNotEmpty ? dlCtrl.text.trim() : null,
                creditPeriodDays: int.tryParse(creditDaysCtrl.text.trim()) ?? 21,
                dealsInBrands: brandsCtrl.text.trim().isNotEmpty ? brandsCtrl.text.trim() : null,
              );
              setState(() => _suppliers.insert(0, newSup));
              await ApiService.post(ApiEndpoints.suppliers, newSup.toJson());
              _fetchSuppliers();
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
      final q = _searchQuery.toLowerCase();
      return _searchQuery.isEmpty ||
          s.supplierName.toLowerCase().contains(q) ||
          (s.contactPerson?.toLowerCase().contains(q) ?? false) ||
          (s.city?.toLowerCase().contains(q) ?? false) ||
          (s.gstin?.toLowerCase().contains(q) ?? false) ||
          (s.dealsInBrands?.toLowerCase().contains(q) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Suppliers & Stockists'),
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: const InputDecoration(
                hintText: 'Search stockist, brand, GSTIN, city...',
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
                            const Icon(Icons.business_outlined, size: 52, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            const Text('No suppliers found', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            const Text('Tap + below to add a pharma distributor', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: list.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) {
                          final s = list[idx];
                          return InkWell(
                            onTap: () => _showSupplierDetailsSheet(s),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.cardBorder),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: AppColors.accent.withValues(alpha: 0.12),
                                        child: Text(
                                          s.supplierName.isNotEmpty ? s.supplierName[0].toUpperCase() : 'S',
                                          style: const TextStyle(
                                            color: AppColors.accent,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              s.supplierName,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15,
                                                color: AppColors.textPrimary,
                                              ),
                                            ),
                                            if (s.contactPerson != null)
                                              Text(
                                                s.contactPerson!,
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.textSecondary,
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                      if (s.city != null)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade100,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            s.city!,
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  if (s.gstin != null || s.drugLicenseNumber != null)
                                    Row(
                                      children: [
                                        if (s.gstin != null)
                                          Container(
                                            margin: const EdgeInsets.only(right: 8),
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: Colors.blue.shade50,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              'GST: ${s.gstin}',
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue.shade800),
                                            ),
                                          ),
                                        if (s.creditPeriodDays != null)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: Colors.green.shade50,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '${s.creditPeriodDays}d Credit',
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green.shade800),
                                            ),
                                          ),
                                      ],
                                    ),
                                  if (s.dealsInBrands != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      'Brands: ${s.dealsInBrands}',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                    ),
                                  ],
                                ],
                              ),
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
