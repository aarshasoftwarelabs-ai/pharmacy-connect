import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/medicine_model.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';
import '../../core/services/barcode_medicine_service.dart';
import '../billing/camera_barcode_scanner_screen.dart';

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final inventory = context.watch<InventoryProvider>();
    final billing = context.watch<BillingProvider>();
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Inventory & Stock',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.4,
              ),
            ),
            Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF10B981),
                  ),
                ),
                const SizedBox(width: 5),
                const Text(
                  'Live Cloud Synced',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF059669),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.textPrimary),
            tooltip: 'Reload Inventory',
            onPressed: () => inventory.fetchMedicines(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // KPI Metric Glance Bar
          _buildKpiBar(context, inventory),

          // Search Box Container
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: TextField(
                onChanged: inventory.setSearchQuery,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: 'Search medicine, generic, or barcode...',
                  hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted, fontWeight: FontWeight.normal),
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary, size: 22),
                  suffixIcon: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (inventory.searchQuery.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.textMuted),
                          onPressed: () => inventory.setSearchQuery(''),
                        ),
                      IconButton(
                        icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
                        tooltip: 'Scan Barcode with Camera',
                        onPressed: () async {
                          final code = await CameraBarcodeScannerScreen.scanCode(context);
                          if (code != null && code.trim().isNotEmpty) {
                            final cleanCode = code.trim();
                            final match = inventory.findByBarcode(cleanCode);
                            if (match != null) {
                              inventory.setSearchQuery(match.name);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('✓ Found: ${match.name} (Stock: ${match.stock} Units)'),
                                    backgroundColor: const Color(0xFF0D9488),
                                  ),
                                );
                              }
                            } else {
                              // Barcode not in inventory! Look up and open Add Medicine Sheet with auto-filled details!
                              final autoData = await BarcodeMedicineService.lookup(cleanCode);
                              if (context.mounted) {
                                _showAddMedicineSheet(context, initialData: autoData);
                              }
                            }
                          }
                        },
                      ),
                    ],
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
            ),
          ),

          // Medicine Inventory List
          Expanded(
            child: inventory.isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: AppColors.primary),
                        SizedBox(height: 12),
                        Text(
                          'Syncing inventory from cloud...',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () => inventory.fetchMedicines(),
                    color: AppColors.primary,
                    child: inventory.medicines.isEmpty
                        ? Center(
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(28.0),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 76,
                                    height: 76,
                                    decoration: BoxDecoration(
                                      color: inventory.errorMessage != null
                                          ? const Color(0xFFFEE2E2)
                                          : const Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      inventory.errorMessage != null
                                          ? Icons.cloud_off_rounded
                                          : Icons.inventory_2_outlined,
                                      size: 38,
                                      color: inventory.errorMessage != null ? AppColors.error : AppColors.textMuted,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    inventory.errorMessage ??
                                        (inventory.searchQuery.isEmpty
                                            ? 'No medicines in inventory'
                                            : 'No medicines matching "${inventory.searchQuery}"'),
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: inventory.errorMessage != null ? AppColors.error : AppColors.textSecondary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton.icon(
                                    onPressed: () => inventory.fetchMedicines(),
                                    icon: const Icon(Icons.refresh_rounded, size: 18),
                                    label: const Text('Reload Real Inventory'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 84),
                            itemCount: inventory.medicines.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final med = inventory.medicines[index];
                              return _buildMedicineCard(
                                context: context,
                                med: med,
                                currency: currency,
                                billing: billing,
                                inventory: inventory,
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          gradient: const LinearGradient(
            colors: [Color(0xFF0D9488), Color(0xFF059669)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.38),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(30),
            onTap: () => _showAddMedicineSheet(context),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add_circle_rounded, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Add Medicine',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Modern KPI Glance Strip
  Widget _buildKpiBar(BuildContext context, InventoryProvider inventory) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          Expanded(
            child: _buildKpiCard(
              title: 'Medicines',
              value: '${inventory.allMedicines.length}',
              icon: Icons.medication_rounded,
              color: AppColors.primary,
              bgColor: const Color(0xFFF0FDFA),
              borderColor: const Color(0xFFCCFBF1),
              onTap: () => inventory.setSelectedCategory('All'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildKpiCard(
              title: 'Total Units',
              value: '${inventory.totalStockCount}',
              icon: Icons.inventory_2_rounded,
              color: const Color(0xFF2563EB),
              bgColor: const Color(0xFFEFF6FF),
              borderColor: const Color(0xFFDBEAFE),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildKpiCard(
              title: 'Low Stock',
              value: '${inventory.lowStockCount}',
              icon: Icons.warning_amber_rounded,
              color: inventory.lowStockCount > 0 ? const Color(0xFFD97706) : AppColors.textMuted,
              bgColor: inventory.lowStockCount > 0 ? const Color(0xFFFFFBEB) : const Color(0xFFF8FAFC),
              borderColor: inventory.lowStockCount > 0 ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required Color borderColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor, width: 1.1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 13, color: color),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: color == AppColors.textMuted ? AppColors.textPrimary : color,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Modern Medicine Card
  Widget _buildMedicineCard({
    required BuildContext context,
    required MedicineModel med,
    required NumberFormat currency,
    required BillingProvider billing,
    required InventoryProvider inventory,
  }) {
    final cartIndex = billing.cartItems.indexWhere((item) => item.medicine.id == med.id);
    final inCartQty = cartIndex >= 0 ? billing.cartItems[cartIndex].quantity : 0;
    final isLow = med.isLowStock;
    final isOut = med.isOutOfStock;

    final iconData = _getCategoryIcon(med.category);
    final iconColor = _getCategoryColor(med.category);

    final bool hasValidDiscount = med.mrp > med.sellingPrice && med.mrp > 0;
    final int discountPct = hasValidDiscount ? (((med.mrp - med.sellingPrice) / med.mrp) * 100).round() : 0;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isOut
              ? const Color(0xFFFCA5A5)
              : isLow
                  ? const Color(0xFFFCD34D)
                  : const Color(0xFFE2E8F0),
          width: isLow || isOut ? 1.4 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showMedicineDetailSheet(context, med, currency, inventory, billing),
          child: Padding(
            padding: const EdgeInsets.all(14.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Avatar Icon + Title & Generic + Stock Pill
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Category Icon Avatar
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: iconColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: Icon(iconData, color: iconColor, size: 22),
                    ),
                    const SizedBox(width: 12),
                    // Medicine Title, Generic & Manufacturer
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            med.name,
                            style: const TextStyle(
                              fontSize: 15.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.2,
                            ),
                          ),
                          if (med.genericName != null && med.genericName!.trim().isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              med.genericName!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                          const SizedBox(height: 5),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              if (med.manufacturer != null && med.manufacturer!.trim().isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.apartment_rounded, size: 10, color: AppColors.textMuted),
                                      const SizedBox(width: 3),
                                      Text(
                                        med.manufacturer!,
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              if (med.category != null && med.category!.isNotEmpty && med.category != 'General')
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: iconColor.withValues(alpha: 0.08),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    med.category!,
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      color: iconColor,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Stock Status Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: isOut
                            ? const Color(0xFFFEF2F2)
                            : isLow
                                ? const Color(0xFFFFFBEB)
                                : const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isOut
                              ? const Color(0xFFFECACA)
                              : isLow
                                  ? const Color(0xFFFDE68A)
                                  : const Color(0xFFA7F3D0),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isOut
                                  ? AppColors.error
                                  : isLow
                                      ? AppColors.warning
                                      : AppColors.success,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isOut
                                ? 'Out of Stock'
                                : isLow
                                    ? 'Low: ${med.stock}'
                                    : '${med.stock} in Stock',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isOut
                                  ? AppColors.error
                                  : isLow
                                      ? AppColors.warning
                                      : const Color(0xFF065F46),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Barcode / Expiry micro row (if available)
                if ((med.barcode != null && med.barcode!.isNotEmpty) || (med.expiryDate != null && med.expiryDate!.isNotEmpty)) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (med.barcode != null && med.barcode!.isNotEmpty) ...[
                        const Icon(Icons.qr_code_2_rounded, size: 13, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          med.barcode!,
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontFamily: 'monospace'),
                        ),
                      ],
                      if (med.barcode != null && med.expiryDate != null)
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 8),
                          child: Text('•', style: TextStyle(color: AppColors.textMuted)),
                        ),
                      if (med.expiryDate != null && med.expiryDate!.isNotEmpty) ...[
                        const Icon(Icons.event_outlined, size: 12, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          'Exp: ${med.expiryDate}',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ],
                  ),
                ],

                const SizedBox(height: 10),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 10),

                // Bottom Row: Price & POS Action
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Price Area
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (hasValidDiscount)
                          Row(
                            children: [
                              Text(
                                currency.format(med.mrp),
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: AppColors.textMuted,
                                  decoration: TextDecoration.lineThrough,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  '$discountPct% OFF',
                                  style: const TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF15803D),
                                  ),
                                ),
                              ),
                            ],
                          )
                        else
                          const Text(
                            'Selling Price',
                            style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                          ),
                        Text(
                          currency.format(med.sellingPrice),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primaryDark,
                            letterSpacing: -0.4,
                          ),
                        ),
                      ],
                    ),

                    // POS Action Button / Stepper
                    if (inCartQty > 0)
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDFA),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFF99F6E4)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            InkWell(
                              onTap: () => billing.updateQuantity(med.id, inCartQty - 1),
                              borderRadius: const BorderRadius.horizontal(left: Radius.circular(9)),
                              child: const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                child: Icon(Icons.remove_rounded, size: 16, color: AppColors.primary),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              child: Text(
                                '$inCartQty in POS',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                            ),
                            InkWell(
                              onTap: med.stock > inCartQty
                                  ? () => billing.updateQuantity(med.id, inCartQty + 1)
                                  : null,
                              borderRadius: const BorderRadius.horizontal(right: Radius.circular(9)),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                child: Icon(
                                  Icons.add_rounded,
                                  size: 16,
                                  color: med.stock > inCartQty ? AppColors.primary : AppColors.textMuted,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          gradient: isOut
                              ? null
                              : const LinearGradient(
                                  colors: [AppColors.primary, Color(0xFF0F766E)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                          color: isOut ? const Color(0xFFF1F5F9) : null,
                          borderRadius: BorderRadius.circular(11),
                          boxShadow: isOut
                              ? null
                              : [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.28),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(11),
                            onTap: isOut
                                ? null
                                : () {
                                    billing.addToCart(med);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Row(
                                          children: [
                                            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                                            const SizedBox(width: 8),
                                            Text('${med.name} added to POS bill'),
                                          ],
                                        ),
                                        backgroundColor: AppColors.primaryDark,
                                        behavior: SnackBarBehavior.floating,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        duration: const Duration(milliseconds: 900),
                                      ),
                                    );
                                  },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.add_shopping_cart_rounded,
                                    size: 15,
                                    color: isOut ? AppColors.textMuted : Colors.white,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    isOut ? 'Unavailable' : 'Add to POS',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isOut ? AppColors.textMuted : Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Quick Detail & Stock Adjustment Modal
  void _showMedicineDetailSheet(
    BuildContext context,
    MedicineModel med,
    NumberFormat currency,
    InventoryProvider inventory,
    BillingProvider billing,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Grab handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: _getCategoryColor(med.category).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Icon(_getCategoryIcon(med.category), color: _getCategoryColor(med.category), size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          med.name,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        ),
                        if (med.genericName != null && med.genericName!.isNotEmpty)
                          Text(
                            med.genericName!,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                        if (med.manufacturer != null && med.manufacturer!.isNotEmpty)
                          Text(
                            'Manufacturer: ${med.manufacturer!}',
                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Divider(height: 1),
              const SizedBox(height: 14),

              // Key Specs Grid
              Row(
                children: [
                  Expanded(
                    child: _buildDetailStatBox('Selling Price', currency.format(med.sellingPrice), const Color(0xFF0F766E)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildDetailStatBox('MRP', med.mrp > 0 ? currency.format(med.mrp) : 'N/A', AppColors.textSecondary),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildDetailStatBox(
                      'Stock Units',
                      '${med.stock}',
                      med.isLowStock ? AppColors.warning : AppColors.success,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Quick Stock Adjust Row
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Quick Stock Adjustment',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildQuickAddChip(ctx, inventory, med, -5, '-5'),
                        const SizedBox(width: 6),
                        _buildQuickAddChip(ctx, inventory, med, 5, '+5'),
                        const SizedBox(width: 6),
                        _buildQuickAddChip(ctx, inventory, med, 10, '+10'),
                        const SizedBox(width: 6),
                        _buildQuickAddChip(ctx, inventory, med, 25, '+25'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Add to POS button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: med.stock <= 0
                      ? null
                      : () {
                          billing.addToCart(med);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('${med.name} added to POS bill'),
                              backgroundColor: AppColors.primary,
                            ),
                          );
                        },
                  icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                  label: const Text('Add to POS Cart', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailStatBox(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAddChip(
    BuildContext ctx,
    InventoryProvider inventory,
    MedicineModel med,
    int delta,
    String label,
  ) {
    return Expanded(
      child: OutlinedButton(
        onPressed: () async {
          await inventory.updateMedicineStock(medicineId: med.id, addedUnits: delta);
          if (ctx.mounted) {
            Navigator.pop(ctx);
          }
        },
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 6),
          side: const BorderSide(color: Color(0xFFCBD5E1)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          backgroundColor: Colors.white,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: delta < 0 ? AppColors.error : AppColors.primaryDark,
          ),
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String? category) {
    if (category == null) return Icons.medication_rounded;
    final cat = category.toLowerCase();
    if (cat.contains('analgesic') || cat.contains('pain')) return Icons.healing_rounded;
    if (cat.contains('antibiotic')) return Icons.biotech_rounded;
    if (cat.contains('antacid') || cat.contains('gastro')) return Icons.health_and_safety_rounded;
    if (cat.contains('antihistamine') || cat.contains('cold') || cat.contains('cough')) return Icons.air_rounded;
    return Icons.medication_rounded;
  }

  Color _getCategoryColor(String? category) {
    if (category == null) return AppColors.primary;
    final cat = category.toLowerCase();
    if (cat.contains('analgesic')) return const Color(0xFF2563EB);
    if (cat.contains('antibiotic')) return const Color(0xFF059669);
    if (cat.contains('antacid')) return const Color(0xFFD97706);
    if (cat.contains('antihistamine')) return const Color(0xFF7C3AED);
    return AppColors.primary;
  }

  void _showAddMedicineSheet(BuildContext context, {ScannedMedicineData? initialData}) {
    final nameCtrl = TextEditingController(text: initialData?.name ?? '');
    final genericCtrl = TextEditingController(text: initialData?.genericName ?? '');
    final mfgCtrl = TextEditingController(text: initialData?.manufacturer ?? '');
    final categoryCtrl = TextEditingController(text: initialData?.category ?? 'General');
    final mrpCtrl = TextEditingController(text: initialData != null ? initialData.mrp.toStringAsFixed(2) : '');
    final spCtrl = TextEditingController(text: initialData != null ? initialData.sellingPrice.toStringAsFixed(2) : '');
    final stockCtrl = TextEditingController(text: initialData != null ? initialData.stock.toString() : '10');
    final barcodeCtrl = TextEditingController(text: initialData?.barcode ?? '');
    final expiryCtrl = TextEditingController(text: initialData?.expiryDate ?? '12/2028');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            void applyAutoFill(ScannedMedicineData data) {
              setSheetState(() {
                nameCtrl.text = data.name;
                if (data.genericName != null && data.genericName!.isNotEmpty) {
                  genericCtrl.text = data.genericName!;
                }
                categoryCtrl.text = data.category;
                if (data.manufacturer != null && data.manufacturer!.isNotEmpty) {
                  mfgCtrl.text = data.manufacturer!;
                }
                mrpCtrl.text = data.mrp.toStringAsFixed(2);
                spCtrl.text = data.sellingPrice.toStringAsFixed(2);
                stockCtrl.text = data.stock.toString();
                barcodeCtrl.text = data.barcode;
                expiryCtrl.text = data.expiryDate;
              });
            }

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
                    if (initialData != null || barcodeCtrl.text.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Barcode: ${barcodeCtrl.text} (Auto-filled)',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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
                            decoration: InputDecoration(
                              labelText: 'Barcode / SKU',
                              hintText: 'e.g. 890123456789',
                              suffixIcon: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (barcodeCtrl.text.isNotEmpty)
                                    IconButton(
                                      icon: const Icon(Icons.flash_on_rounded, color: Colors.orange, size: 20),
                                      tooltip: 'Auto-fill details from barcode',
                                      onPressed: () async {
                                        final auto = await BarcodeMedicineService.lookup(barcodeCtrl.text.trim());
                                        applyAutoFill(auto);
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('✓ Auto-filled: ${auto.name}'),
                                              backgroundColor: const Color(0xFF059669),
                                            ),
                                          );
                                        }
                                      },
                                    ),
                                  IconButton(
                                    icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
                                    tooltip: 'Scan Barcode with Camera',
                                    onPressed: () async {
                                      final code = await CameraBarcodeScannerScreen.scanCode(context);
                                      if (code != null && code.trim().isNotEmpty) {
                                        final clean = code.trim();
                                        final auto = await BarcodeMedicineService.lookup(clean);
                                        applyAutoFill(auto);
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('✓ Auto-filled: ${auto.name} from Barcode!'),
                                              backgroundColor: const Color(0xFF059669),
                                            ),
                                          );
                                        }
                                      }
                                    },
                                  ),
                                ],
                              ),
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
                          if (nameCtrl.text.trim().isEmpty && barcodeCtrl.text.trim().isNotEmpty) {
                            final auto = await BarcodeMedicineService.lookup(barcodeCtrl.text.trim());
                            applyAutoFill(auto);
                          }

                          if (nameCtrl.text.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter medicine name or scan barcode')),
                            );
                            return;
                          }

                          final mrp = double.tryParse(mrpCtrl.text) ?? 50.0;
                          final sp = double.tryParse(spCtrl.text) ?? (mrp * 0.9);
                          final stock = int.tryParse(stockCtrl.text) ?? 10;

                          Navigator.pop(ctx);
                          final inv = context.read<InventoryProvider>();
                          final ok = await inv.addMedicine(
                                name: nameCtrl.text.trim(),
                                genericName: genericCtrl.text.trim().isNotEmpty ? genericCtrl.text.trim() : null,
                                category: categoryCtrl.text.trim().isNotEmpty ? categoryCtrl.text.trim() : 'General',
                                manufacturer: mfgCtrl.text.trim().isNotEmpty ? mfgCtrl.text.trim() : null,
                                mrp: mrp,
                                sellingPrice: sp,
                                stock: stock,
                                barcode: barcodeCtrl.text.trim().isNotEmpty ? barcodeCtrl.text.trim() : null,
                                expiryDate: expiryCtrl.text.trim().isNotEmpty ? expiryCtrl.text.trim() : '12/2028',
                              );
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(ok 
                                  ? '✓ Added ${nameCtrl.text.trim()} to inventory!' 
                                  : (inv.errorMessage ?? 'Failed to add medicine. Please try again.')),
                                backgroundColor: ok ? const Color(0xFF059669) : Colors.red,
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Save to Inventory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
