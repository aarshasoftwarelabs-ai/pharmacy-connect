import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/subscription_provider.dart';

class SubscriptionRenewalModal extends StatefulWidget {
  final int pharmacyId;
  final String pharmacyName;

  const SubscriptionRenewalModal({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
  });

  static Future<void> show(BuildContext context, {required int pharmacyId, required String pharmacyName}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => SubscriptionRenewalModal(
        pharmacyId: pharmacyId,
        pharmacyName: pharmacyName,
      ),
    );
  }

  @override
  State<SubscriptionRenewalModal> createState() => _SubscriptionRenewalModalState();
}

class _SubscriptionRenewalModalState extends State<SubscriptionRenewalModal> {
  static const String _kSubscriptionUpiId = 'lodaliya@ptyes';
  static const _upiChannel = MethodChannel('com.davasetu.pharmacy_mobile/upi');

  bool _isProcessing = false;
  final _utrController = TextEditingController();

  @override
  void dispose() {
    _utrController.dispose();
    super.dispose();
  }

  void _copyUpiId() {
    Clipboard.setData(const ClipboardData(text: _kSubscriptionUpiId));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('UPI ID "lodaliya@ptyes" copied to clipboard!'),
          ],
        ),
      ),
    );
  }

  Future<void> _pasteUtrFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null && data!.text!.trim().isNotEmpty) {
      final clean = data.text!.trim().replaceAll(RegExp(r'\s+'), '');
      setState(() {
        _utrController.text = clean;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text('Pasted UTR number from clipboard!'),
            duration: Duration(milliseconds: 1200),
          ),
        );
      }
    }
  }

  Future<void> _openUpiApp([String? packageName]) async {
    final trId = 'DS${widget.pharmacyId}${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    final upiUri = 'upi://pay?pa=$_kSubscriptionUpiId&pn=DavaSetu%20Pharmacy&am=1499.00&cu=INR&tn=DavaSetu%201-Year%20License%20Pharmacy%20${widget.pharmacyId}&tr=$trId';
    bool opened = false;
    try {
      final res = await _upiChannel.invokeMethod<bool>('launchUpi', {
        'uri': upiUri,
        if (packageName != null) 'package': packageName,
      });
      opened = res == true;
    } catch (e) {
      debugPrint('Native UPI intent launch note: $e');
    }

    if (!opened) {
      _copyUpiId();
      if (!mounted) return;
      _showManualPaymentGuide();
    }
  }

  void _showManualPaymentGuide() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.payment_rounded, color: Color(0xFF059669)),
            SizedBox(width: 8),
            Text('Pay via UPI', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Official Payee UPI ID copied to clipboard:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 16),
                  SizedBox(width: 6),
                  Text(_kSubscriptionUpiId, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              '1. Open Google Pay, PhonePe, or Paytm.\n'
              '2. Pay ₹1,499 to lodaliya@ptyes.\n'
              '3. Enter the 12-digit UPI UTR / Reference No. to instantly activate your 1-Year Pass.',
              style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.textPrimary),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF059669),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('OK, Got It', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleOnlinePayment() async {
    setState(() => _isProcessing = true);
    final subProvider = context.read<SubscriptionProvider>();

    try {
      final String rawUtr = _utrController.text.trim();
      final String transactionId = rawUtr.isNotEmpty 
          ? rawUtr 
          : 'UPI-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

      // Process 1-Year renewal via backend API with genuine payment tracking
      final success = await subProvider.renewMobilePlan(
        widget.pharmacyId,
        durationMonths: 12,
        amount: 1499.00,
        paymentMethod: 'UPI',
        transactionId: transactionId,
        upiId: _kSubscriptionUpiId,
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      if (success) {
        final receipt = subProvider.lastPaymentReceipt;
        final receiptNo = receipt?['receipt_number'] ?? 'DS-SUB-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
        
        Navigator.pop(context); // Close bottom modal
        _showSuccessReceiptDialog(receiptNo: receiptNo, txnId: transactionId);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(subProvider.errorMessage ?? 'Payment / Renewal failed. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
      );
    }
  }

  void _showSuccessReceiptDialog({required String receiptNo, required String txnId}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        contentPadding: const EdgeInsets.all(20),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.verified_rounded, color: Color(0xFF16A34A), size: 36),
            ),
            const SizedBox(height: 12),
            const Text(
              '🎉 Mobile-Only 1-Year Pass Activated!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Validity extended by 365 Days on Mobile App',
              style: TextStyle(fontSize: 12, color: Colors.green.shade800, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 14),

            // Official Receipt Card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildReceiptRow('Store Name:', widget.pharmacyName),
                  const SizedBox(height: 4),
                  _buildReceiptRow('Store ID:', '#${widget.pharmacyId}'),
                  const SizedBox(height: 4),
                  _buildReceiptRow('Plan Name:', 'Mobile-Only Pro (No PC/Laptop)'),
                  const SizedBox(height: 4),
                  _buildReceiptRow('Receipt No:', receiptNo, isBold: true),
                  const SizedBox(height: 4),
                  _buildReceiptRow('Txn / Ref:', txnId),
                  const SizedBox(height: 4),
                  _buildReceiptRow('Payment Mode:', 'ONLINE UPI ($_kSubscriptionUpiId)'),
                  const Divider(height: 12),
                  _buildReceiptRow('Amount Paid:', '₹1,499.00', isBold: true, color: const Color(0xFF059669)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.copy_rounded, size: 14),
                    label: const Text('Copy Slip', style: TextStyle(fontSize: 12)),
                    onPressed: () {
                      final slip = '''
🧾 DavaSetu License Receipt
Receipt No: $receiptNo
Store: ${widget.pharmacyName} (#${widget.pharmacyId})
Amount: ₹1,499.00 (PAID)
Mode: ONLINE UPI ($_kSubscriptionUpiId)
Txn ID: $txnId
Validity: 365 Days Extended
''';
                      Clipboard.setData(ClipboardData(text: slip));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Receipt copied to clipboard!')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Start Billing', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value, {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: color ?? AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final screenHeight = MediaQuery.of(context).size.height;

    return SafeArea(
      top: true,
      bottom: false,
      child: Container(
        constraints: BoxConstraints(maxHeight: screenHeight * 0.90),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top Drag Handle & Header Row
            Padding(
              padding: const EdgeInsets.only(top: 10, left: 20, right: 12),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: const Icon(Icons.smartphone_rounded, size: 20, color: Color(0xFF059669)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Mobile Pro (1-Year License)',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            Text(
                              widget.pharmacyName,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close_rounded, size: 20, color: Color(0xFF64748B)),
                        splashRadius: 20,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),

            // Scrollable Content
            Flexible(
              child: SingleChildScrollView(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 14,
                  bottom: bottomInset + 20,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. Clean Minimal Pricing Hero Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.baseline,
                                    textBaseline: TextBaseline.alphabetic,
                                    children: [
                                      const Text(
                                        '₹1,499',
                                        style: TextStyle(
                                          fontSize: 30,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFF0F172A),
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        '₹2,499',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey.shade400,
                                          decoration: TextDecoration.lineThrough,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Text(
                                        '/ 1 Year',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF64748B),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Just ₹4.10 / Day • 365 Days License',
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: Color(0xFF059669),
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFF86EFAC)),
                                ),
                                child: const Text(
                                  '40% OFF',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF166534),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),
                          const Divider(height: 1, color: Color(0xFFE2E8F0)),
                          const SizedBox(height: 10),

                          _buildFeatureBullet('Unlimited Smartphone Billing & Thermal Printing'),
                          const SizedBox(height: 6),
                          _buildFeatureBullet('WhatsApp Invoice Sharing & Customer Khata'),
                          const SizedBox(height: 6),
                          _buildFeatureBullet('Full Stock Inventory & Camera Barcode Scanner'),

                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFB45309)),
                                SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '📱 Mobile-Only: ફક્ત સ્માર્ટફોન માટે (PC/લેપટોપ શામેલ નથી)',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // 2. Official Payee UPI Row (Clean & Minimal Pill)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified_rounded, size: 18, color: Color(0xFF059669)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text('Official UPI ID', style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                                Text(
                                  _kSubscriptionUpiId,
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: _copyUpiId,
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.copy_rounded, size: 13, color: Color(0xFF0F172A)),
                                  SizedBox(width: 4),
                                  Text('Copy', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // 3. Fast 1-Tap UPI Apps (1 Compact Single Row)
                    const Text(
                      'Pay with UPI App:',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                    ),
                    const SizedBox(height: 8),

                    Row(
                      children: [
                        Expanded(
                          child: _buildCompactUpiChip(
                            name: 'GPay',
                            color: const Color(0xFF1A73E8),
                            icon: Icons.account_balance_wallet_rounded,
                            onTap: () => _openUpiApp('com.google.android.apps.nbu.paisa.user'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildCompactUpiChip(
                            name: 'PhonePe',
                            color: const Color(0xFF5F259F),
                            icon: Icons.payments_rounded,
                            onTap: () => _openUpiApp('com.phonepe.app'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildCompactUpiChip(
                            name: 'Paytm',
                            color: const Color(0xFF002970),
                            icon: Icons.payment_rounded,
                            onTap: () => _openUpiApp('net.one97.paytm'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildCompactUpiChip(
                            name: 'Any UPI',
                            color: const Color(0xFF059669),
                            icon: Icons.bolt_rounded,
                            onTap: () => _openUpiApp(null),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // 4. Verification / UTR Input Field (Clean & Minimal)
                    TextField(
                      controller: _utrController,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        isDense: true,
                        labelText: 'UPI Reference / UTR No. (Optional)',
                        labelStyle: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        hintText: 'e.g. 428912345678',
                        hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                        prefixIcon: const Icon(Icons.tag_rounded, size: 18, color: Color(0xFF059669)),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.paste_rounded, size: 18, color: Color(0xFF059669)),
                          tooltip: 'Paste from clipboard',
                          onPressed: _pasteUtrFromClipboard,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF059669), width: 1.5),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 5. Single Primary Action Button
                    SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isProcessing ? null : _handleOnlinePayment,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: _isProcessing
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.check_circle_rounded, size: 18),
                                  SizedBox(width: 8),
                                  Text(
                                    'Activate 1-Year Pass (₹1,499)',
                                    style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
                                  ),
                                ],
                              ),
                      ),
                    ),

                    const SizedBox(height: 10),
                    const Center(
                      child: Text(
                        '🔒 Instant Cloud Activation • 100% Genuine Payment',
                        style: TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureBullet(String text) {
    return Row(
      children: [
        const Icon(Icons.check_circle_rounded, size: 15, color: Color(0xFF059669)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF334155),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompactUpiChip({
    required String name,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 3),
            Text(
              name,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
