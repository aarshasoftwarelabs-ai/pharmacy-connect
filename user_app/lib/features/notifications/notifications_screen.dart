import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../services/notification_service.dart';
import '../../widgets/fade_in_slide.dart';
import '../medicines/models/medicine.dart';
import '../../core/routes/app_routes.dart';
import 'dart:ui';
import 'package:google_fonts/google_fonts.dart';

import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _notifications = [];
  bool _isLoading = true;

  // Dummy data for Phase 1 Demo
  final List<Medicine> _myMedicines = [
    Medicine(
      id: '1',
      name: 'Crocin Advance',
      dosage: '500mg',
      currentStock: 3, // Will trigger refill alert (<= 3 days)
      dosagePerDay: 1,
      createdAt: DateTime.now(),
    ),
    Medicine(
      id: '2',
      name: 'Pan-D Capsule',
      dosage: '40mg',
      currentStock: 15,
      dosagePerDay: 1,
      createdAt: DateTime.now(),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final notifs = await NotificationService.getNotifications();
      if (mounted) {
        setState(() {
          _notifications = notifs;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading notifications: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  IconData _getNotificationIcon(String type) {
    if (type.contains('REQUEST')) {
      if (type.contains('NOT_AVAILABLE')) return Icons.cancel_rounded;
      if (type.contains('CAN_ARRANGE')) return Icons.inventory_2_rounded;
      return Icons.check_circle_rounded;
    }
    if (type.contains('BILL')) return Icons.receipt_rounded;
    return Icons.notifications_active_rounded;
  }

  Color _getNotificationColor(String type) {
    if (type.contains('NOT_AVAILABLE')) return AppColors.error;
    if (type.contains('CAN_ARRANGE')) return AppColors.secondary;
    if (type.contains('AVAILABLE') || type.contains('READY') || type.contains('CREATED')) return AppColors.success;
    return AppColors.primary;
  }

  Future<void> _markAsRead(AppNotification notification) async {
    if (notification.isRead) return;
    try {
      await NotificationService.markAsRead(notification.id);
      setState(() {
        final index = _notifications.indexWhere((n) => n.id == notification.id);
        if (index != -1) {
          _notifications[index] = AppNotification(
            id: notification.id,
            recipientUserId: notification.recipientUserId,
            pharmacyId: notification.pharmacyId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            referenceType: notification.referenceType,
            referenceId: notification.referenceId,
            isRead: true,
            createdAt: notification.createdAt,
          );
        }
      });
    } catch (e) {
      debugPrint('Error marking as read: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Action Center',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Smart Alerts Section
                  _buildActionCenter(context),
                  const SizedBox(height: 24),

                  // Notifications Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Text(
                      'Recent Updates',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (_notifications.isEmpty)
                    _buildEmptyState()
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notification = _notifications[index];
                        final color = _getNotificationColor(notification.type);
                        final icon = _getNotificationIcon(notification.type);

                        return FadeInSlide(
                          delay: 0.1 + (index * 0.1),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: notification.isRead ? Colors.white : Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                              border: Border.all(
                                color: Colors.grey.withValues(alpha: 0.1),
                              ),
                            ),
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(16),
                              onTap: () => _markAsRead(notification),
                              leading: Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(icon, color: color, size: 24),
                              ),
                              title: Text(
                                notification.title,
                                style: TextStyle(
                                  fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.bold,
                                  fontSize: 16,
                                  color: notification.isRead ? Colors.black87 : Colors.black,
                                ),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 8.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      notification.message,
                                      style: TextStyle(
                                        color: notification.isRead ? AppColors.textSecondary : Colors.black87,
                                        height: 1.4,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      timeago.format(notification.createdAt),
                                      style: const TextStyle(
                                        color: AppColors.textHint,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildActionCenter(BuildContext context) {
    // Find medicines that need refill
    final refillMedicines = _myMedicines.where((m) => m.needsRefill).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Smart Alerts',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(width: 8),
              if (refillMedicines.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${refillMedicines.length}',
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          if (refillMedicines.isNotEmpty)
            _buildPremiumRefillAlert(context, refillMedicines.first)
          else
            _buildPremiumAllGood(context),
        ],
      ),
    );
  }

  Widget _buildPremiumRefillAlert(BuildContext context, Medicine med) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            const Color(0xFFFEF2F2),
            const Color(0xFFFEE2E2).withOpacity(0.5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEF4444).withOpacity(0.12),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
          BoxShadow(
            color: Colors.white.withOpacity(0.8),
            blurRadius: 10,
            offset: const Offset(-5, -5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Glowing Icon Container
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFEF4444).withOpacity(0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.warning_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Refill: ${med.name}',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                          color: const Color(0xFF7F1D1D),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${med.currentStock} tablets (${med.remainingDays} days left)',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF991B1B),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Premium Order Button
                GestureDetector(
                  onTap: () {
                    Navigator.pushNamed(context, AppRoutes.medicineRequest);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFEF4444).withOpacity(0.15),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Text(
                      'Order',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFFDC2626),
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumAllGood(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [
            const Color(0xFFF0FDF4),
            const Color(0xFFDCFCE7).withOpacity(0.5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.08),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF059669)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF10B981).withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.white,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Stock is Good',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                          color: const Color(0xFF064E3B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'No refills needed right now.',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF065F46),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: FadeInSlide(
        delay: 0.1,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.notifications_off_rounded,
                size: 64,
                color: AppColors.primaryLight,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'No Notifications Yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'We will notify you here about updates.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
