import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';
import 'widgets/dynamic_punch_hole.dart';

void main() {
  runApp(const PharmacyConnectApp());
}

class PharmacyConnectApp extends StatelessWidget {
  const PharmacyConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PharmacyConnect',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppRoutes.generateRoute,
      builder: (context, child) {
        return DynamicPunchHole(
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
