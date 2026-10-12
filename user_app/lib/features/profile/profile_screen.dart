import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/routes/app_routes.dart';
import '../../widgets/fade_in_slide.dart';
import '../../widgets/modern_icons.dart';
import 'widgets/profile_avatar.dart';
import '../../services/medicine_request_service.dart';
import '../medicines/models/medicine_request.dart';
import '../../core/config/api_config.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userName = 'Rajesh Kumar';
  String _userEmail = 'rajesh.kumar@gmail.com';
  int _totalOrders = 0;
  int _prescriptionsCount = 0;
  int _deliveredCount = 0;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    final email = prefs.getString('user_email');

    if (mounted) {
      setState(() {
        if (name != null && name.isNotEmpty) {
          _userName = name;
        }
        if (email != null && email.isNotEmpty) {
          _userEmail = email;
        }
      });
    }

    try {
      final requests = await MedicineRequestService.getUserMedicineRequests();
      if (mounted) {
        setState(() {
          _totalOrders = requests.length;
          _prescriptionsCount = requests.where((r) => r.imageReference != null && r.imageReference!.isNotEmpty).length;
          _deliveredCount = requests.where((r) => r.customerConfirmation == CustomerConfirmationStatus.confirmed).length;
        });
      }
    } catch (_) {}
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) {
      Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (route) => false);
    }
  }


  void _showHelpSupportSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Help & Support',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'We are here to assist you 24/7 with any medicine questions.',
              style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13),
            ),
            const SizedBox(height: 18),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.phone_in_talk_rounded, color: Color(0xFF0284C7)),
              ),
              title: Text('Call Support', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              subtitle: Text('+91 1800 123 4567 (Toll Free)', style: GoogleFonts.inter(fontSize: 12)),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981)),
              ),
              title: Text('WhatsApp Helpdesk', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              subtitle: Text('+91 98765 43210', style: GoogleFonts.inter(fontSize: 12)),
              onTap: () => Navigator.pop(ctx),
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFF3E8FF), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.mail_outline_rounded, color: Color(0xFF8B5CF6)),
              ),
              title: Text('Email Support', style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              subtitle: Text('support@davasetu.com', style: GoogleFonts.inter(fontSize: 12)),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettingsSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Settings & Account',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(Icons.notifications_active_outlined, color: Color(0xFF6D28D9)),
              title: Text('Push Notifications', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
            ),
            ListTile(
              leading: const Icon(Icons.lock_outline_rounded, color: Color(0xFF6D28D9)),
              title: Text('Privacy & Security', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.chevron_right_rounded),
            ),
            ListTile(
              leading: const Icon(Icons.description_outlined, color: Color(0xFF6D28D9)),
              title: Text('Terms & Privacy Policy', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.chevron_right_rounded),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444)),
              title: Text(
                'Log Out',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFEF4444),
                ),
              ),
              onTap: () {
                Navigator.pop(ctx);
                _logout();
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            children: [
              // 1. Top Header with Logo & Notification
              Padding(
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
                              color: Color(0xFF7C3AED),
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
              ),

              const SizedBox(height: 8),

              // 2. Profile Hero Gradient Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.1,
                  child: InkWell(
                    onTap: () async {
                      await Navigator.pushNamed(context, AppRoutes.profileDetails);
                      _loadProfile();
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(18.0),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF5B21B6),
                            Color(0xFF7C3AED),
                            Color(0xFF8B5CF6),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF7C3AED).withOpacity(0.3),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -20,
                            top: -20,
                            bottom: -20,
                            child: SizedBox(
                              width: 120,
                              child: CustomPaint(
                                painter: const LeafWatermarkPainter(
                                  color: Color(0x1FFFFFFF),
                                ),
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              ProfileAvatar(
                                size: 68,
                                badgeIcon: Icons.edit_rounded,
                                onBadgeTap: () async {
                                  await Navigator.pushNamed(context, AppRoutes.profileDetails);
                                  _loadProfile();
                                },
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _userName,
                                      style: GoogleFonts.outfit(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _userEmail,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: Colors.white.withOpacity(0.85),
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.04),
                                            blurRadius: 4,
                                          ),
                                        ],
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(
                                            Icons.check_circle_rounded,
                                            color: Color(0xFF10B981),
                                            size: 13,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Verified',
                                            style: GoogleFonts.inter(
                                              color: const Color(0xFF10B981),
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                Icons.chevron_right_rounded,
                                color: Colors.white.withOpacity(0.85),
                                size: 24,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // 3. Quick Stats Row (4 Cards)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.15,
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          customIcon: const ModernPillCapsule(
                            size: 18,
                            primaryColor: Color(0xFF0284C7),
                            secondaryColor: Color(0xFF38BDF8),
                          ),
                          bgColor: const Color(0xFFE0F2FE),
                          title: 'Total Orders',
                          value: '$_totalOrders',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.assignment_outlined,
                          iconColor: const Color(0xFF8B5CF6),
                          bgColor: const Color(0xFFF3E8FF),
                          title: 'Prescriptions',
                          value: '$_prescriptionsCount',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.inventory_2_outlined,
                          iconColor: const Color(0xFF0284C7),
                          bgColor: const Color(0xFFE0F2FE),
                          title: 'Delivered',
                          value: '$_deliveredCount',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatCard(
                          icon: Icons.stars_rounded,
                          iconColor: const Color(0xFF8B5CF6),
                          bgColor: const Color(0xFFF3E8FF),
                          title: 'Total Savings',
                          value: '₹ 284',
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),


              // 5. Menu Items List
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.25,
                  child: Column(
                    children: [
                      _buildMenuCard(
                        icon: Icons.assignment_outlined,
                        iconColor: const Color(0xFF8B5CF6),
                        bgColor: const Color(0xFFF3E8FF),
                        title: 'My Prescriptions',
                        subtitle: 'View, upload and manage your prescriptions',
                        onTap: () => Navigator.pushNamed(context, AppRoutes.myPrescriptions),
                      ),
                      const SizedBox(height: 10),
                      _buildMenuCard(
                        icon: Icons.inventory_2_outlined,
                        iconColor: const Color(0xFF0284C7),
                        bgColor: const Color(0xFFE0F2FE),
                        title: 'My Orders',
                        subtitle: 'Track your medicine orders and deliveries',
                        onTap: () => Navigator.pushNamed(context, AppRoutes.medicineRequests),
                      ),
                      const SizedBox(height: 10),
                      _buildMenuCard(
                        icon: Icons.medication_rounded,
                        iconColor: const Color(0xFF10B981),
                        bgColor: const Color(0xFFD1FAE5),
                        title: 'My Medicines',
                        subtitle: 'Manage your medicine list and reminders',
                        onTap: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
                      ),
                      const SizedBox(height: 10),
                      _buildMenuCard(
                        icon: Icons.headset_mic_outlined,
                        iconColor: const Color(0xFF8B5CF6),
                        bgColor: const Color(0xFFF3E8FF),
                        title: 'Help & Support',
                        subtitle: 'FAQs, contact us and get assistance',
                        onTap: _showHelpSupportSheet,
                      ),
                      const SizedBox(height: 10),
                      _buildMenuCard(
                        icon: Icons.settings_outlined,
                        iconColor: const Color(0xFF64748B),
                        bgColor: const Color(0xFFF1F5F9),
                        title: 'Settings',
                        subtitle: 'App preferences and account settings',
                        onTap: _showSettingsSheet,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 110), // Bottom padding for navigation bar
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    IconData? icon,
    Widget? customIcon,
    Color? iconColor,
    required Color bgColor,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: customIcon ??
                Icon(
                  icon ?? Icons.circle,
                  color: iconColor,
                  size: 16,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            title,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1E1B4B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard({
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
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
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: const Color(0xFF1E1B4B),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF94A3B8),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
