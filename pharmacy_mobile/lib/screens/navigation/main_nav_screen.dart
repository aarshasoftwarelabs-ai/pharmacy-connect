import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/billing_provider.dart';
import '../billing/billing_screen.dart';
import '../customers/customers_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../inventory/inventory_screen.dart';
import '../orders/orders_screen.dart';
import '../reports/reports_screen.dart';
import '../settings/profile_screen.dart';
import '../suppliers/suppliers_screen.dart';

class MainNavScreen extends StatefulWidget {
  const MainNavScreen({super.key});

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  int _currentIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final billing = context.watch<BillingProvider>();
    final cartCount = billing.itemCount;

    final screens = [
      DashboardScreen(onNavigateTab: _onTabTapped),
      const BillingScreen(),
      const InventoryScreen(),
      const OrdersScreen(),
    ];

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.local_pharmacy_rounded, size: 28, color: AppColors.primary),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    auth.pharmacyName,
                    style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: Color(0xFF4ADE80), shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'POS Online • ${auth.userName}',
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_rounded, color: AppColors.primary),
              title: const Text('Dashboard', style: TextStyle(fontWeight: FontWeight.w600)),
              selected: _currentIndex == 0,
              onTap: () {
                Navigator.pop(context);
                _onTabTapped(0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.point_of_sale_rounded, color: AppColors.primary),
              title: const Text('POS Counter (Billing)', style: TextStyle(fontWeight: FontWeight.w600)),
              trailing: cartCount > 0
                  ? Badge(label: Text('$cartCount'))
                  : null,
              selected: _currentIndex == 1,
              onTap: () {
                Navigator.pop(context);
                _onTabTapped(1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_rounded, color: AppColors.primary),
              title: const Text('Smart Inventory', style: TextStyle(fontWeight: FontWeight.w600)),
              selected: _currentIndex == 2,
              onTap: () {
                Navigator.pop(context);
                _onTabTapped(2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.receipt_long_rounded, color: AppColors.primary),
              title: const Text('Bills & Invoices', style: TextStyle(fontWeight: FontWeight.w600)),
              selected: _currentIndex == 3,
              onTap: () {
                Navigator.pop(context);
                _onTabTapped(3);
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.people_alt_rounded, color: Colors.blue),
              title: const Text('Customers (Khata)', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomersScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.apartment_rounded, color: Colors.purple),
              title: const Text('Suppliers & Purchases', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SuppliersScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.bar_chart_rounded, color: Colors.teal),
              title: const Text('Sales Reports & CA Tax', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsScreen()));
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings_rounded, color: Colors.orange),
              title: const Text('Profile & Settings', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: AppColors.error),
              title: const Text('Logout', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                auth.logout();
              },
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textMuted,
        type: BottomNavigationBarType.fixed,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard_rounded),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: cartCount > 0,
              label: Text('$cartCount'),
              child: const Icon(Icons.point_of_sale_outlined),
            ),
            activeIcon: Badge(
              isLabelVisible: cartCount > 0,
              label: Text('$cartCount'),
              child: const Icon(Icons.point_of_sale_rounded),
            ),
            label: 'POS Billing',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2_rounded),
            label: 'Inventory',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            activeIcon: Icon(Icons.receipt_long_rounded),
            label: 'Orders',
          ),
        ],
      ),
    );
  }
}
