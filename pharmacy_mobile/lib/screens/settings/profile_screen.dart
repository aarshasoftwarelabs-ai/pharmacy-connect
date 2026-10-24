import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/storage_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/billing_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../widgets/subscription_renewal_modal.dart';
import '../../widgets/bluetooth_printer_modal.dart';
import '../../widgets/messaging_gateway_modal.dart';
import '../../core/services/thermal_printer_service.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      context.read<SubscriptionProvider>().fetchSubscription(auth.pharmacyId);
    });
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Text('$label copied to clipboard!'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final subProvider = context.watch<SubscriptionProvider>();
    final sub = subProvider.subscription;
    final pharmacy = StorageService.getPharmacy();
    final phoneStr = auth.user?.phone?.isNotEmpty == true ? auth.user!.phone! : (pharmacy?['phone']?.toString() ?? 'Not provided');
    final emailStr = auth.user?.email.isNotEmpty == true ? auth.user!.email : (pharmacy?['email']?.toString() ?? 'Not provided');
    final gstStr = pharmacy?['gstin']?.toString() ?? 'Not registered';
    final dlStr = pharmacy?['drug_license_number']?.toString() ?? pharmacy?['reg_no']?.toString() ?? 'Not provided';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Store Profile & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Futuristic Glassmorphic Pharmacy Profile Hero
            Container(
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: AppColors.glowShadow,
              ),
              child: Stack(
                children: [
                  // Decorative background shapes
                  Positioned(
                    right: -20,
                    top: -20,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                  ),
                  Positioned(
                    left: -30,
                    bottom: -30,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.05),
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      children: [
                        // Store Avatar & Verified Badge
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.15),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 34,
                                backgroundColor: Colors.white,
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    gradient: AppColors.emeraldGradient,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.local_pharmacy_rounded, size: 28, color: Colors.white),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.verified_rounded, color: Color(0xFF6EE7B7), size: 13),
                                        SizedBox(width: 4),
                                        Text(
                                          'VERIFIED PHARMACY',
                                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.6),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    auth.pharmacyName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Logged in as ${auth.userName} • ${auth.role.toUpperCase()}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),
                        Divider(color: Colors.white.withValues(alpha: 0.2), height: 1),
                        const SizedBox(height: 14),

                        // Store Quick Actions Row
                        Row(
                          children: [
                            _buildHeroAction(
                              icon: Icons.phone_in_talk_rounded,
                              label: 'Call Store',
                              onTap: () => _copyToClipboard(phoneStr, 'Phone number'),
                            ),
                            const SizedBox(width: 8),
                            _buildHeroAction(
                              icon: Icons.alternate_email_rounded,
                              label: 'Email',
                              onTap: () => _copyToClipboard(emailStr, 'Email address'),
                            ),
                            const SizedBox(width: 8),
                            _buildHeroAction(
                              icon: Icons.badge_outlined,
                              label: 'Copy GST',
                              onTap: () => _copyToClipboard(gstStr, 'GSTIN'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 1.5 Mobile Pro Subscription & License Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF8FAFC), Colors.white],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: (sub?.isExpired ?? false)
                      ? const Color(0xFFFCA5A5)
                      : (sub?.isExpiringSoon ?? false)
                          ? const Color(0xFFFDE68A)
                          : const Color(0xFFA7F3D0),
                  width: 1.5,
                ),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF0F766E), Color(0xFF059669)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    sub?.planName ?? 'Mobile-Only Pro (1-Year Pass)',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5, color: AppColors.textPrimary),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (sub?.isExpired ?? false)
                                        ? const Color(0xFFFEE2E2)
                                        : (sub?.isExpiringSoon ?? false)
                                            ? const Color(0xFFFEF3C7)
                                            : const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    (sub?.isExpired ?? false)
                                        ? 'EXPIRED'
                                        : (sub?.isExpiringSoon ?? false)
                                            ? 'EXPIRING SOON'
                                            : (sub?.isLifetime ?? false)
                                                ? 'LIFETIME'
                                                : '${sub?.daysRemaining ?? 365}d LEFT',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: (sub?.isExpired ?? false)
                                          ? const Color(0xFFDC2626)
                                          : (sub?.isExpiringSoon ?? false)
                                              ? const Color(0xFFD97706)
                                              : const Color(0xFF16A34A),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              sub?.subscriptionEndDate != null
                                  ? 'Valid till: ${sub!.subscriptionEndDate!.split('T')[0]} • Smartphone Only (No PC)'
                                  : '1-Year Pass • Smartphone Billing Only (No PC required)',
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.flash_on_rounded, size: 14, color: Color(0xFFD97706)),
                              SizedBox(width: 4),
                              Text(
                                '₹1,499 / Year (₹4.10/day)',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton.icon(
                        onPressed: () {
                          SubscriptionRenewalModal.show(
                            context,
                            pharmacyId: auth.pharmacyId,
                            pharmacyName: auth.pharmacyName,
                          );
                        },
                        icon: const Icon(Icons.autorenew_rounded, size: 14),
                        label: Text(
                          (sub?.isExpired ?? false) ? 'Renew Now' : 'Renew / Extend',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 2. Cloud Database Connection Status (Clean, Non-Technical)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.softShadow,
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Icon(Icons.cloud_done_rounded, color: Color(0xFF059669), size: 26),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Cloud Database Synced',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                            ),
                            SizedBox(width: 6),
                            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                          ],
                        ),
                        SizedBox(height: 4),
                        Text(
                          'All medicines, POS bills & customers are securely backed up in realtime.',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 3. Store Credentials & Compliance Cards
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Store Identification & Licenses',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 14),
                  _buildSmartRow(
                    icon: Icons.badge_outlined,
                    label: 'Drug License',
                    value: dlStr,
                    badge: dlStr != 'Not provided' ? 'ACTIVE' : 'NOT SET',
                    badgeColor: dlStr != 'Not provided' ? AppColors.success : AppColors.textMuted,
                    badgeBg: dlStr != 'Not provided' ? AppColors.successBg : const Color(0xFFF1F5F9),
                    onCopy: () => _copyToClipboard(dlStr, 'Drug License'),
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1)),
                  _buildSmartRow(
                    icon: Icons.receipt_long_outlined,
                    label: 'GSTIN Registration',
                    value: gstStr,
                    badge: gstStr != 'Not registered' ? 'VERIFIED' : 'UNREGISTERED',
                    badgeColor: gstStr != 'Not registered' ? AppColors.primary : AppColors.textMuted,
                    badgeBg: gstStr != 'Not registered' ? AppColors.primarySubtle : const Color(0xFFF1F5F9),
                    onCopy: () => _copyToClipboard(gstStr, 'GSTIN'),
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1)),
                  _buildSmartRow(
                    icon: Icons.phone_android_rounded,
                    label: 'Pharmacy Helpline',
                    value: phoneStr,
                    badge: 'CALL',
                    badgeColor: Colors.blue,
                    badgeBg: AppColors.infoBg,
                    onCopy: () => _copyToClipboard(phoneStr, 'Phone'),
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1)),
                  _buildSmartRow(
                    icon: Icons.mail_outline_rounded,
                    label: 'Official Email',
                    value: emailStr,
                    badge: 'OFFICIAL',
                    badgeColor: Colors.indigo,
                    badgeBg: Colors.indigo.shade50,
                    onCopy: () => _copyToClipboard(emailStr, 'Email'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 4. System Diagnostics & App Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primarySubtle,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.shield_outlined, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('DavaSetu Mobile POS Engine', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        SizedBox(height: 2),
                        Text('v1.4.0 • Enterprise Edition • Local & Cloud Sync', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 4.5 Bluetooth Thermal Hardware Printer
            FutureBuilder<String?>(
              future: ThermalPrinterService.instance.getSavedPrinterName(),
              builder: (ctx, snapshot) {
                final printerName = snapshot.data;
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.cardBorder),
                    boxShadow: AppColors.softShadow,
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () async {
                        await BluetoothPrinterModal.show(context, storeName: auth.pharmacyName);
                        setState(() {});
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFDBEAFE)),
                              ),
                              child: const Icon(Icons.print_rounded, color: Color(0xFF2563EB), size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Text(
                                        'Thermal Receipt Printer',
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                                      ),
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                        decoration: BoxDecoration(
                                          color: printerName != null ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          printerName != null ? 'CONNECTED' : 'NOT SET',
                                          style: TextStyle(
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w800,
                                            color: printerName != null ? const Color(0xFF15803D) : AppColors.textMuted,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    printerName != null
                                        ? '$printerName (58mm/80mm Ready)'
                                        : 'Connect ₹1,500 - ₹2,000 Bluetooth POS printer',
                                    style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 22),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 16),

            // 4.6 Automated WhatsApp & SMS Gateway Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.softShadow,
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () async {
                    await MessagingGatewayModal.show(context, pharmacyName: auth.pharmacyName);
                    setState(() {});
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: const Icon(Icons.mark_chat_unread_rounded, color: Color(0xFF059669), size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'Auto WhatsApp / SMS',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'ACTIVE',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF15803D),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              const Text(
                                'Auto-sends digital receipts upon checkout',
                                style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 22),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),

            // 5. Logout Button
            OutlinedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Logout Session'),
                    content: const Text('Are you sure you want to log out of DavaSetu Pharmacy Mobile?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                        onPressed: () async {
                          Navigator.pop(ctx);
                          final billing = context.read<BillingProvider>();
                          billing.clearCart();
                          await auth.logout();
                          if (context.mounted) {
                            Navigator.pushAndRemoveUntil(
                              context,
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                              (route) => false,
                            );
                          }
                        },
                        child: const Text('Log Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: Color(0xFFFCA5A5)),
                backgroundColor: const Color(0xFFFEF2F2),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign Out of Terminal', style: TextStyle(fontWeight: FontWeight.bold)),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroAction({required IconData icon, required String label, required VoidCallback onTap}) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: Colors.white),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }


  Widget _buildSmartRow({
    required IconData icon,
    required String label,
    required String value,
    required String badge,
    required Color badgeColor,
    required Color badgeBg,
    required VoidCallback onCopy,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(6)),
          child: Text(
            badge,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: badgeColor, letterSpacing: 0.5),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.copy_rounded, size: 16, color: AppColors.textMuted),
          tooltip: 'Copy',
          onPressed: onCopy,
        ),
      ],
    );
  }
}
