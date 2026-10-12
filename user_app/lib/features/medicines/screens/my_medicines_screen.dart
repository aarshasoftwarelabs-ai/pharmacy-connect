import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/routes/app_routes.dart';
import '../../../widgets/fade_in_slide.dart';
import '../../../widgets/modern_icons.dart';

class MyMedicinesScreen extends StatefulWidget {
  const MyMedicinesScreen({super.key});

  @override
  State<MyMedicinesScreen> createState() => _MyMedicinesScreenState();
}

class _MyMedicinesScreenState extends State<MyMedicinesScreen> {
  int _selectedTabIndex = 0; // 0: Current, 1: Past, 2: All
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _medicines = [];

  static const List<Map<String, dynamic>> _defaultMedicines = [
    {
      'name': 'Dolo 650',
      'type': 'Tablet',
      'dosage': '1 tablet',
      'time': '9:00 AM',
      'meal': 'After Breakfast',
      'remaining': '3 tablets',
      'remainingCount': 3,
      'totalCount': 15,
      'status': 'Current',
      'isTakenToday': true,
      'primaryColor': 0xFF0284C7,
      'secColor': 0xFF38BDF8,
      'bgColor': 0xFFE0F2FE,
    },
    {
      'name': 'Vitamin D3',
      'type': 'Capsule',
      'dosage': '1 capsule',
      'time': '8:00 PM',
      'meal': 'With Milk / Dinner',
      'remaining': '15 capsules',
      'remainingCount': 15,
      'totalCount': 30,
      'status': 'Current',
      'isTakenToday': false,
      'primaryColor': 0xFFD97706,
      'secColor': 0xFFFBBF24,
      'bgColor': 0xFFFEF3C7,
    },
    {
      'name': 'Metformin 500',
      'type': 'Tablet',
      'dosage': '1 tablet',
      'time': '9:00 PM',
      'meal': 'After Dinner',
      'remaining': '20 tablets',
      'remainingCount': 20,
      'totalCount': 30,
      'status': 'Current',
      'isTakenToday': false,
      'primaryColor': 0xFFDB2777,
      'secColor': 0xFFF472B6,
      'bgColor': 0xFFFCE7F3,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadMedicines();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMedicines() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString('user_medicines');
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        setState(() {
          _medicines = list.map((e) {
            final m = Map<String, dynamic>.from(e);
            // Ensure safe fallbacks for newly added fields
            m['totalCount'] = m['totalCount'] ?? 30;
            m['isTakenToday'] = m['isTakenToday'] ?? false;
            m['meal'] = m['meal'] ?? 'After Meal';
            m['time'] = m['time'] ?? '9:00 AM';
            m['type'] = m['type'] ?? 'Tablet';
            return m;
          }).toList();
        });
        return;
      } catch (_) {}
    }

