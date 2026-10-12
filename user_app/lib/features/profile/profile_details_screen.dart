import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/fade_in_slide.dart';
import 'widgets/profile_avatar.dart';

class ProfileDetailsScreen extends StatefulWidget {
  const ProfileDetailsScreen({super.key});

  @override
  State<ProfileDetailsScreen> createState() => _ProfileDetailsScreenState();
}

class _ProfileDetailsScreenState extends State<ProfileDetailsScreen> {
  String _userName = 'Jenish Lodaliya';
  String _userPhone = '9664781007';
  String _userEmail = 'jklodaliya@gmail.com';
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

  void _showEditFieldSheet({
    required String title,
    required String initialValue,
    required String prefKey,
    required Function(String) onSave,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? hintText,
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
                  'Edit $title',
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
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: maxLines,
              keyboardType: keyboardType,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF1E1B4B),
              ),
              decoration: InputDecoration(
                hintText: hintText ?? 'Enter $title',
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 1.6),
                ),
              ),
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  final text = controller.text.trim();
                  if (text.isNotEmpty) {
                    HapticFeedback.lightImpact();
                    _saveField(prefKey, text, onSave);
                    Navigator.pop(ctx);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  'Save Changes',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showGenderPicker() {
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
            Text(
              'Select Gender',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1E1B4B),
              ),
            ),
            const SizedBox(height: 16),
            ...['Male', 'Female', 'Other'].map((g) {
              final isSelected = _gender.toLowerCase() == g.toLowerCase();
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFF3E8FF) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: ListTile(
                  title: Text(
                    g,
                    style: GoogleFonts.inter(
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      color: isSelected ? const Color(0xFF6D28D9) : const Color(0xFF1E1B4B),
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle_rounded, color: Color(0xFF7C3AED))
                      : null,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _saveField('user_gender', g, (v) => _gender = v);
                    Navigator.pop(ctx);
                  },
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDateOfBirth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(1990, 4, 12),
      firstDate: DateTime(1930),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF7C3AED),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1E1B4B),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      final formatted = '${picked.day} ${months[picked.month - 1]} ${picked.year}';
      _saveField('user_dob', formatted, (v) => _dob = v);
    }
  }

  Future<void> _callEmergency() async {
    final url = Uri.parse('tel:$_emergencyPhone');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Calling $_emergencyPhone')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: _InteractiveIconButton(
          icon: Icons.arrow_back_rounded,
          onTap: () => Navigator.pop(context),
        ),
        title: Text(
          'Profile Details',
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF0F172A),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: _InteractiveIconButton(
              icon: Icons.edit_note_rounded,
              onTap: () {
                _showEditFieldSheet(
                  title: 'Full Name',
                  initialValue: _userName,
                  prefKey: 'user_name',
                  onSave: (v) => _userName = v,
                );
              },
            ),
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
              const SizedBox(height: 10),

              // 1. Ultra-Modern Aurora Profile Identity Card
              FadeInSlide(
                delay: 0.05,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF2E1065), // Deep Violet
                        Color(0xFF4C1D95), // Royal Purple
                        Color(0xFF6D28D9), // Vibrant Purple
                        Color(0xFF7C3AED), // Luminous Violet
                      ],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6D28D9).withOpacity(0.35),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      // Ambient decorative blur orbs
                      Positioned(
                        right: -20,
                        top: -20,
                        child: Container(
                          width: 110,
                          height: 110,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(0.08),
                          ),
                        ),
                      ),
                      Positioned(
                        left: -30,
                        bottom: -30,
                        child: Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF38BDF8).withOpacity(0.12),
                          ),
                        ),
                      ),
                      // Card Content
                      Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  width: 92,
                                  height: 92,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white.withOpacity(0.35), width: 2.5),
                                  ),
                                ),
                                ProfileAvatar(
                                  size: 84,
                                  badgeIcon: Icons.camera_alt_rounded,
                                  onBadgeTap: () {
                                    HapticFeedback.lightImpact();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Photo update feature coming soon!'),
                                        duration: Duration(seconds: 1),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Text(
                              _userName,
                              style: GoogleFonts.outfit(
                                fontSize: 21,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              _userEmail,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: Colors.white.withOpacity(0.85),
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Status Chips Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
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
                                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
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
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.18),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white.withOpacity(0.3), width: 0.8),
                                  ),
                                  child: Text(
                                    'ID: #DS-882',
                                    style: GoogleFonts.inter(
                                      color: Colors.white,
                                      fontSize: 11,
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
                ),
              ),

              const SizedBox(height: 24),

              // 2. Section 1: Personal Information
              FadeInSlide(
                delay: 0.1,
                child: _buildSectionHeader(
                  icon: Icons.person_rounded,
                  title: 'PERSONAL INFORMATION',
                ),
              ),
              const SizedBox(height: 10),

              FadeInSlide(
                delay: 0.12,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1.1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.025),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _DetailTile(
                        icon: Icons.person_outline_rounded,
                        iconGradient: const [Color(0xFF38BDF8), Color(0xFF0284C7)],
                        label: 'Full Name',
                        value: _userName,
                        onTap: () => _showEditFieldSheet(
                          title: 'Full Name',
                          initialValue: _userName,
                          prefKey: 'user_name',
                          onSave: (v) => _userName = v,
                        ),
                      ),
                      _buildDivider(),
                      _DetailTile(
                        icon: Icons.phone_outlined,
                        iconGradient: const [Color(0xFF34D399), Color(0xFF059669)],
                        label: 'Phone Number',
                        value: _userPhone,
                        badgeText: 'Verified',
                        badgeColor: const Color(0xFF059669),
                        badgeBg: const Color(0xFFD1FAE5),
                        onTap: () => _showEditFieldSheet(
                          title: 'Phone Number',
                          initialValue: _userPhone,
                          prefKey: 'user_phone',
                          keyboardType: TextInputType.phone,
                          onSave: (v) => _userPhone = v,
                        ),
                      ),
                      _buildDivider(),
                      _DetailTile(
                        icon: Icons.email_outlined,
                        iconGradient: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                        label: 'Email Address',
                        value: _userEmail,
                        onTap: () => _showEditFieldSheet(
                          title: 'Email Address',
                          initialValue: _userEmail,
                          prefKey: 'user_email',
                          keyboardType: TextInputType.emailAddress,
                          onSave: (v) => _userEmail = v,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // 2.1 Side-by-Side Modern DOB & Gender Cards
              FadeInSlide(
                delay: 0.15,
                child: Row(
                  children: [
                    Expanded(
                      child: _QuickInfoCard(
                        icon: Icons.calendar_today_rounded,
                        iconColor: const Color(0xFF0284C7),
                        bgColor: const Color(0xFFE0F2FE),
                        label: 'Date of Birth',
                        value: _dob,
                        onTap: _pickDateOfBirth,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickInfoCard(
                        icon: Icons.wc_rounded,
                        iconColor: const Color(0xFF7C3AED),
                        bgColor: const Color(0xFFF3E8FF),
                        label: 'Gender',
                        value: _gender,
                        onTap: _showGenderPicker,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 3. Section 2: Residential Address
              FadeInSlide(
                delay: 0.18,
                child: _buildSectionHeader(
                  icon: Icons.location_on_rounded,
                  title: 'RESIDENTIAL ADDRESS',
                  actionText: 'Edit Address',
                  onActionTap: () => _showEditFieldSheet(
                    title: 'Address',
                    initialValue: _address,
                    prefKey: 'user_address',
                    maxLines: 3,
                    onSave: (v) => _address = v,
                  ),
                ),
              ),
              const SizedBox(height: 10),

              FadeInSlide(
                delay: 0.2,
                child: _BouncingCard(
                  onTap: () => _showEditFieldSheet(
                    title: 'Address',
                    initialValue: _address,
                    prefKey: 'user_address',
                    maxLines: 3,
                    onSave: (v) => _address = v,
                  ),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
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
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                            ),
                            borderRadius: BorderRadius.circular(13),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF7C3AED).withOpacity(0.25),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.home_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Primary Residence',
                                    style: GoogleFonts.outfit(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF1E1B4B),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'Default',
                                      style: GoogleFonts.inter(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _address,
                                style: GoogleFonts.inter(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF475569),
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          Icons.chevron_right_rounded,
                          color: Color(0xFF94A3B8),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // 4. Section 3: Emergency Contact
              FadeInSlide(
                delay: 0.22,
                child: _buildSectionHeader(
                  icon: Icons.emergency_rounded,
                  title: 'EMERGENCY & CAREGIVER CONTACT',
                  actionText: 'Edit',
                  onActionTap: () => _showEditFieldSheet(
                    title: 'Emergency Contact Name',
                    initialValue: _emergencyName,
                    prefKey: 'emergency_name',
                    onSave: (v) => _emergencyName = v,
                  ),
                ),
              ),
              const SizedBox(height: 10),

              FadeInSlide(
                delay: 0.25,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0), width: 1.1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.025),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _DetailTile(
                        icon: Icons.person_pin_rounded,
                        iconGradient: const [Color(0xFFFB7185), Color(0xFFE11D48)],
                        label: 'Contact Name',
                        value: _emergencyName,
                        badgeText: _emergencyRelation,
                        badgeColor: const Color(0xFFBE123C),
                        badgeBg: const Color(0xFFFFE4E6),
                        onTap: () => _showEditFieldSheet(
                          title: 'Contact Name',
                          initialValue: _emergencyName,
                          prefKey: 'emergency_name',
                          onSave: (v) => _emergencyName = v,
                        ),
                      ),
                      _buildDivider(),
                      _DetailTile(
                        icon: Icons.phone_in_talk_rounded,
                        iconGradient: const [Color(0xFFF43F5E), Color(0xFFBE123C)],
                        label: 'Emergency Phone',
                        value: _emergencyPhone,
                        onTap: () => _showEditFieldSheet(
                          title: 'Emergency Phone',
                          initialValue: _emergencyPhone,
                          prefKey: 'emergency_phone',
                          keyboardType: TextInputType.phone,
                          onSave: (v) => _emergencyPhone = v,
                        ),
                        trailingWidget: _BouncingCard(
                          onTap: _callEmergency,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFE4E6),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFFECDD3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.call_rounded, size: 13, color: Color(0xFFE11D48)),
                                const SizedBox(width: 4),
                                Text(
                                  'Call',
                                  style: GoogleFonts.inter(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFFBE123C),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      _buildDivider(),
                      _DetailTile(
                        icon: Icons.group_outlined,
                        iconGradient: const [Color(0xFFA855F7), Color(0xFF7E22CE)],
                        label: 'Relationship',
                        value: _emergencyRelation,
                        onTap: () => _showEditFieldSheet(
                          title: 'Relationship',
                          initialValue: _emergencyRelation,
                          prefKey: 'emergency_relation',
                          onSave: (v) => _emergencyRelation = v,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // 5. Data Privacy & Encryption Card
              FadeInSlide(
                delay: 0.28,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFAF5FF), Color(0xFFF3E8FF)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE9D5FF), width: 1.1),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6D28D9).withOpacity(0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.shield_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'End-to-End Encrypted Healthcare',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF4C1D95),
                                fontWeight: FontWeight.w700,
                                fontSize: 13.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Your medical and personal data is secured with HIPAA compliant 256-bit encryption.',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF6D28D9).withOpacity(0.85),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 36),
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
            Icon(icon, color: const Color(0xFF7C3AED), size: 16),
            const SizedBox(width: 7),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF64748B),
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
        if (actionText != null)
          _BouncingCard(
            onTap: onActionTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF3E8FF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.edit_outlined, size: 12, color: Color(0xFF7C3AED)),
                  const SizedBox(width: 4),
                  Text(
                    actionText,
                    style: GoogleFonts.inter(
                      color: const Color(0xFF7C3AED),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
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

// -------------------------------------------------------------
// Interactive Bouncing Touch Wrapper
// -------------------------------------------------------------
class _BouncingCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scaleFactor;

  const _BouncingCard({
    required this.child,
    this.onTap,
    this.scaleFactor = 0.96,
  });

  @override
  State<_BouncingCard> createState() => _BouncingCardState();
}

class _BouncingCardState extends State<_BouncingCard> with SingleTickerProviderStateMixin {
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
// Interactive Header Icon Button
// -------------------------------------------------------------
class _InteractiveIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _InteractiveIconButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _BouncingCard(
      onTap: onTap,
      scaleFactor: 0.88,
      child: Container(
        margin: const EdgeInsets.all(8),
        padding: const EdgeInsets.all(8),
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
        child: Icon(icon, color: const Color(0xFF1E1B4B), size: 20),
      ),
    );
  }
}

// -------------------------------------------------------------
// Modern Detail Tile with Squircle Gradient Icon
// -------------------------------------------------------------
class _DetailTile extends StatelessWidget {
  final IconData icon;
  final List<Color> iconGradient;
  final String label;
  final String value;
  final String? badgeText;
  final Color? badgeColor;
  final Color? badgeBg;
  final Widget? trailingWidget;
  final VoidCallback onTap;

  const _DetailTile({
    required this.icon,
    required this.iconGradient,
    required this.label,
    required this.value,
    this.badgeText,
    this.badgeColor,
    this.badgeBg,
    this.trailingWidget,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _BouncingCard(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: iconGradient,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: iconGradient.last.withOpacity(0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E1B4B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (badgeText != null)
              Container(
                margin: const EdgeInsets.only(right: 6),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
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
            if (trailingWidget != null)
              trailingWidget!
            else
              Container(
                width: 26,
                height: 26,
                decoration: const BoxDecoration(
                  color: Color(0xFFF8FAFC),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF94A3B8),
                  size: 16,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// -------------------------------------------------------------
// Quick Info Card (DOB & Gender Side-by-Side)
// -------------------------------------------------------------
class _QuickInfoCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _QuickInfoCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _BouncingCard(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
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
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 19),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E1B4B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 16),
          ],
        ),
      ),
    );
  }
}
