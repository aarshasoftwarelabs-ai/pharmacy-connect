import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/storage_service.dart';
import '../../core/services/thermal_printer_service.dart';
import '../../core/services/offline_sync_service.dart';
import '../../widgets/bluetooth_printer_modal.dart';
import '../../models/medicine_model.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';
import 'camera_barcode_scanner_screen.dart';

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

  void _showCustomerInfoDialog(BillingProvider billing) {
    _customerNameCtrl.text = billing.customerName;
    _customerPhoneCtrl.text = billing.customerPhone;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              const Row(
                children: [
                  Icon(Icons.person_outline_rounded, color: AppColors.primary),
                  SizedBox(width: 8),
                  Text(
                    'Customer Information',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Add customer details for WhatsApp digital bill & loyalty history',
                style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _customerNameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Customer Name',
                  hintText: 'e.g. Ramesh Patel (or Walk-in)',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _customerPhoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number (for WhatsApp Invoice)',
                  hintText: 'e.g. 9876543210',
                  prefixIcon: Icon(Icons.phone_iphone_rounded),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    billing.setCustomerInfo(
                      name: _customerNameCtrl.text.trim().isNotEmpty ? _customerNameCtrl.text.trim() : 'Walk-in Customer',
                      phone: _customerPhoneCtrl.text.trim(),
                    );
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Save Customer Details', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddMedicineModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.82,
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
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: TextField(
                          onChanged: inv.setSearchQuery,
                          autofocus: false,
                          decoration: InputDecoration(
                            hintText: 'Search medicine, generic, or barcode...',
                            hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
                              tooltip: 'Live Camera Barcode Scanner',
                              onPressed: () {
                                Navigator.pop(ctx);
                                CameraBarcodeScannerScreen.open(context);
                              },
                            ),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: inv.medicines.isEmpty
                          ? const Center(
                              child: Text('No medicines found matching query', style: TextStyle(color: AppColors.textSecondary)),
                            )
                          : ListView.separated(
                              controller: scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: inv.medicines.length,
                              separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              itemBuilder: (context, index) {
                                final med = inv.medicines[index];
                                final isLow = med.isLowStock;
                                final isOut = med.isOutOfStock;

                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 38,
                                        height: 38,
                                        decoration: BoxDecoration(
                                          color: AppColors.primarySubtle,
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(Icons.medication_rounded, size: 20, color: AppColors.primaryDark),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              med.name,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14.5),
                                            ),
                                            Text(
                                              '${med.category ?? "Medicine"} • Stock: ${med.stock}',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                                color: isOut
                                                    ? AppColors.error
                                                    : isLow
                                                        ? AppColors.warning
                                                        : AppColors.textSecondary,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            _currency.format(med.sellingPrice),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 15,
                                              color: AppColors.primaryDark,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          InkWell(
                                            onTap: () {
                                              context.read<BillingProvider>().addToCart(med);
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('Added ${med.name} to POS cart' + (isOut ? ' (Zero Stock)' : '')),
                                                  backgroundColor: AppColors.primaryDark,
                                                  duration: const Duration(milliseconds: 700),
                                                ),
                                              );
                                            },
                                            borderRadius: BorderRadius.circular(8),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: isOut ? const Color(0xFFF59E0B) : AppColors.primary,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                isOut ? '+ Add (0 Stk)' : '+ Add',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ),
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
                );
              },
            );
          },
        );
      },
    );
  }

  void _showCheckoutDialog(BillingProvider billing) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
            const Row(
              children: [
                Icon(Icons.point_of_sale_rounded, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  'Confirm POS Checkout',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textPrimary),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildSummaryRow('Customer:', billing.customerName.isEmpty ? 'Walk-in Customer' : billing.customerName),
                  const SizedBox(height: 6),
                  _buildSummaryRow('Total Items:', '${billing.itemCount} units (${billing.cartItems.length} products)'),
                  const SizedBox(height: 6),
                  _buildSummaryRow('Payment Mode:', billing.paymentMode, isBold: true),
                  const SizedBox(height: 10),
                  const Divider(height: 1),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Grand Total Payable:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                      Text(
                        _currency.format(billing.grandTotal),
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.primaryDark),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final success = await billing.processCheckout();
                      if (mounted) {
                        if (success) {
                          context.read<InventoryProvider>().fetchMedicines();
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
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Complete & Issue Bill', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  void _showSuccessDialog() {
    final billing = context.read<BillingProvider>();
    final bill = billing.lastBill;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 60),
            const SizedBox(height: 12),
            const Text(
              'POS Invoice Generated!',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 6),
            Text(
              'Bill ${bill?['bill_number'] ?? ''} created successfully\nTotal Paid: ${_currency.format(bill?['total'] ?? 0)}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.textSecondary, fontSize: 13.5),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.mark_chat_read_rounded, color: Color(0xFF15803D), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      bill?['customer_phone'] != null && bill!['customer_phone'].toString().isNotEmpty
                          ? '📲 Digital invoice dispatched to +91 ${bill['customer_phone']} via SMS & WhatsApp!'
                          : 'Share digital invoice directly to customer via WhatsApp with 1-tap!',
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF15803D), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final pharmacy = StorageService.getPharmacy();
                      final pharmacyName = pharmacy?['name']?.toString() ?? 'DavaSetu Medicals';
                      final gstin = pharmacy?['gstin']?.toString();
                      final dlNo = pharmacy?['dl_number']?.toString() ?? pharmacy?['dlNo']?.toString();
                      final phone = pharmacy?['phone']?.toString();
                      final address = pharmacy?['address']?.toString();
                      final defaultMac = await ThermalPrinterService.instance.getSavedPrinterMac();

                      if (defaultMac != null && defaultMac.isNotEmpty) {
                        final ok = await ThermalPrinterService.instance.printViaBluetooth(
                          billData: bill ?? {},
                          storeName: pharmacyName,
                          gstin: gstin,
                          dlNo: dlNo,
                          phone: phone,
                          address: address,
                        );

                        if (ok) {
                          if (context.mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                behavior: SnackBarBehavior.floating,
                                backgroundColor: const Color(0xFF15803D),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                content: const Row(
                                  children: [
                                    Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                                    SizedBox(width: 8),
                                    Text('Receipt printed to Bluetooth printer!'),
                                  ],
                                ),
                              ),
                            );
                          }
                          return;
                        }
                      }

                      // If no default printer or print failed, open Bluetooth printer bottom sheet
                      if (context.mounted) {
                        Navigator.pop(ctx);
                        BluetoothPrinterModal.show(
                          context,
                          autoPrintBill: bill,
                          storeName: pharmacyName,
                        );
                      }
                    },
                    icon: const Icon(Icons.print_rounded, size: 16),
                    label: const Text('Print Receipt'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final billText = '''
🧾 *DavaSetu Pharmacy Invoice*
Bill No: ${bill?['bill_number']}
Date: ${bill?['date']}
Customer: ${bill?['customer_name']}
--------------------------------
${bill?['items_summary']}
--------------------------------
*Total Amount: ${_currency.format(bill?['total'] ?? 0)}*
Payment: ${bill?['payment_mode']}
--------------------------------
_Thank you for choosing DavaSetu Pharmacy!_
''';
                      Clipboard.setData(ClipboardData(text: billText));
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: const Color(0xFF15803D),
                          content: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                              const SizedBox(width: 8),
                              Text('Invoice for ${bill?['bill_number']} copied for WhatsApp!'),
                            ],
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF15803D),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.share_rounded, size: 16),
                    label: const Text('WhatsApp', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final billing = context.watch<BillingProvider>();
    final inventory = context.watch<InventoryProvider>();

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
              'Mobile POS Billing',
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
                  'Live Register Active',
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
          ValueListenableBuilder<int>(
            valueListenable: OfflineSyncService.instance.pendingCountNotifier,
            builder: (context, pendingCount, _) {
              if (pendingCount == 0) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.only(right: 6.0),
                child: ActionChip(
                  avatar: const Icon(Icons.cloud_upload_rounded, size: 15, color: Color(0xFFB45309)),
                  label: Text(
                    '$pendingCount Offline',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF92400E)),
                  ),
                  backgroundColor: const Color(0xFFFEF3C7),
                  side: const BorderSide(color: Color(0xFFFDE68A)),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  visualDensity: VisualDensity.compact,
                  onPressed: () async {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Syncing offline bills with cloud database...'),
                        duration: Duration(seconds: 1),
                      ),
                    );
                    final synced = await billing.syncOfflineQueue();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: const Color(0xFF15803D),
                          behavior: SnackBarBehavior.floating,
                          content: Text('$synced offline bills synced to cloud successfully!'),
                        ),
                      );
                    }
                  },
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
            tooltip: 'Live Camera Barcode Scanner',
            onPressed: () => CameraBarcodeScannerScreen.open(context),
          ),
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
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // 1. Customer Selection Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: InkWell(
              onTap: () => _showCustomerInfoDialog(billing),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.primarySubtle,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.person_rounded, size: 20, color: AppColors.primaryDark),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            billing.customerName.isEmpty ? 'Walk-in Customer' : billing.customerName,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5, color: AppColors.textPrimary),
                          ),
                          Text(
                            billing.customerPhone.isEmpty ? 'Tap to enter customer name & phone for WhatsApp bill' : 'Phone: ${billing.customerPhone}',
                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.edit_outlined, size: 16, color: AppColors.primary),
                  ],
                ),
              ),
            ),
          ),

          // 2. Main Body Content (Empty State or Active Cart)
          Expanded(
            child: billing.cartItems.isEmpty
                ? _buildEmptyStateWithQuickPicks(context, billing, inventory)
                : _buildActiveCartList(billing),
          ),

          // 3. Bottom Checkout Drawer (Only when cart is not empty)
          if (billing.cartItems.isNotEmpty) _buildBottomCheckoutDrawer(billing),
        ],
      ),
    );
  }

  // Modern Empty State with Quick Actions & Quick-Pick Medicines
  Widget _buildEmptyStateWithQuickPicks(
    BuildContext context,
    BillingProvider billing,
    InventoryProvider inventory,
  ) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dual Quick Action Cards (Scan Barcode & Search Catalog)
          Row(
            children: [
              // Scan Barcode Card
              Expanded(
                child: InkWell(
                  onTap: () => CameraBarcodeScannerScreen.open(context),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.qr_code_scanner_rounded, size: 30, color: Colors.white),
                        SizedBox(height: 12),
                        Text(
                          'Scan Barcode',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Live Camera Scanner',
                          style: TextStyle(fontSize: 11, color: Color(0xFFCCFBF1)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Search Catalog Card
              Expanded(
                child: InkWell(
                  onTap: _showAddMedicineModal,
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(18),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.28),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.manage_search_rounded, size: 30, color: Colors.white),
                        SizedBox(height: 12),
                        Text(
                          'Search Catalog',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Browse All Medicines',
                          style: TextStyle(fontSize: 11, color: Color(0xFFDBEAFE)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // Quick-Add Popular Medicines Strip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.bolt_rounded, color: Color(0xFFD97706), size: 18),
                  SizedBox(width: 4),
                  Text(
                    'Quick Add to Bill',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                ],
              ),
              Text(
                '${inventory.medicines.length} in store',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Quick add items grid/list
          if (inventory.medicines.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Center(
                child: Text('Loading inventory items...', style: TextStyle(color: AppColors.textSecondary)),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: inventory.medicines.take(6).length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final med = inventory.medicines[index];
                return _buildQuickPickMedicineTile(med, billing);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildQuickPickMedicineTile(MedicineModel med, BillingProvider billing) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primarySubtle,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.medication_rounded, size: 18, color: AppColors.primaryDark),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  med.name,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary),
                ),
                Text(
                  '${med.category ?? "Medicine"} • Stock: ${med.stock}',
                  style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _currency.format(med.sellingPrice),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.primaryDark),
              ),
              const SizedBox(height: 4),
              InkWell(
                onTap: med.stock <= 0
                    ? null
                    : () {
                        billing.addToCart(med);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 16),
                                const SizedBox(width: 6),
                                Text('${med.name} added to bill'),
                              ],
                            ),
                            backgroundColor: AppColors.primaryDark,
                            duration: const Duration(milliseconds: 700),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        );
                      },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: med.stock <= 0 ? const Color(0xFFF1F5F9) : AppColors.primarySubtle,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: med.stock <= 0 ? Colors.transparent : const Color(0xFF99F6E4)),
                  ),
                  child: Text(
                    med.stock <= 0 ? 'Out of stock' : '+ Add to Bill',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: med.stock <= 0 ? AppColors.textMuted : AppColors.primaryDark,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Active Cart Items List
  Widget _buildActiveCartList(BillingProvider billing) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
      itemCount: billing.cartItems.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = billing.cartItems[index];

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primarySubtle,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.medication_rounded, size: 20, color: AppColors.primaryDark),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.medicine.name,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_currency.format(item.unitPrice)} each',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              // Stepper
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    InkWell(
                      onTap: () => billing.updateQuantity(item.medicine.id, item.quantity - 1),
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(9)),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        child: Icon(Icons.remove, size: 16, color: AppColors.primary),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6),
                      child: Text(
                        '${item.quantity}',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                      ),
                    ),
                    InkWell(
                      onTap: () => billing.updateQuantity(item.medicine.id, item.quantity + 1),
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(9)),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        child: Icon(Icons.add, size: 16, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Text(
                _currency.format(item.netTotal),
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.primaryDark),
              ),
            ],
          ),
        );
      },
    );
  }

  // Modern Bottom Checkout Drawer
  Widget _buildBottomCheckoutDrawer(BillingProvider billing) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            offset: const Offset(0, -4),
            blurRadius: 18,
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Payment Mode Selector Pills
            Row(
              children: [
                _buildPaymentModePill(billing, 'CASH', '💵 Cash'),
                const SizedBox(width: 6),
                _buildPaymentModePill(billing, 'UPI', '📱 UPI / QR'),
                const SizedBox(width: 6),
                _buildPaymentModePill(billing, 'CARD', '💳 Card'),
              ],
            ),
            const SizedBox(height: 14),

            // Price Details Summary
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total (${billing.itemCount} ${billing.itemCount == 1 ? 'item' : 'items'}):',
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                    const Text(
                      'Inclusive of all GST taxes',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 10.5),
                    ),
                  ],
                ),
                Text(
                  _currency.format(billing.grandTotal),
                  style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w900, color: AppColors.primaryDark, letterSpacing: -0.4),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Checkout Button
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0D9488), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _showCheckoutDialog(billing),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Checkout (${_currency.format(billing.grandTotal)})',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentModePill(BillingProvider billing, String mode, String label) {
    final isSelected = billing.paymentMode == mode;
    return Expanded(
      child: InkWell(
        onTap: () => billing.setPaymentMode(mode),
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primarySubtle : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
              width: isSelected ? 1.4 : 1,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
