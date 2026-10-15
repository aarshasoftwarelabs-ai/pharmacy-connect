import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _refills = [
    {
      'id': 'RF-101',
      'patient_name': 'Ramesh Patel',
      'phone': '9898012345',
      'medicine_name': 'Metformin 500mg',
      'quantity': 60,
      'status': 'Pending',
      'date': 'Today, 09:30 AM',
    },
    {
      'id': 'RF-102',
      'patient_name': 'Priya Shah',
      'phone': '9825098765',
      'medicine_name': 'Thyronorm 50mcg',
      'quantity': 100,
      'status': 'Approved',
      'date': 'Yesterday, 04:15 PM',
    },
    {
      'id': 'RF-103',
      'patient_name': 'Kiritbhai Dave',
      'phone': '9426055512',
      'medicine_name': 'Telmisartan 40mg',
      'quantity': 30,
      'status': 'Dispensed',
      'date': '14 Oct, 11:20 AM',
    },
  ];

  final List<Map<String, dynamic>> _prescriptions = [
    {
      'id': 'RX-501',
      'patient_name': 'Ananya Mehta',
      'doctor_name': 'Dr. K. S. Trivedi',
      'status': 'Review Needed',
      'items_count': 3,
      'date': 'Today, 10:15 AM',
    },
    {
      'id': 'RX-502',
      'patient_name': 'Sanjay Varma',
      'doctor_name': 'Dr. N. B. Joshi',
      'status': 'Processed',
      'items_count': 2,
      'date': 'Yesterday, 06:40 PM',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Orders & Prescriptions'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Medicine Refills'),
            Tab(text: 'Rx Prescriptions'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Refills Tab
          ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _refills.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = _refills[index];
              final isPending = item['status'] == 'Pending';
              final isApproved = item['status'] == 'Approved';

              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          item['id'],
                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPending
                                ? AppColors.warningBg
                                : isApproved
                                    ? AppColors.infoBg
                                    : AppColors.successBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item['status'],
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isPending
                                  ? AppColors.warning
                                  : isApproved
                                      ? AppColors.info
                                      : AppColors.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item['patient_name'],
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '📞 ${item['phone']} • ${item['date']}',
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item['medicine_name'],
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Text(
                            'Qty: ${item['quantity']}',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ),
                    if (isPending) ...[
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() => item['status'] = 'Rejected');
                              },
                              style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                              child: const Text('Decline'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                setState(() => item['status'] = 'Approved');
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Refill ${item['id']} Approved!')),
                                );
                              },
                              child: const Text('Approve Refill'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              );
            },
          ),

          // Prescriptions Tab
          ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _prescriptions.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final rx = _prescriptions[index];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primarySubtle,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.description_outlined, color: AppColors.primary, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            rx['patient_name'],
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${rx['doctor_name']} • ${rx['items_count']} medicines',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            rx['date'],
                            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Viewing Rx: ${rx['id']}')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
                      child: const Text('View Rx', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
