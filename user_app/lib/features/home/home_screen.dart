import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/routes/app_routes.dart';
import '../../services/notification_service.dart';
import '../../widgets/fade_in_slide.dart';
import '../../widgets/modern_icons.dart';
import '../profile/widgets/profile_avatar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _userName = 'User';
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    if (name != null && name.isNotEmpty) {
      if (mounted) {
        setState(() {
          _userName = name;
        });
      }
    }

    try {
      final count = await NotificationService.getUnreadCount();
      if (mounted) {
        setState(() {
          _unreadCount = count;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Top Bar: Logo & Notification
              _buildTopBar(),

              const SizedBox(height: 8),

              // 2. Greeting Section with Senior Avatar
              _buildGreeting(),

              const SizedBox(height: 16),

              // 3. Today's Medicines Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.1,
                  child: _buildTodaysMedicinesCard(),
                ),
              ),

              const SizedBox(height: 14),

              // 4. Refill Warning Alert Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.15,
                  child: _buildWarningBanner(),
                ),
              ),

              const SizedBox(height: 16),

              // 5. 6-Action Grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.2,
                  child: _buildActionGrid(),
                ),
              ),

              const SizedBox(height: 16),

              // 6. Insurance & Claims Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.25,
                  child: _buildInsuranceCard(),
                ),
              ),

              const SizedBox(height: 110), // Bottom padding for navigation
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Image.asset(
                'assets/images/logo.png',
                height: 42,
                errorBuilder: (c, e, s) => Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Color(0xFF6D28D9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 24),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dava Setu',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF1E1B4B),
                      letterSpacing: -0.5,
                    ),
                  ),
                  Text(
                    'Your Health • Our Priority',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, AppRoutes.notifications),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.notifications_none_rounded,
                    size: 24,
                    color: Color(0xFF1E1B4B),
                  ),
                ),
                if (_unreadCount > 0)
                  Positioned(
                    right: 8,
                    top: 6,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGreeting() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Good Morning,',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(
                    _userName,
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF1E1B4B),
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text('👏', style: TextStyle(fontSize: 20)),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Stay healthy, stay happy!',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              Positioned(
                right: -10,
                top: -10,
                child: SizedBox(
                  width: 90,
                  height: 90,
                  child: CustomPaint(
                    painter: LeafWatermarkPainter(
                      color: const Color(0xFF8B5CF6).withOpacity(0.08),
                    ),
                  ),
                ),
              ),
              const SeniorAvatarWidget(size: 64),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTodaysMedicinesCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF6D28D9),
            Color(0xFF7C3AED),
            Color(0xFF8B5CF6),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6D28D9).withOpacity(0.3),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.event_note_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's Medicines",
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '2 medicines • 2 times',
                        style: GoogleFonts.inter(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
                child: Row(
                  children: [
                    Text(
                      'View All',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Medicine Item 1: Dolo 650 (Taken)
          _buildTodayMedicineItem(
            name: 'Dolo 650',
            dosage: '1 tablet • 9:00 AM',
            primaryColor: const Color(0xFF0284C7),
            secondaryColor: const Color(0xFF38BDF8),
            isTaken: true,
          ),

          const SizedBox(height: 10),

          // Medicine Item 2: Vitamin D3 (Upcoming)
          _buildTodayMedicineItem(
            name: 'Vitamin D3',
            dosage: '1 capsule • 8:00 PM',
            primaryColor: const Color(0xFFDB2777),
            secondaryColor: const Color(0xFFF472B6),
            isTaken: false,
          ),
        ],
      ),
    );
  }

  Widget _buildTodayMedicineItem({
    required String name,
    required String dosage,
    required Color primaryColor,
    required Color secondaryColor,
    required bool isTaken,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          ModernPillCapsule(
            size: 36,
            primaryColor: primaryColor,
            secondaryColor: secondaryColor,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.outfit(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  dosage,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: isTaken ? const Color(0xFFDCFCE7) : const Color(0xFFF3E8FF),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isTaken ? Icons.check_circle_rounded : Icons.schedule_rounded,
                  color: isTaken ? const Color(0xFF16A34A) : const Color(0xFF7C3AED),
                  size: 13,
                ),
                const SizedBox(width: 4),
                Text(
                  isTaken ? 'Taken' : 'Upcoming',
                  style: GoogleFonts.inter(
                    color: isTaken ? const Color(0xFF16A34A) : const Color(0xFF7C3AED),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWarningBanner() {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF7ED),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFFFEDD5)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(
                color: Color(0xFFFFEDD5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_rounded,
                color: Color(0xFFEA580C),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your medicine may run out in 3 days.',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E1B4B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Request a refill to avoid interruption.',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFFEA580C),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionGrid() {
    final items = [
      {
        'title': 'My Medicines',
        'isPill': true,
        'color': const Color(0xFF0284C7),
        'secColor': const Color(0xFF38BDF8),
        'bgColor': const Color(0xFFE0F2FE),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.refillReminders),
      },
      {
        'title': 'Nearby Pharmacy',
        'isPill': false,
        'icon': Icons.storefront_rounded,
        'color': const Color(0xFF0D9488),
        'bgColor': const Color(0xFFCCFBF1),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.medicineRequest),
      },
      {
        'title': 'Refill Request',
        'isPill': false,
        'icon': Icons.sync_rounded,
        'color': const Color(0xFF8B5CF6),
        'bgColor': const Color(0xFFF3E8FF),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.refillReminders),
      },
      {
        'title': 'Prescription',
        'isPill': false,
        'icon': Icons.description_rounded,
        'color': const Color(0xFF8B5CF6),
        'bgColor': const Color(0xFFF3E8FF),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.myPrescriptions),
      },
      {
        'title': 'Track Orders',
        'isPill': false,
        'icon': Icons.local_shipping_rounded,
        'color': const Color(0xFF0D9488),
        'bgColor': const Color(0xFFCCFBF1),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.medicineRequests),
      },
      {
        'title': 'Notifications',
        'isPill': false,
        'icon': Icons.notifications_active_rounded,
        'color': const Color(0xFF8B5CF6),
        'bgColor': const Color(0xFFF3E8FF),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.notifications),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.95,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return InkWell(
          onTap: item['onTap'] as VoidCallback,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  right: 8,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: Colors.grey.shade400,
                      size: 16,
                    ),
                  ),
                ),
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: item['bgColor'] as Color,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: (item['isPill'] as bool)
                              ? ModernPillCapsule(
                                  size: 26,
                                  primaryColor: item['color'] as Color,
                                  secondaryColor: item['secColor'] as Color,
                                )
                              : Icon(
                                  item['icon'] as IconData,
                                  color: item['color'] as Color,
                                  size: 22,
                                ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Text(
                          item['title'] as String,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1E1B4B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInsuranceCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFEDE9FE),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.shield_rounded, color: Color(0xFF6D28D9), size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Insurance & Claims',
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF1E1B4B),
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Get reminders for your insurance claims\nand save on your medicines.',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 11,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
        ],
      ),
    );
  }
}
