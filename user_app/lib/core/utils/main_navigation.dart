import 'package:flutter/material.dart';

import '../../features/home/home_screen.dart';
import '../../features/pharmacy/pharmacy_screen.dart';
import '../../features/medicines/screens/medicine_requests_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../widgets/animated_bottom_nav_bar.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const PharmacyScreen(),
    const MedicineRequestsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true, // This is crucial for the floating effect
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: SafeArea(
        child: AnimatedBottomNavBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
        ),
      ),
    );

  }
}
