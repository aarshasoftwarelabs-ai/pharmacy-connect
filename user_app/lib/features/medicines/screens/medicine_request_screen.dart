import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../../widgets/app_button.dart';
import '../../../widgets/app_card.dart';
import '../../../widgets/app_text_field.dart';
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

      final request = await MedicineRequestService.createMedicineRequest(
        pharmacyId: pharmacyId,
        medicineName: name.isNotEmpty ? name : null,
        imageReference: _imageFile != null ? 'mock_image_reference' : null,
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
      appBar: AppBar(title: const Text('Ask for Medicine')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Enter the medicine name or upload a photo.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            
            AppTextField(
              label: 'Medicine name',
              hint: 'e.g. Dolo 650',
              controller: _nameController,
            ),
            
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24.0),
              child: Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.0),
                    child: Text('OR', style: TextStyle(color: AppColors.textHint, fontWeight: FontWeight.bold)),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
            ),
            
            Text('Upload medicine image', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('Take a photo or choose from gallery', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            
            if (_imageFile != null)
              AppCard(
                child: Column(
                  children: [
                    Container(
                      height: 150,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: FileImage(_imageFile!),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => setState(() => _imageFile = null),
                      icon: const Icon(Icons.delete_outline, color: AppColors.error),
                      label: const Text('Remove image', style: TextStyle(color: AppColors.error)),
                    ),
                  ],
                ),
              )
            else
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Camera'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Gallery'),
                    ),
                  ),
                ],
              ),
            
            const SizedBox(height: 32),
            Text('Send to pharmacy', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            
            if (_isLoadingPharmacies)
              const Center(child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator()))
            else if (_pharmacyError != null)
              Center(child: Text(_pharmacyError!, style: const TextStyle(color: AppColors.error)))
            else if (_pharmacies.isEmpty)
              const Center(child: Text('No pharmacies found.'))
            else
              ..._pharmacies.map((pharmacy) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: InkWell(
                  onTap: () => setState(() => _selectedPharmacy = pharmacy),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: _selectedPharmacy == pharmacy ? AppColors.primary : AppColors.border,
                        width: _selectedPharmacy == pharmacy ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      color: _selectedPharmacy == pharmacy ? AppColors.primary.withValues(alpha: 0.05) : AppColors.surface,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _selectedPharmacy == pharmacy ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                          color: _selectedPharmacy == pharmacy ? AppColors.primary : AppColors.textHint,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(pharmacy.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text(pharmacy.address, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        const Text('Connected', style: TextStyle(color: AppColors.success, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              )),
            
            const SizedBox(height: 32),
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : AppButton(
                    text: 'Send Request',
                    onPressed: _submitRequest,
                  ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
