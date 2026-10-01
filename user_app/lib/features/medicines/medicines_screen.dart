import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class MedicinesScreen extends StatelessWidget {
  const MedicinesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Medicines')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.textHint),
                  const SizedBox(width: 12),
                  Text('Search medicines...', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textHint)),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Icon(Icons.medication, size: 64, color: AppColors.border),
            const SizedBox(height: 16),
            const Text('Categories & Catalogue Placeholder', style: TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