    setState(() {
      _medicines = List.from(_defaultMedicines.map((m) => Map<String, dynamic>.from(m)));
    });
    _saveMedicines();
  }

  Future<void> _saveMedicines() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_medicines', jsonEncode(_medicines));
  }

  void _toggleDoseTaken(int index) {
    HapticFeedback.mediumImpact();
    setState(() {
      final current = _medicines[index]['isTakenToday'] == true;
      _medicines[index]['isTakenToday'] = !current;
      _saveMedicines();
    });

    final wasTaken = _medicines[index]['isTakenToday'] == true;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              wasTaken ? Icons.check_circle_rounded : Icons.schedule_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                wasTaken
                    ? '${_medicines[index]['name']} marked as taken today! 👏'
                    : '${_medicines[index]['name']} dose reset to upcoming.',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: wasTaken ? const Color(0xFF16A34A) : const Color(0xFF1E1B4B),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showAddMedicineDialog() {
    final nameController = TextEditingController();
    final dosageController = TextEditingController(text: '1 tablet');
    final timeController = TextEditingController(text: '9:00 AM');
    final mealController = TextEditingController(text: 'After Meal');
    final countController = TextEditingController(text: '15');
    String selectedType = 'Tablet';

    final colorsList = [
      {'primary': 0xFF0284C7, 'sec': 0xFF38BDF8, 'bg': 0xFFE0F2FE},
      {'primary': 0xFFD97706, 'sec': 0xFFFBBF24, 'bg': 0xFFFEF3C7},
      {'primary': 0xFFDB2777, 'sec': 0xFFF472B6, 'bg': 0xFFFCE7F3},
      {'primary': 0xFF7C3AED, 'sec': 0xFFA78BFA, 'bg': 0xFFF3E8FF},
      {'primary': 0xFF16A34A, 'sec': 0xFF4ADE80, 'bg': 0xFFDCFCE7},
    ];
    int selectedColorIndex = 0;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
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
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Add Medicine to Routine',
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

                // Medicine Name
                Text(
                  'Medicine Name',
                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    hintText: 'e.g. Paracetamol 650mg, Amoxicillin...',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 14),

                // Type Chips
                Text(
                  'Form / Type',
                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                ),
                const SizedBox(height: 6),
                Row(
                  children: ['Tablet', 'Capsule', 'Syrup', 'Drops'].map((t) {
                    final isSel = selectedType == t;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(t, style: GoogleFonts.inter(fontSize: 12, fontWeight: isSel ? FontWeight.w700 : FontWeight.w500, color: isSel ? Colors.white : const Color(0xFF475569))),
                        selected: isSel,
                        selectedColor: const Color(0xFF6D28D9),
                        backgroundColor: const Color(0xFFF1F5F9),
                        onSelected: (val) {
                          if (val) setModalState(() => selectedType = t);
                        },
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),

                // Dosage & Time
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Dosage', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155))),
                          const SizedBox(height: 6),
                          TextField(
                            controller: dosageController,
                            decoration: InputDecoration(
                              hintText: 'e.g. 1 tablet',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Dose Time', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155))),
                          const SizedBox(height: 6),
                          TextField(
                            controller: timeController,
                            decoration: InputDecoration(
                              hintText: 'e.g. 9:00 AM',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Meal & Supply Count
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Condition', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155))),
                          const SizedBox(height: 6),
                          TextField(
                            controller: mealController,
                            decoration: InputDecoration(
                              hintText: 'e.g. After Meal',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Remaining Supply', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155))),
                          const SizedBox(height: 6),
                          TextField(
                            controller: countController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              hintText: 'e.g. 15 tablets',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Color Theme selector
                Text(
                  'Color Accent',
                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                ),
                const SizedBox(height: 8),
                Row(
                  children: List.generate(colorsList.length, (i) {
                    final col = colorsList[i];
                    final isSel = selectedColorIndex == i;
                    return GestureDetector(
                      onTap: () => setModalState(() => selectedColorIndex = i),
                      child: Container(
                        margin: const EdgeInsets.only(right: 12),
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Color(col['primary']!),
                          shape: BoxShape.circle,
                          border: isSel ? Border.all(color: Colors.white, width: 3) : null,
                          boxShadow: isSel
                              ? [BoxShadow(color: Color(col['primary']!).withOpacity(0.5), blurRadius: 8, spreadRadius: 2)]
                              : null,
                        ),
                        child: isSel ? const Icon(Icons.check, color: Colors.white, size: 18) : null,
                      ),
                    );
                  }),
                ),

                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () {
                      final name = nameController.text.trim();
                      final dosage = dosageController.text.trim();
                      final time = timeController.text.trim();
                      final meal = mealController.text.trim();
                      final count = int.tryParse(countController.text.trim()) ?? 15;
                      final col = colorsList[selectedColorIndex];

                      if (name.isNotEmpty) {
                        setState(() {
                          _medicines.add({
                            'name': name,
                            'type': selectedType,
                            'dosage': dosage.isNotEmpty ? dosage : '1 $selectedType',
                            'time': time.isNotEmpty ? time : '9:00 AM',
                            'meal': meal.isNotEmpty ? meal : 'After Meal',
                            'remaining': '$count ${selectedType.toLowerCase()}s',
                            'remainingCount': count,
                            'totalCount': count > 30 ? count : 30,
                            'status': 'Current',
                            'isTakenToday': false,
                            'primaryColor': col['primary'],
                            'secColor': col['sec'],
                            'bgColor': col['bg'],
                          });
                          _saveMedicines();
                        });
                        Navigator.pop(ctx);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6D28D9),
                      elevation: 3,
                      shadowColor: const Color(0xFF6D28D9).withOpacity(0.35),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: Text(
                      'Save to Routine',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _deleteMedicine(int index) {
    final deleted = _medicines[index];
    setState(() {
      _medicines.removeAt(index);
      _saveMedicines();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${deleted['name']} removed from routine.', style: GoogleFonts.inter()),
        action: SnackBarAction(
          label: 'UNDO',
          textColor: const Color(0xFFFBBF24),
          onPressed: () {
            setState(() {
              _medicines.insert(index, deleted);
              _saveMedicines();
            });
          },
        ),
        backgroundColor: const Color(0xFF1E1B4B),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredMedicines = _medicines.where((med) {
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final name = (med['name'] ?? '').toString().toLowerCase();
        final dosage = (med['dosage'] ?? '').toString().toLowerCase();
        final type = (med['type'] ?? '').toString().toLowerCase();
        if (!name.contains(query) && !dosage.contains(query) && !type.contains(query)) {
          return false;
        }
      }
      if (_selectedTabIndex == 1) return med['status'] == 'Past';
      if (_selectedTabIndex == 0) return med['status'] == 'Current';
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1E1B4B)),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'My Medicines',
              style: GoogleFonts.outfit(
                color: const Color(0xFF1E1B4B),
                fontWeight: FontWeight.w800,
                fontSize: 21,
                letterSpacing: -0.3,
              ),
            ),
            Text(
              '${_medicines.where((m) => m['status'] == 'Current').length} Active in Daily Routine',
              style: GoogleFonts.inter(
                color: const Color(0xFF64748B),
                fontWeight: FontWeight.w500,
                fontSize: 11.5,
              ),
            ),
          ],
        ),
        centerTitle: false,
      ),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 650),
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
            padding: const EdgeInsets.only(bottom: 140),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),

                // 1. Daily Routine & Adherence Hero Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: FadeInSlide(
                    delay: 0.05,
                    child: _buildAdherenceHeroCard(),
                  ),
                ),

                const SizedBox(height: 14),

                // 2. Integrated Search Bar (Seamlessly mixed into layout)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: FadeInSlide(
                    delay: 0.08,
                    child: _buildSearchBar(),
                  ),
                ),

                const SizedBox(height: 14),

                // 3. Segmented Filter Tabs (Current, Past, All)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: FadeInSlide(
                    delay: 0.1,
                    child: _buildFilterTabs(),
                  ),
                ),

                const SizedBox(height: 16),

                // 3. Medicine Cards List
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: filteredMedicines.isEmpty
                      ? _buildEmptyState()
                      : Column(
                          children: List.generate(filteredMedicines.length, (idx) {
                            final med = filteredMedicines[idx];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 14.0),
                              child: FadeInSlide(
                                delay: 0.12 + (idx * 0.05),
                                child: _buildModernMedicineCard(med),
                              ),
                            );
                          }),
                        ),
                ),

                const SizedBox(height: 12),

                // 4. "+ Add New Medicine" Smart Banner Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: FadeInSlide(
                    delay: 0.25,
                    child: _buildAddMedicineButton(),
                  ),
                ),

                const SizedBox(height: 16),

                // 5. "Never Miss a Dose" Pro-Tips Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: FadeInSlide(
                    delay: 0.3,
                    child: _buildNeverMissBanner(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // 1. Daily Adherence Hero Card
  // ==========================================
  Widget _buildAdherenceHeroCard() {
    final currentMeds = _medicines.where((m) => m['status'] == 'Current').toList();
    final takenCount = currentMeds.where((m) => m['isTakenToday'] == true).length;
    final totalCount = currentMeds.length;
    final percent = totalCount > 0 ? (takenCount / totalCount) : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF5B21B6),
            Color(0xFF6D28D9),
            Color(0xFF7C3AED),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6D28D9).withOpacity(0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Today's Routine",
                    style: GoogleFonts.outfit(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${(percent * 100).toInt()}% Done',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$takenCount of $totalCount Doses Taken',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    percent == 1.0
                        ? '🎉 Great job! All doses complete for today.'
                        : 'Tap "Take Dose" below after taking each medicine.',
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w400,
                      color: Colors.white.withOpacity(0.85),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: percent,
              minHeight: 7,
              backgroundColor: Colors.white.withOpacity(0.2),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF34D399)),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // Integrated Modern Search Bar
  // ==========================================
  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _searchQuery.isNotEmpty
              ? const Color(0xFF6D28D9).withOpacity(0.4)
              : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6D28D9).withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) {
          setState(() {
            _searchQuery = val.trim();
          });
        },
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF1E1B4B),
        ),
        decoration: InputDecoration(
          hintText: 'Search medicines by name, dose or type...',
          hintStyle: GoogleFonts.inter(
            color: const Color(0xFF94A3B8),
            fontSize: 13,
            fontWeight: FontWeight.w400,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: Color(0xFF6D28D9),
            size: 20,
          ),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.cancel_rounded, size: 18, color: Color(0xFF94A3B8)),
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
                    });
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        ),
      ),
    );
  }

  // ==========================================
  // 3. Segmented Filter Tabs
  // ==========================================
  Widget _buildFilterTabs() {
    final currentCount = _medicines.where((m) => m['status'] == 'Current').length;
    final pastCount = _medicines.where((m) => m['status'] == 'Past').length;

    return Container(
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E1B4B).withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildFilterPill('Active ($currentCount)', 0),
          _buildFilterPill('Past ($pastCount)', 1),
          _buildFilterPill('All (${_medicines.length})', 2),
        ],
      ),
    );
  }

  Widget _buildFilterPill(String title, int index) {
    final isSelected = _selectedTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() {
            _selectedTabIndex = index;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF6D28D9) : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF6D28D9).withOpacity(0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              title,
              style: GoogleFonts.inter(
                color: isSelected ? Colors.white : const Color(0xFF64748B),
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                fontSize: 12.5,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // 3. Modern Redesigned Medicine Card
  // ==========================================
  Widget _buildModernMedicineCard(Map<String, dynamic> med) {
    final isTaken = med['isTakenToday'] == true;
    final remainingCount = med['remainingCount'] is int ? med['remainingCount'] as int : 10;
    final totalCount = med['totalCount'] is int ? med['totalCount'] as int : 30;
    final stockPercent = (remainingCount / (totalCount > 0 ? totalCount : 30)).clamp(0.0, 1.0);
    final isLowStock = remainingCount <= 5;
    final primaryColor = _getColor(med['primaryColor'], const Color(0xFF6D28D9));
    final secColor = _getColor(med['secColor'], const Color(0xFF8B5CF6));
    final bgColor = _getColor(med['bgColor'], const Color(0xFFF3E8FF));
    final originalIndex = _medicines.indexOf(med);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isLowStock ? const Color(0xFFFECDD3) : const Color(0xFFF1F5F9),
          width: 1.3,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1E1B4B).withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
          if (isLowStock)
            BoxShadow(
              color: const Color(0xFFE11D48).withOpacity(0.06),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: 3D Squircle Icon + Name/Dose info + Dose Status Button + Menu
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Squircle 3D Capsule Icon Container
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(15),
                    boxShadow: [
                      BoxShadow(
                        color: primaryColor.withOpacity(0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Center(
                    child: ModernPillCapsule(
                      size: 30,
                      primaryColor: primaryColor,
                      secondaryColor: secColor,
                    ),
                  ),
                ),
                const SizedBox(width: 12),

                // Medicine Name & Timing
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              med['name'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.outfit(
                                fontSize: 16.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF1E1B4B),
                              ),
                            ),
                          ),
                          if (isLowStock) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFE4E6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'LOW STOCK',
                                style: GoogleFonts.outfit(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFFE11D48),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(Icons.schedule_rounded, size: 12.5, color: Color(0xFF64748B)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Builder(
                              builder: (context) {
                                String cleanDosage = (med['dosage'] ?? '1 tablet').toString();
                                if (cleanDosage.contains('•')) {
                                  cleanDosage = cleanDosage.split('•').first.trim();
                                }
                                final timeStr = (med['time'] != null && med['time'].toString().isNotEmpty)
                                    ? med['time'].toString()
                                    : '9:00 AM';
                                final mealStr = (med['meal'] != null && med['meal'].toString().isNotEmpty)
                                    ? '(${med['meal']})'
                                    : '';
                                return Text(
                                  '$cleanDosage • $timeStr $mealStr'.trim(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.inter(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF64748B),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 6),

                // 3-Dots Popup Menu
                PopupMenuButton<String>(
                  padding: EdgeInsets.zero,
                  icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF94A3B8), size: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  onSelected: (val) {
                    if (val == 'delete' && originalIndex != -1) {
                      _deleteMedicine(originalIndex);
                    } else if (val == 'refill') {
                      Navigator.pushNamed(context, AppRoutes.refillReminders);
                    }
                  },
                  itemBuilder: (c) => [
                    const PopupMenuItem(
                      value: 'refill',
                      child: Row(
                        children: [
                          Icon(Icons.autorenew_rounded, size: 16, color: Color(0xFF6D28D9)),
                          SizedBox(width: 8),
                          Text('Request Refill'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline_rounded, size: 16, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete Medicine', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Stock Supply Progress Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isLowStock ? Icons.warning_amber_rounded : Icons.inventory_2_outlined,
                            size: 13,
                            color: isLowStock ? const Color(0xFFE11D48) : const Color(0xFF64748B),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            'Remaining: $remainingCount ${med['type'] ?? 'units'} ($remainingCount days supply)',
                            style: GoogleFonts.inter(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: isLowStock ? const Color(0xFFE11D48) : const Color(0xFF334155),
                            ),
                          ),
                        ],
                      ),
                      Text(
                        '${(stockPercent * 100).toInt()}%',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isLowStock ? const Color(0xFFE11D48) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: stockPercent,
                      minHeight: 5,
                      backgroundColor: const Color(0xFFE2E8F0),
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isLowStock ? const Color(0xFFF43F5E) : primaryColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Action Row: Interactive "Take Dose" Button + "Refill" Button
            Row(
              children: [
                // 1. Take Dose Interactive Toggle Button
                Expanded(
                  flex: 12,
                  child: InkWell(
                    onTap: originalIndex != -1 ? () => _toggleDoseTaken(originalIndex) : null,
                    borderRadius: BorderRadius.circular(12),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 10),
                      decoration: BoxDecoration(
                        color: isTaken ? const Color(0xFFDCFCE7) : const Color(0xFFEDE9FE),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isTaken ? const Color(0xFF86EFAC) : const Color(0xFFDDD6FE),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isTaken ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                            size: 15,
                            color: isTaken ? const Color(0xFF16A34A) : const Color(0xFF6D28D9),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            isTaken ? 'Dose Taken Today' : 'Take Dose',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isTaken ? const Color(0xFF16A34A) : const Color(0xFF6D28D9),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(width: 8),

                // 2. Request Refill Button (High-contrast if low stock)
                Expanded(
                  flex: 11,
                  child: InkWell(
                    onTap: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 8),
                      decoration: BoxDecoration(
                        gradient: isLowStock
                            ? const LinearGradient(
                                colors: [Color(0xFFE11D48), Color(0xFFF43F5E)],
                              )
                            : const LinearGradient(
                                colors: [Color(0xFF6D28D9), Color(0xFF7C3AED)],
                              ),
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: (isLowStock ? const Color(0xFFE11D48) : const Color(0xFF6D28D9)).withOpacity(0.25),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.autorenew_rounded, size: 14, color: Colors.white),
                          const SizedBox(width: 5),
                          Text(
                            'Request Refill',
                            style: GoogleFonts.outfit(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // Empty State
  // ==========================================
  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: const BoxDecoration(
              color: Color(0xFFF3E8FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.medication_rounded, size: 40, color: Color(0xFF6D28D9)),
          ),
          const SizedBox(height: 16),
          Text(
            'No medicines found',
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1E1B4B),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Add your daily prescriptions to track your dosages and receive automated refill alerts.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              color: const Color(0xFF64748B),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // 4. Add Medicine Card Button
  // ==========================================
  Widget _buildAddMedicineButton() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _showAddMedicineDialog,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFDDD6FE), width: 1.3),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6D28D9).withOpacity(0.06),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: Color(0xFFF3E8FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add_rounded, color: Color(0xFF6D28D9), size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                'Add Medicine to Routine',
                style: GoogleFonts.outfit(
                  color: const Color(0xFF6D28D9),
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================
  // 5. Never Miss Banner
  // ==========================================
  Widget _buildNeverMissBanner() {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFF5F3FF), Color(0xFFFAF5FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFEDE9FE), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6D28D9).withOpacity(0.04),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDE9FE),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'SMART REMINDERS',
                          style: GoogleFonts.outfit(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF6D28D9),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Never miss a dose!',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF1E1B4B),
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    'Set automated phone alarms and stay on track with your doctor routine.',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 11.5,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            const ModernMedicineBottleIllustration(size: 64),
          ],
        ),
      ),
    );
  }

  Color _getColor(dynamic val, Color fallback) {
    if (val is Color) return val;
    if (val is int) return Color(val);
    return fallback;
  }
}
