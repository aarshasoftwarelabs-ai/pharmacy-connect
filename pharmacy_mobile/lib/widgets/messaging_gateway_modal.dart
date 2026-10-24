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

  bool _autoSendSms = true;
  bool _autoSendWhatsapp = true;
  bool _isActive = true;
  String _preferredChannel = 'WHATSAPP_AND_SMS';
  String _gatewayProvider = 'FAST2SMS';
  String _smsSenderId = 'DAVAST';
  final TextEditingController _apiKeyController = TextEditingController();
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
    _apiKeyController.dispose();
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
          _autoSendSms = data['autoSendBillSms'] ?? true;
          _autoSendWhatsapp = data['autoSendBillWhatsapp'] ?? true;
          _preferredChannel = data['preferredChannel'] ?? 'WHATSAPP_AND_SMS';
          _gatewayProvider = data['gatewayProvider'] ?? 'FAST2SMS';
          _smsSenderId = data['smsSenderId'] ?? 'DAVAST';
          _apiKeyController.text = data['smsApiKey'] ?? '';
        });
      }
    } catch (e) {
      debugPrint('Error loading messaging settings: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);
    try {
      final payload = {
        'isActive': _isActive,
        'autoSendBillSms': _autoSendSms,
        'autoSendBillWhatsapp': _autoSendWhatsapp,
        'preferredChannel': _preferredChannel,
        'gatewayProvider': _gatewayProvider,
        'smsSenderId': _smsSenderId,
        'smsApiKey': _apiKeyController.text.trim(),
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
                Text('Messaging settings saved!'),
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

  Future<void> _sendTestMessage(String channel) async {
    final phone = _testPhoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (phone.length < 10) {
      setState(() {
        _testFeedbackMessage = 'Please enter a valid 10-digit mobile number';
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
          'channel': channel,
        },
      );

      if (!mounted) return;
      setState(() {
        _isFeedbackSuccess = res.success;
        _testFeedbackMessage = res.message ?? (res.success ? 'Test message sent!' : 'Dispatch error');
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
                              'Automated WhatsApp & SMS',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Auto-send receipts upon billing checkout',
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
                              'Dispatch receipt automatically to customer',
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
                              _autoSendSms = val;
                              _autoSendWhatsapp = val;
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Preferred Channel Selector
                  const Text(
                    'Preferred Channels',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildChannelChip('WHATSAPP_AND_SMS', 'WhatsApp + SMS', Icons.all_inclusive_rounded),
                      const SizedBox(width: 8),
                      _buildChannelChip('WHATSAPP', 'WhatsApp', Icons.chat_rounded),
                      const SizedBox(width: 8),
                      _buildChannelChip('SMS', 'SMS Only', Icons.sms_rounded),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Gateway Provider Selection
                  const Text(
                    'Gateway Provider',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _gatewayProvider,
                        isExpanded: true,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                        items: const [
                          DropdownMenuItem(value: 'FAST2SMS', child: Text('Fast2SMS (Quick Indian SMS)')),
                          DropdownMenuItem(value: 'WHATSAPP_CLOUD', child: Text('WhatsApp Cloud API (Meta)')),
                          DropdownMenuItem(value: 'SIMULATED', child: Text('DavaSetu Built-in Cloud Queue (Zero Setup)')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _gatewayProvider = val);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Fast2SMS API Key Input
                  if (_gatewayProvider == 'FAST2SMS') ...[
                    TextField(
                      controller: _apiKeyController,
                      decoration: InputDecoration(
                        labelText: 'Fast2SMS API Key (Optional)',
                        hintText: 'Enter API Key for live SMS dispatch',
                        hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade400),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      style: const TextStyle(fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Leave empty to use zero-config cloud log mode.',
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                  ],

                  if (_gatewayProvider == 'SIMULATED') ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFDBEAFE)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline_rounded, color: Color(0xFF2563EB), size: 18),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Zero-setup mode is active. Invoices are logged and tracked in the cloud queue.',
                              style: TextStyle(fontSize: 11.5, color: Color(0xFF1E40AF)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // Live Test Section
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
                          'Test Message Dispatch',
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
                                  hintText: '10-digit mobile...',
                                  filled: true,
                                  fillColor: Colors.white,
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                ),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: _isTesting ? null : () => _sendTestMessage('WHATSAPP'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF25D366),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('WhatsApp', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                            ),
                            const SizedBox(width: 6),
                            ElevatedButton(
                              onPressed: _isTesting ? null : () => _sendTestMessage('SMS'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2563EB),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('SMS', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
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
                        _isSaving ? 'Saving...' : 'Save Messaging Settings',
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

  Widget _buildChannelChip(String value, String label, IconData icon) {
    final isSelected = _preferredChannel == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _preferredChannel = value;
            _autoSendWhatsapp = value == 'WHATSAPP' || value == 'WHATSAPP_AND_SMS';
            _autoSendSms = value == 'SMS' || value == 'WHATSAPP_AND_SMS';
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFECFDF5) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFF059669) : const Color(0xFFE2E8F0),
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: isSelected ? const Color(0xFF059669) : Colors.grey.shade600),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? const Color(0xFF059669) : AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
