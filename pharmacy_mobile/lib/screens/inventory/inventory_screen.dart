import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final inventory = context.watch<InventoryProvider>();
    final billing = context.watch<BillingProvider>();
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    final categories = ['All', 'Analgesics', 'Antibiotics', 'Antacids', 'Antihistamines', 'General'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Inventory & Stock'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => inventory.fetchMedicines(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Box
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              children: [
                TextField(
                  onChanged: inventory.setSearchQuery,
                  decoration: const InputDecoration(
                    hintText: 'Search by medicine, generic, or barcode...',
                    prefixIcon: Icon(Icons.search_rounded, color: AppColors.textMuted),
                  ),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: categories.map((cat) {
                      final isSelected = inventory.selectedCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: FilterChip(
                          label: Text(cat),
                          selected: isSelected,
                          selectedColor: AppColors.primarySubtle,
                          labelStyle: TextStyle(
                            color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                          onSelected: (_) => inventory.setSelectedCategory(cat),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Inventory List
          Expanded(
            child: inventory.isLoading
                ? const Center(child: CircularProgressIndicator())
                : inventory.medicines.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.inventory_2_outlined, size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            Text(
                              inventory.searchQuery.isEmpty
                                  ? 'No medicines in inventory'
                                  : 'No medicines matching "${inventory.searchQuery}"',
                              style: const TextStyle(color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: inventory.medicines.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final med = inventory.medicines[index];
                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: med.isLowStock ? AppColors.warning.withValues(alpha: 0.5) : AppColors.cardBorder,
                                width: med.isLowStock ? 1.5 : 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            med.name,
                                            style: const TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          if (med.genericName != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              med.genericName!,
                                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                            ),
                                          ],
                                          if (med.manufacturer != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              med.manufacturer!,
                                              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    // Stock Badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: med.isOutOfStock
                                            ? AppColors.errorBg
                                            : med.isLowStock
                                                ? AppColors.warningBg
                                                : AppColors.successBg,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        med.isOutOfStock
                                            ? 'Out of Stock'
                                            : med.isLowStock
                                                ? 'Low: ${med.stock}'
                                                : 'Stock: ${med.stock}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: med.isOutOfStock
                                              ? AppColors.error
                                              : med.isLowStock
                                                  ? AppColors.warning
                                                  : AppColors.success,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Divider(height: 1),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          'MRP ${currency.format(med.mrp)}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textMuted,
                                            decoration: TextDecoration.lineThrough,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          currency.format(med.sellingPrice),
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                    ElevatedButton.icon(
                                      onPressed: med.stock <= 0
                                          ? null
                                          : () {
                                              billing.addToCart(med);
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Added ${med.name} to POS Cart'),
                                                  duration: const Duration(milliseconds: 900),
                                                ),
                                              );
                                            },
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        backgroundColor: AppColors.primary,
                                      ),
                                      icon: const Icon(Icons.add_shopping_cart_rounded, size: 16),
                                      label: const Text('Add to POS', style: TextStyle(fontSize: 12)),
                                    ),
                                  ],
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
        onPressed: () => _showAddMedicineSheet(context),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Add Medicine', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  void _showAddMedicineSheet(BuildContext context) {
    final nameCtrl = TextEditingController();
    final genericCtrl = TextEditingController();
    final mfgCtrl = TextEditingController();
    final categoryCtrl = TextEditingController(text: 'General');
    final mrpCtrl = TextEditingController();
    final spCtrl = TextEditingController();
    final stockCtrl = TextEditingController(text: '10');
    final barcodeCtrl = TextEditingController();
    final expiryCtrl = TextEditingController(text: '12/2026');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Add New Medicine',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Medicine Name *',
                    hintText: 'e.g. Paracetamol 650mg',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: genericCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Generic Name',
                          hintText: 'e.g. Paracetamol',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: categoryCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Category',
                          hintText: 'e.g. Analgesics',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: mfgCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Manufacturer',
                          hintText: 'e.g. Cipla',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: stockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Stock Units *',
                          hintText: '10',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: mrpCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'MRP (₹) *',
                          hintText: '50.00',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: spCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Selling Price (₹) *',
                          hintText: '45.00',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: barcodeCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Barcode / SKU',
                          hintText: 'e.g. 890123456789',
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: expiryCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Expiry Date',
                          hintText: 'MM/YYYY',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter medicine name')),
                        );
                        return;
                      }
                      final mrp = double.tryParse(mrpCtrl.text) ?? 50.0;
                      final sp = double.tryParse(spCtrl.text) ?? (mrp * 0.9);
                      final stock = int.tryParse(stockCtrl.text) ?? 10;

                      Navigator.pop(ctx);
                      final ok = await context.read<InventoryProvider>().addMedicine(
                            name: nameCtrl.text.trim(),
                            genericName: genericCtrl.text.trim().isNotEmpty ? genericCtrl.text.trim() : null,
                            category: categoryCtrl.text.trim().isNotEmpty ? categoryCtrl.text.trim() : 'General',
                            manufacturer: mfgCtrl.text.trim().isNotEmpty ? mfgCtrl.text.trim() : null,
                            mrp: mrp,
                            sellingPrice: sp,
                            stock: stock,
                            barcode: barcodeCtrl.text.trim().isNotEmpty ? barcodeCtrl.text.trim() : null,
                            expiryDate: expiryCtrl.text.trim().isNotEmpty ? expiryCtrl.text.trim() : null,
                          );
                      if (context.mounted && ok) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Added ${nameCtrl.text.trim()} to inventory')),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Save to Inventory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
