import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/routes/app_routes.dart';
import '../../services/medicine_request_service.dart';
import '../medicines/models/medicine_request.dart';
import '../../widgets/fade_in_slide.dart';

class MyPrescriptionsScreen extends StatefulWidget {
  const MyPrescriptionsScreen({super.key});

  @override
  State<MyPrescriptionsScreen> createState() => _MyPrescriptionsScreenState();
}

class _MyPrescriptionsScreenState extends State<MyPrescriptionsScreen> {
  List<MedicineRequest> _prescriptions = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchPrescriptions();
  }

  Future<void> _fetchPrescriptions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final requests = await MedicineRequestService.getUserMedicineRequests();
      if (mounted) {
        setState(() {
          _prescriptions = requests
              .where((r) => r.imageReference != null && r.imageReference!.isNotEmpty)
              .toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _showPrescriptionImage(String imageReference) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Align(
              alignment: Alignment.topRight,
              child: IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white, size: 30),
                onPressed: () => Navigator.pop(ctx),
              ),
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: _buildImageWidget(imageReference, fit: BoxFit.contain),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageWidget(String ref, {BoxFit fit = BoxFit.cover}) {
    if (ref.startsWith('data:image')) {
      try {
        final commaIndex = ref.indexOf(',');
        final base64Str = commaIndex != -1 ? ref.substring(commaIndex + 1) : ref;
        final bytes = base64Decode(base64Str);
        return Image.memory(bytes, fit: fit);
      } catch (_) {}
    } else if (ref.startsWith('http')) {
      return Image.network(ref, fit: fit);
    }
    return Container(
      color: const Color(0xFFF1F5F9),
      child: const Center(
        child: Icon(Icons.description_rounded, size: 36, color: Color(0xFF64748B)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'My Prescriptions',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: const Color(0xFF1E293B),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_photo_alternate_rounded, color: Color(0xFF6D28D9)),
            tooltip: 'Upload Prescription',
            onPressed: () async {
              await Navigator.pushNamed(context, AppRoutes.medicineRequest);
              _fetchPrescriptions();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPrescriptions,
        color: const Color(0xFF6D28D9),
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF6D28D9)));
    }

    if (_error != null && _prescriptions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 56, color: Color(0xFF94A3B8)),
              const SizedBox(height: 12),
              Text(
                'Could not load prescriptions',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
              ),
              const SizedBox(height: 6),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _fetchPrescriptions,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Try Again'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6D28D9),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_prescriptions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Color(0xFFF3E8FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.receipt_long_outlined, size: 56, color: Color(0xFF7C3AED)),
              ),
              const SizedBox(height: 18),
              Text(
                'No Prescriptions Uploaded',
                style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
              ),
              const SizedBox(height: 6),
              Text(
                'Upload your doctor prescription to request medicines easily.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () async {
                  await Navigator.pushNamed(context, AppRoutes.medicineRequest);
                  _fetchPrescriptions();
                },
                icon: const Icon(Icons.upload_file_rounded, size: 18),
                label: const Text('Upload Prescription'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6D28D9),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _prescriptions.length,
      itemBuilder: (context, index) {
        final item = _prescriptions[index];
        return FadeInSlide(
          delay: 0.05 * index,
          child: Container(
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: InkWell(
              onTap: () {
                Navigator.pushNamed(
                  context,
                  AppRoutes.medicineRequestDetails,
                  arguments: item,
                );
              },
              borderRadius: BorderRadius.circular(18),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    // Thumbnail
                    GestureDetector(
                      onTap: () => _showPrescriptionImage(item.imageReference!),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: 64,
                          height: 64,
                          child: _buildImageWidget(item.imageReference!),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    // Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.medicineName ?? 'Prescription Order',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            item.pharmacyName ?? 'Pharmacy Partner',
                            style: GoogleFonts.inter(
                              fontSize: 12.5,
                              color: const Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: _getStatusColor(item.status).withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _getStatusLabel(item.status),
                                  style: GoogleFonts.inter(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                    color: _getStatusColor(item.status),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${item.createdAt.day}/${item.createdAt.month}/${item.createdAt.year}',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Color _getStatusColor(MedicineRequestStatus status) {
    switch (status) {
      case MedicineRequestStatus.waiting:
        return const Color(0xFFF59E0B);
      case MedicineRequestStatus.available:
        return const Color(0xFF10B981);
      case MedicineRequestStatus.canArrange:
        return const Color(0xFF3B82F6);
      case MedicineRequestStatus.notAvailable:
        return const Color(0xFFEF4444);
    }
  }

  String _getStatusLabel(MedicineRequestStatus status) {
    switch (status) {
      case MedicineRequestStatus.waiting:
        return 'Waiting';
      case MedicineRequestStatus.available:
        return 'Available';
      case MedicineRequestStatus.canArrange:
        return 'Can Arrange';
      case MedicineRequestStatus.notAvailable:
        return 'Not Available';
    }
  }
}
