import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../../widgets/app_button.dart';
import '../../../widgets/app_card.dart';
import '../../../widgets/app_text_field.dart';
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
  final TextEditingController _nameController = TextEditingController();
  File? _imageFile;
  final ImagePicker _picker = ImagePicker();
  Pharmacy? _selectedPharmacy;
  bool _isLoading = false;
  
  List<Pharmacy> _pharmacies = [];
  bool _isLoadingPharmacies = true;
  String? _pharmacyError;

  @override
  void initState() {
    super.initState();
    _fetchPharmacies();
  }

  Future<void> _fetchPharmacies() async {
    try {
      final pharmacies = await PharmacyService.getPharmacies();
      if (mounted) {
        setState(() {
          _pharmacies = pharmacies;
          _isLoadingPharmacies = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _pharmacyError = e.toString();
          _isLoadingPharmacies = false;
        });
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source);
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

  Future<void> _submitRequest() async {
    final name = _nameController.text.trim();
    if (name.isEmpty && _imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a medicine name or upload an image.')),
      );
      return;
    }
    if (_selectedPharmacy == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a pharmacy.')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Use the actual ID from the API
      final pharmacyId = int.parse(_selectedPharmacy!.id);

      String? base64Image;
      if (_imageFile != null) {
        final bytes = await _imageFile!.readAsBytes();
        base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      }

      final request = await MedicineRequestService.createMedicineRequest(
        pharmacyId: pharmacyId,
        medicineName: name.isNotEmpty ? name : null,
        imageReference: base64Image,
      );

      if (!mounted) return;

      Navigator.pushReplacementNamed(
        context,
        AppRoutes.requestSent,
        arguments: request,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Ask for Medicine', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInSlide(
              delay: 0.1,
              child: Text(
                'What do you need today?',
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                  height: 1.2,
                ),
              ),
            ),
            const SizedBox(height: 8),
            FadeInSlide(
              delay: 0.15,
              child: Text(
                'Type the name or simply upload a photo of your prescription.',
                style: GoogleFonts.outfit(
                  fontSize: 15,
                  color: const Color(0xFF64748B),
                ),
              ),
            ),
            const SizedBox(height: 32),
            
            FadeInSlide(
              delay: 0.2,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withOpacity(0.04),
                      blurRadius: 24,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(4),
                child: TextField(
                  controller: _nameController,
                  style: GoogleFonts.outfit(fontSize: 16),
                  decoration: InputDecoration(
                    hintText: 'e.g. Dolo 650, Paracetamol...',
                    hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8)),
                    prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
              ),
            ),
            
            FadeInSlide(
              delay: 0.3,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 32.0),
                child: Row(
                  children: [
                    const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Text('OR', style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontWeight: FontWeight.bold)),
                    ),
                    const Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  ],
                ),
              ),
            ),
            
            if (_imageFile != null)
              FadeInSlide(
                delay: 0.4,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withOpacity(0.04),
                        blurRadius: 24,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(_imageFile!, height: 180, width: double.infinity, fit: BoxFit.cover),
                      ),
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: () => setState(() => _imageFile = null),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.delete_outline_rounded, color: Color(0xFFEF4444), size: 20),
                              const SizedBox(width: 8),
                              Text('Remove Photo', style: GoogleFonts.outfit(color: const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              FadeInSlide(
                delay: 0.4,
                child: Row(
                  children: [
                    Expanded(
                      child: _buildImageOption(
                        icon: Icons.camera_alt_rounded,
                        label: 'Camera',
                        gradient: const [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                        onTap: () => _pickImage(ImageSource.camera),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildImageOption(
                        icon: Icons.photo_library_rounded,
                        label: 'Gallery',
                        gradient: const [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                        onTap: () => _pickImage(ImageSource.gallery),
                      ),
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: 40),
            FadeInSlide(
              delay: 0.5,
              child: Text(
                'Send to pharmacy',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            if (_isLoadingPharmacies)
              const Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator(color: Color(0xFF0F766E))))
            else if (_pharmacyError != null)
              Center(child: Text(_pharmacyError!, style: GoogleFonts.outfit(color: const Color(0xFFEF4444))))
            else if (_pharmacies.isEmpty)
              Center(child: Text('No pharmacies found.', style: GoogleFonts.outfit(color: const Color(0xFF64748B))))
            else
              ..._pharmacies.asMap().entries.map((entry) {
                int index = entry.key;
                Pharmacy pharmacy = entry.value;
                bool isSelected = _selectedPharmacy == pharmacy;
                return FadeInSlide(
                  delay: 0.6 + (index * 0.1),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: InkWell(
                      onTap: () => setState(() => _selectedPharmacy = pharmacy),
                      borderRadius: BorderRadius.circular(20),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeOutCubic,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
                          border: Border.all(
                            color: isSelected ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                            width: isSelected ? 2 : 1,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: isSelected ? [
                            BoxShadow(
                              color: const Color(0xFF10B981).withOpacity(0.15),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            )
                          ] : [
                            BoxShadow(
                              color: const Color(0xFF0F172A).withOpacity(0.03),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected ? const Color(0xFF10B981) : Colors.transparent,
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF10B981) : const Color(0xFFCBD5E1),
                                  width: 2,
                                ),
                              ),
                              child: isSelected ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pharmacy.name,
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 16,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    pharmacy.address,
                                    style: GoogleFonts.outfit(
                                      fontSize: 13,
                                      color: const Color(0xFF64748B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            if (pharmacy.isConnected)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'Connected',
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF059669),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            
            const SizedBox(height: 40),
            FadeInSlide(
              delay: 0.9,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF0F766E)))
                  : Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0D9488), Color(0xFF0F766E)],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F766E).withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: _submitRequest,
                          borderRadius: BorderRadius.circular(16),
                          child: Center(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Send Request',
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildImageOption({
    required IconData icon,
    required String label,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradient[0].withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: Colors.white, size: 28),
                ),
                const SizedBox(height: 12),
                Text(
                  label,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
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
