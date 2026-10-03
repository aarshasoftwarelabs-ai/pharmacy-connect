import 'package:flutter/material.dart';

import '../../features/auth/login_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/auth/otp_screen.dart';
import '../../features/auth/splash_screen.dart';
import '../utils/main_navigation.dart';

import '../../features/medicines/screens/medicine_request_screen.dart';
import '../../features/medicines/screens/request_sent_screen.dart';
import '../../features/medicines/screens/medicine_requests_screen.dart';
import '../../features/medicines/screens/medicine_request_details_screen.dart';
import '../../features/medicines/models/medicine_request.dart';
import '../../features/notifications/notifications_screen.dart';

class AppRoutes {
  static const String splash = '/splash';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String otp = '/otp';
  static const String main = '/main'; // Home with Bottom Nav
  
  static const String medicineRequest = '/medicine-request';
  static const String requestSent = '/request-sent';
  static const String medicineRequests = '/medicine-requests';
  static const String medicineRequestDetails = '/medicine-request-details';
  static const String notifications = '/notifications';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen(), settings: settings);
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen(), settings: settings);
      case signup:
        return MaterialPageRoute(builder: (_) => const SignupScreen(), settings: settings);
      case otp:
        return MaterialPageRoute(builder: (_) => const OtpScreen(), settings: settings);
      case main:
        return MaterialPageRoute(builder: (_) => const MainNavigation(), settings: settings);
      
      case medicineRequest:
        return MaterialPageRoute(builder: (_) => const MedicineRequestScreen());
      case requestSent:
        final request = settings.arguments as MedicineRequest;
        return MaterialPageRoute(builder: (_) => RequestSentScreen(request: request));
      case medicineRequests:
        return MaterialPageRoute(builder: (_) => const MedicineRequestsScreen());
      case medicineRequestDetails:
        final request = settings.arguments as MedicineRequest;
        return MaterialPageRoute(builder: (_) => MedicineRequestDetailsScreen(request: request));
      case notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
        
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('No route defined for ${settings.name}')),
          ),
        );
    }
  }
}
