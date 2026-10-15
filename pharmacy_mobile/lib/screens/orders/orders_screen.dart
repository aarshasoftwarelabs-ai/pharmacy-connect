import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/billing_provider.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

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
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final billing = context.watch<BillingProvider>();
    final recentBills = billing.recentBills;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Bills & Orders'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          isScrollable: true,
          tabs: [
            Tab(text: 'POS Invoices (${recentBills.length})'),
            const Tab(text: 'Medicine Refills'),
            const Tab(text: 'Rx Prescriptions'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. POS Invoices Tab
          recentBills.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.receipt_long_outlined, size: 48, color: AppColors.textMuted),
                      SizedBox(height: 12),
                      Text('No recent POS invoices yet', style: TextStyle(color: AppColors.textSecondary)),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: recentBills.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final bill = recentBills[index];
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
                              Row(
                                children: [
                                  Text(
                                    bill['bill_number'],
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.successBg,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      bill['payment_mode'] ?? 'POS',
                                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.success),
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                _currency.format(bill['total']),
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.person_outline_rounded, size: 16, color: AppColors.textMuted),
                              const SizedBox(width: 6),
                              Text(
                                bill['customer_name'],
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.access_time_rounded, size: 15, color: AppColors.textMuted),
                              const SizedBox(width: 6),
                              Text(
                                '${bill['date']} • ${bill['items_count']} ${bill['items_count'] == 1 ? 'item' : 'items'}',
                                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          const Divider(height: 1),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              OutlinedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Thermal receipt ${bill['bill_number']} printed!')),
                                  );
                                },
                                icon: const Icon(Icons.print_rounded, size: 16),
                                label: const Text('Print Receipt', style: TextStyle(fontSize: 12)),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('WhatsApp receipt sent for ${bill['bill_number']}!')),
                                  );
                                },
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                                icon: const Icon(Icons.share_rounded, size: 16),
                                label: const Text('Share Invoice', style: TextStyle(fontSize: 12, color: Colors.white)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),

          // 2. Refills Tab
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

          // 3. Prescriptions Tab
          ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _prescriptions.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = _prescriptions[index];
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
                            color: AppColors.infoBg,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item['status'],
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.info),
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
                      'Prescribed by ${item['doctor_name']} • ${item['date']}',
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${item['items_count']} medicines on prescription',
                          style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Opening Rx ${item['id']} details')),
                            );
                          },
                          child: const Text('Dispense Rx'),
                        ),
                      ],
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
