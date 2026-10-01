import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../../services/medicine_request_service.dart';
import '../models/medicine_request.dart';
import '../../../widgets/app_button.dart';

class MedicineRequestsScreen extends StatefulWidget {
  const MedicineRequestsScreen({super.key});

  @override
  State<MedicineRequestsScreen> createState() => _MedicineRequestsScreenState();
}

class _MedicineRequestsScreenState extends State<MedicineRequestsScreen> {
  List<MedicineRequest> _requests = [];
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _error;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchRequests();
    
    // Auto-polling every 15 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _fetchRequests(isBackgroundRefresh: true);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchRequests({bool isBackgroundRefresh = false}) async {
    if (!isBackgroundRefresh && _requests.isEmpty) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    } else if (isBackgroundRefresh) {
      if (!mounted) return;
      setState(() {
        _isRefreshing = true;
      });
    }

    try {
      final data = await MedicineRequestService.getUserMedicineRequests();
      if (mounted) {
        setState(() {
          _requests = data;
          _isLoading = false;
          _isRefreshing = false;
          if (!isBackgroundRefresh) _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        if (!isBackgroundRefresh) {
          setState(() {
            _error = e.toString().replaceAll('Exception: ', '');
            _isLoading = false;
            _isRefreshing = false;
          });
        } else {
          // Keep old data, just hide refresh indicator and maybe show tiny snackbar
          setState(() {
            _isRefreshing = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Unable to connect. Retrying...'),
              duration: const Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Orders', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          if (_isRefreshing)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchRequests(isBackgroundRefresh: false),
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _requests.isEmpty && _error == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _requests.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text('Unable to load your requests.', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => _fetchRequests(isBackgroundRefresh: false),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_requests.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => _fetchRequests(isBackgroundRefresh: false),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.7,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.inbox_outlined, size: 64, color: AppColors.textHint.withValues(alpha: 0.5)),
                const SizedBox(height: 16),
                Text('No medicine requests yet', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text(
                  'When you ask a pharmacy for a medicine,\nyour requests will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 32),
                AppButton(
                  text: 'Ask for Medicine',
                  onPressed: () {
                    Navigator.pushReplacementNamed(context, AppRoutes.medicineRequest);
                  },
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchRequests(isBackgroundRefresh: false),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final req = _requests[index];
          return _buildRequestCard(context, req);
        },
      ),
    );
  }

  Widget _buildRequestCard(BuildContext context, MedicineRequest req) {
    // Determine accent color based on status
    Color accentColor;
    switch (req.status) {
      case MedicineRequestStatus.waiting:
        accentColor = AppColors.warning;
        break;
      case MedicineRequestStatus.available:
        accentColor = AppColors.success;
        break;
      case MedicineRequestStatus.canArrange:
        accentColor = AppColors.secondary;
        break;
      case MedicineRequestStatus.notAvailable:
        accentColor = AppColors.error;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () async {
              await Navigator.pushNamed(
                context,
                AppRoutes.medicineRequestDetails,
                arguments: req,
              );
              _fetchRequests(isBackgroundRefresh: true);
            },
            child: IntrinsicHeight(
              child: Row(
                children: [
                  // Accent line
                  Container(width: 4, color: accentColor),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: accentColor.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  req.imageReference != null ? Icons.document_scanner : Icons.edit_note,
                                  color: accentColor,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      req.medicineName ?? 'Prescription Upload',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(Icons.storefront, size: 14, color: AppColors.textHint),
                                        const SizedBox(width: 4),
                                        Text(req.pharmacyName, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(height: 1, color: AppColors.border),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.access_time, size: 14, color: AppColors.textHint),
                                  const SizedBox(width: 4),
                                  Text('${req.createdAt.day}/${req.createdAt.month}/${req.createdAt.year}', style: const TextStyle(fontSize: 12, color: AppColors.textHint)),
                                ],
                              ),
                              _buildStatusBadge(req.status),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(MedicineRequestStatus status) {
    Color color;
    String text;
    
    switch (status) {
      case MedicineRequestStatus.waiting:
        color = AppColors.warning;
        text = 'WAITING';
        break;
      case MedicineRequestStatus.available:
        color = AppColors.success;
        text = 'AVAILABLE';
        break;
      case MedicineRequestStatus.canArrange:
        color = AppColors.secondary;
        text = 'CAN ARRANGE';
        break;
      case MedicineRequestStatus.notAvailable:
        color = AppColors.error;
        text = 'NOT AVAILABLE';
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5),
      ),
    );
  }
}
