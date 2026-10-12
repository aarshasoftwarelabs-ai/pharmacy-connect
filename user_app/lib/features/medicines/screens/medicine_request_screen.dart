import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/routes/app_routes.dart';
import '../../../widgets/fade_in_slide.dart';
import '../../pharmacy/models/pharmacy.dart';
import '../../../services/medicine_request_service.dart';
import '../../../services/pharmacy_service.dart';

class MedicineRequestScreen extends StatefulWidget {
  const MedicineRequestScreen({super.key});

  @override
  State<MedicineRequestScreen> createState() => _MedicineRequestScreenState();
}

class _MedicineRequestScreenState extends State<MedicineRequestScreen> {
  final TextEditingController _searchController = TextEditingController();
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();
  Pharmacy? _selectedPharmacy;
  String _selectedFilter = 'All';
  bool _isSubmitting = false;

  List<Pharmacy> _apiPharmacies = [];
  bool _isLoadingPharmacies = true;

  // Curated demo pharmacies matching the exact design
  final List<Map<String, dynamic>> _curatedPharmacies = [
    {
      'id': '1',
      'name': 'Apollo Pharmacy',
      'badge': 'Best Rated',
      'badgeColor': Color(0xFFF3E8FF),
      'badgeTextColor': Color(0xFF7C3AED),
      'rating': 4.8,
      'reviews': '1.2k reviews',
      'distance': '0.8 km',
      'hours': 'Open 8 AM - 11 PM',
      'deliveryTime': 'Delivery: 30-45 mins',
      'logoType': 'apollo',
      'isOpen': true,
      'address': 'MG Road, Near Metro Station',
    },
    {
      'id': '2',
      'name': 'MedPlus',
      'badge': 'Popular',
      'badgeColor': Color(0xFFFCE7F3),
      'badgeTextColor': Color(0xFFE11D48),
      'rating': 4.6,
      'reviews': '980 reviews',
      'distance': '1.2 km',
      'hours': 'Open 8 AM - 11 PM',
      'deliveryTime': 'Delivery: 45-60 mins',
      'logoType': 'medplus',
      'isOpen': true,
      'address': 'Station Road, City Center',
    },
    {
      'id': '3',
      'name': 'Sun Pharma',
      'badge': 'Popular',
      'badgeColor': Color(0xFFFCE7F3),
      'badgeTextColor': Color(0xFFE11D48),
      'rating': 4.5,
      'reviews': '760 reviews',
      'distance': '1.5 km',
      'hours': 'Open 8 AM - 10 PM',
      'deliveryTime': 'Delivery: 45-70 mins',
      'logoType': 'sunpharma',
      'isOpen': true,
      'address': 'Ring Road, Sector 4',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchPharmacies();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchPharmacies() async {
    try {
      final pharmacies = await PharmacyService.getPharmacies();
      if (mounted) {
        setState(() {
          _apiPharmacies = pharmacies;
          _isLoadingPharmacies = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingPharmacies = false;
        });
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        imageQuality: 80,
      );
      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  void _showImagePickerModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Upload Prescription',
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E1B4B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Select an option to upload your prescription',
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImage(ImageSource.camera);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F0FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFDDD6FE)),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.camera_alt_rounded, color: Color(0xFF6D28D9), size: 30),
                          const SizedBox(height: 8),
                          Text('Camera', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: const Color(0xFF1E1B4B))),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: InkWell(
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickImage(ImageSource.gallery);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F0FF),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFDDD6FE)),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.photo_library_rounded, color: Color(0xFF6D28D9), size: 30),
                          const SizedBox(height: 8),
                          Text('Gallery', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: const Color(0xFF1E1B4B))),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Future<void> _submitRequest() async {
    if (_imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload a prescription photo first.'),
          backgroundColor: Color(0xFFE11D48),
        ),
      );
      return;
    }

    if (_selectedPharmacy == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a pharmacy from the list.'),
          backgroundColor: Color(0xFFE11D48),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final pharmacyId = int.tryParse(_selectedPharmacy!.id) ?? 1;
      final bytes = await _imageFile!.readAsBytes();
      final base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';

      final request = await MedicineRequestService.createMedicineRequest(
        pharmacyId: pharmacyId,
        medicineName: 'Prescription Order',
        imageReference: base64Image,
      );

      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          AppRoutes.requestSent,
          arguments: request,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: const Color(0xFFE11D48),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  void _showChatSupportSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Support & Assistance',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Our pharmacy experts are ready to assist you 24/7.',
              style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.phone_in_talk_rounded, color: Color(0xFF0284C7)),
              ),
              title: Text('Call Support', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              subtitle: Text('+91 1800 123 4567 (Toll Free)', style: GoogleFonts.inter(fontSize: 12)),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981)),
              ),
              title: Text('WhatsApp Chat', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              subtitle: Text('+91 98765 43210', style: GoogleFonts.inter(fontSize: 12)),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: _buildAppBar(),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 18.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Banner
              FadeInSlide(
                delay: 0.05,
                child: _buildHeroBanner(),
              ),

              const SizedBox(height: 20),

              // Step 1: Upload Prescription
              FadeInSlide(
                delay: 0.1,
                child: _buildStepOneHeader(),
              ),

              const SizedBox(height: 14),

              FadeInSlide(
                delay: 0.15,
                child: _buildUploadPrescriptionSection(),
              ),

              const SizedBox(height: 24),

              // Step 2: Find Pharmacy
              FadeInSlide(
                delay: 0.2,
                child: _buildStepTwoHeader(),
              ),

              const SizedBox(height: 14),

              FadeInSlide(
                delay: 0.25,
                child: _buildSearchBar(),
              ),

              const SizedBox(height: 14),

              FadeInSlide(
                delay: 0.3,
                child: _buildFilterChips(),
              ),

              const SizedBox(height: 20),

              // Nearby Pharmacies List Header
              FadeInSlide(
                delay: 0.35,
                child: _buildPharmaciesHeader(),
              ),

              const SizedBox(height: 12),

              // Pharmacies List
              _buildPharmaciesList(),

              const SizedBox(height: 18),

              // Need Help Banner
              FadeInSlide(
                delay: 0.5,
                child: _buildNeedHelpCard(),
              ),

              // Submit Button when pharmacy is selected or image is chosen
              if (_selectedPharmacy != null || _imageFile != null) ...[
                const SizedBox(height: 20),
                FadeInSlide(
                  delay: 0.1,
                  child: _buildSubmitButton(),
                ),
              ],

              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }

  // 1. App Bar with Dava Setu Logo & Bell
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF1E1B4B), size: 24),
        onPressed: () {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          }
        },
      ),
      centerTitle: true,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Dava Setu Heart Icon
          const _DavaSetuHeartLogo(size: 34),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Dava Setu',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1E1B4B),
                  letterSpacing: -0.3,
                ),
              ),
              Row(
                children: [
                  Text(
                    'Your Health',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: 3,
                    height: 3,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFF6D28D9),
                    ),
                  ),
                  Text(
                    'Our Priority',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      actions: [
        Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF1E1B4B), size: 26),
              onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
            ),
            Positioned(
              right: 13,
              top: 13,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 6),
      ],
    );
  }

  // 2. Hero Banner Card
  Widget _buildHeroBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFEFF4FF),
            Color(0xFFF3E8FF),
          ],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Text Info
          Expanded(
            flex: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Upload Prescription',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF1E1B4B),
                      height: 1.22,
                    ),
                    children: const [
                      TextSpan(text: 'Get Medicines\nfrom '),
                      TextSpan(
                        text: 'Trusted Pharmacies',
                        style: TextStyle(
                          color: Color(0xFF6D28D9),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Fast • Safe • Hassle Free',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),

          // Right 3D Prescription Illustration
          const SizedBox(width: 6),
          const Expanded(
            flex: 9,
            child: _PrescriptionHeroArt(),
          ),
        ],
      ),
    );
  }

  // 3. Step 1 Header
  Widget _buildStepOneHeader() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: Color(0xFF6D28D9),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            '1',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Upload Prescription',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF1E1B4B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Add a photo of your prescription or\nchoose from gallery.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 4. Upload Area (Dashed Box + Camera/Gallery Buttons)
  Widget _buildUploadPrescriptionSection() {
    return Row(
      children: [
        // Left Box (Tap to Upload / Preview)
        Expanded(
          flex: 13,
          child: _imageFile != null
              ? Container(
                  height: 118,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFF6D28D9), width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6D28D9).withOpacity(0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          _imageFile!,
                          width: double.infinity,
                          height: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: InkWell(
                          onTap: () => setState(() => _imageFile = null),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close_rounded, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 6,
                        left: 6,
                        right: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Prescription Added ✓',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF10B981),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : CustomPaint(
                  painter: _DashedBorderPainter(
                    color: const Color(0xFFC4B5FD),
                    strokeWidth: 1.5,
                    radius: 18,
                    dashLength: 5,
                    gapLength: 4,
                  ),
                  child: InkWell(
                    onTap: _showImagePickerModal,
                    borderRadius: BorderRadius.circular(18),
                    child: Container(
                      height: 118,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFAFAFE),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3E8FF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt_rounded,
                              color: Color(0xFF6D28D9),
                              size: 22,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Tap to Upload',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: const Color(0xFF6D28D9),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'or choose from gallery',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: const Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
        ),

        const SizedBox(width: 12),

        // Right Column: Camera & Gallery Buttons
        Expanded(
          flex: 10,
          child: Column(
            children: [
              _buildUploadActionButton(
                icon: Icons.camera_alt_outlined,
                label: 'Camera',
                onTap: () => _pickImage(ImageSource.camera),
              ),
              const SizedBox(height: 10),
              _buildUploadActionButton(
                icon: Icons.image_outlined,
                label: 'Gallery',
                onTap: () => _pickImage(ImageSource.gallery),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildUploadActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFF6D28D9), size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1E1B4B),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 5. Step 2 Header
  Widget _buildStepTwoHeader() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: Color(0xFF6D28D9),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Text(
            '2',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Find Pharmacy',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF1E1B4B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Choose from nearby trusted pharmacies\nor search for a specific one.',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 6. Search Bar
  Widget _buildSearchBar() {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (_) => setState(() {}),
        style: GoogleFonts.inter(fontSize: 13.5, color: const Color(0xFF1E1B4B)),
        decoration: InputDecoration(
          hintText: 'Search pharmacy, area or store name...',
          hintStyle: GoogleFonts.inter(
            fontSize: 12.5,
            color: const Color(0xFF94A3B8),
          ),
          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
          suffixIcon: IconButton(
            icon: const Icon(Icons.tune_rounded, color: Color(0xFF6D28D9), size: 20),
            onPressed: () {},
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }

  // 7. Filter Chips: All, Nearby, 24x7, Best Rated
  Widget _buildFilterChips() {
    final chips = [
      {'label': 'All', 'icon': Icons.home_rounded},
      {'label': 'Nearby', 'icon': Icons.location_on_outlined},
      {'label': '24x7', 'icon': Icons.access_time_rounded},
      {'label': 'Best Rated', 'icon': Icons.star_outline_rounded},
    ];

    return Row(
      children: chips.map((c) {
        final label = c['label'] as String;
        final icon = c['icon'] as IconData;
        final isSelected = _selectedFilter == label;

        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedFilter = label;
                });
              },
              borderRadius: BorderRadius.circular(24),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF6D28D9) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF6D28D9) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      icon,
                      size: 16,
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // 8. Section Header: Nearby Pharmacies
  Widget _buildPharmaciesHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            const Icon(Icons.location_on_rounded, color: Color(0xFF6D28D9), size: 18),
            const SizedBox(width: 6),
            Text(
              'Nearby Pharmacies',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E1B4B),
              ),
            ),
          ],
        ),
        InkWell(
          onTap: () {},
          child: Row(
            children: [
              Text(
                'View All',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF6D28D9),
                ),
              ),
              const SizedBox(width: 2),
              const Icon(Icons.arrow_forward_rounded, color: Color(0xFF6D28D9), size: 14),
            ],
          ),
        ),
      ],
    );
  }

  // 9. Pharmacies List Cards
  Widget _buildPharmaciesList() {
    final query = _searchController.text.toLowerCase().trim();

    // Combine curated pharmacies with API pharmacies
    List<Map<String, dynamic>> combined = List.from(_curatedPharmacies);

    if (_apiPharmacies.isNotEmpty) {
      for (final p in _apiPharmacies) {
        if (!combined.any((item) => item['name'].toString().toLowerCase() == p.name.toLowerCase())) {
          combined.add({
            'id': p.id,
            'name': p.name,
            'badge': 'Verified',
            'badgeColor': const Color(0xFFD1FAE5),
            'badgeTextColor': const Color(0xFF059669),
            'rating': 4.7,
            'reviews': '500+ reviews',
            'distance': '1.8 km',
            'hours': 'Open 8 AM - 10 PM',
            'deliveryTime': 'Delivery: 30-45 mins',
            'logoType': 'generic',
            'isOpen': p.isOpenNow,
            'address': p.address,
          });
        }
      }
    }

    if (query.isNotEmpty) {
      combined = combined.where((item) {
        final name = item['name'].toString().toLowerCase();
        final addr = item['address'].toString().toLowerCase();
        return name.contains(query) || addr.contains(query);
      }).toList();
    }

    if (_selectedFilter == 'Nearby') {
      combined = combined.take(2).toList();
    } else if (_selectedFilter == 'Best Rated') {
      combined.sort((a, b) => (b['rating'] as double).compareTo(a['rating'] as double));
    }

    return Column(
      children: combined.asMap().entries.map((entry) {
        final index = entry.key;
        final data = entry.value;
        final isSelected = _selectedPharmacy?.id == data['id'].toString();

        return FadeInSlide(
          delay: 0.35 + (index * 0.08),
          child: Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: _buildPharmacyCard(data, isSelected),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPharmacyCard(Map<String, dynamic> data, bool isSelected) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isSelected ? const Color(0xFF6D28D9) : const Color(0xFFF1F5F9),
          width: isSelected ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isSelected ? const Color(0xFF6D28D9).withOpacity(0.08) : Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              _buildPharmacyLogo(data['logoType'] as String),

              const SizedBox(width: 12),

              // Title, Badge, Rating & Hours
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            data['name'] as String,
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF1E1B4B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: data['badgeColor'] as Color,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            data['badge'] as String,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: data['badgeTextColor'] as Color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 14),
                        const SizedBox(width: 3),
                        Text(
                          '${data['rating']}',
                          style: GoogleFonts.inter(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1E1B4B),
                          ),
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '(${data['reviews']})',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${data['distance']}  •  ${data['hours']}',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),

              // Right: Delivery Time & Select Button
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.delivery_dining_rounded, color: Color(0xFF0284C7), size: 15),
                      const SizedBox(width: 3),
                      Text(
                        data['deliveryTime'] as String,
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF0284C7),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedPharmacy = null;
                        } else {
                          _selectedPharmacy = Pharmacy(
                            id: data['id'].toString(),
                            name: data['name'] as String,
                            address: data['address'] as String,
                            phone: '+919876543210',
                            latitude: 23.0225,
                            longitude: 72.5714,
                            isConnected: true,
                          );
                        }
                      });
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 7),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF10B981) : const Color(0xFF6D28D9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        isSelected ? 'Selected ✓' : 'Select',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPharmacyLogo(String logoType) {
    if (logoType == 'apollo') {
      return Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFF0D9488),
          borderRadius: BorderRadius.circular(13),
        ),
        alignment: Alignment.center,
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      );
    } else if (logoType == 'medplus') {
      return Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: const Color(0xFF0284C7),
          borderRadius: BorderRadius.circular(13),
        ),
        alignment: Alignment.center,
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      );
    } else if (logoType == 'sunpharma') {
      return Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFDC2626), width: 2),
        ),
        alignment: Alignment.center,
        child: const Icon(Icons.add_rounded, color: Color(0xFF16A34A), size: 24),
      );
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFF6D28D9),
        borderRadius: BorderRadius.circular(13),
      ),
      alignment: Alignment.center,
      child: const Icon(Icons.local_pharmacy_rounded, color: Colors.white, size: 22),
    );
  }

  // 10. "Need Help?" Card
  Widget _buildNeedHelpCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5FD),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFDBEAFE)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFF3B82F6),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.shield_rounded, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need help?',
                  style: GoogleFonts.outfit(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
                Text(
                  'Our support team is available 24/7',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          InkWell(
            onTap: _showChatSupportSheet,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF8B5CF6)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF6D28D9), size: 14),
                  const SizedBox(width: 4),
                  Text(
                    'Chat Now',
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF6D28D9),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 11. Submit Button
  Widget _buildSubmitButton() {
    return Container(
      width: double.infinity,
      height: 52,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF6D28D9), Color(0xFF7C3AED)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6D28D9).withOpacity(0.35),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isSubmitting ? null : _submitRequest,
          borderRadius: BorderRadius.circular(18),
          child: Center(
            child: _isSubmitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Send Request',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

// ==========================================
// Custom Visual Components & Painters
// ==========================================

/// Heart Logo Widget for Dava Setu
class _DavaSetuHeartLogo extends StatelessWidget {
  final double size;
  const _DavaSetuHeartLogo({this.size = 32});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _DavaSetuHeartPainter(),
      ),
    );
  }
}

