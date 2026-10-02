import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../widgets/fade_in_slide.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _userName = 'Guest User';
  String _initials = 'GU';

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString('user_name');
    if (name != null && name.isNotEmpty) {
      setState(() {
        _userName = name;
        final parts = name.trim().split(' ');
        if (parts.length > 1) {
          _initials = '${parts[0][0]}${parts[1][0]}'.toUpperCase();
        } else {
          _initials = name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
        }
      });
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
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          FadeInSlide(
            delay: 0.1,
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.primaryLight,
                  child: Text(_initials, style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_userName, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    const Text('User Account', style: TextStyle(color: AppColors.textSecondary)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          FadeInSlide(delay: 0.2, child: _buildSectionHeader('Account')),
          FadeInSlide(delay: 0.3, child: _buildListTile(Icons.person_outline, 'Personal Information')),
          FadeInSlide(delay: 0.4, child: _buildListTile(Icons.location_on_outlined, 'Saved Addresses')),
          FadeInSlide(delay: 0.5, child: _buildListTile(Icons.local_pharmacy_outlined, 'My Pharmacy')),
          const SizedBox(height: 24),
          FadeInSlide(delay: 0.6, child: _buildSectionHeader('Settings')),
          FadeInSlide(delay: 0.7, child: _buildListTile(Icons.notifications_outlined, 'Notifications')),
          FadeInSlide(delay: 0.8, child: _buildListTile(Icons.help_outline, 'Help & Support')),
          FadeInSlide(delay: 0.9, child: _buildListTile(Icons.info_outline, 'About PharmacyConnect')),
          const SizedBox(height: 32),
          FadeInSlide(
            delay: 1.0,
            child: TextButton(
              onPressed: _logout,
              child: const Text('Logout', style: TextStyle(color: AppColors.error, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textHint, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildListTile(IconData icon, String title) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: AppColors.textPrimary, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
      onTap: () {},
    );
  }
}
