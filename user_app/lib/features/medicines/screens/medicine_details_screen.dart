import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class MedicineDetailsScreen extends StatelessWidget {
  const MedicineDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );

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
          'Medicine Details',
          style: TextStyle(
            color: Color(0xFF1E1E2D),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: Color(0xFF1E1E2D)),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            _buildTopCard(),
            const SizedBox(height: 16),
            _buildInfoRow(),
            const SizedBox(height: 16),
            _buildStatusCard(),
            const SizedBox(height: 24),
            _buildRemainingStock(),
            const SizedBox(height: 24),
            _buildListMenu(),
          ],
        ),
      ),
    );
  }

  Widget _buildTopCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFFF3F0FF), Color(0xFFE0D4FC)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Dolo 650',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E1E2D),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Paracetamol 650mg',
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text(
                    'Pain Relief',
                    style: TextStyle(
                      color: Color(0xFF4F46E5),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(width: 4, height: 4, decoration: const BoxDecoration(color: Color(0xFF4F46E5), shape: BoxShape.circle)),
                  const SizedBox(width: 8),
                  const Text(
                    'Fever',
                    style: TextStyle(
                      color: Color(0xFF4F46E5),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Positioned(
            right: -20,
            bottom: -20,
            child: Transform.rotate(
              angle: 0.1,
              child: Image.asset(
                'assets/images/logo.png', // Fallback
                height: 100,
                errorBuilder: (c, e, s) => const Icon(Icons.medication, size: 80, color: Color(0xFF6D28D9)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildInfoItem(Icons.medication_rounded, 'Dosage', '1 tablet'),
          Container(width: 1, height: 40, color: Colors.grey.shade200),
          _buildInfoItem(Icons.schedule_rounded, 'Time', '9:00 AM', isPurple: true),
          Container(width: 1, height: 40, color: Colors.grey.shade200),
          _buildInfoItem(Icons.calendar_month_rounded, 'Frequency', 'Once daily', isPurple: true),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value, {bool isPurple = false}) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: isPurple ? const Color(0xFF6D28D9) : const Color(0xFF3B82F6)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1E1E2D)),
        ),
      ],
    );
  }

  Widget _buildStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFF10B981),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'You took your medicine!',
                  style: TextStyle(
                    color: Color(0xFF065F46),
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Great job! Keep it up.',
                  style: TextStyle(
                    color: const Color(0xFF047857).withOpacity(0.8),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRemainingStock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.inventory_2_rounded, color: Color(0xFF6D28D9), size: 20),
            const SizedBox(width: 8),
            const Text(
              'Remaining Stock',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E1E2D),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: '3 ',
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF1E1E2D)),
                        ),
                        TextSpan(
                          text: 'tablets left',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1E1E2D)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 8,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDE9FE),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: 0.15, // representing low stock
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF6D28D9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 24),
            OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                backgroundColor: const Color(0xFFF3F0FF),
                side: const BorderSide(color: Colors.transparent),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
              ),
              child: Row(
                children: const [
                  Icon(Icons.autorenew_rounded, color: Color(0xFF6D28D9), size: 18),
                  SizedBox(width: 6),
                  Text(
                    'Request Refill',
                    style: TextStyle(color: Color(0xFF6D28D9), fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                  SizedBox(width: 4),
                  Icon(Icons.chevron_right_rounded, color: Color(0xFF6D28D9), size: 16),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildListMenu() {
    return Column(
      children: [
        _buildListItem(
          icon: Icons.notifications_active_rounded,
          iconColor: const Color(0xFF6D28D9),
          title: 'Next Reminder',
          subtitleWidget: Row(
            children: [
              const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF6D28D9)),
              const SizedBox(width: 4),
              Text('Tomorrow • 9:00 AM', style: TextStyle(color: Colors.grey.shade700, fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ),
          bottomText: '1 tablet',
        ),
        const SizedBox(height: 12),
        _buildListItem(
          icon: Icons.description_outlined,
          iconColor: const Color(0xFF6D28D9),
          title: 'View Prescription',
          subtitle: 'Check your prescription details',
        ),
        const SizedBox(height: 12),
        _buildListItem(
          icon: Icons.storefront_outlined,
          iconColor: const Color(0xFF6D28D9),
          title: 'Request from Pharmacy',
          subtitle: 'Order this medicine for home delivery',
        ),
        const SizedBox(height: 12),
        _buildListItem(
          icon: Icons.shield_outlined,
          iconColor: Colors.white,
          iconBgColor: const Color(0xFF6D28D9),
          title: 'Need help with this medicine?',
          subtitle: 'Get support or ask a pharmacist',
          titleColor: const Color(0xFF6D28D9),
        ),
      ],
    );
  }

  Widget _buildListItem({
    required IconData icon,
    required Color iconColor,
    Color? iconBgColor,
    required String title,
    String? subtitle,
    Widget? subtitleWidget,
    String? bottomText,
    Color? titleColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBgColor ?? const Color(0xFFF3F0FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: titleColor ?? const Color(0xFF1E1E2D),
                  ),
                ),
                const SizedBox(height: 4),
                if (subtitleWidget != null) subtitleWidget,
                if (subtitle != null)
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                  ),
                if (bottomText != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    bottomText,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                  ),
                ],
              ],
            ),
          ),
          const Center(
            child: Icon(Icons.chevron_right_rounded, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
