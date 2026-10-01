import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../models/medicine_request.dart';
import '../../../services/medicine_request_service.dart';

class MedicineRequestDetailsScreen extends StatefulWidget {
  final MedicineRequest request;

  const MedicineRequestDetailsScreen({super.key, required this.request});

  @override
  State<MedicineRequestDetailsScreen> createState() => _MedicineRequestDetailsScreenState();
}

class _MedicineRequestDetailsScreenState extends State<MedicineRequestDetailsScreen> {
  late MedicineRequest _request;
  bool _isLoading = false;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _request = widget.request;
    _fetchLatestDetails();
    
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _fetchLatestDetails(isBackground: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchLatestDetails({bool isBackground = false}) async {
    if (!isBackground) {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      final freshData = await MedicineRequestService.getMedicineRequestById(_request.id);
      if (mounted) {
        setState(() {
          _request = freshData;
        });
      }
    } catch (e) {
      if (mounted && !isBackground) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not refresh details: ${e.toString().replaceAll('Exception: ', '')}')),
        );
      }
    } finally {
      if (mounted && !isBackground) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleConfirm() async {
    setState(() => _isLoading = true);
    try {
      final updated = await MedicineRequestService.confirmRequest(_request.id);
      if (mounted) {
        setState(() => _request = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request confirmed successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleCancel() async {
    setState(() => _isLoading = true);
    try {
      final updated = await MedicineRequestService.cancelRequest(_request.id);
      if (mounted) {
        setState(() => _request = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request cancelled.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Request Details'),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchLatestDetails(isBackground: false),
            tooltip: 'Refresh Details',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchLatestDetails(isBackground: false),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Medicine request', style: Theme.of(context).textTheme.titleLarge),
              const Divider(),
              const SizedBox(height: 16),
              
              _buildDetailRow('Medicine name:', _request.medicineName ?? 'Not provided'),
              const SizedBox(height: 16),
              _buildDetailRow('Requested pharmacy:', _request.pharmacyName),
              const SizedBox(height: 16),
              _buildDetailRow('Requested:', '${_request.createdAt.day}/${_request.createdAt.month}/${_request.createdAt.year}'),
              
              if (_request.imageReference != null) ...[
                const SizedBox(height: 16),
                const Text('Request image:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                const SizedBox(height: 8),
                Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.image, size: 40, color: AppColors.border),
                        Text('Image Preview', style: TextStyle(color: AppColors.textHint)),
                      ],
                    ),
                  ),
                ),
              ],
              
              const SizedBox(height: 32),
              Text('Pharmacy response', style: Theme.of(context).textTheme.titleLarge),
              const Divider(),
              const SizedBox(height: 16),
              
              _buildResponseSection(_request),
              
              if (_request.status == MedicineRequestStatus.available || _request.status == MedicineRequestStatus.canArrange)
                ...[
                  const SizedBox(height: 32),
                  Text('Your Confirmation', style: Theme.of(context).textTheme.titleLarge),
                  const Divider(),
                  const SizedBox(height: 16),
                  _buildConfirmationSection(),
                ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
      ],
    );
  }

  Widget _buildResponseSection(MedicineRequest request) {
    Color color;
    String title;
    String message;
    IconData icon;

    switch (request.status) {
      case MedicineRequestStatus.waiting:
        color = AppColors.warning;
        title = 'WAITING';
        message = 'Waiting for pharmacy response...';
        icon = Icons.access_time;
        break;
      case MedicineRequestStatus.available:
        color = AppColors.success;
        title = 'AVAILABLE';
        message = 'Medicine is available at this pharmacy.';
        icon = Icons.check_circle;
        break;
      case MedicineRequestStatus.canArrange:
        color = AppColors.secondary;
        title = 'CAN ARRANGE';
        message = 'The pharmacy can arrange this medicine.';
        icon = Icons.inventory;
        break;
      case MedicineRequestStatus.notAvailable:
        color = AppColors.error;
        title = 'NOT AVAILABLE';
        message = 'This medicine is currently not available.';
        icon = Icons.cancel;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
                const SizedBox(height: 4),
                Text(message, style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 14)),
                if (request.responseMessage != null && request.responseMessage!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '"${request.responseMessage!}"',
                      style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 12),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationSection() {
    if (_request.customerConfirmation == CustomerConfirmationStatus.confirmed) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.success),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: AppColors.success),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Confirmed', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.success)),
                  if (_request.confirmedAt != null)
                    Text('You confirmed this on ${_request.confirmedAt!.day}/${_request.confirmedAt!.month}/${_request.confirmedAt!.year}', 
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (_request.customerConfirmation == CustomerConfirmationStatus.cancelled) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.error),
        ),
        child: const Row(
          children: [
            Icon(Icons.cancel, color: AppColors.error),
            SizedBox(width: 16),
            Text('Request Cancelled', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.error)),
          ],
        ),
      );
    }

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleConfirm,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('CONFIRM REQUEST', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: TextButton(
            onPressed: _isLoading ? null : _handleCancel,
            style: TextButton.styleFrom(
              foregroundColor: AppColors.error,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('Cancel Request'),
          ),
        ),
      ],
    );
  }
}
