import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/routes/app_routes.dart';
import '../../services/notification_service.dart';
import '../../services/pharmacy_service.dart';
import '../../widgets/fade_in_slide.dart';
import '../../widgets/modern_icons.dart';
import '../pharmacy/models/pharmacy.dart';
import '../profile/widgets/profile_avatar.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _userName = 'User';
  int _unreadCount = 0;
  Pharmacy? _connectedPharmacy;
  List<Pharmacy> _availablePharmacies = [];

  @override
  void initState() {
    super.initState();
    _loadUser();
    _loadConnectedPharmacy();
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
          physics: const ClampingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Top Header: Greeting & Notification
              _buildTopHeader(),

              const SizedBox(height: 10),

              // 2. Today's Medicines Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.1,
                  child: _buildTodaysMedicinesCard(),
                ),
              ),

              const SizedBox(height: 10),

              // 3. Refill Warning Alert Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.15,
                  child: _buildWarningBanner(),
                ),
              ),

              const SizedBox(height: 12),

              // 4. Connected Pharmacies Carousel (Horizontal Scrollable, placed BEFORE buttons)
              FadeInSlide(
                delay: 0.2,
                child: _buildConnectedPharmaciesSection(),
              ),

              const SizedBox(height: 12),

              // 5. 6-Action Grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.25,
                  child: _buildActionGrid(),
                ),
              ),

              // Bottom clearance: stops precisely at bottom of 6 action cards above the floating navigation bar
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopHeader() {
    return Padding(
      padding: const EdgeInsets.only(left: 20.0, right: 20.0, top: 8.0, bottom: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Good Morning,',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        _userName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF1E1B4B),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text('👏', style: TextStyle(fontSize: 18)),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  'Stay healthy, stay happy!',
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    color: const Color(0xFF64748B),
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, AppRoutes.notifications),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
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


  Widget _buildTodaysMedicinesCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
        'title': 'Nearby Pharmacy',
        'subtitle': 'Find stores & order',
        'badgeText': '15 MIN',
        'hasDot': true,
        'badgeBg': const Color(0xFFCCFBF1),
        'badgeTextColor': const Color(0xFF0F766E),
        'iconWidget': const ModernPharmacyStoreIcon(size: 24),
        'bgGradient': const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFCCFBF1), Color(0xFF99F6E4)],
        ),
        'shadowColor': const Color(0xFF0D9488),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.medicineRequest),
      },
      {
        'title': 'My Medicines',
        'subtitle': 'Dose timings & log',
        'badgeText': 'DAILY',
        'hasDot': false,
        'badgeBg': const Color(0xFFE0F2FE),
        'badgeTextColor': const Color(0xFF0369A1),
        'iconWidget': const ModernPillCapsule(
          size: 24,
          primaryColor: Color(0xFF0284C7),
          secondaryColor: Color(0xFF38BDF8),
        ),
        'bgGradient': const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFE0F2FE), Color(0xFFBAE6FD)],
        ),
        'shadowColor': const Color(0xFF0284C7),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.refillReminders),
      },
      {
        'title': 'Refill Request',
        'subtitle': '1-tap quick reorder',
        'badgeText': 'QUICK',
        'hasDot': false,
        'badgeBg': const Color(0xFFFEF3C7),
        'badgeTextColor': const Color(0xFFB45309),
        'iconWidget': const ModernRefillSyncIcon(size: 24),
        'bgGradient': const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)],
        ),
        'shadowColor': const Color(0xFFD97706),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.refillReminders),
      },
      {
        'title': 'Prescription',
        'subtitle': 'Doctor Rx vault',
        'badgeText': 'VAULT',
        'hasDot': false,
        'badgeBg': const Color(0xFFEDE9FE),
        'badgeTextColor': const Color(0xFF6D28D9),
        'iconWidget': const ModernPrescriptionDocIcon(size: 24),
        'bgGradient': const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF3E8FF), Color(0xFFE9D5FF)],
        ),
        'shadowColor': const Color(0xFF7C3AED),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.myPrescriptions),
      },
      {
        'title': 'Track Orders',
        'subtitle': 'Live order status',
        'badgeText': 'LIVE',
        'hasDot': true,
        'badgeBg': const Color(0xFFDCFCE7),
        'badgeTextColor': const Color(0xFF15803D),
        'iconWidget': const ModernDeliveryTruckIcon(size: 24),
        'bgGradient': const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFDCFCE7), Color(0xFFBBF7D0)],
        ),
        'shadowColor': const Color(0xFF16A34A),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.medicineRequests),
      },
      {
        'title': 'Notifications',
        'subtitle': 'Reminders & alerts',
        'badgeText': 'ALERTS',
        'hasDot': false,
        'badgeBg': const Color(0xFFFFE4E6),
        'badgeTextColor': const Color(0xFFBE123C),
        'iconWidget': const ModernNotificationBellIcon(size: 24),
        'bgGradient': const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFE4E6), Color(0xFFFECDD3)],
        ),
        'shadowColor': const Color(0xFFE11D48),
        'onTap': () => Navigator.pushNamed(context, AppRoutes.notifications),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header Row
        Padding(
          padding: const EdgeInsets.only(bottom: 12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Row(
                children: [
                  Container(
                    width: 4,
                    height: 16,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF7C3AED), Color(0xFF3B82F6)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Quick Services',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E1B4B),
                      letterSpacing: -0.2,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'Smart Hub',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF475569),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // 2-Column Bento Deck Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.44,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            final shadowColor = item['shadowColor'] as Color;
            final bgGradient = item['bgGradient'] as Gradient;
            final iconWidget = item['iconWidget'] as Widget;
            final badgeBg = item['badgeBg'] as Color;
            final badgeTextColor = item['badgeTextColor'] as Color;
            final badgeText = item['badgeText'] as String;
            final hasDot = item['hasDot'] as bool;

            return Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFFF1F5F9),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF1E1B4B).withOpacity(0.04),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: shadowColor.withOpacity(0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: item['onTap'] as VoidCallback,
                  borderRadius: BorderRadius.circular(20),
                  splashColor: shadowColor.withOpacity(0.12),
                  highlightColor: shadowColor.withOpacity(0.06),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Top row: Squircle icon + Micro badge pill
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                gradient: bgGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: shadowColor.withOpacity(0.22),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: iconWidget,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                              decoration: BoxDecoration(
                                color: badgeBg,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (hasDot) ...[
                                    Container(
                                      width: 5,
                                      height: 5,
                                      decoration: BoxDecoration(
                                        color: badgeTextColor,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                  ],
                                  Text(
                                    badgeText,
                                    style: GoogleFonts.inter(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w700,
                                      color: badgeTextColor,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 8),

                        // Bottom info: Title with arrow + Subtitle
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    item['title'] as String,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.outfit(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF1E1B4B),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  size: 10,
                                  color: shadowColor.withOpacity(0.6),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item['subtitle'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildConnectedPharmaciesSection() {
    final list = _availablePharmacies.isNotEmpty
        ? _availablePharmacies
        : [
            Pharmacy(
              id: '1',
              name: 'Sanjivani Medical & Chemist',
              address: 'Shop 4, Ring Road, Surat',
              phone: '+919876543210',
              latitude: 21.1702,
              longitude: 72.8311,
              isConnected: true,
              isOpenNow: true,
            ),
            Pharmacy(
              id: '2',
              name: 'Shreeji Pharma & Healthcare',
              address: 'Opp. Civil Hospital, Surat',
              phone: '+919823456789',
              latitude: 21.1800,
              longitude: 72.8200,
              isConnected: true,
              isOpenNow: true,
            ),
            Pharmacy(
              id: '3',
              name: 'Apollo Pharmacy Express',
              address: 'Ghod Dod Road, Surat',
              phone: '+919811122233',
              latitude: 21.1600,
              longitude: 72.8000,
              isConnected: true,
              isOpenNow: true,
            ),
          ];

    // Ensure currently selected pharmacy is first in list if present
    final sortedList = List<Pharmacy>.from(list);
    if (_connectedPharmacy != null) {
      final index = sortedList.indexWhere((p) => p.id == _connectedPharmacy!.id);
      if (index > 0) {
        final current = sortedList.removeAt(index);
        sortedList.insert(0, current);
      } else if (index == -1) {
        sortedList.insert(0, _connectedPharmacy!);
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header Row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFCCFBF1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.storefront_rounded, size: 15, color: Color(0xFF0D9488)),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Connected Pharmacies',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E1B4B),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${sortedList.length}',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF6D28D9),
                      ),
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: _showPharmacySwitcherBottomSheet,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Row(
                    children: [
                      Text(
                        'Manage',
                        style: GoogleFonts.outfit(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF6D28D9),
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: Color(0xFF6D28D9)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Horizontal Scrolling Pharmacies Carousel
        SizedBox(
          height: 184,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            itemCount: sortedList.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              if (index == sortedList.length) {
                // "+ Connect Store" Card
                return InkWell(
                  onTap: _showPharmacySwitcherBottomSheet,
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: 140,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: const BoxDecoration(
                            color: Color(0xFFF3E8FF),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add_rounded, color: Color(0xFF6D28D9), size: 26),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Add Store',
                          style: GoogleFonts.outfit(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1E1B4B),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Browse nearby',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              final p = sortedList[index];
              final isPrimary = p.id == _connectedPharmacy?.id;
              final isOpen = p.isOpenNow;
              final screenWidth = MediaQuery.of(context).size.width;
              final cardWidth = (screenWidth * 0.88).clamp(345.0, 480.0);

              return InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  if (!isPrimary) {
                    _selectPharmacy(p);
                  } else {
                    _showPharmacySwitcherBottomSheet();
                  }
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: cardWidth,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isPrimary ? const Color(0xFF0D9488) : const Color(0xFFE2E8F0),
                      width: isPrimary ? 1.6 : 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (isPrimary ? const Color(0xFF0D9488) : const Color(0xFF1E1B4B))
                            .withOpacity(isPrimary ? 0.08 : 0.035),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Top Row: Icon + Name & Auto-Adjusting Address + Active Badge
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: isPrimary
                                    ? [const Color(0xFFCCFBF1), const Color(0xFF99F6E4)]
                                    : [const Color(0xFFF1F5F9), const Color(0xFFE2E8F0)],
                              ),
                              borderRadius: BorderRadius.circular(13),
                            ),
                            child: const Center(
                              child: ModernPharmacyStoreIcon(size: 24),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.outfit(
                                    fontSize: 15.5,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF1E1B4B),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.only(top: 2.0),
                                      child: Icon(Icons.location_on_rounded, size: 12, color: Color(0xFF94A3B8)),
                                    ),
                                    const SizedBox(width: 3),
                                    Expanded(
                                      child: Text(
                                        p.address,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          color: const Color(0xFF64748B),
                                          height: 1.25,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isPrimary ? const Color(0xFFCCFBF1) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isPrimary ? 'Active' : 'Connected',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isPrimary ? const Color(0xFF0F766E) : const Color(0xFF64748B),
                              ),
                            ),
                          ),
                        ],
                      ),

                      // Middle status line: Open status & pickup
                      Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isOpen ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isOpen ? 'Open Now' : 'Closed',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: isOpen ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                            ),
                          ),
                          const Text(' • ', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12)),
                          const Icon(Icons.bolt_rounded, size: 13, color: Color(0xFF16A34A)),
                          Text(
                            '15 min pickup',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF15803D),
                            ),
                          ),
                        ],
                      ),

                      const Divider(height: 1, color: Color(0xFFF1F5F9)),

                      // Bottom action row: Primary/Set Primary + Direction + Call (Auto-adjusted spacing)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (isPrimary)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0FDF4),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.check_circle_rounded, size: 13, color: Color(0xFF16A34A)),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Primary Store',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF16A34A),
                                    ),
                                  ),
                                ],
                              ),
                            )
                          else
                            InkWell(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                _selectPharmacy(p);
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF3E8FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.swap_horiz_rounded, size: 13, color: Color(0xFF6D28D9)),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Set Primary',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF6D28D9),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                          // Right actions: Direction + Call
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Directions Button (Google Maps)
                              InkWell(
                                onTap: () => _openDirections(p),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE0F2FE),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFBAE6FD)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.directions_rounded, size: 13, color: Color(0xFF0284C7)),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Direction',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF0369A1),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              const SizedBox(width: 6),

                              // Call Button
                              InkWell(
                                onTap: () => _callPharmacy(p.phone),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.phone_rounded, size: 12, color: Color(0xFF475569)),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Call',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF475569),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showPharmacySwitcherBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String query = '';
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filtered = _availablePharmacies.where((p) {
              if (query.isEmpty) return true;
              return p.name.toLowerCase().contains(query.toLowerCase()) ||
                  p.address.toLowerCase().contains(query.toLowerCase());
            }).toList();

            return Container(
              height: MediaQuery.of(context).size.height * 0.72,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  // Drag Handle
                  Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2.5),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Change Connected Pharmacy',
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1E1B4B),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Select your primary store for quick orders',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F9FE),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        onChanged: (val) {
                          setModalState(() {
                            query = val.trim();
                          });
                        },
                        decoration: InputDecoration(
                          hintText: 'Search pharmacy name or location...',
                          hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6D28D9), size: 20),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  // Pharmacy List
                  Expanded(
                    child: filtered.isEmpty
                        ? Center(
                            child: Text(
                              'No pharmacies found',
                              style: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final p = filtered[index];
                              final isSelected = p.id == _connectedPharmacy?.id;

                              return InkWell(
                                onTap: () async {
                                  HapticFeedback.lightImpact();
                                  await _selectPharmacy(p);
                                  if (ctx.mounted) Navigator.pop(ctx);
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFFF5F3FF) : Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isSelected ? const Color(0xFF8B5CF6) : const Color(0xFFE2E8F0),
                                      width: isSelected ? 1.5 : 1.0,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: isSelected ? const Color(0xFFEDE9FE) : const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Center(
                                          child: Icon(
                                            Icons.storefront_rounded,
                                            color: isSelected ? const Color(0xFF6D28D9) : const Color(0xFF475569),
                                            size: 22,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              p.name,
                                              style: GoogleFonts.outfit(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF1E1B4B),
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              p.address,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      if (isSelected)
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF6D28D9),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.check_rounded, color: Colors.white, size: 14),
                                        )
                                      else
                                        const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 20),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _selectPharmacy(Pharmacy p) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_pharmacy_id', p.id);
    await prefs.setString('selected_pharmacy_name', p.name);
    await prefs.setString('selected_pharmacy_address', p.address);
    await prefs.setString('selected_pharmacy_phone', p.phone);

    if (mounted) {
      setState(() {
        _connectedPharmacy = p;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connected to ${p.name}', style: GoogleFonts.inter()),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _loadConnectedPharmacy() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString('selected_pharmacy_id');
    final name = prefs.getString('selected_pharmacy_name');
    final address = prefs.getString('selected_pharmacy_address');
    final phone = prefs.getString('selected_pharmacy_phone');

    if (name != null && name.isNotEmpty) {
      if (mounted) {
        setState(() {
          _connectedPharmacy = Pharmacy(
            id: id ?? '1',
            name: name,
            address: address ?? 'Surat, Gujarat',
            phone: phone ?? '+919876543210',
            latitude: 23.0225,
            longitude: 72.5714,
            isConnected: true,
            isOpenNow: true,
          );
        });
      }
    }

    try {
      final list = await PharmacyService.getPharmacies();
      if (mounted) {
        setState(() {
          _availablePharmacies = list;
          if (_connectedPharmacy == null && list.isNotEmpty) {
            _connectedPharmacy = list.first;
            _selectPharmacy(list.first);
          } else if (_connectedPharmacy != null && list.isNotEmpty) {
            final match = list.firstWhere(
              (p) => p.id == _connectedPharmacy!.id,
              orElse: () => _connectedPharmacy!,
            );
            _connectedPharmacy = match;
          }
        });
      }
    } catch (_) {
      if (_availablePharmacies.isEmpty) {
        final fallbackList = [
          Pharmacy(
            id: '1',
            name: 'Sanjivani Medical & Chemist',
            address: 'Shop 4, Ring Road, Surat',
            phone: '+919876543210',
            latitude: 21.1702,
            longitude: 72.8311,
            isConnected: true,
            isOpenNow: true,
          ),
          Pharmacy(
            id: '2',
            name: 'Shreeji Pharma & Healthcare',
            address: 'Opp. Civil Hospital, Surat',
            phone: '+919823456789',
            latitude: 21.1800,
            longitude: 72.8200,
            isConnected: true,
            isOpenNow: true,
          ),
          Pharmacy(
            id: '3',
            name: 'Apollo Pharmacy Express',
            address: 'Ghod Dod Road, Surat',
            phone: '+919811122233',
            latitude: 21.1600,
            longitude: 72.8000,
            isConnected: true,
            isOpenNow: true,
          ),
        ];
        if (mounted) {
          setState(() {
            _availablePharmacies = fallbackList;
            if (_connectedPharmacy == null) {
              _connectedPharmacy = fallbackList.first;
              _selectPharmacy(fallbackList.first);
            }
          });
        }
      }
    }
  }

  Future<void> _callPharmacy(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Phone: $phone', style: GoogleFonts.inter()),
            backgroundColor: const Color(0xFF1E1B4B),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _openDirections(Pharmacy p) async {
    HapticFeedback.lightImpact();
    // Direct Google Maps navigation / directions URL
    final mapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}';
    final uri = Uri.parse(mapsUrl);
    final queryUrl = 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent('${p.name}, ${p.address}')}';
    final queryUri = Uri.parse(queryUrl);

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(queryUri)) {
        await launchUrl(queryUri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Could not open map for ${p.name}', style: GoogleFonts.inter()),
              backgroundColor: const Color(0xFF1E1B4B),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Pharmacy: ${p.name} (${p.address})', style: GoogleFonts.inter()),
            backgroundColor: const Color(0xFF1E1B4B),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}
