import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/subscription_provider.dart';

/// Google Play-compliant Store License & Plan Status sheet.
/// Displays current plan validity synced from the server without any external
/// in-app checkout links or UPI intents.
class SubscriptionRenewalModal extends StatefulWidget {
  final int pharmacyId;
  final String pharmacyName;

  const SubscriptionRenewalModal({
    super.key,
    required this.pharmacyId,
    required this.pharmacyName,
  });

  static Future<void> show(
    BuildContext context, {
    required int pharmacyId,
    required String pharmacyName,
  }) {
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
  bool _isRefreshing = false;

  Future<void> _refreshStatus() async {
    setState(() => _isRefreshing = true);
    await context.read<SubscriptionProvider>().fetchSubscription(widget.pharmacyId);
    if (!mounted) return;
    setState(() => _isRefreshing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text('Store license status synced from cloud.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final sub = context.watch<SubscriptionProvider>().subscription;
    final isExpired = sub?.isExpired ?? false;
    final isExpiringSoon = sub?.isExpiringSoon ?? false;
    final isLifetime = sub?.isLifetime ?? false;

    final badgeColor = isExpired
        ? const Color(0xFFDC2626)
        : isExpiringSoon
            ? const Color(0xFFD97706)
            : const Color(0xFF16A34A);
    final badgeBg = isExpired
        ? const Color(0xFFFEE2E2)
        : isExpiringSoon
            ? const Color(0xFFFEF3C7)
            : const Color(0xFFDCFCE7);
    final statusLabel = isExpired
        ? 'EXPIRED'
        : isExpiringSoon
            ? 'EXPIRING SOON'
            : isLifetime
                ? 'LIFETIME'
                : 'ACTIVE';

    return SafeArea(
      top: true,
      bottom: false,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
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
            const SizedBox(height: 14),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: const Icon(Icons.verified_user_rounded, size: 22, color: Color(0xFF059669)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Store License Details',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        '${widget.pharmacyName} • Store #${widget.pharmacyId}',
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
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          sub?.planName ?? 'Standard Plan',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: badgeBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: badgeColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildInfoRow(
                    'Remaining Validity:',
                    isLifetime
                        ? 'Lifetime Access'
                        : isExpired
                            ? 'Expired (0 days left)'
                            : '${sub?.daysRemaining ?? 14} days remaining',
                  ),
                  if (sub?.subscriptionEndDate != null) ...[
                    const SizedBox(height: 4),
                    _buildInfoRow(
                      'Valid Till:',
                      sub!.subscriptionEndDate!.split('T').first,
                    ),
                  ],
                  const SizedBox(height: 12),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),
                  const SizedBox(height: 10),
                  _buildFeatureBullet('Counter POS Billing & Thermal Receipt Printing'),
                  const SizedBox(height: 6),
                  _buildFeatureBullet('Camera Barcode & Batch/Expiry Scanner'),
                  const SizedBox(height: 6),
                  _buildFeatureBullet('Inventory, Schedule H1 Register & Cloud Sync'),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF1D4ED8)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Your store license is managed by your DavaSetu PC Software or pharmacy administrator. Once activated, tap Refresh below to sync your mobile access.',
                      style: TextStyle(
                        fontSize: 11.5,
                        color: Color(0xFF1E40AF),
                        height: 1.4,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 46,
              child: ElevatedButton.icon(
                onPressed: _isRefreshing ? null : _refreshStatus,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                icon: _isRefreshing
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.sync_rounded, size: 18),
                label: Text(
                  _isRefreshing ? 'Checking License...' : 'Refresh License Status',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        Text(
          value,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
      ],
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
}
