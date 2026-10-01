import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/routes/app_routes.dart';
import '../../../widgets/app_button.dart';
import '../models/medicine_request.dart';

class RequestSentScreen extends StatelessWidget {
  final MedicineRequest request;

  const RequestSentScreen({super.key, required this.request});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, size: 80, color: AppColors.success),
              const SizedBox(height: 24),
              Text('Request Sent', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 12),
              Text(
                'Your medicine request has been sent to\n${request.pharmacyName}.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 16),
              ),
              const SizedBox(height: 32),
              
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    if (request.medicineName != null) ...[
                      Text('Medicine:', style: Theme.of(context).textTheme.bodySmall),
                      Text(request.medicineName!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 16),
                    ],
                    if (request.imageReference != null) ...[
                      const Icon(Icons.image, color: AppColors.textHint),
                      const Text('Image attached', style: TextStyle(color: AppColors.textSecondary)),
                      const SizedBox(height: 16),
                    ],
                    Text('Request status:', style: Theme.of(context).textTheme.bodySmall),
                    const Text('Waiting for pharmacy response', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.warning)),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),
              AppButton(
                text: 'View Request',
                onPressed: () {
                  Navigator.pushReplacementNamed(
                    context,
                    AppRoutes.medicineRequestDetails,
                    arguments: request,
                  );
                },
              ),
              const SizedBox(height: 16),
              AppButton(
                text: 'Back to Home',
                isOutlined: true,
                onPressed: () {
                  Navigator.popUntil(context, ModalRoute.withName(AppRoutes.main));
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
