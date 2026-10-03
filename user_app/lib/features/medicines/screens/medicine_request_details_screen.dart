import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../models/medicine_request.dart';
import '../../../services/medicine_request_service.dart';
import '../../../widgets/fade_in_slide.dart';
import '../../../widgets/app_refresh_indicator.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        title: Text(
          'Request Details',
          style: GoogleFonts.outfit(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
      ),
      body: AppRefreshIndicator(
        onRefresh: () => _fetchLatestDetails(isBackground: false),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FadeInSlide(
                delay: 0.1,
                child: _buildSectionHeader('Medicine Details', Icons.medication_rounded),
              ),
              const SizedBox(height: 16),
              FadeInSlide(
                delay: 0.2,
                child: _buildDetailsCard(),
              ),
              
              const SizedBox(height: 32),
              FadeInSlide(
                delay: 0.3,
                child: _buildSectionHeader('Pharmacy Response', Icons.storefront_rounded),
              ),
              const SizedBox(height: 16),
              FadeInSlide(
                delay: 0.4,
                child: _buildResponseSection(_request),
              ),
              
              if (_request.status == MedicineRequestStatus.available || _request.status == MedicineRequestStatus.canArrange)
                ...[
                  const SizedBox(height: 32),
                  FadeInSlide(
                    delay: 0.5,
                    child: _buildSectionHeader('Your Confirmation', Icons.check_circle_outline_rounded),
                  ),
                  const SizedBox(height: 16),
                  FadeInSlide(
                    delay: 0.6,
                    child: _buildConfirmationSection(),
                  ),
                ],
              
              const SizedBox(height: 40),
              FadeInSlide(
                delay: 0.7,
                child: _buildRequestAnotherButton(),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 22, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailsCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoRow(Icons.medical_services_rounded, 'Medicine Name', _request.medicineName ?? 'Not provided', isHighlight: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Color(0xFFF1F5F9), height: 1),
          ),
          _buildInfoRow(Icons.local_pharmacy_rounded, 'Requested Pharmacy', _request.pharmacyName),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Color(0xFFF1F5F9), height: 1),
          ),
          _buildInfoRow(Icons.calendar_today_rounded, 'Date Requested', '${_request.createdAt.day}/${_request.createdAt.month}/${_request.createdAt.year}'),
          
          if (_request.imageReference != null) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Divider(color: Color(0xFFF1F5F9), height: 1),
            ),
            Text(
              'Request Image',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0), style: BorderStyle.solid),
              ),
              child: _buildImagePreview(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {bool isHighlight = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isHighlight ? AppColors.primary.withOpacity(0.1) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon, 
            size: 20, 
            color: isHighlight ? AppColors.primary : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  color: const Color(0xFF64748B),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.inter(
                  color: const Color(0xFF1E293B),
                  fontSize: isHighlight ? 18 : 15,
                  fontWeight: isHighlight ? FontWeight.bold : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImagePreview() {
    if (_request.imageReference == null) return const SizedBox.shrink();
    
    Widget imageWidget;
    if (_request.imageReference!.startsWith('data:image')) {
      final base64String = _request.imageReference!.split(',').last;
      try {
        imageWidget = Image.memory(
          base64Decode(base64String),
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        );
      } catch (e) {
        imageWidget = const Icon(Icons.broken_image, color: Colors.grey);
      }
    } else if (_request.imageReference!.startsWith('http')) {
      imageWidget = Image.network(
        _request.imageReference!,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
      );
    } else {
      imageWidget = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)
              ],
            ),
            child: const Icon(Icons.image_outlined, size: 28, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 12),
          Text(
            'Image Attached',
            style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
          ),
        ],
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: imageWidget,
    );
  }

  Widget _buildResponseSection(MedicineRequest request) {
    Color color;
    Color bgColor;
    String title;
    String message;
    IconData icon;

    switch (request.status) {
      case MedicineRequestStatus.waiting:
        color = const Color(0xFFF59E0B);
        bgColor = const Color(0xFFFEF3C7);
        title = 'WAITING';
        message = 'Waiting for pharmacy response...';
        icon = Icons.hourglass_top_rounded;
        break;
      case MedicineRequestStatus.available:
        color = const Color(0xFF10B981);
        bgColor = const Color(0xFFD1FAE5);
        title = 'AVAILABLE';
        message = 'Medicine is available at this pharmacy.';
        icon = Icons.check_circle_rounded;
        break;
      case MedicineRequestStatus.canArrange:
        color = const Color(0xFF3B82F6);
        bgColor = const Color(0xFFDBEAFE);
        title = 'CAN ARRANGE';
        message = 'The pharmacy can arrange this medicine.';
        icon = Icons.inventory_2_rounded;
        break;
      case MedicineRequestStatus.notAvailable:
        color = const Color(0xFFEF4444);
        bgColor = const Color(0xFFFEE2E2);
        title = 'NOT AVAILABLE';
        message = 'This medicine is currently not available.';
        icon = Icons.cancel_rounded;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Hero(
                tag: 'request_icon_${request.id}',
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: bgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color, size: 28),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title, 
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold, 
                        fontSize: 16,
                        color: color,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      message, 
                      style: GoogleFonts.inter(
                        color: const Color(0xFF475569), 
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (request.responseMessage != null && request.responseMessage!.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.format_quote_rounded, size: 16, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 6),
                      Text(
                        'Message from Pharmacy',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    request.responseMessage!,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF1E293B),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildConfirmationSection() {
    if (_request.customerConfirmation == CustomerConfirmationStatus.confirmed) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Confirmed', 
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold, 
                      fontSize: 16,
                      color: const Color(0xFF065F46),
                    ),
                  ),
                  if (_request.confirmedAt != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'You confirmed this on ${_request.confirmedAt!.day}/${_request.confirmedAt!.month}/${_request.confirmedAt!.year}', 
                        style: GoogleFonts.inter(
                          fontSize: 13, 
                          color: const Color(0xFF047857),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (_request.customerConfirmation == CustomerConfirmationStatus.cancelled) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.cancel_rounded, color: Color(0xFFEF4444), size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                'Request Cancelled', 
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold, 
                  fontSize: 16,
                  color: const Color(0xFF991B1B),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Text(
            'Would you like to confirm the order with this pharmacy?',
            style: GoogleFonts.inter(
              color: const Color(0xFF475569),
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _handleCancel,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleConfirm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Confirm', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRequestAnotherButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2DD4BF), Color(0xFF0F766E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
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
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.pushNamed(context, AppRoutes.medicineRequest);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 18.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.add_circle_outline_rounded, color: Colors.white, size: 24),
                const SizedBox(width: 12),
                Text(
                  'Request Another Medicine',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
