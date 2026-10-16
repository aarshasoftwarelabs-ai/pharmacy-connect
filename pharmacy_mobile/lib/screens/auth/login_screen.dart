import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/inventory_provider.dart';
import '../navigation/main_nav_screen.dart';
import '../staff/staff_scanner_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isStaffLogin = false; // Default to Store Owner (Pocket Pharmacy ERP) mode!

  // Owner controllers
  final _identifierController = TextEditingController(text: 'deeplodaliya007@gmail.com');
  final _passwordController = TextEditingController(text: 'Jenish009@@@');
  bool _obscurePassword = true;

  // Staff controllers
  final _staffPhoneController = TextEditingController(text: '9876543210');
  final _staffPinController = TextEditingController(text: '1234');
  bool _obscurePin = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _staffPhoneController.dispose();
    _staffPinController.dispose();
    super.dispose();
  }

  Future<void> _handleOwnerLogin() async {
    final auth = context.read<AuthProvider>();
    final success = await auth.login(
      _identifierController.text,
      _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      context.read<InventoryProvider>().fetchMedicines();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const MainNavScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.error,
          content: Text(auth.errorMessage ?? 'Login failed. Please check credentials.'),
        ),
      );
    }
  }

  Future<void> _handleStaffLogin() async {
    final auth = context.read<AuthProvider>();
    final phone = _staffPhoneController.text.trim();
    final pin = _staffPinController.text.trim();

    if (phone.isEmpty || pin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          content: Text('Please enter store phone number and 4-digit PIN'),
        ),
      );
      return;
    }

    final success = await auth.staffLogin(
      pharmacyPhone: phone,
      pin: pin,
    );

    if (!mounted) return;

    if (success) {
      context.read<InventoryProvider>().fetchMedicines();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const StaffScannerScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.error,
          content: Text(auth.errorMessage ?? 'Staff PIN invalid. Please contact the owner.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Medical App Logo & Icon
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.primarySubtle,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.local_pharmacy_rounded,
                      size: 40,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Title & Subtitle
                const Text(
                  'DavaSetu Pharmacy',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Mobile POS & Complete Pharmacy ERP',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),

                // Role Toggle Selector (Owner first, Staff second)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      // 1. Store Owner (Default)
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isStaffLogin = false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !_isStaffLogin ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: !_isStaffLogin
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.06),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.admin_panel_settings_rounded,
                                  size: 16,
                                  color: !_isStaffLogin ? AppColors.primary : AppColors.textMuted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Store Owner (માલિક)',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: !_isStaffLogin ? FontWeight.bold : FontWeight.normal,
                                    color: !_isStaffLogin ? AppColors.primary : AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      // 2. Staff Scanner
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isStaffLogin = true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _isStaffLogin ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: _isStaffLogin
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.06),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.qr_code_scanner_rounded,
                                  size: 16,
                                  color: _isStaffLogin ? AppColors.primary : AppColors.textMuted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  'Staff Scanner (સ્ટાફ)',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: _isStaffLogin ? FontWeight.bold : FontWeight.normal,
                                    color: _isStaffLogin ? AppColors.primary : AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Form based on selected mode
                if (_isStaffLogin) ...[
                  // Staff Phone
                  const Text(
                    'Store Mobile Number (દુકાનનો નંબર)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _staffPhoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.storefront_rounded, color: AppColors.textMuted),
                      hintText: 'e.g. 9876543210',
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Staff PIN
                  const Text(
                    'Staff 4-Digit PIN (તમારો પિન)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _staffPinController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    obscureText: _obscurePin,
                    decoration: InputDecoration(
                      counterText: '',
                      prefixIcon: const Icon(Icons.pin_rounded, color: AppColors.textMuted),
                      hintText: 'e.g. 1234',
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePin ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppColors.textMuted,
                        ),
                        onPressed: () => setState(() => _obscurePin = !_obscurePin),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Staff Login Button
                  ElevatedButton.icon(
                    onPressed: auth.isLoading ? null : _handleStaffLogin,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: auth.isLoading
                        ? const SizedBox.shrink()
                        : const Icon(Icons.qr_code_scanner_rounded, color: Colors.white),
                    label: auth.isLoading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Open Barcode Scanner (સ્કેનર ખોલો)',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                  ),
                ] else ...[
                  // Owner Email/Phone
                  const Text(
                    'Owner Email or Phone',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _identifierController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.textMuted),
                      hintText: 'admin@davasetu.com',
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Owner Password
                  const Text(
                    'Password',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textMuted),
                      hintText: 'Enter password',
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppColors.textMuted,
                        ),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Owner Login Button
                  ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleOwnerLogin,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Sign In to Dashboard',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                  ),
                ],

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
