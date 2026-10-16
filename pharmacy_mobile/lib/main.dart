import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_theme.dart';
import 'core/services/storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/billing_provider.dart';
import 'providers/inventory_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/navigation/main_nav_screen.dart';
import 'screens/staff/staff_scanner_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await StorageService.init();

  runApp(const DavaSetuApp());
}

class DavaSetuApp extends StatelessWidget {
  const DavaSetuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => InventoryProvider()),
        ChangeNotifierProvider(create: (_) => BillingProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return MaterialApp(
            title: 'DavaSetu Pharmacy',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            home: auth.isAuthenticated
                ? (auth.isStaff ? const StaffScannerScreen() : const MainNavScreen())
                : const LoginScreen(),
          );
        },
      ),
    );
  }
}
