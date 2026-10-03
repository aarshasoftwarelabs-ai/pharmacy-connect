import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../../services/medicine_request_service.dart';
import '../models/medicine_request.dart';
import '../../../widgets/app_button.dart';
import '../../../widgets/fade_in_slide.dart';
import '../../../widgets/app_refresh_indicator.dart';

class MedicineRequestsScreen extends StatefulWidget {
  const MedicineRequestsScreen({super.key});

  @override
  State<MedicineRequestsScreen> createState() => _MedicineRequestsScreenState();
}

class _MedicineRequestsScreenState extends State<MedicineRequestsScreen> {
  List<MedicineRequest> _requests = [];
  bool _isLoading = true;
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
    }

    try {
      final data = await MedicineRequestService.getUserMedicineRequests();
      if (mounted) {
        setState(() {
          _requests = data;
          _isLoading = false;
          if (!isBackgroundRefresh) _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        if (!isBackgroundRefresh) {
          setState(() {
            _error = e.toString().replaceAll('Exception: ', '');
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'My Orders',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w600,
            fontSize: 22,
            color: const Color(0xFF1E293B),
            letterSpacing: -0.5,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _requests.isEmpty && _error == null) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    if (_error != null && _requests.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF2F2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFEF4444)),
              ),
              const SizedBox(height: 24),
              Text(
                'Unable to load your requests',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: const Color(0xFF64748B),
                  fontSize: 15,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
              AppButton(
                text: 'Retry',
                onPressed: () => _fetchRequests(isBackgroundRefresh: false),
              ),
            ],
          ),
        ),
      );
    }

    if (_requests.isEmpty) {
      return AppRefreshIndicator(
        onRefresh: () => _fetchRequests(isBackgroundRefresh: false),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Container(
            height: MediaQuery.of(context).size.height * 0.7,
            alignment: Alignment.center,
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF94A3B8).withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.inbox_outlined,
                    size: 64,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'No medicine requests yet',
                  style: GoogleFonts.outfit(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'When you ask a pharmacy for a medicine, your requests will appear here.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 15,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 40),
                Container(
                  width: double.infinity,
                  height: 56,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F766E), Color(0xFF047857)],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F766E).withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushReplacementNamed(
                        context,
                        AppRoutes.medicineRequest,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      'Ask for Medicine',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return AppRefreshIndicator(
      onRefresh: () => _fetchRequests(isBackgroundRefresh: false),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        itemCount: _requests.length,
        itemBuilder: (context, index) {
          final req = _requests[index];
          return _buildRequestCard(context, req, index);
        },
      ),
    );
  }

  Widget _buildRequestCard(BuildContext context, MedicineRequest req, int index) {
    Color accentColor;
    Color bgColor;
    switch (req.status) {
      case MedicineRequestStatus.waiting:
        accentColor = const Color(0xFFF59E0B);
        bgColor = const Color(0xFFFFFBEB);
        break;
      case MedicineRequestStatus.available:
        accentColor = const Color(0xFF10B981);
        bgColor = const Color(0xFFECFDF5);
        break;
      case MedicineRequestStatus.canArrange:
        accentColor = const Color(0xFF3B82F6);
        bgColor = const Color(0xFFEFF6FF);
        break;
      case MedicineRequestStatus.notAvailable:
        accentColor = const Color(0xFFEF4444);
        bgColor = const Color(0xFFFEF2F2);
        break;
    }

    // Fix animation bug by clamping index to max 10 for delay calculation
    final double animDelay = 0.1 + ((index < 10 ? index : 9) * 0.1);

    return FadeInSlide(
      delay: animDelay,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(0.04),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
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
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            req.imageReference != null
                                ? Icons.document_scanner_rounded
                                : Icons.medication_rounded,
                            color: accentColor,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                req.medicineName ?? 'Prescription Request',
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 18,
                                  color: const Color(0xFF1E293B),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.storefront_rounded,
                                    size: 14,
                                    color: Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      req.pharmacyName,
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        color: const Color(0xFF64748B),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Divider(height: 1, color: Color(0xFFF1F5F9)),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.access_time_rounded,
                              size: 14,
                              color: Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${req.createdAt.day}/${req.createdAt.month}/${req.createdAt.year}',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                        _buildStatusBadge(req.status, accentColor, bgColor),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(MedicineRequestStatus status, Color color, Color bgColor) {
    String text;
    switch (status) {
      case MedicineRequestStatus.waiting:
        text = 'WAITING';
        break;
      case MedicineRequestStatus.available:
        text = 'AVAILABLE';
        break;
      case MedicineRequestStatus.canArrange:
        text = 'CAN ARRANGE';
        break;
      case MedicineRequestStatus.notAvailable:
        text = 'UNAVAILABLE';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