class _DavaSetuHeartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final gradient = const LinearGradient(
      colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
      begin: Alignment.bottomLeft,
      end: Alignment.topRight,
    ).createShader(rect);

    final paint = Paint()
      ..shader = gradient
      ..style = PaintingStyle.fill;

    final width = size.width;
    final height = size.height;

    final path = Path();
    path.moveTo(width / 2, height * 0.88);
    path.cubicTo(
      width * 0.1,
      height * 0.6,
      0,
      height * 0.28,
      width * 0.26,
      height * 0.12,
    );
    path.cubicTo(
      width * 0.42,
      height * 0.02,
      width / 2,
      height * 0.25,
      width / 2,
      height * 0.25,
    );
    path.cubicTo(
      width / 2,
      height * 0.25,
      width * 0.58,
      height * 0.02,
      width * 0.74,
      height * 0.12,
    );
    path.cubicTo(
      width,
      height * 0.28,
      width * 0.9,
      height * 0.6,
      width / 2,
      height * 0.88,
    );
    path.close();

    canvas.drawPath(path, paint);

    // Inner White Ribbon Motif
    final ribbonPaint = Paint()
      ..color = Colors.white.withOpacity(0.9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.12
      ..strokeCap = StrokeCap.round;

    final ribbonPath = Path();
    ribbonPath.moveTo(width * 0.38, height * 0.62);
    ribbonPath.lineTo(width * 0.62, height * 0.38);
    canvas.drawPath(ribbonPath, ribbonPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// 3D Prescription Banner Illustration
class _PrescriptionHeroArt extends StatelessWidget {
  const _PrescriptionHeroArt();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 94,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background soft circle
          Positioned(
            right: 0,
            child: Container(
              width: 82,
              height: 82,
              decoration: BoxDecoration(
                color: const Color(0xFFC7D2FE).withOpacity(0.35),
                shape: BoxShape.circle,
              ),
            ),
          ),

          // Prescription Notepad
          Positioned(
            right: 22,
            top: 6,
            child: Transform.rotate(
              angle: -0.05,
              child: Container(
                width: 58,
                height: 74,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Rx',
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                            color: const Color(0xFF2563EB),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Color(0xFF2563EB),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add, color: Colors.white, size: 8),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    _buildDocLine(width: 38),
                    const SizedBox(height: 3),
                    _buildDocLine(width: 32),
                    const SizedBox(height: 3),
                    _buildDocLine(width: 42),
                    const SizedBox(height: 3),
                    _buildDocLine(width: 26),
                  ],
                ),
              ),
            ),
          ),

          // Blue Medical Shield
          Positioned(
            right: 4,
            bottom: 4,
            child: Container(
              width: 34,
              height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF38BDF8), Color(0xFF2563EB)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(8),
                  topRight: Radius.circular(8),
                  bottomLeft: Radius.circular(18),
                  bottomRight: Radius.circular(18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2563EB).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
            ),
          ),

          // Blister Pill Pack
          Positioned(
            left: 6,
            bottom: 2,
            child: Container(
              width: 38,
              height: 24,
              decoration: BoxDecoration(
                color: const Color(0xFF60A5FA),
                borderRadius: BorderRadius.circular(6),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildMiniPillDot(),
                  _buildMiniPillDot(),
                  _buildMiniPillDot(),
                ],
              ),
            ),
          ),

          // Pill Capsule
          Positioned(
            left: 24,
            bottom: 20,
            child: Transform.rotate(
              angle: -0.4,
              child: Container(
                width: 24,
                height: 11,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF43F5E), Colors.white],
                    stops: [0.5, 0.5],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocLine({required double width}) {
    return Container(
      width: width,
      height: 3,
      decoration: BoxDecoration(
        color: const Color(0xFFCBD5E1),
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildMiniPillDot() {
    return Container(
      width: 6,
      height: 6,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
    );
  }
}

/// Dashed Border Painter
class _DashedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double radius;
  final double dashLength;
  final double gapLength;

  _DashedBorderPainter({
    required this.color,
    this.strokeWidth = 1.5,
    this.radius = 16,
    this.dashLength = 5,
    this.gapLength = 4,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(radius),
    );

    final path = Path()..addRRect(rrect);
    final metrics = path.computeMetrics();

    for (final metric in metrics) {
      double distance = 0.0;
      while (distance < metric.length) {
        final nextDistance = distance + dashLength;
        final extractPath = metric.extractPath(
          distance,
          nextDistance > metric.length ? metric.length : nextDistance,
        );
        canvas.drawPath(extractPath, paint);
        distance += dashLength + gapLength;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
