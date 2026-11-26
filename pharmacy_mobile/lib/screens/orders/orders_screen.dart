import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/storage_service.dart';
import '../../core/services/thermal_printer_service.dart';
import '../../widgets/bluetooth_printer_modal.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
  String _searchQuery = '';
  String _selectedPaymentFilter = 'All'; // 'All', 'COUNTER', 'ONLINE'

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshBills();
    });
  }

  Future<void> _refreshBills() async {
    final auth = context.read<AuthProvider>();
    await context.read<BillingProvider>().fetchBills(auth.pharmacyId);
  }

  Future<void> _handlePrintReceipt(Map<String, dynamic> bill) async {
    final pharmacy = StorageService.getPharmacy();
    final pharmacyName = pharmacy?['name']?.toString() ?? 'DavaSetu Medicals';
    final gstin = pharmacy?['gstin']?.toString();
    final dlNo = pharmacy?['regNo']?.toString() ??
        pharmacy?['reg_no']?.toString() ??
        pharmacy?['dl_number']?.toString() ??
        pharmacy?['dlNo']?.toString();
    final phone = pharmacy?['phone']?.toString();
    final address = pharmacy?['address']?.toString();
    final defaultMac = await ThermalPrinterService.instance.getSavedPrinterMac();

    if (defaultMac != null && defaultMac.isNotEmpty) {
      final ok = await ThermalPrinterService.instance.printViaBluetooth(
        billData: bill,
        storeName: pharmacyName,
        gstin: gstin,
        dlNo: dlNo,
        phone: phone,
        address: address,
      );

      if (ok) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF15803D),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                  const SizedBox(width: 8),
                  Text('Thermal slip printed for ${bill['bill_number'] ?? 'Bill'}!'),
                ],
              ),
            ),
          );
        }
        return;
      }
    }

    if (mounted) {
      BluetoothPrinterModal.show(
        context,
        autoPrintBill: bill,
        storeName: pharmacyName,
        gstin: gstin,
        dlNo: dlNo,
        phone: phone,
        address: address,
      );
    }
  }

  /// Sends or resends a bill invoice via WhatsApp/SMS with honest feedback.
  Future<void> _resendInvoiceWhatsApp(Map<String, dynamic> bill) async {
    final billNo = bill['bill_number']?.toString() ?? 'Invoice';
    final billId = int.tryParse(bill['id']?.toString() ?? '');
    if (billId == null || billId <= 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Offline bill is not synced to cloud yet.'),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final phone = (bill['customer_phone'] ?? '').toString().trim();
    if (phone.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No customer phone number on this bill.'),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final res = await ApiService.post(ApiEndpoints.resendBillMessage(billId), {});
    if (!mounted) return;
    if (res.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.send_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text('Invoice $billNo dispatched via WhatsApp!')),
            ],
          ),
          backgroundColor: const Color(0xFF059669),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message ?? 'Failed to send WhatsApp invoice'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final billing = context.watch<BillingProvider>();
    final recentBills = billing.recentBills;

    // Filter by search query and payment mode
    final filteredBills = recentBills.where((b) {
      final billNo = (b['bill_number'] ?? '').toString().toLowerCase();
      final customer = (b['customer_name'] ?? '').toString().toLowerCase();
      final paymentMode = (b['payment_mode'] ?? '').toString().toUpperCase();

      final matchesSearch = _searchQuery.trim().isEmpty ||
          billNo.contains(_searchQuery.toLowerCase().trim()) ||
          customer.contains(_searchQuery.toLowerCase().trim());

      final matchesPayment = _selectedPaymentFilter == 'All' ||
          (_selectedPaymentFilter == 'COUNTER' &&
              (paymentMode.contains('CASH') ||
                  paymentMode.contains('CARD') ||
                  paymentMode.contains('OFFLINE') ||
                  paymentMode.contains('POS'))) ||
          (_selectedPaymentFilter == 'ONLINE' &&
              (paymentMode.contains('UPI') || paymentMode.contains('ONLINE'))) ||
          paymentMode.contains(_selectedPaymentFilter);

      return matchesSearch && matchesPayment;
    }).toList();

    final activeBills = recentBills
        .where((b) => (b['payment_status'] ?? 'PAID').toString().toUpperCase() != 'CANCELLED')
        .toList();
    final totalSales = activeBills.fold(0.0, (sum, b) => sum + ((b['total'] as num?)?.toDouble() ?? 0.0));
    final averageBill = activeBills.isNotEmpty ? totalSales / activeBills.length : 0.0;

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
              'Invoices & Sales History',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.4,
              ),
            ),
            Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFF10B981),
                  ),
                ),
                const SizedBox(width: 5),
                const Text(
                  'Live Cloud POS Invoices',
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
            icon: const Icon(Icons.refresh_rounded, color: AppColors.primary),
            tooltip: 'Refresh Invoices',
            onPressed: _refreshBills,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // 1. High-Impact KPI Summary Strip (Real Sales Data Only)
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
            child: Row(
              children: [
                Expanded(
                  flex: 4,
                  child: _buildKpiBox(
                    title: 'Total Sales',
                    value: _currency.format(totalSales),
                    icon: Icons.currency_rupee_rounded,
                    color: AppColors.primary,
                    bgColor: const Color(0xFFF0FDFA),
                    borderColor: const Color(0xFFCCFBF1),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 3,
                  child: _buildKpiBox(
                    title: 'Total Invoices',
                    value: '${activeBills.length} Bills',
                    icon: Icons.receipt_long_rounded,
                    color: const Color(0xFF2563EB),
                    bgColor: const Color(0xFFEFF6FF),
                    borderColor: const Color(0xFFDBEAFE),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 3,
                  child: _buildKpiBox(
                    title: 'Average Bill',
                    value: _currency.format(averageBill),
                    icon: Icons.analytics_outlined,
                    color: const Color(0xFF7C3AED),
                    bgColor: const Color(0xFFF5F3FF),
                    borderColor: const Color(0xFFEDE9FE),
                  ),
                ),
              ],
            ),
          ),

          // 2. Search & Filter Bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Column(
              children: [
                // Search Input Field
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    onChanged: (v) => setState(() => _searchQuery = v),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      hintText: 'Search bill number, customer name...',
                      hintStyle: const TextStyle(fontSize: 12.5, color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.primary),
                      suffixIcon: _searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded, size: 16),
                              onPressed: () => setState(() => _searchQuery = ''),
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Payment Filters (All / Counter Cash / Online UPI)
                Row(
                  children: [
                    const Text(
                      'Filter:',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                    ),
                    const SizedBox(width: 8),
                    _buildFilterChip('All', 'All (${recentBills.length})'),
                    const SizedBox(width: 6),
                    _buildFilterChip('COUNTER', 'Counter / Cash'),
                    const SizedBox(width: 6),
                    _buildFilterChip('ONLINE', 'UPI / Online'),
                  ],
                ),
              ],
            ),
          ),

          // 3. Invoices List with Pull-to-Refresh
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: _refreshBills,
              child: filteredBills.isEmpty
                  ? _buildEmptyState()
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                      itemCount: filteredBills.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final bill = filteredBills[index];
                        return _buildInvoiceCard(bill);
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final isSelected = _selectedPaymentFilter == filterKey;
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentFilter = filterKey),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryDark : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primaryDark : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildKpiBox({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required Color borderColor,
  }) {
    return Container(
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
                  style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w800,
              color: color == AppColors.textMuted ? AppColors.textPrimary : color,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.receipt_long_outlined, size: 36, color: AppColors.textMuted),
            ),
            const SizedBox(height: 14),
            Text(
              _searchQuery.isNotEmpty ? 'No Matching Invoices Found' : 'No Invoices Recorded Yet',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(
              _searchQuery.isNotEmpty
                  ? 'Try searching with another bill number or customer name.'
                  : 'Counter POS sales bills will automatically appear here.',
              style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceCard(Map<String, dynamic> bill) {
    final billNo = bill['bill_number'] ?? 'PC-2026-000001';
    final customer = bill['customer_name'] ?? 'Walk-in Customer';
    final paymentMode = (bill['payment_mode'] ?? 'CASH').toString().toUpperCase();
    final paymentStatus = (bill['payment_status'] ?? 'PAID').toString().toUpperCase();
    final isCancelled = paymentStatus == 'CANCELLED';
    final isUnpaid = paymentStatus == 'UNPAID';
    final itemsCount = bill['items_count'] ?? 1;
    final total = (bill['total'] as num?)?.toDouble() ?? 0.0;
    final date = bill['date'] ?? 'Today';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
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
          onTap: () => _showInvoiceDetailModal(bill),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Receipt Icon + Bill Number + Mode + Amount
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Receipt Icon Avatar
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.primarySubtle,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(Icons.receipt_rounded, color: AppColors.primaryDark, size: 22),
                    ),
                    const SizedBox(width: 12),
                    // Bill Number & Status Pill
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                billNo,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15.5,
                                  color: AppColors.textPrimary,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFA7F3D0)),
                                ),
                                child: Text(
                                  paymentMode,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF059669),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              const Icon(Icons.person_rounded, size: 13, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(
                                customer,
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Amount Pill
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _currency.format(total),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primaryDark,
                            letterSpacing: -0.4,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: isCancelled
                                ? const Color(0xFFFEE2E2)
                                : isUnpaid
                                    ? const Color(0xFFFEF3C7)
                                    : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            isCancelled
                                ? 'Returned / Cancelled'
                                : isUnpaid
                                    ? 'Udhar / Unpaid'
                                    : 'Paid Bill',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isCancelled
                                  ? const Color(0xFFDC2626)
                                  : isUnpaid
                                      ? const Color(0xFFD97706)
                                      : const Color(0xFF059669),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                // Date & Items meta info
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded, size: 12, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text(date, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.shopping_bag_outlined, size: 12, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text('$itemsCount ${itemsCount == 1 ? 'Medicine' : 'Medicines'}',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // Action Buttons
                Row(
                  children: [
                    // Print Receipt Button
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _handlePrintReceipt(bill),
                        icon: const Icon(Icons.print_rounded, size: 15, color: AppColors.textPrimary),
                        label: const Text(
                          'Print Receipt',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // WhatsApp Share Button
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF0D9488), Color(0xFF059669)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: () => _resendInvoiceWhatsApp(bill),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(vertical: 9),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.share_rounded, size: 15, color: Colors.white),
                                  SizedBox(width: 6),
                                  Text(
                                    'Share Invoice',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                  ),
                                ],
                              ),
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

  // Digital Thermal Receipt Modal
  void _showInvoiceDetailModal(Map<String, dynamic> bill) {
    final pharmacy = StorageService.getPharmacy();
    final pharmacyName = pharmacy?['name']?.toString() ?? 'DavaSetu Medicals';
    final billNo = bill['bill_number'] ?? 'PC-2026-000001';
    final customer = bill['customer_name'] ?? 'Walk-in Customer';
    final total = (bill['total'] as num?)?.toDouble() ?? 0.0;
    final date = bill['date'] ?? 'Today';
    final storedTax = (bill['total_gst'] as num?)?.toDouble() ?? (bill['tax'] as num?)?.toDouble() ?? 0.0;
    final storedTaxable = (bill['total_taxable_amount'] as num?)?.toDouble() ?? 0.0;
    final subtotal = storedTaxable > 0
        ? storedTaxable
        : (storedTax > 0 ? (total - storedTax).clamp(0.0, total) : total);
    final tax = storedTax;

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

              // Store Header
              Text(
                pharmacyName,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              ),
              const Text(
                'Mobile POS Digital Tax Invoice',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 14),
              const Divider(height: 1),
              const SizedBox(height: 14),

              // Invoice Details Rows
              _buildReceiptRow('Invoice Number:', billNo, isBold: true),
              const SizedBox(height: 6),
              _buildReceiptRow('Customer:', customer),
              const SizedBox(height: 6),
              _buildReceiptRow('Date & Time:', date),
              const SizedBox(height: 6),
              _buildReceiptRow('Payment Mode:', bill['payment_mode'] ?? 'POS (Paid)'),
              const SizedBox(height: 14),
              const Divider(height: 1),
              const SizedBox(height: 14),

              // Breakdown
              _buildReceiptRow('Taxable Subtotal:', _currency.format(subtotal)),
              const SizedBox(height: 6),
              _buildReceiptRow('GST Tax:', _currency.format(tax)),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDFA),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFCCFBF1)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Amount Paid:', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                    Text(
                      _currency.format(total),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primaryDark),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _handlePrintReceipt(bill);
                      },
                      icon: const Icon(Icons.print_rounded, size: 16),
                      label: const Text('Print Receipt'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _resendInvoiceWhatsApp(bill);
                      },
                      icon: const Icon(Icons.share_rounded, size: 16),
                      label: const Text('WhatsApp'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
              if (int.tryParse(bill['id']?.toString() ?? '') != null &&
                  (bill['payment_status'] ?? 'PAID').toString().toUpperCase() != 'CANCELLED') ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    if ((bill['payment_status'] ?? '').toString().toUpperCase() == 'UNPAID') ...[
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final billId = int.parse(bill['id'].toString());
                            final billing = context.read<BillingProvider>();
                            Navigator.pop(ctx);
                            final ok = await billing.markBillPaid(billId);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(ok ? 'Bill marked as PAID!' : (billing.errorMessage ?? 'Update failed')),
                                  backgroundColor: ok ? const Color(0xFF059669) : AppColors.error,
                                ),
                              );
                            }
                          },
                          icon: const Icon(Icons.check_circle_outline_rounded, size: 16, color: Color(0xFF059669)),
                          label: const Text('Mark Paid', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w700)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFA7F3D0)),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final billId = int.parse(bill['id'].toString());
                          final billing = context.read<BillingProvider>();
                          final inventory = context.read<InventoryProvider>();
                          Navigator.pop(ctx);
                          final confirmed = await showDialog<bool>(
                            context: context,
                            builder: (dCtx) => AlertDialog(
                              title: Text('Return / Cancel $billNo?'),
                              content: const Text('This will cancel the bill and restore sold medicine quantities back into your stock.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(dCtx, false), child: const Text('Keep Bill')),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                                  onPressed: () => Navigator.pop(dCtx, true),
                                  child: const Text('Return & Restore Stock', style: TextStyle(color: Colors.white)),
                                ),
                              ],
                            ),
                          );
                          if (confirmed == true) {
                            final ok = await billing.cancelBill(billId, reason: 'Customer Return');
                            if (ok) await inventory.fetchMedicines();
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(ok ? 'Bill returned & stock restored!' : (billing.errorMessage ?? 'Cancel failed')),
                                  backgroundColor: ok ? const Color(0xFF059669) : AppColors.error,
                                ),
                              );
                            }
                          }
                        },
                        icon: const Icon(Icons.assignment_return_outlined, size: 16, color: AppColors.error),
                        label: const Text('Return / Cancel', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFFCA5A5)),
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary)),
        Text(
          value,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
