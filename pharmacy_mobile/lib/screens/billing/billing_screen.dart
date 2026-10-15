import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
  final _customerNameCtrl = TextEditingController();
  final _customerPhoneCtrl = TextEditingController();

  @override
  void dispose() {
    _customerNameCtrl.dispose();
    _customerPhoneCtrl.dispose();
    super.dispose();
  }

  void _showAddMedicineModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.8,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (_, scrollController) {
            return Consumer<InventoryProvider>(
              builder: (context, inv, child) {
                return Column(
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 10, bottom: 8),
                      height: 4,
                      width: 40,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: TextField(
                        onChanged: inv.setSearchQuery,
                        decoration: InputDecoration(
                          hintText: 'Search medicine name or scan barcode...',
                          prefixIcon: const Icon(Icons.search_rounded),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.qr_code_scanner_rounded),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Camera Barcode scanner active')),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: ListView.separated(
                        controller: scrollController,
                        itemCount: inv.medicines.length,
                        separatorBuilder: (context, index) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final med = inv.medicines[index];
                          return ListTile(
                            title: Text(med.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(
                              '${med.category ?? "Medicine"} • Stock: ${med.stock}',
                              style: TextStyle(
                                color: med.isLowStock ? AppColors.warning : AppColors.textSecondary,
                              ),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _currency.format(med.sellingPrice),
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton(
                                  onPressed: med.stock <= 0
                                      ? null
                                      : () {
                                          context.read<BillingProvider>().addToCart(med);
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text('Added ${med.name} to cart'),
                                              duration: const Duration(seconds: 1),
                                            ),
                                          );
                                        },
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: const Text('Add'),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  void _showCheckoutDialog(BillingProvider billing) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Sale & Bill', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Items: ${billing.itemCount}'),
            const SizedBox(height: 4),
            Text('Payment Mode: ${billing.paymentMode}'),
            const SizedBox(height: 8),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total Amount:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(
                  _currency.format(billing.grandTotal),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await billing.processCheckout();
              if (mounted) {
                if (success) {
                  _showSuccessDialog();
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      backgroundColor: AppColors.error,
                      content: Text(billing.errorMessage ?? 'Checkout failed'),
                    ),
                  );
                }
              }
            },
            child: const Text('Complete & Print'),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 54),
        title: const Text('Invoice Generated!', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text(
          'Bill created successfully. Inventory stock has been updated.',
          textAlign: TextAlign.center,
        ),
        actions: [
          Center(
            child: ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Done'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final billing = context.watch<BillingProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mobile POS Billing'),
        actions: [
          if (billing.cartItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep_rounded, color: AppColors.error),
              tooltip: 'Clear Cart',
              onPressed: () => billing.clearCart(),
            ),
          IconButton(
            icon: const Icon(Icons.add_shopping_cart_rounded, color: AppColors.primary),
            tooltip: 'Add Medicine',
            onPressed: _showAddMedicineModal,
          ),
        ],
      ),
      body: billing.cartItems.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.primarySubtle,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.shopping_bag_outlined, size: 56, color: AppColors.primary),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'POS Cart is Empty',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Tap the button below to search or scan medicines',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: _showAddMedicineModal,
                    icon: const Icon(Icons.search_rounded),
                    label: const Text('Search / Add Medicine'),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                // Cart Items List
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: billing.cartItems.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final item = billing.cartItems[index];
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.medicine.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${_currency.format(item.unitPrice)} each',
                                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            // Qty Selector
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: AppColors.cardBorder),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove, size: 16),
                                    onPressed: () => billing.updateQuantity(
                                      item.medicine.id,
                                      item.quantity - 1,
                                    ),
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                    padding: EdgeInsets.zero,
                                  ),
                                  Text(
                                    '${item.quantity}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add, size: 16),
                                    onPressed: () => billing.updateQuantity(
                                      item.medicine.id,
                                      item.quantity + 1,
                                    ),
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                    padding: EdgeInsets.zero,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              _currency.format(item.netTotal),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                // Checkout Card at bottom
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        offset: const Offset(0, -4),
                        blurRadius: 16,
                      ),
                    ],
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  child: SafeArea(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Payment Method Selector
                        Row(
                          children: ['CASH', 'UPI', 'CARD'].map((mode) {
                            final isSelected = billing.paymentMode == mode;
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                child: ChoiceChip(
                                  label: Center(child: Text(mode)),
                                  selected: isSelected,
                                  selectedColor: AppColors.primarySubtle,
                                  labelStyle: TextStyle(
                                    color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                  onSelected: (_) => billing.setPaymentMode(mode),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 12),

                        // Subtotal & Grand Total
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total (${billing.itemCount} items):',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                            ),
                            Text(
                              _currency.format(billing.grandTotal),
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        ElevatedButton(
                          onPressed: () => _showCheckoutDialog(billing),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Complete Sale (Checkout)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
