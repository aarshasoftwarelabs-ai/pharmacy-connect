import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/app_button.dart';
import '../../widgets/fade_in_slide.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Cart')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const FadeInSlide(
                delay: 0.1,
                child: Icon(Icons.shopping_cart_outlined, size: 80, color: AppColors.border),
              ),
              const SizedBox(height: 24),
              FadeInSlide(
                delay: 0.2,
                child: Text('Your cart is empty', style: Theme.of(context).textTheme.headlineMedium),
              ),
              const SizedBox(height: 8),
              const FadeInSlide(
                delay: 0.3,
                child: Text(
                  'Search for medicines and add them to your cart.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              ),
              const SizedBox(height: 48),
              FadeInSlide(
                delay: 0.4,
                child: AppButton(
                  text: 'Browse Medicines',
                  onPressed: () {
                    // Will pop back to home in the future
                    Navigator.pop(context);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
