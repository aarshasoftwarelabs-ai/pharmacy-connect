import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/routes/app_routes.dart';
import '../../widgets/fade_in_slide.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userName = 'Guest User';
  String _userSubtitle = 'User Account';
  String _initials = 'GU';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    final phone = prefs.getString('user_phone'); // Typically apps store phone or email
    
    if (name != null && name.isNotEmpty) {
      if (mounted) {
        setState(() {
          _userName = name;
          _userSubtitle = phone ?? 'Personal Account';
          final parts = name.trim().split(' ');
          if (parts.length > 1) {
            _initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
          } else {
            _initials = name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
          }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Modern cool gray background
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _buildModernAppBar(),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FadeInSlide(delay: 0.1, child: _buildSectionHeader('Account Overview')),
                  const SizedBox(height: 12),
                  FadeInSlide(delay: 0.2, child: _buildModernListTile(Icons.person_outline_rounded, 'Personal Information', const Color(0xFF3B82F6))),
                  FadeInSlide(delay: 0.3, child: _buildModernListTile(Icons.location_on_outlined, 'Saved Addresses', const Color(0xFFF59E0B))),
                  FadeInSlide(delay: 0.4, child: _buildModernListTile(Icons.local_pharmacy_outlined, 'My Pharmacy', const Color(0xFF0F766E))),
                  
                  const SizedBox(height: 32),
                  FadeInSlide(delay: 0.5, child: _buildSectionHeader('Preferences & Settings')),
                  const SizedBox(height: 12),
                  FadeInSlide(delay: 0.6, child: _buildModernListTile(Icons.notifications_outlined, 'Notifications', const Color(0xFF8B5CF6))),
                  FadeInSlide(delay: 0.7, child: _buildModernListTile(Icons.help_outline_rounded, 'Help & Support', const Color(0xFF14B8A6))),
                  FadeInSlide(delay: 0.8, child: _buildModernListTile(Icons.info_outline_rounded, 'About PharmacyConnect', const Color(0xFF6366F1))),
                  
                  const SizedBox(height: 40),
                  FadeInSlide(
                    delay: 0.9,
                    child: Center(
                      child: InkWell(
                        onTap: _logout,
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Log Out',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFFEF4444),
                                  fontWeight: FontWeight.w600,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernAppBar() {
    return SliverAppBar(
      expandedHeight: 220.0,
      floating: false,
      pinned: true,
      elevation: 0,
      backgroundColor: const Color(0xFF0F766E),
      automaticallyImplyLeading: false, // Prevents back button if not needed, or handled via app layout
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0F766E), Color(0xFF14B8A6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              // Decorative circles for a modern glassmorphism touch
              Positioned(
                right: -50,
                top: -50,
                child: CircleAvatar(
                  radius: 100,
                  backgroundColor: Colors.white.withOpacity(0.1),
                ),
              ),
              Positioned(
                left: -30,
                bottom: -20,
                child: CircleAvatar(
                  radius: 60,
                  backgroundColor: Colors.white.withOpacity(0.1),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              shape: BoxShape.circle,
                            ),
                            child: CircleAvatar(
                              radius: 36,
                              backgroundColor: Colors.white,
                              child: Text(
                                _initials,
                                style: GoogleFonts.outfit(
                                  fontSize: 28,
                                  color: const Color(0xFF0F766E),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _userName,
                                  style: GoogleFonts.outfit(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    _userSubtitle,
                                    style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF94A3B8),
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildModernListTile(IconData icon, String title, Color iconColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {},
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: iconColor, size: 22),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      color: const Color(0xFF334155),
                    ),
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Color(0xFFCBD5E1),
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
