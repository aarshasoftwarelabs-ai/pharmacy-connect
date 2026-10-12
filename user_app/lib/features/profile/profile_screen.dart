import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/routes/app_routes.dart';
import '../../widgets/fade_in_slide.dart';
import '../../widgets/modern_icons.dart';
import 'widgets/profile_avatar.dart';
import '../../services/medicine_request_service.dart';
import '../medicines/models/medicine_request.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  String _userName = 'Jenish Lodaliya';
  String _userEmail = 'jklodaliya@gmail.com';
  String _userPhone = '+91 98765 43210';
  int _totalOrders = 0;
  int _prescriptionsCount = 0;
  int _deliveredCount = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    final email = prefs.getString('user_email');
    final phone = prefs.getString('user_phone');

    if (mounted) {
      setState(() {
        if (name != null && name.isNotEmpty) _userName = name;
        if (email != null && email.isNotEmpty) _userEmail = email;
        if (phone != null && phone.isNotEmpty) _userPhone = phone;
      });
    }

    try {
      final requests = await MedicineRequestService.getUserMedicineRequests();
      if (mounted) {
        setState(() {
          _totalOrders = requests.length;
          _prescriptionsCount = requests.where((r) => r.imageReference != null && r.imageReference!.isNotEmpty).length;
          _deliveredCount = requests.where((r) => r.customerConfirmation == CustomerConfirmationStatus.confirmed).length;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) {
      Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (route) => false);
    }
  }

  void _showLogoutConfirmationDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFFEE2E2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 28),
            ),
            const SizedBox(height: 14),
            Text(
              'Log Out of Dava Setu?',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E1B4B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Are you sure you want to log out? You will need to sign in again to access your prescriptions and orders.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF64748B),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      'Cancel',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF475569),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _logout();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      'Log Out',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showHelpSupportSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Help & Support',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E1B4B),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '24/7 dedicated customer assistance',
                      style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 12.5),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 18),
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              tileColor: const Color(0xFFF8FAFC),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.phone_in_talk_rounded, color: Color(0xFF0284C7)),
              ),
              title: Text('Toll-Free Helpline', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14.5)),
              subtitle: Text('+91 1800 123 4567 (Free 24x7)', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
              onTap: () => Navigator.pop(ctx),
            ),
            const SizedBox(height: 10),
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              tileColor: const Color(0xFFF8FAFC),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981)),
              ),
              title: Text('WhatsApp Support', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14.5)),
              subtitle: Text('+91 98765 43210 (Instant reply)', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
              onTap: () => Navigator.pop(ctx),
            ),
            const SizedBox(height: 10),
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              tileColor: const Color(0xFFF8FAFC),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: const Color(0xFFF3E8FF), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.mail_outline_rounded, color: Color(0xFF8B5CF6)),
              ),
              title: Text('Email Care', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14.5)),
              subtitle: Text('support@davasetu.com', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
              trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
              onTap: () => Navigator.pop(ctx),
            ),
            const SizedBox(height: 12),
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
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Settings & Preferences',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E1B4B),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFF3E8FF), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.notifications_active_outlined, color: Color(0xFF7C3AED), size: 20),
              ),
              title: Text('Push Notifications', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              trailing: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 22),
            ),
            const Divider(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.lock_outline_rounded, color: Color(0xFF0284C7), size: 20),
              ),
              title: Text('Privacy & Security', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
            ),
            const Divider(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.description_outlined, color: Color(0xFF475569), size: 20),
              ),
              title: Text('Terms & Privacy Policy', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
              trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
            ),
            const SizedBox(height: 12),
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
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Top Modern Header Bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20.0, 12.0, 20.0, 10.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(2.5),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              colors: [Color(0xFF7C3AED), Color(0xFF3B82F6)],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF7C3AED).withOpacity(0.25),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Container(
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Image.asset(
                              'assets/images/logo.png',
                              height: 38,
                              width: 38,
                              errorBuilder: (c, e, s) => Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF7C3AED),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 22),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  'Dava Setu',
                                  style: GoogleFonts.outfit(
                                    fontSize: 21,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                    letterSpacing: -0.4,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF10B981),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
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
                    Row(
                      children: [
                        _HeaderIconButton(
                          icon: Icons.notifications_none_rounded,
                          hasBadge: true,
                          onTap: () => Navigator.pushNamed(context, AppRoutes.notifications),
                        ),
                        const SizedBox(width: 8),
                        _HeaderIconButton(
                          icon: Icons.settings_outlined,
                          hasBadge: false,
                          onTap: _showSettingsSheet,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 6),

              // 2. Ultra-Modern Aurora Hero Profile Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.05,
                  child: _InteractiveCard(
                    onTap: () async {
                      await Navigator.pushNamed(context, AppRoutes.profileDetails);
                      _loadProfile();
                    },
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF2E1065), // Deep Violet
                            Color(0xFF4C1D95), // Royal Purple
                            Color(0xFF6D28D9), // Vibrant Violet
                            Color(0xFF7C3AED), // Luminous Purple
                          ],
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6D28D9).withOpacity(0.35),
                            blurRadius: 22,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          // Ambient decorative glowing orbs
                          Positioned(
                            right: -25,
                            top: -25,
                            child: Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.08),
                              ),
                            ),
                          ),
                          Positioned(
                            right: 40,
                            bottom: -35,
                            child: Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: const Color(0xFF38BDF8).withOpacity(0.12),
                              ),
                            ),
                          ),
                          // Content
                          Padding(
                            padding: const EdgeInsets.all(18.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    // Animated ring wrapped Avatar
                                    Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Container(
                                          width: 72,
                                          height: 72,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white.withOpacity(0.35), width: 2),
                                          ),
                                        ),
                                        ProfileAvatar(
                                          size: 66,
                                          badgeIcon: Icons.edit_rounded,
                                          onBadgeTap: () async {
                                            await Navigator.pushNamed(context, AppRoutes.profileDetails);
                                            _loadProfile();
                                          },
                                        ),
                                      ],
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _userName,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: GoogleFonts.outfit(
                                              fontSize: 19.5,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.white,
                                              letterSpacing: -0.3,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Row(
                                            children: [
                                              Icon(Icons.mail_outline_rounded, size: 12, color: Colors.white.withOpacity(0.8)),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  _userEmail,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    color: Colors.white.withOpacity(0.85),
                                                    fontWeight: FontWeight.w400,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              // Verified Badge Chip
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(20),
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: Colors.black.withOpacity(0.08),
                                                      blurRadius: 6,
                                                      offset: const Offset(0, 2),
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
                                                      'Verified Patient',
                                                      style: GoogleFonts.inter(
                                                        color: const Color(0xFF0F766E),
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w700,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              // ID Chip
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.white.withOpacity(0.18),
                                                  borderRadius: BorderRadius.circular(20),
                                                  border: Border.all(color: Colors.white.withOpacity(0.3), width: 0.8),
                                                ),
                                                child: Text(
                                                  'ID: #DS-882',
                                                  style: GoogleFonts.inter(
                                                    color: Colors.white,
                                                    fontSize: 10.5,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),
                                // Sub-card divider & Action Row
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: Colors.white.withOpacity(0.18), width: 0.8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(Icons.shield_outlined, size: 14, color: Color(0xFF34D399)),
                                          const SizedBox(width: 6),
                                          Text(
                                            'Healthcare ID Active',
                                            style: GoogleFonts.inter(
                                              fontSize: 11.5,
                                              color: Colors.white,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          Text(
                                            'Edit Profile',
                                            style: GoogleFonts.inter(
                                              fontSize: 11.5,
                                              color: Colors.white,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const SizedBox(width: 2),
                                          const Icon(Icons.chevron_right_rounded, size: 16, color: Colors.white),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // 3. Section Title: Quick Analytics Hub
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'OVERVIEW & STATS',
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF64748B),
                        letterSpacing: 0.8,
                      ),
                    ),
                    Text(
                      'Live sync',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF10B981),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 10),

              // 4. Executive 2x2 Interactive Quick Stats Grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.1,
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Total Orders',
                              value: '$_totalOrders',
                              badgeText: 'Active',
                              badgeColor: const Color(0xFF0284C7),
                              badgeBg: const Color(0xFFE0F2FE),
                              iconWidget: const ModernPillCapsule(
                                size: 22,
                                primaryColor: Color(0xFF0284C7),
                                secondaryColor: Color(0xFF38BDF8),
                              ),
                              cardGradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Colors.white, Color(0xFFF0F9FF)],
                              ),
                              borderColor: const Color(0xFFBAE6FD),
                              onTap: () => Navigator.pushNamed(context, AppRoutes.medicineRequests),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              title: 'Prescriptions',
                              value: '$_prescriptionsCount',
                              badgeText: 'Digital Rx',
                              badgeColor: const Color(0xFF7C3AED),
                              badgeBg: const Color(0xFFF3E8FF),
                              iconData: Icons.assignment_outlined,
                              iconColor: const Color(0xFF7C3AED),
                              cardGradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Colors.white, Color(0xFFFAF5FF)],
                              ),
                              borderColor: const Color(0xFFE9D5FF),
                              onTap: () => Navigator.pushNamed(context, AppRoutes.myPrescriptions),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Delivered',
                              value: '$_deliveredCount',
                              badgeText: 'Fulfilled',
                              badgeColor: const Color(0xFF059669),
                              badgeBg: const Color(0xFFD1FAE5),
                              iconData: Icons.check_circle_outline_rounded,
                              iconColor: const Color(0xFF059669),
                              cardGradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Colors.white, Color(0xFFECFDF5)],
                              ),
                              borderColor: const Color(0xFFA7F3D0),
                              onTap: () => Navigator.pushNamed(context, AppRoutes.medicineRequests),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _StatCard(
                              title: 'Total Savings',
                              value: '₹ 284',
                              badgeText: 'Saved',
                              badgeColor: const Color(0xFFD97706),
                              badgeBg: const Color(0xFFFEF3C7),
                              iconData: Icons.stars_rounded,
                              iconColor: const Color(0xFFD97706),
                              cardGradient: const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Colors.white, Color(0xFFFFFBEB)],
                              ),
                              borderColor: const Color(0xFFFDE68A),
                              onTap: () {
                                HapticFeedback.lightImpact();
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // 5. Smart Pharmacy Action Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.15,
                  child: _InteractiveCard(
                    onTap: () => Navigator.pushNamed(context, AppRoutes.medicineRequest),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                        ),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF38BDF8), Color(0xFF0284C7)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 26),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Need Quick Medicines?',
                                  style: GoogleFonts.outfit(
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Upload prescription or request refills in 1 tap',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: const Color(0xFF94A3B8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0284C7),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'Order Now',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // 6. Section 1: Health & Pharmacy Services
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Text(
                  'HEALTH & PHARMACY SERVICES',
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF64748B),
                    letterSpacing: 0.8,
                  ),
                ),
              ),

              const SizedBox(height: 10),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.2,
                  child: Column(
                    children: [
                      _MenuTile(
                        icon: Icons.assignment_outlined,
                        iconGradient: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                        title: 'My Prescriptions',
                        subtitle: 'View, upload and manage digital doctor prescriptions',
                        badgeText: '$_prescriptionsCount Saved',
                        badgeColor: const Color(0xFF7C3AED),
                        badgeBg: const Color(0xFFF3E8FF),
                        onTap: () => Navigator.pushNamed(context, AppRoutes.myPrescriptions),
                      ),
                      const SizedBox(height: 10),
                      _MenuTile(
                        icon: Icons.inventory_2_outlined,
                        iconGradient: const [Color(0xFF38BDF8), Color(0xFF0284C7)],
                        title: 'My Orders & Requests',
                        subtitle: 'Track live medicine deliveries and status updates',
                        badgeText: '$_totalOrders Total',
                        badgeColor: const Color(0xFF0284C7),
                        badgeBg: const Color(0xFFE0F2FE),
                        onTap: () => Navigator.pushNamed(context, AppRoutes.medicineRequests),
                      ),
                      const SizedBox(height: 10),
                      _MenuTile(
                        icon: Icons.medication_rounded,
                        iconGradient: const [Color(0xFF34D399), Color(0xFF059669)],
                        title: 'My Medicines & Reminders',
                        subtitle: 'Daily dosage schedules and refill alerts',
                        badgeText: 'Daily Care',
                        badgeColor: const Color(0xFF059669),
                        badgeBg: const Color(0xFFD1FAE5),
                        onTap: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // 7. Section 2: Support & Preferences
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Text(
                  'PREFERENCES & SUPPORT',
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF64748B),
                    letterSpacing: 0.8,
                  ),
                ),
              ),

              const SizedBox(height: 10),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.25,
                  child: Column(
                    children: [
                      _MenuTile(
                        icon: Icons.headset_mic_outlined,
                        iconGradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
                        title: 'Help & 24/7 Support',
                        subtitle: 'Toll-free helpline, WhatsApp chat and FAQs',
                        badgeText: '24/7 Active',
                        badgeColor: const Color(0xFF059669),
                        badgeBg: const Color(0xFFECFDF5),
                        onTap: _showHelpSupportSheet,
                      ),
                      const SizedBox(height: 10),
                      _MenuTile(
                        icon: Icons.settings_outlined,
                        iconGradient: const [Color(0xFF64748B), Color(0xFF334155)],
                        title: 'Settings & Privacy',
                        subtitle: 'Push notifications, security and preferences',
                        onTap: _showSettingsSheet,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // 8. Modern Logout Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: FadeInSlide(
                  delay: 0.3,
                  child: _InteractiveCard(
                    onTap: _showLogoutConfirmationDialog,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFFEE2E2), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(13),
                            ),
                            child: const Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Log Out Account',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14.5,
                                    color: const Color(0xFFDC2626),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Securely sign out of this device',
                                  style: GoogleFonts.inter(
                                    fontSize: 11.5,
                                    color: const Color(0xFF991B1B).withOpacity(0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.chevron_right_rounded,
                            color: Color(0xFFF87171),
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // 9. Trust & App Version Tag
              Center(
                child: Column(
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.verified_user_outlined, size: 13, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 5),
                        Text(
                          '100% Encrypted & HIPAA Compliant Healthcare',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFF94A3B8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Dava Setu v1.0.4',
                      style: GoogleFonts.inter(
                        fontSize: 10.5,
                        color: const Color(0xFFCBD5E1),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// Interactive Bouncing Touch Wrapper (Smooth iOS/Modern Android feel)
// -------------------------------------------------------------
class _InteractiveCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleFactor;

  const _InteractiveCard({
    required this.child,
    this.onTap,
    this.scaleFactor = 0.97,
  });

  @override
  State<_InteractiveCard> createState() => _InteractiveCardState();
}

class _InteractiveCardState extends State<_InteractiveCard> with SingleTickerProviderStateMixin {
  late AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 110),
      lowerBound: 0.0,
      upperBound: 1.0,
    );
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        if (widget.onTap != null) _anim.forward();
      },
      onTapUp: (_) {
        if (widget.onTap != null) _anim.reverse();
      },
      onTapCancel: () {
        if (widget.onTap != null) _anim.reverse();
      },
      onTap: () {
        if (widget.onTap != null) {
          HapticFeedback.lightImpact();
          widget.onTap!();
        }
      },
      child: AnimatedBuilder(
        animation: _anim,
        builder: (context, child) {
          final scale = 1.0 - (_anim.value * (1.0 - widget.scaleFactor));
          return Transform.scale(scale: scale, child: widget.child);
        },
      ),
    );
  }
}

// -------------------------------------------------------------
// Header Action Icon Button
// -------------------------------------------------------------
class _HeaderIconButton extends StatelessWidget {
  final IconData icon;
  final bool hasBadge;
  final VoidCallback onTap;

  const _HeaderIconButton({
    required this.icon,
    required this.hasBadge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _InteractiveCard(
      onTap: onTap,
      scaleFactor: 0.90,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(icon, size: 21, color: const Color(0xFF1E1B4B)),
          ),
          if (hasBadge)
            Positioned(
              right: 6,
              top: 5,
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
    );
  }
}

// -------------------------------------------------------------
// Executive Modern Stat Card (Used in 2x2 Grid)
// -------------------------------------------------------------
class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String badgeText;
  final Color badgeColor;
  final Color badgeBg;
  final IconData? iconData;
  final Widget? iconWidget;
  final Color? iconColor;
  final Gradient cardGradient;
  final Color borderColor;
  final VoidCallback onTap;

  const _StatCard({
    required this.title,
    required this.value,
    required this.badgeText,
    required this.badgeColor,
    required this.badgeBg,
    this.iconData,
    this.iconWidget,
    this.iconColor,
    required this.cardGradient,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _InteractiveCard(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: cardGradient,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: borderColor.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    shape: BoxShape.circle,
                  ),
                  child: iconWidget ??
                      Icon(
                        iconData ?? Icons.circle,
                        color: iconColor,
                        size: 18,
                      ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badgeText,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: badgeColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// Modern Menu Tile with Gradient Squircle Icon & Interactive Feedback
// -------------------------------------------------------------
class _MenuTile extends StatelessWidget {
  final IconData icon;
  final List<Color> iconGradient;
  final String title;
  final String subtitle;
  final String? badgeText;
  final Color? badgeColor;
  final Color? badgeBg;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.iconGradient,
    required this.title,
    required this.subtitle,
    this.badgeText,
    this.badgeColor,
    this.badgeBg,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _InteractiveCard(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 13.0),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.025),
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
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: iconGradient,
                ),
                borderRadius: BorderRadius.circular(13),
                boxShadow: [
                  BoxShadow(
                    color: iconGradient.last.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 21),
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
                      fontSize: 14.5,
                      color: const Color(0xFF1E1B4B),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (badgeText != null)
              Container(
                margin: const EdgeInsets.only(right: 6),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg ?? const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badgeText!,
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: badgeColor ?? const Color(0xFF475569),
                  ),
                ),
              ),
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Color(0xFFF8FAFC),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chevron_right_rounded,
                color: Color(0xFF94A3B8),
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
