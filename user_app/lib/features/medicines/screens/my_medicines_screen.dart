import 'package:flutter/material.dart';

class MyMedicinesScreen extends StatefulWidget {
  const MyMedicinesScreen({super.key});

  @override
  State<MyMedicinesScreen> createState() => _MyMedicinesScreenState();
}

class _MyMedicinesScreenState extends State<MyMedicinesScreen> {
  int _selectedTabIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E1E2D)),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: const Text(
          'My Medicines',
          style: TextStyle(
            color: Color(0xFF1E1E2D),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Color(0xFF1E1E2D)),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 100),
        child: Column(
          children: [
            const SizedBox(height: 16),
            _buildSegmentedControl(),
            const SizedBox(height: 24),
            _buildMedicineList(),
            const SizedBox(height: 24),
            _buildAddMedicineButton(),
            const SizedBox(height: 24),
            _buildBottomBanner(),
          ],
        ),
      ),
    );
  }

  Widget _buildSegmentedControl() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            _buildTab('Current', 0),
            _buildTab('Past', 1),
            _buildTab('All', 2),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(String title, int index) {
    final isSelected = _selectedTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedTabIndex = index;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF6D28D9) : Colors.transparent,
            borderRadius: BorderRadius.circular(26),
          ),
          child: Center(
            child: Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey.shade500,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                fontSize: 14,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMedicineList() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          _buildMedicineCard(
            icon: Icons.medication_rounded,
            iconColor: const Color(0xFF3B82F6),
            name: 'Dolo 650',
            dosage: '1 tablet • 9:00 AM',
            remaining: 'Remaining: 3 tablets',
          ),
          const SizedBox(height: 16),
          _buildMedicineCard(
            icon: Icons.vaccines_rounded,
            iconColor: const Color(0xFFF59E0B),
            name: 'Vitamin D3',
            dosage: '1 capsule • 8:00 PM',
            remaining: 'Remaining: 15 capsules',
          ),
          const SizedBox(height: 16),
          _buildMedicineCard(
            icon: Icons.medication_liquid_rounded,
            iconColor: const Color(0xFFEC4899),
            name: 'Metformin 500',
            dosage: '1 tablet • 9:00 PM',
            remaining: 'Remaining: 20 tablets',
          ),
        ],
      ),
    );
  }

  Widget _buildMedicineCard({
    required IconData icon,
    required Color iconColor,
    required String name,
    required String dosage,
    required String remaining,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1E1E2D),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      dosage,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      remaining,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.more_vert, color: Colors.grey),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6D28D9),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: const Text(
                'Request Refill',
                style: TextStyle(
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.add, color: Color(0xFF6D28D9)),
          label: const Text(
            'Add Medicine',
            style: TextStyle(
              color: Color(0xFF6D28D9),
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            side: const BorderSide(color: Color(0xFF6D28D9), width: 1),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F0FF),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Never miss a dose!',
                    style: TextStyle(
                      color: Color(0xFF6D28D9),
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Set reminders and stay on track with your health.',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
            const SizedBox(width: 8),
            Expanded(
              flex: 2,
              child: Image.asset(
                'assets/images/logo.png', // Fallback to logo if bottle image is missing
                height: 60,
                errorBuilder: (c, e, s) => const Icon(Icons.medication, size: 60, color: Color(0xFF6D28D9)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
