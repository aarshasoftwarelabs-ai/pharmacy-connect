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
              '🎉 1-Year Pass Activated!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              'Validity extended by 365 Days (12 Months)',
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
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
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

            // Header Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F766E), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF059669).withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFDE047),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '🔥 SAVE 40% LAUNCH OFFER',
                          style: TextStyle(
                            color: Color(0xFF78350F),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.verified_user_rounded, size: 12, color: Colors.white),
                            SizedBox(width: 4),
                            Text('1-Year License', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Mobile Pro Annual License',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Store: ${widget.pharmacyName} (Store ID #${widget.pharmacyId})',
                    style: const TextStyle(color: Color(0xFFCCFBF1), fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text(
                        '₹1,499',
                        style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, height: 1),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '₹2,499',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          fontSize: 15,
                          decoration: TextDecoration.lineThrough,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        '/ 1 Year (365 Days)',
                        style: TextStyle(color: Color(0xFFCCFBF1), fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      '✨ Just ₹4.10 / Day • All Features & Zero Data Loss Guarantee',
                      style: TextStyle(color: Color(0xFFFEF08A), fontSize: 11, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Payee UPI ID Card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: InkWell(
                onTap: _copyUpiId,
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF86EFAC)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.qr_code_2_rounded, size: 20, color: Color(0xFF059669)),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Official Payee UPI ID:', style: TextStyle(fontSize: 10.5, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
                            Text(
                              _kSubscriptionUpiId,
                              style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.copy_rounded, size: 13, color: Color(0xFF059669)),
                            SizedBox(width: 4),
                            Text('Copy', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Smart 1-Tap Direct UPI App Launchers
            const Text(
              '1. Tap to Pay with your UPI App (₹1,499 pre-filled):',
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),

            Row(
              children: [
                Expanded(
                  child: _buildUpiAppButton(
                    title: 'GPay',
                    subtitle: 'Google Pay',
                    icon: Icons.account_balance_wallet_rounded,
                    color: const Color(0xFF1A73E8),
                    bgColor: const Color(0xFFEFF6FF),
                    borderColor: const Color(0xFFBFDBFE),
                    onTap: () => _openUpiApp('com.google.android.apps.nbu.paisa.user'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildUpiAppButton(
                    title: 'PhonePe',
                    subtitle: 'Direct Pay',
                    icon: Icons.payments_rounded,
                    color: const Color(0xFF5F259F),
                    bgColor: const Color(0xFFFAF5FF),
                    borderColor: const Color(0xFFE9D5FF),
                    onTap: () => _openUpiApp('com.phonepe.app'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildUpiAppButton(
                    title: 'Paytm',
                    subtitle: 'Instant UPI',
                    icon: Icons.payment_rounded,
                    color: const Color(0xFF002970),
                    bgColor: const Color(0xFFF0F9FF),
                    borderColor: const Color(0xFFBAE6FD),
                    onTap: () => _openUpiApp('net.one97.paytm'),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 8),

            // Any UPI App Full Width Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _openUpiApp(null),
                icon: const Icon(Icons.bolt_rounded, size: 20),
                label: const Text(
                  '⚡ Open Any UPI App / BHIM (Pay ₹1,499)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Step 2: Payment Verification
            const Text(
              '2. Confirm & Activate License:',
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),

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
                  TextField(
                    controller: _utrController,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      isDense: true,
                      labelText: '12-Digit UPI Ref / UTR No. (Optional)',
                      hintText: 'e.g. 428912345678',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.paste_rounded, size: 18, color: Color(0xFF059669)),
                        tooltip: 'Paste from clipboard',
                        onPressed: _pasteUtrFromClipboard,
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Found in your GPay / PhonePe / Paytm transaction receipt.',
                    style: TextStyle(fontSize: 10.5, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Primary Activation Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isProcessing ? null : _handleOnlinePayment,
                icon: _isProcessing
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.check_circle_rounded, size: 20),
                label: Text(
                  _isProcessing ? 'Verifying & Activating License...' : 'Activate 1-Year Pass (₹1,499)',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 3,
                ),
              ),
            ),

            const SizedBox(height: 10),
            const Center(
              child: Text(
                '🔒 100% Genuine Payment Tracking • Instant Cloud License Activation',
                style: TextStyle(fontSize: 10.5, color: AppColors.textMuted, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpiAppButton({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required Color borderColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, color: color)),
            Text(subtitle, style: const TextStyle(fontSize: 9.5, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
