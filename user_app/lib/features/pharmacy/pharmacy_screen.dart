import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../services/pharmacy_service.dart';
import 'models/pharmacy.dart';

class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key});

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> {
  List<Pharmacy> _pharmacies = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPharmacies();
  }

  Future<void> _loadPharmacies() async {
    try {
      final pharmacies = await PharmacyService.getPharmacies();
      if (mounted) {
        setState(() {
          _pharmacies = pharmacies;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading pharmacies: $e');
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
      appBar: AppBar(title: const Text('My Pharmacy')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  if (_pharmacies.isEmpty)
                    const AppCard(
                      child: Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Center(
                          child: Text(
                            'No pharmacies connected yet.',
                            style: TextStyle(color: AppColors.textSecondary),
                          ),
                        ),
                      ),
                    )
                  else
                    ..._pharmacies.map(
                      (pharmacy) => Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: AppCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const CircleAvatar(
                                    radius: 24,
                                    backgroundColor: AppColors.primaryLight,
                                    child: Icon(
                                      Icons.local_pharmacy,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          pharmacy.name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 18,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        const Text(
                                          'Connected',
                                          style: TextStyle(
                                            color: AppColors.success,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              const Divider(),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.location_on_outlined,
                                    size: 20,
                                    color: AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      pharmacy.address,
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              const Row(
                                children: [
                                  Icon(
                                    Icons.phone_outlined,
                                    size: 20,
                                    color: AppColors.textSecondary,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    '+91 99999 99999',
                                    style: TextStyle(
                                      color: AppColors.textSecondary,
                                    ),
                                  ), // Assuming no phone in model yet
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  const Spacer(),
                  AppButton(
                    text: 'Find a Pharmacy',
                    isOutlined: true,
                    onPressed: _loadPharmacies, // Refresh for now
                  ),
                ],
              ),
            ),
    );
  }
}
