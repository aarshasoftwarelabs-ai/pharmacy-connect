import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'widgets/profile_avatar.dart';

class ProfileDetailsScreen extends StatefulWidget {
  const ProfileDetailsScreen({super.key});

  @override
  State<ProfileDetailsScreen> createState() => _ProfileDetailsScreenState();
}

class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
  String _userName = 'Rajesh Kumar';
  String _userPhone = '+91 98765 43210';
  String _userEmail = 'rajesh.kumar@gmail.com';
  String _dob = '12 Apr 1990';
  String _gender = 'Male';
  String _address = '123, Green Park Society\nRing Road, Surat - 395001\nGujarat, India';
  String _emergencyName = 'Priya Shah';
  String _emergencyPhone = '+91 98765 43211';
  String _emergencyRelation = 'Wife';

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = prefs.getString('user_name') ?? _userName;
      _userPhone = prefs.getString('user_phone') ?? _userPhone;
      _userEmail = prefs.getString('user_email') ?? _userEmail;
      _dob = prefs.getString('user_dob') ?? _dob;
      _gender = prefs.getString('user_gender') ?? _gender;
      _address = prefs.getString('user_address') ?? _address;
      _emergencyName = prefs.getString('emergency_name') ?? _emergencyName;
      _emergencyPhone = prefs.getString('emergency_phone') ?? _emergencyPhone;
      _emergencyRelation = prefs.getString('emergency_relation') ?? _emergencyRelation;
    });
  }

  Future<void> _saveField(String key, String value, Function(String) onUpdate) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
    setState(() {
      onUpdate(value);
    });
  }

  void _showEditDialog({
    required String title,
    required String initialValue,
    required String prefKey,
    required Function(String) onSave,
  }) {
    final controller = TextEditingController(text: initialValue);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          top: 24,
          left: 20,
          right: 20,
        ),
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
                  'Edit $title',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
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
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: prefKey == 'user_address' ? 3 : 1,
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFFF8F9FE),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF6D28D9), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  final text = controller.text.trim();
                  if (text.isNotEmpty) {
                    _saveField(prefKey, text, onSave);
                    Navigator.pop(ctx);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6D28D9),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  'Save Changes',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: Colors.white,
                  ),
                ),
              ),
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
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF1E1B4B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Profile',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1E1B4B),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Color(0xFF1E1B4B), size: 22),
            onPressed: () {
              _showEditDialog(
                title: 'Full Name',
                initialValue: _userName,
                prefKey: 'user_name',
                onSave: (v) => _userName = v,
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              // Profile Header Area
              Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Positioned(
                      right: -30,
                      top: -10,
                      child: SizedBox(
                        width: 140,
                        height: 140,
                        child: CustomPaint(
                          painter: LeafWatermarkPainter(
                            color: const Color(0xFF8B5CF6).withOpacity(0.08),
                          ),
                        ),
                      ),
                    ),
                    Column(
                      children: [
                        ProfileAvatar(
                          size: 88,
                          badgeIcon: Icons.camera_alt_rounded,
                          onBadgeTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Change photo coming soon!'),
                                duration: Duration(seconds: 1),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _userName,
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1E1B4B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _userEmail,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: const Color(0xFF64748B),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFA7F3D0)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
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
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Section 1: Personal Information
              _buildSectionHeader(
                icon: Icons.person_rounded,
                title: 'Personal Information',
              ),
              const SizedBox(height: 10),
              Container(
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
                child: Column(
                  children: [
                    _buildInfoRow(
                      icon: Icons.person_outline_rounded,
                      label: 'Full Name',
                      value: _userName,
                      onTap: () => _showEditDialog(
                        title: 'Full Name',
                        initialValue: _userName,
                        prefKey: 'user_name',
                        onSave: (v) => _userName = v,
                      ),
                    ),
                    _buildDivider(),
                    _buildInfoRow(
                      icon: Icons.phone_outlined,
                      label: 'Phone Number',
                      value: _userPhone,
                      onTap: () => _showEditDialog(
                        title: 'Phone Number',
                        initialValue: _userPhone,
                        prefKey: 'user_phone',
                        onSave: (v) => _userPhone = v,
                      ),
                    ),
                    _buildDivider(),
                    _buildInfoRow(
                      icon: Icons.email_outlined,
                      label: 'Email Address',
                      value: _userEmail,
                      onTap: () => _showEditDialog(
                        title: 'Email Address',
                        initialValue: _userEmail,
                        prefKey: 'user_email',
                        onSave: (v) => _userEmail = v,
                      ),
                    ),
                    _buildDivider(),
                    _buildInfoRow(
                      icon: Icons.calendar_today_outlined,
                      label: 'Date of Birth',
                      value: _dob,
                      onTap: () => _showEditDialog(
                        title: 'Date of Birth',
                        initialValue: _dob,
                        prefKey: 'user_dob',
                        onSave: (v) => _dob = v,
                      ),
                    ),
                    _buildDivider(),
                    _buildInfoRow(
                      icon: Icons.wc_outlined,
                      label: 'Gender',
                      value: _gender,
                      onTap: () => _showEditDialog(
                        title: 'Gender',
                        initialValue: _gender,
                        prefKey: 'user_gender',
                        onSave: (v) => _gender = v,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Section 2: Address
              _buildSectionHeader(
                icon: Icons.location_on_rounded,
                title: 'Address',
                actionText: 'Edit',
                onActionTap: () => _showEditDialog(
                  title: 'Address',
                  initialValue: _address,
                  prefKey: 'user_address',
                  onSave: (v) => _address = v,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
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
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEDE9FE),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.home_outlined,
                        color: Color(0xFF6D28D9),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        _address,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF334155),
                          height: 1.45,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Section 3: Emergency Contact
              _buildSectionHeader(
                icon: Icons.phone_in_talk_rounded,
                title: 'Emergency Contact',
                actionText: 'Edit',
                onActionTap: () => _showEditDialog(
                  title: 'Emergency Contact Name',
                  initialValue: _emergencyName,
                  prefKey: 'emergency_name',
                  onSave: (v) => _emergencyName = v,
                ),
              ),
              const SizedBox(height: 10),
              Container(
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
                child: Column(
                  children: [
                    _buildInfoRow(
                      icon: Icons.person_outline_rounded,
                      label: 'Name',
                      value: _emergencyName,
                      onTap: () => _showEditDialog(
                        title: 'Emergency Contact Name',
                        initialValue: _emergencyName,
                        prefKey: 'emergency_name',
                        onSave: (v) => _emergencyName = v,
                      ),
                    ),
                    _buildDivider(),
                    _buildInfoRow(
                      icon: Icons.phone_outlined,
                      label: 'Phone Number',
                      value: _emergencyPhone,
                      onTap: () => _showEditDialog(
                        title: 'Emergency Phone',
                        initialValue: _emergencyPhone,
                        prefKey: 'emergency_phone',
                        onSave: (v) => _emergencyPhone = v,
                      ),
                    ),
                    _buildDivider(),
                    _buildInfoRow(
                      icon: Icons.group_outlined,
                      label: 'Relation',
                      value: _emergencyRelation,
                      onTap: () => _showEditDialog(
                        title: 'Relation',
                        initialValue: _emergencyRelation,
                        prefKey: 'emergency_relation',
                        onSave: (v) => _emergencyRelation = v,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Privacy Notice Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFAF5FF),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFEDE9FE)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6D28D9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.shield_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Your privacy is important to us',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF5B21B6),
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'We keep your information safe and secure.',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFF7C3AED),
                      size: 20,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required IconData icon,
    required String title,
    String? actionText,
    VoidCallback? onActionTap,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFF6D28D9), size: 18),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E1B4B),
              ),
            ),
          ],
        ),
        if (actionText != null)
          GestureDetector(
            onTap: onActionTap,
            child: Row(
              children: [
                const Icon(Icons.arrow_back_rounded, size: 12, color: Color(0xFF6D28D9)),
                const SizedBox(width: 2),
                Text(
                  actionText,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF6D28D9),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF0284C7), size: 20),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF475569),
                ),
              ),
            ),
            Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1E1B4B),
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.0),
      child: Divider(
        height: 1,
        thickness: 1,
        color: Color(0xFFF1F5F9),
      ),
    );
  }
}
