import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/medicine_model.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';
import 'camera_barcode_scanner_screen.dart';

class BarcodeScannerModal extends StatefulWidget {
  const BarcodeScannerModal({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const BarcodeScannerModal(),
    );
  }

  @override
  State<BarcodeScannerModal> createState() => _BarcodeScannerModalState();
}

class _BarcodeScannerModalState extends State<BarcodeScannerModal>
    with SingleTickerProviderStateMixin {
  final _barcodeCtrl = TextEditingController();
  final _focusNode = FocusNode();
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

  late AnimationController _laserAnimCtrl;
  late Animation<double> _laserAnimation;

  String? _feedbackMessage;
  bool _isSuccessFeedback = true;

  @override
  void initState() {
    super.initState();
    _laserAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _laserAnimation = Tween<double>(begin: 0.1, end: 0.9).animate(
      CurvedAnimation(parent: _laserAnimCtrl, curve: Curves.easeInOut),
    );

    // Auto-focus barcode input for instant scanning or gun entry
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _laserAnimCtrl.dispose();
    _barcodeCtrl.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleBarcodeScanned(String rawCode) {
    final code = rawCode.trim();
    if (code.isEmpty) return;

    final inventory = context.read<InventoryProvider>();
    final billing = context.read<BillingProvider>();

    final MedicineModel? matchedMedicine = inventory.findByBarcode(code);

    if (matchedMedicine != null) {
      if (matchedMedicine.stock <= 0) {
        setState(() {
          _feedbackMessage = 'Out of Stock: ${matchedMedicine.name}';
          _isSuccessFeedback = false;
        });
      } else {
        billing.addToCart(matchedMedicine);
        setState(() {
          _feedbackMessage = '✓ Added ${matchedMedicine.name} (${_currency.format(matchedMedicine.sellingPrice)})';
          _isSuccessFeedback = true;
        });
      }
    } else {
      setState(() {
        _feedbackMessage = 'Barcode "$code" not found in inventory';
        _isSuccessFeedback = false;
      });
    }

    _barcodeCtrl.clear();
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final billing = context.watch<BillingProvider>();
    final inventory = context.watch<InventoryProvider>();
    final List<MedicineModel> medicinesWithBarcodes = inventory.allMedicines.where((m) => m.barcode != null && m.barcode!.isNotEmpty).toList();

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.88,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              height: 4,
              width: 44,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primarySubtle,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Barcode Scanner (POS)',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        Text(
                          'Scan barcode, use USB gun, or tap test items',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // High-Tech Scanner Viewport Simulation
                    Container(
                      height: 160,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A), // Slate 900
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF334155)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.15),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Targeting Reticle (corners)
                            Positioned.fill(
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Container(
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: const Color(0xFF0EA5E9).withValues(alpha: 0.35),
                                      width: 1.5,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),

                            // Animated Laser Line
                            AnimatedBuilder(
                              animation: _laserAnimation,
                              builder: (context, child) {
                                return Positioned(
                                  top: 160 * _laserAnimation.value,
                                  left: 24,
                                  right: 24,
                                  child: Container(
                                    height: 2.5,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981), // Emerald bright
                                      borderRadius: BorderRadius.circular(2),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF10B981).withValues(alpha: 0.9),
                                          blurRadius: 10,
                                          spreadRadius: 2,
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),

                            // Scanner Instructions & Status
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.barcode_reader,
                                  color: Color(0xFF38BDF8),
                                  size: 38,
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Ready for Barcode Scanner',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Use phone camera or enter barcode below',
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.6),
                                    fontSize: 11,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.pop(context);
                                    CameraBarcodeScannerScreen.open(context);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  ),
                                  icon: const Icon(Icons.camera_alt_rounded, size: 15),
                                  label: const Text('Open Mobile Camera', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Feedback Alert Banner
                    if (_feedbackMessage != null) ...[
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: _isSuccessFeedback
                              ? const Color(0xFFECFDF5)
                              : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _isSuccessFeedback
                                ? const Color(0xFFA7F3D0)
                                : const Color(0xFFFECACA),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _isSuccessFeedback
                                  ? Icons.check_circle_rounded
                                  : Icons.error_outline_rounded,
                              color: _isSuccessFeedback
                                  ? const Color(0xFF059669)
                                  : const Color(0xFFDC2626),
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _feedbackMessage!,
                                style: TextStyle(
                                  color: _isSuccessFeedback
                                      ? const Color(0xFF065F46)
                                      : const Color(0xFF991B1B),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Barcode / SKU Input Field
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _barcodeCtrl,
                            focusNode: _focusNode,
                            keyboardType: TextInputType.text,
                            textInputAction: TextInputAction.done,
                            onSubmitted: _handleBarcodeScanned,
                            decoration: InputDecoration(
                              hintText: 'Enter or scan Barcode / SKU...',
                              prefixIcon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
                              suffixIcon: _barcodeCtrl.text.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear, size: 18),
                                      onPressed: () {
                                        _barcodeCtrl.clear();
                                        setState(() {});
                                      },
                                    )
                                  : null,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                            onChanged: (val) => setState(() {}),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: () => _handleBarcodeScanned(_barcodeCtrl.text),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.add_shopping_cart_rounded, size: 18, color: Colors.white),
                          label: const Text('Add', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Quick Test / Available Barcodes
                    if (medicinesWithBarcodes.isNotEmpty) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Quick Tap Barcode Items:',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            '${medicinesWithBarcodes.length} available',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: medicinesWithBarcodes.map((med) {
                          return ActionChip(
                            avatar: const Icon(Icons.barcode_reader, size: 16, color: AppColors.primary),
                            label: Text(
                              '${med.name} (${med.barcode})',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            backgroundColor: AppColors.primarySubtle,
                            side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                            onPressed: () => _handleBarcodeScanned(med.barcode!),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Live Filtered Search Results (if typing)
                    if (_barcodeCtrl.text.trim().isNotEmpty) ...[
                      const Text(
                        'Matching Inventory Items:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 8),
                      Builder(
                        builder: (_) {
                          final query = _barcodeCtrl.text.trim().toLowerCase();
                          final matches = inventory.allMedicines.where((m) =>
                              (m.barcode?.toLowerCase().contains(query) ?? false) ||
                              m.name.toLowerCase().contains(query) ||
                              (m.genericName?.toLowerCase().contains(query) ?? false) ||
                              m.id.toLowerCase() == query).toList();

                          if (matches.isEmpty) {
                            return Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'No medicines match this code/name.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                              ),
                            );
                          }

                          return Column(
                            children: matches.map((med) {
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.cardBorder),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            med.name,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Barcode: ${med.barcode ?? "N/A"} • Stock: ${med.stock}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: med.isLowStock ? AppColors.warning : AppColors.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      _currency.format(med.sellingPrice),
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    const SizedBox(width: 8),
                                    ElevatedButton(
                                      onPressed: med.stock <= 0
                                          ? null
                                          : () => _handleBarcodeScanned(med.barcode ?? med.name),
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      child: const Text('+ Add', style: TextStyle(fontSize: 12)),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Bottom Cart Overview & Close
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.cardBorder)),
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Cart: ${billing.itemCount} items',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          Text(
                            _currency.format(billing.grandTotal),
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryDark,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.check_rounded, color: Colors.white, size: 18),
                      label: const Text('Done / View Cart', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
