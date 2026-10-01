import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../services/medicine_request_service.dart';
import '../medicines/models/medicine_request.dart';

import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<MedicineRequest> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final requests = await MedicineRequestService.getUserMedicineRequests();
      if (mounted) {
        setState(() {
          _requests = requests;
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

  String _getNotificationTitle(MedicineRequestStatus status) {
    switch (status) {
      case MedicineRequestStatus.waiting:
        return 'Request Sent Successfully';
      case MedicineRequestStatus.available:
        return 'Medicines Available!';
      case MedicineRequestStatus.canArrange:
        return 'Pharmacy Can Arrange Medicines';
      case MedicineRequestStatus.notAvailable:
        return 'Medicines Not Available';
    }
  }

  String _getNotificationMessage(MedicineRequest request) {
    final name = request.medicineName ?? 'Image prescription';
    switch (request.status) {
      case MedicineRequestStatus.waiting:
        return 'Your request for $name has been sent to the pharmacy. Please wait for them to respond.';
      case MedicineRequestStatus.available:
        return 'Good news! The pharmacy has $name in stock and is ready for you.';
      case MedicineRequestStatus.canArrange:
        return 'The pharmacy doesn\'t have $name right now but can arrange it for you soon.';
      case MedicineRequestStatus.notAvailable:
        return 'Unfortunately, the pharmacy does not have $name and cannot arrange it.';
    }
  }

  IconData _getNotificationIcon(MedicineRequestStatus status) {
    switch (status) {
      case MedicineRequestStatus.waiting:
        return Icons.access_time_rounded;
      case MedicineRequestStatus.available:
        return Icons.check_circle_rounded;
      case MedicineRequestStatus.canArrange:
        return Icons.inventory_2_rounded;
      case MedicineRequestStatus.notAvailable:
        return Icons.cancel_rounded;
    }
  }

  Color _getNotificationColor(MedicineRequestStatus status) {
    switch (status) {
      case MedicineRequestStatus.waiting:
        return AppColors.warning;
      case MedicineRequestStatus.available:
        return AppColors.success;
      case MedicineRequestStatus.canArrange:
        return AppColors.secondary;
      case MedicineRequestStatus.notAvailable:
        return AppColors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'Notifications',
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
          : _requests.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: _requests.length,
              itemBuilder: (context, index) {
                final request = _requests[index];
                final title = _getNotificationTitle(request.status);
                final message = _getNotificationMessage(request);
                final color = _getNotificationColor(request.status);
                final icon = _getNotificationIcon(request.status);

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
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
                    leading: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    title: Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            message,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            timeago.format(request.createdAt),
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
                );
              },
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
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
            'We will notify you here when the pharmacy\nresponds to your requests.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
