import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/inventory_provider.dart';
import '../navigation/main_nav_screen.dart';
import '../staff/staff_scanner_screen.dart';
import 'otp_verification_screen.dart';
import 'signup_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isStaffLogin = false; // Default to Store Owner mode

  // Store Owner controllers (Mobile + Email OTP flow)
  final _ownerPhoneController = TextEditingController();
  final _ownerEmailController = TextEditingController();
  bool _usePasswordLogin = false;
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  // Counter Scanner controllers
  final _staffPhoneController = TextEditingController(text: '');
  final _staffPinController = TextEditingController(text: '');
  bool _obscurePin = true;

  // Real-time Phone Lookup State
  bool _isCheckingPhone = false;
  Map<String, dynamic>? _matchedUser;
  String? _lastCheckedPhone;

  @override
  void initState() {
    super.initState();
    _staffPhoneController.addListener(_onStaffPhoneChanged);
  }

  void _onStaffPhoneChanged() {
    final digits = _staffPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (digits.length >= 10) {
      final last10 = digits.substring(digits.length - 10);
      if (last10 != _lastCheckedPhone) {
        _lookupUser(last10);
      }
    } else {
      if (_matchedUser != null || _lastCheckedPhone != null) {
        setState(() {
          _matchedUser = null;
          _lastCheckedPhone = null;
          _isCheckingPhone = false;
        });
      }
    }
  }

  Future<void> _lookupUser(String phone10) async {
    _lastCheckedPhone = phone10;
    setState(() {
      _isCheckingPhone = true;
    });

    final auth = context.read<AuthProvider>();
    final result = await auth.lookupCounterUser(phone10);

    if (!mounted) return;
    setState(() {
      _isCheckingPhone = false;
      _matchedUser = result;
    });
  }

  @override
  void dispose() {
    _staffPhoneController.removeListener(_onStaffPhoneChanged);
    _ownerPhoneController.dispose();
    _ownerEmailController.dispose();
    _passwordController.dispose();
    _staffPhoneController.dispose();
    _staffPinController.dispose();
    super.dispose();
  }

  Future<void> _handleOwnerContinue() async {
    final digits = _ownerPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    final email = _ownerEmailController.text.trim();

    // 1. Mobile Number Check
    if (digits.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text('કૃપા કરીને તમારો મોબાઈલ નંબર દાખલ કરો (Please enter your mobile number)'),
        ),
      );
      return;
    }

    if (digits.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text('કૃપા કરીને માન્ય 10 અંકનો મોબાઈલ નંબર દાખલ કરો (Please enter a valid 10-digit mobile number)'),
        ),
      );
      return;
    }

    // 2. Email Address Check
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text('કૃપા કરીને તમારું ઈમેઈલ એડ્રેસ દાખલ કરો (Please enter your email address)'),
        ),
      );
      return;
    }

    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text('કૃપા કરીને માન્ય ઈમેઈલ દાખલ કરો (Please enter a valid email address)'),
        ),
      );
      return;
    }

    // 3. Both are entered and valid! Call checkMobile & proceed to OTP page
    final auth = context.read<AuthProvider>();
    final result = await auth.checkMobile(digits, email);

    if (!mounted) return;

    if (result != null) {
      final isExisting = result['exists'] == true;
      final pharmacyName = result['pharmacyName']?.toString();

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => OtpVerificationScreen(
            phone: digits,
            email: email,
            isExisting: isExisting,
            pharmacyName: pharmacyName,
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text(auth.errorMessage ?? 'ચકાસણી નિષ્ફળ રહી. ફરી પ્રયાસ કરો.'),
        ),
      );
    }
  }

  Future<void> _handleOwnerPasswordLogin() async {
    final phone = _ownerPhoneController.text.trim();
    final email = _ownerEmailController.text.trim();
    final id = email.isNotEmpty ? email : phone;
    final password = _passwordController.text.trim();

    if (id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text('કૃપા કરીને મોબાઈલ અથવા ઈમેઈલ દાખલ કરો'),
        ),
      );
      return;
    }

    if (password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          content: Text('કૃપા કરીને પાસવર્ડ દાખલ કરો'),
        ),
      );
      return;
    }

    final auth = context.read<AuthProvider>();
    final success = await auth.login(id, password);

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
          behavior: SnackBarBehavior.floating,
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
                // Role Toggle Selector (Store Owner first, Counter Scanner second)
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
                                  'Store Owner',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: !_isStaffLogin ? FontWeight.bold : FontWeight.w600,
                                    color: !_isStaffLogin ? AppColors.primary : AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      // 2. Counter Scanner
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
                                  'Counter Scanner',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: _isStaffLogin ? FontWeight.bold : FontWeight.w600,
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
                  // Mobile Number Field
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Mobile Number (મોબાઈલ નંબર)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                      ),
                      if (_isCheckingPhone)
                        Row(
                          children: const [
                            SizedBox(
                              width: 12,
                              height: 12,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            ),
                            SizedBox(width: 6),
                            Text(
                              'તપાસી રહ્યા છીએ...',
                              style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _staffPhoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.phone_android_rounded, color: AppColors.textMuted),
                      hintText: 'Enter 10-digit mobile number',
                      suffixIcon: _matchedUser != null
                          ? const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A))
                          : null,
                    ),
                  ),

                  // Matched User Profile Badge Card
                  if (_matchedUser != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _getRoleColor(_matchedUser!['role']).withValues(alpha: 0.08),
                            Colors.white,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _getRoleColor(_matchedUser!['role']).withValues(alpha: 0.35),
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: _getRoleColor(_matchedUser!['role']).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _getRoleIcon(_matchedUser!['role']),
                              color: _getRoleColor(_matchedUser!['role']),
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _matchedUser!['name']?.toString() ?? 'Counter Staff',
                                        style: const TextStyle(
                                          fontSize: 14.5,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: _getRoleColor(_matchedUser!['role']),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        _formatRoleLabel(_matchedUser!['role']),
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    const Icon(Icons.storefront_rounded, size: 13, color: AppColors.textMuted),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        _matchedUser!['pharmacyName']?.toString() ?? 'DavaSetu Pharmacy',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else if (!_isCheckingPhone && _staffPhoneController.text.trim().replaceAll(RegExp(r'\D'), '').length >= 10) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF64748B)),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'નંબર લુકઅપ: સામાન્ય કાઉન્ટર સ્કેનર માટે ડિફોલ્ટ PIN 1234 વાપરો.',
                              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 16),

                  // Counter 4-Digit PIN
                  const Text(
                    'Counter 4-Digit PIN (કાઉન્ટર પિન)',
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

                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Icon(Icons.shield_outlined, size: 18, color: Color(0xFF64748B)),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'કાઉન્ટર સ્કેનર મોડમાં ફક્ત બારકોડ સ્કેનિંગ અને કાઉન્ટર POS ઉપલબ્ધ રહેશે. ફાર્મસીના બધા નાણાકીય રિપોર્ટ્સ અને સેટિંગ્સ Store Owner માટે 100% સુરક્ષિત રહે છે.',
                            style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.35),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  // Mobile Number Field
                  const Text(
                    'Mobile Number (મોબાઈલ નંબર)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _ownerPhoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.phone_android_rounded, color: AppColors.textMuted),
                      prefixText: '+91 ',
                      hintText: 'Enter 10-digit mobile number',
                      counterText: '',
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Email Address Field
                  const Text(
                    'Email Address (ઈમેઈલ એડ્રેસ)',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _ownerEmailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.alternate_email_rounded, color: AppColors.textMuted),
                      hintText: 'e.g. owner@davasetu.com',
                    ),
                  ),
                  
                  // Optional Password field if user toggles "Sign in with password"
                  if (_usePasswordLogin) ...[
                    const SizedBox(height: 16),
                    const Text(
                      'Password (ગુપ્ત પાસવર્ડ)',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppColors.textMuted),
                        hintText: 'Enter your password',
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: AppColors.textMuted,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Action Button: Continue (or Sign in with Password)
                  ElevatedButton(
                    onPressed: auth.isLoading
                        ? null
                        : (_usePasswordLogin ? _handleOwnerPasswordLogin : _handleOwnerContinue),
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
                        : Text(
                            _usePasswordLogin ? 'Sign In with Password (લોગિન)' : 'Continue (આગળ વધો)',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                  ),

                  const SizedBox(height: 12),

                  // Toggle between OTP and Password
                  Center(
                    child: TextButton.icon(
                      onPressed: () => setState(() => _usePasswordLogin = !_usePasswordLogin),
                      icon: Icon(
                        _usePasswordLogin ? Icons.mark_email_read_rounded : Icons.lock_outline_rounded,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      label: Text(
                        _usePasswordLogin
                            ? 'Switch to Mobile & Email OTP (ઓટીપીથી આગળ વધો)'
                            : 'Or Sign In with Password (પાસવર્ડથી લોગિન કરો)',
                        style: const TextStyle(fontSize: 12.5, color: AppColors.primary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),
                  Row(
                    children: const [
                      Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'નવી ફાર્મસી? / NEW STORE',
                          style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                        ),
                      ),
                      Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Register New Pharmacy Button
                  OutlinedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SignUpScreen()),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: AppColors.primary, width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      backgroundColor: AppColors.primarySubtle.withValues(alpha: 0.4),
                    ),
                    icon: const Icon(Icons.storefront_rounded, color: AppColors.primary, size: 20),
                    label: const Text(
                      'Create New Pharmacy (નવી ફાર્મસી બનાવો)',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Center(
                    child: Text(
                      'કોઈ લેપટોપ કે કમ્પ્યુટર વગર • 100% મોબાઈલથી ચલાવો',
                      style: TextStyle(fontSize: 11.5, color: AppColors.textMuted, fontWeight: FontWeight.w500),
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

  Color _getRoleColor(dynamic role) {
    final r = role?.toString().toUpperCase() ?? '';
    if (r.contains('OWNER')) return const Color(0xFFD97706); // Amber/Gold
    if (r.contains('MANAGE')) return const Color(0xFF7C3AED); // Purple
    if (r.contains('PHARM')) return const Color(0xFF059669); // Emerald
    return const Color(0xFF0284C7); // Sky Blue
  }

  IconData _getRoleIcon(dynamic role) {
    final r = role?.toString().toUpperCase() ?? '';
    if (r.contains('OWNER')) return Icons.verified_user_rounded;
    if (r.contains('MANAGE')) return Icons.manage_accounts_rounded;
    if (r.contains('PHARM')) return Icons.medication_rounded;
    return Icons.person_rounded;
  }

  String _formatRoleLabel(dynamic role) {
    final r = role?.toString().toUpperCase() ?? '';
    if (r.contains('OWNER')) return 'OWNER';
    if (r.contains('MANAGE')) return 'MANAGER';
    if (r.contains('PHARM')) return 'PHARMACIST';
    return 'STAFF';
  }
}
