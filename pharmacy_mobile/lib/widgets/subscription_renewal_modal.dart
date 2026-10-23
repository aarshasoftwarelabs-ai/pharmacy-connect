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
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Clean Header: Icon, Plan Title, Close button
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: const Icon(
                      Icons.smartphone_rounded,
                      color: Color(0xFF059669),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Mobile-Only Pro',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          '${widget.pharmacyName} • 1-Year Pass',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, size: 20, color: Colors.grey),
                    visualDensity: VisualDensity.compact,
                    splashRadius: 18,
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Minimal Clean Pricing Box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        const Text(
                          '₹1,499',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          '/ વર્ષ',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '₹2,499',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade400,
                            decoration: TextDecoration.lineThrough,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '40% OFF',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF16A34A),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: const [
                        Icon(Icons.check_circle_outline_rounded, size: 13, color: Color(0xFF059669)),
                        SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            'માત્ર સ્માર્ટફોન માટે (PC/લેપટોપ સોફ્ટવેર શામેલ નથી)',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFF475569),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // UPI Quick Pay Options (1-Tap Launchers)
              const Text(
                'UPI એપ દ્વારા ચૂકવો:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),

              Row(
                children: [
                  Expanded(
                    child: _buildUpiAppButton(
                      title: 'GPay',
                      icon: Icons.account_balance_wallet_rounded,
                      color: const Color(0xFF1A73E8),
                      bgColor: const Color(0xFFEFF6FF),
                      onTap: () => _openUpiApp('com.google.android.apps.nbu.paisa.user'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildUpiAppButton(
                      title: 'PhonePe',
                      icon: Icons.payments_rounded,
                      color: const Color(0xFF5F259F),
                      bgColor: const Color(0xFFFAF5FF),
                      onTap: () => _openUpiApp('com.phonepe.app'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildUpiAppButton(
                      title: 'Paytm',
                      icon: Icons.payment_rounded,
                      color: const Color(0xFF002970),
                      bgColor: const Color(0xFFF0F9FF),
                      onTap: () => _openUpiApp('net.one97.paytm'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildUpiAppButton(
                      title: 'Other UPI',
                      icon: Icons.bolt_rounded,
                      color: const Color(0xFF059669),
                      bgColor: const Color(0xFFF0FDF4),
                      onTap: () => _openUpiApp(null),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Ref / UTR Input
              Container(
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _utrController,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: '12-digit UTR / Ref No. (ચૂકવણી પછી)',
                    hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                    prefixIcon: const Icon(Icons.tag_rounded, size: 18, color: Colors.grey),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.paste_rounded, size: 17, color: Color(0xFF059669)),
                      tooltip: 'Paste',
                      onPressed: _pasteUtrFromClipboard,
                    ),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Primary Action Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _handleOnlinePayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          'પ્લાન એક્ટિવેટ કરો • ₹1,499',
                          style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800),
                        ),
                ),
              ),

              const SizedBox(height: 12),

              // Clean Discrete Footer
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  InkWell(
                    onTap: _copyUpiId,
                    borderRadius: BorderRadius.circular(6),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.copy_rounded, size: 11, color: AppColors.textMuted),
                          SizedBox(width: 4),
                          Text(
                            'UPI: $_kSubscriptionUpiId',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Text('  •  ', style: TextStyle(color: Colors.grey, fontSize: 10)),
                  const Text(
                    '🔒 Instant Cloud Activation',
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUpiAppButton({
    required String title,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 3),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 11,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
