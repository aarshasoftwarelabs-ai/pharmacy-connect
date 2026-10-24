import 'package:flutter/material.dart';
import '../core/api/api_endpoints.dart';
import '../core/api/api_service.dart';
import '../core/constants/app_colors.dart';

class MessagingGatewayModal extends StatefulWidget {
  final String pharmacyName;

  const MessagingGatewayModal({
    super.key,
    required this.pharmacyName,
  });

  static Future<void> show(BuildContext context, {required String pharmacyName}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => MessagingGatewayModal(pharmacyName: pharmacyName),
    );
  }

  @override
  State<MessagingGatewayModal> createState() => _MessagingGatewayModalState();
}

class _MessagingGatewayModalState extends State<MessagingGatewayModal> {
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isTesting = false;

  bool _autoSendWhatsapp = true;
  bool _isActive = true;
  String _gatewayProvider = 'SIMULATED';
  final TextEditingController _phoneNumberIdController = TextEditingController();
  final TextEditingController _accessTokenController = TextEditingController();
  final TextEditingController _testPhoneController = TextEditingController();

  String? _testFeedbackMessage;
  bool _isFeedbackSuccess = true;

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  @override
  void dispose() {
    _phoneNumberIdController.dispose();
    _accessTokenController.dispose();
    _testPhoneController.dispose();
    super.dispose();
  }

  Future<void> _fetchSettings() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.get(ApiEndpoints.messagingSettings);
      if (res.success && res.data != null) {
        final data = res.data is Map ? res.data : (res.data['data'] ?? {});
        setState(() {
          _isActive = data['isActive'] ?? true;
          _autoSendWhatsapp = data['autoSendBillWhatsapp'] ?? true;
          _gatewayProvider = 'SIMULATED';
        });
      }
    } catch (e) {
      debugPrint('Error loading WhatsApp messaging settings: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);
    try {
      final payload = {
        'isActive': _isActive,
        'autoSendBillWhatsapp': _autoSendWhatsapp,
        'preferredChannel': 'WHATSAPP',
        'gatewayProvider': 'SIMULATED',
      };

      final res = await ApiService.put(
        ApiEndpoints.messagingSettings,
        payload,
      );

      if (!mounted) return;
      if (res.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            behavior: SnackBarBehavior.floating,
            backgroundColor: Color(0xFF15803D),
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('WhatsApp settings saved!'),
              ],
            ),
          ),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red.shade700,
            content: Text(res.message ?? 'Failed to save settings'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _sendTestMessage() async {
    final phone = _testPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (phone.length < 10) {
      setState(() {
        _testFeedbackMessage = 'Please enter a valid 10-digit WhatsApp number';
        _isFeedbackSuccess = false;
      });
      return;
    }

    setState(() {
      _isTesting = true;
      _testFeedbackMessage = null;
    });

    try {
      final res = await ApiService.post(
        ApiEndpoints.sendTestMessage,
        {
          'phone': phone,
        },
      );

      if (!mounted) return;
      setState(() {
        _isFeedbackSuccess = res.success;
        _testFeedbackMessage = res.message ?? (res.success ? 'WhatsApp message dispatched!' : 'Dispatch error');
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isFeedbackSuccess = false;
        _testFeedbackMessage = 'Error: $e';
      });
    } finally {
      if (mounted) setState(() => _isTesting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + bottomInset),
      child: _isLoading
          ? const SizedBox(
              height: 250,
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF059669)),
              ),
            )
          : SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle pill
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: const Icon(Icons.mark_chat_unread_rounded, color: Color(0xFF059669), size: 24),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Automated WhatsApp Gateway',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Auto-send digital receipts to customer WhatsApp',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Colors.grey),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Master Toggle: Auto-Send on Checkout
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Auto-Send on Checkout',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                            ),
                            Text(
                              'Dispatch receipt automatically to customer WhatsApp',
                              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        Switch.adaptive(
                          value: _isActive,
                          activeTrackColor: const Color(0xFF059669),
                          onChanged: (val) {
                            setState(() {
                              _isActive = val;
                              _autoSendWhatsapp = val;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Direct WhatsApp Route
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Direct WhatsApp Active (100% Free & Unlimited). All digital tax receipts format automatically with 0 setup.',
                            style: TextStyle(fontSize: 11.5, color: Color(0xFF047857), fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Live Test WhatsApp Section
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Test WhatsApp Delivery',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _testPhoneController,
                                keyboardType: TextInputType.phone,
                                maxLength: 10,
                                decoration: InputDecoration(
                                  counterText: '',
                                  hintText: '10-digit WhatsApp number...',
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              onPressed: _isTesting ? null : _sendTestMessage,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF25D366),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              icon: const Icon(Icons.send_rounded, size: 14),
                              label: Text(_isTesting ? 'Sending...' : 'Test WhatsApp', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        if (_testFeedbackMessage != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            _testFeedbackMessage!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: _isFeedbackSuccess ? const Color(0xFF15803D) : Colors.red.shade700,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isSaving ? null : _saveSettings,
                      icon: _isSaving
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.check_rounded, size: 18),
                      label: Text(
                        _isSaving ? 'Saving...' : 'Save WhatsApp Configuration',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
