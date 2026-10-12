import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
  bool _isSearching = false;

  final List<Map<String, dynamic>> _medicines = [
    {
      'name': 'Dolo 650',
      'dosage': '1 tablet • 9:00 AM',
      'remaining': 'Remaining: 3 tablets',
      'status': 'Current',
      'primaryColor': const Color(0xFF0284C7),
      'secColor': const Color(0xFF38BDF8),
      'bgColor': const Color(0xFFE0F2FE),
    },
    {
      'name': 'Vitamin D3',
      'dosage': '1 capsule • 8:00 PM',
      'remaining': 'Remaining: 15 capsules',
      'status': 'Current',
      'primaryColor': const Color(0xFFD97706),
      'secColor': const Color(0xFFFBBF24),
      'bgColor': const Color(0xFFFEF3C7),
    },
    {
      'name': 'Metformin 500',
      'dosage': '1 tablet • 9:00 PM',
      'remaining': 'Remaining: 20 tablets',
      'status': 'Current',
      'primaryColor': const Color(0xFFDB2777),
      'secColor': const Color(0xFFF472B6),
      'bgColor': const Color(0xFFFCE7F3),
    },
  ];

  void _showAddMedicineDialog() {
    final nameController = TextEditingController();
    final dosageController = TextEditingController();
    final countController = TextEditingController();

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
                  'Add New Medicine',
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
            const SizedBox(height: 14),
            TextField(
              controller: nameController,
              decoration: InputDecoration(
                hintText: 'Medicine Name (e.g. Paracetamol)',
                filled: true,
                fillColor: const Color(0xFFF8F9FE),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: dosageController,
              decoration: InputDecoration(
                hintText: 'Dosage & Time (e.g. 1 tablet • 8:00 AM)',
                filled: true,
                fillColor: const Color(0xFFF8F9FE),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: countController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Remaining Quantity (e.g. 10)',
                filled: true,
                fillColor: const Color(0xFFF8F9FE),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () {
                  final name = nameController.text.trim();
                  final dosage = dosageController.text.trim();
                  final count = countController.text.trim();
                  if (name.isNotEmpty) {
                    setState(() {
                      _medicines.add({
                        'name': name,
                        'dosage': dosage.isNotEmpty ? dosage : '1 tablet • 8:00 AM',
                        'remaining': 'Remaining: ${count.isNotEmpty ? count : '10'} tablets',
                        'status': 'Current',
                        'primaryColor': const Color(0xFF7C3AED),
                        'secColor': const Color(0xFFA78BFA),
                        'bgColor': const Color(0xFFF3E8FF),
                      });
                    });
                    Navigator.pop(ctx);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6D28D9),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  'Add Medicine',
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
    final filteredMedicines = _medicines.where((med) {
      if (_searchQuery.isNotEmpty &&
          !med['name'].toString().toLowerCase().contains(_searchQuery.toLowerCase())) {
        return false;
      }
      if (_selectedTabIndex == 1) return med['status'] == 'Past';
      if (_selectedTabIndex == 0) return med['status'] == 'Current';
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF1E1B4B)),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: _isSearching
            ? TextField(
                autofocus: true,
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: const InputDecoration(
                  hintText: 'Search medicines...',
                  border: InputBorder.none,
                ),
              )
            : Text(
                'My Medicines',
                style: GoogleFonts.outfit(
                  color: const Color(0xFF1E1B4B),
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                ),
              ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: Icon(
              _isSearching ? Icons.close_rounded : Icons.search_rounded,
              color: const Color(0xFF1E1B4B),
              size: 24,
            ),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) _searchQuery = '';
              });
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 120),
        child: Column(
          children: [
            const SizedBox(height: 12),

            // 1. Segmented Filter Tabs (Current, Past, All)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: FadeInSlide(
                delay: 0.1,
                child: _buildFilterTabs(),
              ),
            ),

            const SizedBox(height: 18),

            // 2. Medicine Cards List
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: FadeInSlide(
                delay: 0.15,
                child: Column(
                  children: filteredMedicines.map((med) => Padding(
                    padding: const EdgeInsets.only(bottom: 14.0),
                    child: _buildMedicineCard(med),
                  )).toList(),
                ),
              ),
            ),

            const SizedBox(height: 10),

            // 3. "+ Add Medicine" Outline Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: FadeInSlide(
                delay: 0.2,
                child: _buildAddMedicineButton(),
              ),
            ),

            const SizedBox(height: 18),

            // 4. "Never miss a dose!" Banner with 3D Bottle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: FadeInSlide(
                delay: 0.25,
                child: _buildNeverMissBanner(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFEDE9FE).withOpacity(0.4),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          _buildFilterPill('Current', 0),
          _buildFilterPill('Past', 1),
          _buildFilterPill('All', 2),
        ],
      ),
    );
  }

  Widget _buildFilterPill(String title, int index) {
    final isSelected = _selectedTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedTabIndex = index;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF6D28D9) : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF6D28D9).withOpacity(0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              title,
              style: GoogleFonts.inter(
                color: isSelected ? Colors.white : const Color(0xFF64748B),
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                fontSize: 13,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMedicineCard(Map<String, dynamic> med) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: med['bgColor'] as Color,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: ModernPillCapsule(
                    size: 32,
                    primaryColor: med['primaryColor'] as Color,
                    secondaryColor: med['secColor'] as Color,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      med['name'] as String,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E1B4B),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      med['dosage'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 12.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      med['remaining'] as String,
                      style: GoogleFonts.inter(
                        fontSize: 12.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, color: Color(0xFF94A3B8)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                onSelected: (val) {
                  if (val == 'delete') {
                    setState(() {
                      _medicines.remove(med);
                    });
                  }
                },
                itemBuilder: (c) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Text('Edit Reminder'),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete Medicine', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: () => Navigator.pushNamed(context, AppRoutes.refillReminders),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6D28D9),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                'Request Refill',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddMedicineButton() {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: OutlinedButton.icon(
        onPressed: _showAddMedicineDialog,
        icon: const Icon(Icons.add_rounded, color: Color(0xFF6D28D9), size: 20),
        label: Text(
          'Add Medicine',
          style: GoogleFonts.inter(
            color: const Color(0xFF6D28D9),
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.white,
          side: const BorderSide(color: Color(0xFF6D28D9), width: 1.2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildNeverMissBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F3FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFEDE9FE)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Never miss a dose!',
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF5B21B6),
                    fontWeight: FontWeight.w700,
                    fontSize: 14.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Set reminders and stay\non track with your health.',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 11.5,
                    height: 1.35,
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
          const SizedBox(width: 8),
          const ModernMedicineBottleIllustration(size: 68),
        ],
      ),
    );
  }
}
