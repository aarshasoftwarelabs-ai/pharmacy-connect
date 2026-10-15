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
    );
  }
}
