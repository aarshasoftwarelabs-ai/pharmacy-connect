import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/routes/app_routes.dart';


import 'package:shared_preferences/shared_preferences.dart';
import 'core/config/api_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final customUrl = prefs.getString('custom_api_url');
  if (customUrl != null && customUrl.isNotEmpty) {
    ApiConfig.setCustomUrl(customUrl);
  }
  runApp(const PharmacyConnectApp());
}

class PharmacyConnectApp extends StatelessWidget {
  const PharmacyConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dava Setu',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppRoutes.generateRoute,
    );
  }
}
