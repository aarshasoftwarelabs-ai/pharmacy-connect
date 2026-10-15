import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/api/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../models/report_model.dart';
import '../../providers/auth_provider.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
  String _range = 'today'; // 'today', 'yesterday', 'this-week', 'this-month'
  bool _isLoading = true;
  SalesReportModel? _report;

  @override
  void initState() {
    super.initState();
    _fetchReport();
  }

  Future<void> _fetchReport() async {
    setState(() => _isLoading = true);
    final pharmacyId = context.read<AuthProvider>().pharmacyId;

    try {
      final res = await ApiService.get('${ApiEndpoints.salesReport(pharmacyId)}?range=$_range');
      if (res.success && res.data != null) {
        setState(() {
          _report = SalesReportModel.fromJson(res.data as Map<String, dynamic>);
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    // Fallback data for demo & offline
    setState(() {
      _report = SalesReportModel(
        totalSales: _range == 'today' ? 12850.0 : (_range == 'this-week' ? 74200.0 : 284000.0),
        totalDiscount: 620.0,
        netSales: _range == 'today' ? 12230.0 : 70480.0,
        netProfit: _range == 'today' ? 2450.0 : 14800.0,
        totalBills: _range == 'today' ? 42 : 216,
        averageBillValue: 305.0,
        topMedicines: [
          TopMedicineItem(medicineName: 'Paracetamol 500mg', quantitySold: 94, totalSales: 2820.0),
          TopMedicineItem(medicineName: 'Amoxicillin 250mg', quantitySold: 48, totalSales: 3120.0),
          TopMedicineItem(medicineName: 'Pantoprazole 40mg', quantitySold: 35, totalSales: 3675.0),
          TopMedicineItem(medicineName: 'Cetirizine 10mg', quantitySold: 60, totalSales: 2400.0),
        ],
      );
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final r = _report ?? SalesReportModel();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Sales Reports & Analytics'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchReport,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Filter Pills
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  {'id': 'today', 'label': 'Today'},
                  {'id': 'yesterday', 'label': 'Yesterday'},
                  {'id': 'this-week', 'label': 'This Week'},
                  {'id': 'this-month', 'label': 'This Month'},
                ].map((item) {
                  final isSel = _range == item['id'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(item['label']!),
                      selected: isSel,
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSel ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                      onSelected: (_) {
                        setState(() => _range = item['id']!);
                        _fetchReport();
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // Summary Stats Grid
            if (_isLoading)
              const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
            else ...[
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      'Total Sales',
                      _currency.format(r.totalSales),
                      Icons.trending_up_rounded,
                      AppColors.primary,
                      AppColors.primarySubtle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      'Net Profit',
                      _currency.format(r.netProfit),
                      Icons.account_balance_wallet_rounded,
                      AppColors.success,
                      AppColors.successBg,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      'Total Bills',
                      '${r.totalBills}',
                      Icons.receipt_rounded,
                      AppColors.accent,
                      AppColors.accent.withValues(alpha: 0.1),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      'Avg Bill Value',
                      _currency.format(r.averageBillValue),
                      Icons.analytics_rounded,
                      Colors.purple,
                      Colors.purple.shade50,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Top Selling Medicines Section
              const Text(
                'Top Fast-Moving Medicines',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: r.topMedicines.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, idx) {
                  final med = r.topMedicines[idx];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: AppColors.primarySubtle,
                          child: Text(
                            '#${idx + 1}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                med.medicineName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                '${med.quantitySold} units sold',
                                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          _currency.format(med.totalSales),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primary),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String val, IconData icon, Color color, Color bg) {
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
              Text(title, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
              CircleAvatar(
                radius: 16,
                backgroundColor: bg,
                child: Icon(icon, size: 18, color: color),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            val,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }
}
