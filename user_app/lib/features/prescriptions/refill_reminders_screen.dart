import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/routes/app_routes.dart';
import '../../widgets/fade_in_slide.dart';
import '../../widgets/modern_icons.dart';

class RefillRemindersScreen extends StatefulWidget {
  const RefillRemindersScreen({super.key});

  @override
  State<RefillRemindersScreen> createState() => _RefillRemindersScreenState();
}

class _RefillRemindersScreenState extends State<RefillRemindersScreen> {
  List<Map<String, dynamic>> _medicines = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMedicines();
  }

  Future<void> _loadMedicines() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('user_medicines');
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        if (mounted) {
          setState(() {
            _medicines = list.map((e) => Map<String, dynamic>.from(e)).toList();
            _isLoading = false;
          });
          return;
        }
      } catch (_) {}
    }

    if (mounted) {
      setState(() {
        _medicines = [
          {
            'name': 'Dolo 650',
            'dosage': '1 tablet • 9:00 AM',
            'remaining': 'Remaining: 3 tablets',
            'remainingCount': 3,
            'status': 'Current',
            'primaryColor': 0xFF0284C7,
            'secColor': 0xFF38BDF8,
            'bgColor': 0xFFE0F2FE,
          },
          {
            'name': 'Vitamin D3',
            'dosage': '1 capsule • 8:00 PM',
            'remaining': 'Remaining: 15 capsules',
            'remainingCount': 15,
            'status': 'Current',
            'primaryColor': 0xFFD97706,
            'secColor': 0xFFFBBF24,
            'bgColor': 0xFFFEF3C7,
          },
          {
            'name': 'Metformin 500',
            'dosage': '1 tablet • 9:00 PM',
            'remaining': 'Remaining: 20 tablets',
            'remainingCount': 20,
            'status': 'Current',
            'primaryColor': 0xFFDB2777,
            'secColor': 0xFFF472B6,
            'bgColor': 0xFFFCE7F3,
          },
        ];
        _isLoading = false;
      });
    }
  }

  Color _getColor(dynamic val, Color fallback) {
    if (val is Color) return val;
    if (val is int) return Color(val);
    return fallback;
  }

  int _getRemainingCount(Map<String, dynamic> med) {
    if (med['remainingCount'] is int) return med['remainingCount'] as int;
    final str = med['remaining']?.toString() ?? '';
    final match = RegExp(r'\d+').firstMatch(str);
    if (match != null) {
      return int.tryParse(match.group(0)!) ?? 10;
    }
    return 10;
  }

  @override
  Widget build(BuildContext context) {
    final dueMedicines = _medicines.where((m) => _getRemainingCount(m) <= 5).toList();
    final otherMedicines = _medicines.where((m) => _getRemainingCount(m) > 5).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Refill Reminders',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.w700,
            fontSize: 20,
            color: const Color(0xFF1E293B),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF6D28D9)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEA580C), Color(0xFFF97316)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFEA580C).withOpacity(0.3),
                          blurRadius: 14,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.alarm_on_rounded, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${dueMedicines.length} Refill${dueMedicines.length == 1 ? '' : 's'} Due Soon',
                                style: GoogleFonts.outfit(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Order in advance to avoid skipping daily doses.',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.white.withOpacity(0.9),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  if (dueMedicines.isNotEmpty) ...[
                    Text(
                      'Urgent Refills (<= 5 Days Remaining)',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...dueMedicines.map((med) => _buildRefillCard(med, isUrgent: true)),
                    const SizedBox(height: 20),
                  ],

                  if (otherMedicines.isNotEmpty) ...[
                    Text(
                      'Upcoming Stock Levels',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...otherMedicines.map((med) => _buildRefillCard(med, isUrgent: false)),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildRefillCard(Map<String, dynamic> med, {required bool isUrgent}) {
    final name = med['name'] as String;
    final dosage = med['dosage'] as String;
    final remaining = med['remaining'] as String;
    final pColor = _getColor(med['primaryColor'], const Color(0xFF0284C7));
    final sColor = _getColor(med['secColor'], const Color(0xFF38BDF8));
    final bColor = _getColor(med['bgColor'], const Color(0xFFE0F2FE));

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isUrgent ? const Color(0xFFFFEDD5) : const Color(0xFFF1F5F9),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: bColor, shape: BoxShape.circle),
            child: Center(
              child: ModernPillCapsule(size: 28, primaryColor: pColor, secondaryColor: sColor),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    if (isUrgent) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'Low Stock',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFDC2626),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  dosage,
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 4),
                Text(
                  remaining,
                  style: GoogleFonts.inter(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: isUrgent ? const Color(0xFFEA580C) : const Color(0xFF10B981),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, AppRoutes.medicineRequest);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: isUrgent ? const Color(0xFF6D28D9) : const Color(0xFFF1F5F9),
              foregroundColor: isUrgent ? Colors.white : const Color(0xFF475569),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              'Order Refill',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}

