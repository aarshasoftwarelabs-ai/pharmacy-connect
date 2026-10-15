import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/inventory_provider.dart';
import '../../providers/billing_provider.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const DashboardScreen({super.key, this.onNavigateTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchMedicines();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final inventory = context.watch<InventoryProvider>();
    final billing = context.watch<BillingProvider>();

    final lowStockList = inventory.lowStockMedicines;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              auth.pharmacyName,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const Text(
              'Live POS & Inventory',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => inventory.fetchMedicines(),
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.error),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => inventory.fetchMedicines(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Quick POS Banner
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Quick Billing (POS)',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Scan barcode or search medicine to create instant bill',
                            style: TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: () => widget.onNavigateTab?.call(1),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppColors.primaryDark,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            ),
                            icon: const Icon(Icons.point_of_sale_rounded, size: 18),
                            label: const Text('Start Billing'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.receipt_long_rounded,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // KPI Stats Grid
              const Text(
                'Today\'s Overview',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Sales Today',
                      value: _currency.format(14850),
                      icon: Icons.currency_rupee_rounded,
                      color: AppColors.success,
                      bgColor: AppColors.successBg,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Total Medicines',
                      value: '${inventory.medicines.length}',
                      icon: Icons.medication_rounded,
                      color: AppColors.info,
                      bgColor: AppColors.infoBg,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Low Stock Alert',
                      value: '${inventory.lowStockCount}',
                      icon: Icons.warning_amber_rounded,
                      color: AppColors.warning,
                      bgColor: AppColors.warningBg,
                      onTap: () => widget.onNavigateTab?.call(2),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildKpiCard(
                      title: 'Cart Items',
                      value: '${billing.itemCount}',
                      icon: Icons.shopping_cart_outlined,
                      color: AppColors.primary,
                      bgColor: AppColors.primarySubtle,
                      onTap: () => widget.onNavigateTab?.call(1),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 28),

              // Low Stock Warning Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Low Stock Medicines',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: () => widget.onNavigateTab?.call(2),
                    child: const Text('View All'),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              if (inventory.isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
              else if (lowStockList.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: const Center(
                    child: Text(
                      'All medicines are sufficiently in stock! 👍',
                      style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                    ),
                  ),
                )
              else
                ...lowStockList.take(3).map(
                      (med) => Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.warningBg,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.warning_amber_rounded, color: AppColors.warning),
                          ),
                          title: Text(
                            med.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          subtitle: Text(
                            'Batch: ${med.batchNumber ?? "-"} • Exp: ${med.expiryDate ?? "-"}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.errorBg,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Stock: ${med.stock}',
                                  style: const TextStyle(
                                    color: AppColors.error,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _currency.format(med.sellingPrice),
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: color, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
          ],
        ),
      ),
    );
  }
}
