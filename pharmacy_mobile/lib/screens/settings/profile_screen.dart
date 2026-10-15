import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/storage_service.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  final _serverUrlCtrl = TextEditingController();
  bool _isTestingConnection = false;
  int? _pingLatencyMs;
  bool? _isServerReachable;
  String? _pingMessage;

  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _serverUrlCtrl.text = StorageService.getBaseUrl() ?? ApiEndpoints.baseUrl;

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    // Initial silent ping test
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _testServerPing(silent: true);
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _serverUrlCtrl.dispose();
    super.dispose();
  }

  Future<void> _testServerPing({bool silent = false}) async {
    final rawUrl = _serverUrlCtrl.text.trim();
    if (rawUrl.isEmpty) return;

    setState(() {
      _isTestingConnection = true;
      if (!silent) _pingMessage = 'Testing connection...';
    });

    final stopwatch = Stopwatch()..start();
    try {
      final uri = Uri.parse(rawUrl);
      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      stopwatch.stop();

      setState(() {
        _pingLatencyMs = stopwatch.elapsedMilliseconds;
        _isServerReachable = response.statusCode < 500;
        _pingMessage = _isServerReachable!
            ? 'Connected • ${_pingLatencyMs}ms latency'
            : 'Server responded with status ${response.statusCode}';
        _isTestingConnection = false;
      });
    } catch (e) {
      stopwatch.stop();
      setState(() {
        _isServerReachable = false;
        _pingLatencyMs = null;
        _pingMessage = 'Unable to reach server. Check Wi-Fi & IP.';
        _isTestingConnection = false;
      });
    }
  }

  void _saveServerUrl() async {
    final url = _serverUrlCtrl.text.trim();
    if (url.isEmpty) return;
    await StorageService.setBaseUrl(url);
    if (mounted) {
      _testServerPing();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          backgroundColor: AppColors.primaryDark,
          content: const Row(
            children: [
              Icon(Icons.check_circle_rounded, color: Colors.white),
              SizedBox(width: 10),
              Text('Server URL updated! Reconnecting...'),
            ],
          ),
        ),
      );
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Text('$label copied to clipboard!'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Store Profile & LAN Hub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Ping Server',
            onPressed: () => _testServerPing(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Futuristic Glassmorphic Pharmacy Profile Hero
            Container(
              decoration: BoxDecoration(
                gradient: AppColors.heroGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: AppColors.glowShadow,
              ),
              child: Stack(
                children: [
                  // Decorative background shapes
                  Positioned(
                    right: -20,
                    top: -20,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                  ),
                  Positioned(
                    left: -30,
                    bottom: -30,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withValues(alpha: 0.05),
                      ),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      children: [
                        // Store Avatar & Verified Badge
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.15),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 34,
                                backgroundColor: Colors.white,
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    gradient: AppColors.emeraldGradient,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.local_pharmacy_rounded, size: 28, color: Colors.white),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.verified_rounded, color: Color(0xFF6EE7B7), size: 13),
                                        SizedBox(width: 4),
                                        Text(
                                          'VERIFIED PHARMACY',
                                          style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.6),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    auth.pharmacyName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Logged in as ${auth.userName} • ${auth.role.toUpperCase()}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),
                        Divider(color: Colors.white.withValues(alpha: 0.2), height: 1),
                        const SizedBox(height: 14),

                        // Store Quick Actions Row
                        Row(
                          children: [
                            _buildHeroAction(
                              icon: Icons.phone_in_talk_rounded,
                              label: 'Call Store',
                              onTap: () => _copyToClipboard('+91 98765 43210', 'Phone number'),
                            ),
                            const SizedBox(width: 8),
                            _buildHeroAction(
                              icon: Icons.alternate_email_rounded,
                              label: 'Email',
                              onTap: () => _copyToClipboard('pharmacy@davasetu.com', 'Email address'),
                            ),
                            const SizedBox(width: 8),
                            _buildHeroAction(
                              icon: Icons.badge_outlined,
                              label: 'Copy GST',
                              onTap: () => _copyToClipboard('24AAACP1234A1Z5', 'GSTIN'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // 2. Realtime LAN Server Connectivity Hub
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.cardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.wifi_tethering_rounded, color: AppColors.primary, size: 22),
                          SizedBox(width: 8),
                          Text(
                            'LAN Server Connection',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                      // Live Ping Status Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isServerReachable == true
                              ? AppColors.successBg
                              : _isServerReachable == false
                                  ? AppColors.errorBg
                                  : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _isServerReachable == true
                                ? AppColors.success.withValues(alpha: 0.3)
                                : _isServerReachable == false
                                    ? AppColors.error.withValues(alpha: 0.3)
                                    : Colors.grey.shade300,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (_isTestingConnection)
                              const SizedBox(
                                width: 10,
                                height: 10,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                              )
                            else
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _isServerReachable == true
                                      ? AppColors.success
                                      : _isServerReachable == false
                                          ? AppColors.error
                                          : Colors.grey,
                                ),
                              ),
                            const SizedBox(width: 6),
                            Text(
                              _isTestingConnection
                                  ? 'Testing...'
                                  : _isServerReachable == true
                                      ? '${_pingLatencyMs ?? 20}ms Online'
                                      : 'Offline',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: _isServerReachable == true
                                    ? AppColors.success
                                    : _isServerReachable == false
                                        ? AppColors.error
                                        : Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _pingMessage ??
                        'Connect your mobile phone to your pharmacy computer\'s Wi-Fi IP to sync live billing and medicines.',
                    style: TextStyle(
                      fontSize: 12,
                      color: _isServerReachable == false ? AppColors.error : AppColors.textSecondary,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // URL Input with Save & Ping
                  TextField(
                    controller: _serverUrlCtrl,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    decoration: InputDecoration(
                      labelText: 'API Base URL',
                      hintText: 'http://192.168.1.X:3000/api',
                      prefixIcon: const Icon(Icons.link_rounded, color: AppColors.primary),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                        tooltip: 'Apply & Ping',
                        onPressed: _saveServerUrl,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Quick Presets Row
                  const Text(
                    'Quick IP Presets:',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 6),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildPresetChip('Emulator', 'http://10.0.2.2:3000/api'),
                        _buildPresetChip('Home Wi-Fi', 'http://192.168.1.100:3000/api'),
                        _buildPresetChip('Localhost', 'http://127.0.0.1:3000/api'),
                        _buildPresetChip('Render Cloud', 'https://pharmacyconnect-api.onrender.com/api'),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _saveServerUrl,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.save_rounded, size: 18),
                          label: const Text('Save & Apply', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton.icon(
                        onPressed: () => _testServerPing(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.network_check_rounded, size: 18),
                        label: const Text('Test Ping'),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 3. Store Credentials & Compliance Cards
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: AppColors.softShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Store Identification & Licenses',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 14),
                  _buildSmartRow(
                    icon: Icons.badge_outlined,
                    label: 'Drug License',
                    value: 'DL-20B-19482 / 21B-19483',
                    badge: 'ACTIVE',
                    badgeColor: AppColors.success,
                    badgeBg: AppColors.successBg,
                    onCopy: () => _copyToClipboard('DL-20B-19482 / 21B-19483', 'Drug License'),
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1)),
                  _buildSmartRow(
                    icon: Icons.receipt_long_outlined,
                    label: 'GSTIN Registration',
                    value: '24AAACP1234A1Z5',
                    badge: 'VERIFIED',
                    badgeColor: AppColors.primary,
                    badgeBg: AppColors.primarySubtle,
                    onCopy: () => _copyToClipboard('24AAACP1234A1Z5', 'GSTIN'),
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1)),
                  _buildSmartRow(
                    icon: Icons.phone_android_rounded,
                    label: 'Pharmacy Helpline',
                    value: auth.user?.phone ?? '+91 98765 43210',
                    badge: 'CALL',
                    badgeColor: Colors.blue,
                    badgeBg: AppColors.infoBg,
                    onCopy: () => _copyToClipboard(auth.user?.phone ?? '+91 98765 43210', 'Phone'),
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Divider(height: 1)),
                  _buildSmartRow(
                    icon: Icons.mail_outline_rounded,
                    label: 'Official Email',
                    value: (auth.user?.email.isNotEmpty == true) ? auth.user!.email : 'pharmacy@davasetu.com',
                    badge: 'OFFICIAL',
                    badgeColor: Colors.indigo,
                    badgeBg: Colors.indigo.shade50,
                    onCopy: () => _copyToClipboard(auth.user?.email ?? 'pharmacy@davasetu.com', 'Email'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 4. System Diagnostics & App Info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primarySubtle,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.shield_outlined, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('DavaSetu Mobile POS Engine', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        SizedBox(height: 2),
                        Text('v1.4.0 • Enterprise Edition • Local & Cloud Sync', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 20),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 5. Logout Button
            OutlinedButton.icon(
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Logout Session'),
                    content: const Text('Are you sure you want to log out of DavaSetu Pharmacy Mobile?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                        onPressed: () {
                          Navigator.pop(ctx);
                          auth.logout();
                        },
                        child: const Text('Log Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                );
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: Color(0xFFFCA5A5)),
                backgroundColor: const Color(0xFFFEF2F2),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Sign Out of Terminal', style: TextStyle(fontWeight: FontWeight.bold)),
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroAction({required IconData icon, required String label, required VoidCallback onTap}) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: Colors.white),
              const SizedBox(width: 6),
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPresetChip(String label, String url) {
    final isSelected = _serverUrlCtrl.text.trim() == url;
    return Padding(
      padding: const EdgeInsets.only(right: 6.0),
      child: ActionChip(
        label: Text(label),
        backgroundColor: isSelected ? AppColors.primarySubtle : Colors.grey.shade100,
        side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey.shade300),
        labelStyle: TextStyle(
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? AppColors.primaryDark : AppColors.textSecondary,
        ),
        onPressed: () {
          setState(() {
            _serverUrlCtrl.text = url;
          });
          _saveServerUrl();
        },
      ),
    );
  }

  Widget _buildSmartRow({
    required IconData icon,
    required String label,
    required String value,
    required String badge,
    required Color badgeColor,
    required Color badgeBg,
    required VoidCallback onCopy,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(6)),
          child: Text(
            badge,
            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: badgeColor, letterSpacing: 0.5),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.copy_rounded, size: 16, color: AppColors.textMuted),
          tooltip: 'Copy',
          onPressed: onCopy,
        ),
      ],
    );
  }
}
