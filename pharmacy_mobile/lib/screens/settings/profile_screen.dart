import 'package:flutter/material.dart';
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

class _ProfileScreenState extends State<ProfileScreen> {
  final _serverUrlCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _serverUrlCtrl.text = StorageService.getBaseUrl() ?? ApiEndpoints.baseUrl;
  }

  @override
  void dispose() {
    _serverUrlCtrl.dispose();
    super.dispose();
  }

  void _saveServerUrl() async {
    final url = _serverUrlCtrl.text.trim();
    if (url.isEmpty) return;
    await StorageService.setBaseUrl(url);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Server URL updated! Reconnecting...')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Pharmacy Profile & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Store Profile Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.primarySubtle,
                    child: const Icon(Icons.local_pharmacy_rounded, size: 40, color: AppColors.primary),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    auth.pharmacyName,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Logged in as ${auth.userName} (${auth.role})',
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  _buildProfileRow(Icons.phone_rounded, 'Phone', '+91 98765 43210'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.email_outlined, 'Email', 'pharmacy@davasetu.com'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.badge_outlined, 'Drug License', 'DL-20B-19482 / 21B-19483'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.receipt_outlined, 'GSTIN', '24AAACP1234A1Z5'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Server Connection Settings (Vital for LAN & Mobile connection)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.wifi_rounded, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'Backend Server Connection',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Set your computer/server Wi-Fi IP so the phone connects seamlessly to pharmacy backend.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _serverUrlCtrl,
                    decoration: const InputDecoration(
                      labelText: 'API Base URL',
                      hintText: 'http://192.168.1.X:3000/api',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: _saveServerUrl,
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                        child: const Text('Save & Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 10),
                      TextButton(
                        onPressed: () {
                          _serverUrlCtrl.text = 'http://10.0.2.2:3000/api';
                          _saveServerUrl();
                        },
                        child: const Text('Reset to Default'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Logout'),
                      content: const Text('Are you sure you want to log out of Pharmacy Mobile?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            auth.logout();
                          },
                          child: const Text('Logout', style: TextStyle(color: AppColors.error)),
                        ),
                      ],
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textMuted),
        const SizedBox(width: 10),
        Text('$label: ', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}
