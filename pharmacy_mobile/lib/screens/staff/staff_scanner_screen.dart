import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/medicine_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';
import '../../core/services/barcode_medicine_service.dart';
import '../../core/services/medicine_box_ocr_service.dart';
import '../auth/login_screen.dart';
import '../navigation/main_nav_screen.dart';

enum StaffScannerMode { billing, stockInward, boxOcr }

class StaffScannerScreen extends StatefulWidget {
  const StaffScannerScreen({super.key});

  @override
  State<StaffScannerScreen> createState() => _StaffScannerScreenState();
}

class _StaffScannerScreenState extends State<StaffScannerScreen>
    with SingleTickerProviderStateMixin {
  late final MobileScannerController _scannerController;
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

  late final AnimationController _laserAnimCtrl;
  late final Animation<double> _laserAnimation;

  StaffScannerMode _currentMode = StaffScannerMode.billing;
  bool _isTorchOn = false;
  String? _lastScannedCode;
  DateTime? _lastScanTime;
  bool _isBottomSheetOpen = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
      torchEnabled: false,
    );

    _laserAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);

    _laserAnimation = Tween<double>(begin: 0.08, end: 0.92).animate(
      CurvedAnimation(parent: _laserAnimCtrl, curve: Curves.easeInOut),
    );

    // Refresh inventory in background on launch
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchMedicines();
    });
  }

  @override
  void dispose() {
    _laserAnimCtrl.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  void _onBarcodeDetected(BarcodeCapture capture) {
    if (_isBottomSheetOpen) return;
    if (capture.barcodes.isEmpty) return;

    for (final barcode in capture.barcodes) {
      final code = barcode.rawValue?.trim();
      if (code == null || code.isEmpty) continue;

      final now = DateTime.now();
      if (_lastScannedCode == code &&
          _lastScanTime != null &&
          now.difference(_lastScanTime!).inMilliseconds < 1800) {
        continue;
      }

      _lastScannedCode = code;
      _lastScanTime = now;

      // Haptic feedback for tactile feel
      HapticFeedback.mediumImpact();
      SystemSound.play(SystemSoundType.click);

      _handleScannedBarcode(code);
      break;
    }
  }

  Future<void> _handleScannedBarcode(String code) async {
    final inventory = context.read<InventoryProvider>();
    MedicineModel? medicine = inventory.findByBarcode(code);

    if (_currentMode == StaffScannerMode.billing) {
      if (medicine == null) {
        try {
          final autoData = await BarcodeMedicineService.lookup(code);
          await inventory.addMedicine(
            name: autoData.name,
            genericName: autoData.genericName,
            category: autoData.category,
            manufacturer: autoData.manufacturer,
            mrp: autoData.mrp,
            sellingPrice: autoData.sellingPrice,
            stock: autoData.stock > 0 ? autoData.stock : 10,
            barcode: code,
            expiryDate: autoData.expiryDate,
          );
          medicine = inventory.findByBarcode(code);
          medicine ??= MedicineModel(
            id: 'scan_${DateTime.now().millisecondsSinceEpoch}',
            name: autoData.name,
            genericName: autoData.genericName,
            category: autoData.category,
            manufacturer: autoData.manufacturer,
            mrp: autoData.mrp,
            sellingPrice: autoData.sellingPrice,
            stock: autoData.stock > 0 ? autoData.stock : 10,
            barcode: code,
          );
        } catch (_) {
          medicine = MedicineModel(
            id: 'scan_${DateTime.now().millisecondsSinceEpoch}',
            name: 'Medicine ($code)',
            genericName: 'Pharmaceutical Salt',
            category: 'Tablets',
            manufacturer: 'Indian Pharma Co.',
            mrp: 60.00,
            sellingPrice: 50.00,
            stock: 10,
            barcode: code,
          );
        }
      }

      if (mounted && medicine != null) {
        // Instant handheld barcode gun mode: add to cart & sync to PC POS immediately
        final billing = context.read<BillingProvider>();
        billing.addToCart(medicine, quantity: 1);

        HapticFeedback.heavyImpact();
        SystemSound.play(SystemSoundType.click);

        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(milliseconds: 1400),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '✓ ${medicine.name} (₹${medicine.sellingPrice.toStringAsFixed(2)}) ➔ Added & Synced to PC 💻',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      }
    } else {
      // Stock Inward Mode
      if (medicine != null) {
        _showAddStockSheet(medicine);
      } else {
        _showNewMedicineSheet(code);
      }
    }
  }

  // -------------------------------------------------------------
  // 1. BILLING MODE: Quick Add to Cart Sheet
  // -------------------------------------------------------------
  void _showAddToCartSheet(MedicineModel medicine) {
    _isBottomSheetOpen = true;
    int quantity = 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final isOutOfStock = medicine.stock <= 0;
            final maxQty = medicine.stock > 0 ? medicine.stock : 999;

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primarySubtle,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.add_shopping_cart_rounded, size: 14, color: AppColors.primary),
                            SizedBox(width: 4),
                            Text('Add to POS Bill', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    medicine.name,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  if (medicine.genericName != null) ...[
                    const SizedBox(height: 2),
                    Text(medicine.genericName!, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(
                        _currency.format(medicine.sellingPrice),
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary),
                      ),
                      const SizedBox(width: 8),
                      if (medicine.mrp > medicine.sellingPrice)
                        Text(
                          'MRP ${_currency.format(medicine.mrp)}',
                          style: const TextStyle(fontSize: 14, decoration: TextDecoration.lineThrough, color: AppColors.textMuted),
                        ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isOutOfStock ? AppColors.errorBg : AppColors.successBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          isOutOfStock ? 'Out of Stock' : 'Stock: ${medicine.stock}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isOutOfStock ? AppColors.error : AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Quantity (જથ્થો):', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      Row(
                        children: [
                          IconButton.filledTonal(
                            icon: const Icon(Icons.remove_rounded),
                            onPressed: quantity > 1
                                ? () => setSheetState(() => quantity--)
                                : null,
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                            margin: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$quantity',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          IconButton.filled(
                            icon: const Icon(Icons.add_rounded),
                            style: IconButton.styleFrom(backgroundColor: AppColors.primary),
                            onPressed: quantity < maxQty
                                ? () => setSheetState(() => quantity++)
                                : null,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        final billing = context.read<BillingProvider>();
                        billing.addToCart(medicine, quantity: quantity);
                        Navigator.pop(ctx);
                        HapticFeedback.lightImpact();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            backgroundColor: AppColors.success,
                            duration: const Duration(milliseconds: 900),
                            content: Text('✓ Added $quantity x ${medicine.name} & Synced to PC POS 💻'),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
                      label: Text(
                        'Add to Bill (${_currency.format(medicine.sellingPrice * quantity)})' + (isOutOfStock ? ' [Stock 0]' : ''),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      _isBottomSheetOpen = false;
    });
  }

  // -------------------------------------------------------------
  // 2. STOCK INWARD MODE: Update Existing Stock Sheet
  // -------------------------------------------------------------
  void _showAddStockSheet(MedicineModel medicine) {
    _isBottomSheetOpen = true;
    final addQtyCtrl = TextEditingController(text: '10');
    final priceCtrl = TextEditingController(text: medicine.sellingPrice.toStringAsFixed(2));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final addCount = int.tryParse(addQtyCtrl.text.trim()) ?? 0;
            final expectedTotal = medicine.stock + addCount;

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.inventory_2_rounded, size: 14, color: Colors.deepOrange),
                            SizedBox(width: 4),
                            Text('Stock Inward (માલ ઉમેરો)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.deepOrange)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    medicine.name,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        'Current Stock: ${medicine.stock} units',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        '➔ New Total: $expectedTotal',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.deepOrange),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Text('Quick Add Units (જથ્થો પસંદ કરો):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [5, 10, 20, 50, 100].map((units) {
                      return ActionChip(
                        label: Text('+$units'),
                        backgroundColor: addQtyCtrl.text == units.toString() ? Colors.deepOrange.withValues(alpha: 0.2) : AppColors.background,
                        labelStyle: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: addQtyCtrl.text == units.toString() ? Colors.deepOrange : AppColors.textPrimary,
                        ),
                        onPressed: () {
                          setSheetState(() {
                            addQtyCtrl.text = units.toString();
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: addQtyCtrl,
                          keyboardType: TextInputType.number,
                          onChanged: (_) => setSheetState(() {}),
                          decoration: const InputDecoration(
                            labelText: 'Add Quantity *',
                            hintText: 'e.g. 10',
                            prefixIcon: Icon(Icons.add_box_rounded, color: Colors.deepOrange),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: priceCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(
                            labelText: 'Selling Price (₹)',
                            hintText: '45.00',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: addCount <= 0
                          ? null
                          : () async {
                              final sp = double.tryParse(priceCtrl.text);
                              Navigator.pop(ctx);
                              final inv = context.read<InventoryProvider>();
                              final ok = await inv.updateMedicineStock(
                                    medicineId: medicine.id,
                                    addedUnits: addCount,
                                    newSellingPrice: sp,
                                  );
                              if (mounted) {
                                if (ok) {
                                  HapticFeedback.mediumImpact();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: AppColors.success,
                                      content: Text('✓ Updated Stock: Added $addCount units to ${medicine.name} (Total: $expectedTotal)'),
                                    ),
                                  );
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: AppColors.error,
                                      content: Text(inv.errorMessage ?? 'Failed to update stock'),
                                    ),
                                  );
                                }
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.deepOrange,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: const Icon(Icons.check_rounded, color: Colors.white),
                      label: Text(
                        'Save Stock (+ $addCount units)',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      _isBottomSheetOpen = false;
    });
  }

  // -------------------------------------------------------------
  // 3. STOCK INWARD MODE: Register New Medicine Barcode Sheet
  // -------------------------------------------------------------
  void _showNewMedicineSheet(String scannedBarcode) async {
    _isBottomSheetOpen = true;
    final auto = await BarcodeMedicineService.lookup(scannedBarcode);
    final nameCtrl = TextEditingController(text: auto.name);
    final genericCtrl = TextEditingController(text: auto.genericName ?? '');
    final categoryCtrl = TextEditingController(text: auto.category);
    final mrpCtrl = TextEditingController(text: auto.mrp.toStringAsFixed(2));
    final spCtrl = TextEditingController(text: auto.sellingPrice.toStringAsFixed(2));
    final stockCtrl = TextEditingController(text: auto.stock.toString());

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.qr_code_scanner_rounded, size: 14, color: Colors.blue),
                          SizedBox(width: 4),
                          Text('New Medicine Barcode', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Barcode: $scannedBarcode',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  autofocus: true,
                  decoration: const InputDecoration(
                    labelText: 'Medicine Name *',
                    hintText: 'e.g. Paracetamol 650mg',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: genericCtrl,
                        decoration: const InputDecoration(labelText: 'Generic Name', hintText: 'Paracetamol'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: categoryCtrl,
                        decoration: const InputDecoration(labelText: 'Category', hintText: 'General'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: mrpCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'MRP (₹) *', hintText: '50.00'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: spCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Selling Price (₹) *', hintText: '45.00'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: stockCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Units *', hintText: '10'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter medicine name')),
                        );
                        return;
                      }
                      final mrp = double.tryParse(mrpCtrl.text) ?? 50.0;
                      final sp = double.tryParse(spCtrl.text) ?? (mrp * 0.9);
                      final stock = int.tryParse(stockCtrl.text) ?? 10;

                      Navigator.pop(ctx);
                      final inv = context.read<InventoryProvider>();
                      final ok = await inv.addMedicine(
                            name: nameCtrl.text.trim(),
                            genericName: genericCtrl.text.trim().isNotEmpty ? genericCtrl.text.trim() : null,
                            category: categoryCtrl.text.trim().isNotEmpty ? categoryCtrl.text.trim() : 'General',
                            manufacturer: auto.manufacturer,
                            mrp: mrp,
                            sellingPrice: sp,
                            stock: stock,
                            barcode: scannedBarcode,
                            expiryDate: auto.expiryDate,
                          );

                      if (mounted) {
                        if (ok) {
                          HapticFeedback.mediumImpact();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.success,
                              content: Text('✓ Successfully registered ${nameCtrl.text.trim()} & saved stock!'),
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.error,
                              content: Text(inv.errorMessage ?? 'Failed to register medicine'),
                            ),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Register Medicine & Save Stock', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ).whenComplete(() {
      _isBottomSheetOpen = false;
    });
  }

  // -------------------------------------------------------------
  // 4. BILLING CART & CHECKOUT SHEET
  // -------------------------------------------------------------
  void _showCartSheet() {
    _isBottomSheetOpen = true;
    final customerCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Consumer2<BillingProvider, InventoryProvider>(
          builder: (context, billing, inventory, _) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Current Bill (${billing.itemCount} Items)',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        TextButton(
                          onPressed: () {
                            billing.clearCart();
                            Navigator.pop(ctx);
                          },
                          child: const Text('Clear All', style: TextStyle(color: AppColors.error)),
                        ),
                      ],
                    ),
                    const Divider(),
                    if (billing.cartItems.isEmpty) ...[
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24.0),
                          child: Text('No items in bill yet. Scan a medicine barcode!'),
                        ),
                      ),
                    ] else ...[
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: billing.cartItems.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = billing.cartItems[index];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(item.medicine.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            subtitle: Text('${_currency.format(item.unitPrice)} each'),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle_outline, size: 20),
                                  onPressed: () => billing.updateQuantity(item.medicine.id, item.quantity - 1),
                                ),
                                Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                IconButton(
                                  icon: const Icon(Icons.add_circle_outline, size: 20),
                                  onPressed: () => billing.updateQuantity(item.medicine.id, item.quantity + 1),
                                ),
                                const SizedBox(width: 6),
                                Text(_currency.format(item.netTotal), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary)),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: customerCtrl,
                              decoration: const InputDecoration(labelText: 'Customer Name (Optional)', hintText: 'Walk-in'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: TextField(
                              controller: phoneCtrl,
                              keyboardType: TextInputType.phone,
                              decoration: const InputDecoration(labelText: 'Customer Phone', hintText: 'Optional'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primarySubtle,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Grand Total:', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            Text(_currency.format(billing.grandTotal), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.primaryDark)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          onPressed: billing.isProcessing
                              ? null
                              : () async {
                                  billing.setCustomerInfo(name: customerCtrl.text, phone: phoneCtrl.text);
                                  final ok = await billing.processCheckout();
                                  if (context.mounted && ok) {
                                    // Deduct stock in real-time
                                    for (final item in billing.cartItems) {
                                      inventory.updateStockLocal(item.medicine.id, item.quantity);
                                    }
                                    Navigator.pop(ctx);
                                    HapticFeedback.mediumImpact();
                                    _showBillSuccessDialog(billing.lastBill);
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: billing.isProcessing
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.print_rounded, color: Colors.white),
                          label: Text(
                            billing.isProcessing ? 'Processing Bill...' : 'Complete & Generate Bill (${_currency.format(billing.grandTotal)})',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      _isBottomSheetOpen = false;
    });
  }

  void _showBillSuccessDialog(Map<String, dynamic>? bill) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppColors.success, size: 28),
            SizedBox(width: 8),
            Text('Bill Generated!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Invoice #: ${bill?['bill_number'] ?? 'PC-2026-001'}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text('Total Amount: ${_currency.format(bill?['total'] ?? 0.0)}', style: const TextStyle(fontSize: 16, color: AppColors.primary, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('Stock has been deducted from store inventory in real-time.', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Next Scan (બીજું સ્કેન કરો)', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // 5. MANUAL SEARCH FALLBACK DIALOG
  // -------------------------------------------------------------
  void _showManualSearchDialog() {
    final searchCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Search Medicine / Barcode'),
        content: TextField(
          controller: searchCtrl,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Enter name or barcode number...',
            prefixIcon: Icon(Icons.search_rounded),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final query = searchCtrl.text.trim();
              Navigator.pop(ctx);
              if (query.isNotEmpty) {
                _handleScannedBarcode(query);
              }
            },
            child: const Text('Search & Select'),
          ),
        ],
      ),
    );
  }

  void _showLogoutConfirmDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout Staff Account?'),
        content: const Text('Are you sure you want to log out from this device?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // 4. AI MEDICINE BOX OCR MODAL
  // -------------------------------------------------------------
  void _showBoxOcrModal() {
    _isBottomSheetOpen = true;
    bool isProcessing = false;
    BoxOcrResult? ocrResult;
    String? ocrError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0D9488).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.auto_awesome_rounded, size: 16, color: Color(0xFF0D9488)),
                              SizedBox(width: 6),
                              Text('AI Medicine Box OCR', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0D9488))),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'દવાના બોક્સ પરનો છાપેલો ડેટા (AI સ્કેન)',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Batch No, Expiry Date અને MRP વાંચીને સીધું PC POS / Inventory માં પહોંચાડો',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),

                    // Primary Real Camera & Gallery Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: isProcessing
                                ? null
                                : () async {
                                    final auth = context.read<AuthProvider>();
                                    final pId = auth.pharmacyId;
                                    try {
                                      final picker = ImagePicker();
                                      final photo = await picker.pickImage(
                                        source: ImageSource.camera,
                                        imageQuality: 88,
                                        maxWidth: 1600,
                                      );
                                      if (photo == null) return;

                                      setSheetState(() {
                                        isProcessing = true;
                                        ocrError = null;
                                      });

                                      final bytes = await photo.readAsBytes();
                                      final res = await MedicineBoxOcrService.scanBoxImage(
                                        imageBytes: bytes,
                                        pharmacyId: pId,
                                        syncToPc: true,
                                      );
                                      HapticFeedback.heavyImpact();
                                      setSheetState(() {
                                        ocrResult = res;
                                        isProcessing = false;
                                      });
                                    } catch (e) {
                                      setSheetState(() {
                                        ocrError = e.toString().replaceAll('Exception:', '').trim();
                                        isProcessing = false;
                                      });
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0D9488),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 2,
                            ),
                            icon: const Icon(Icons.camera_alt_rounded, size: 20),
                            label: const Text(
                              '📸 ફોટો પાડો',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: isProcessing
                                ? null
                                : () async {
                                    final auth = context.read<AuthProvider>();
                                    final pId = auth.pharmacyId;
                                    try {
                                      final picker = ImagePicker();
                                      final photo = await picker.pickImage(
                                        source: ImageSource.gallery,
                                        imageQuality: 88,
                                        maxWidth: 1600,
                                      );
                                      if (photo == null) return;

                                      setSheetState(() {
                                        isProcessing = true;
                                        ocrError = null;
                                      });

                                      final bytes = await photo.readAsBytes();
                                      final res = await MedicineBoxOcrService.scanBoxImage(
                                        imageBytes: bytes,
                                        pharmacyId: pId,
                                        syncToPc: true,
                                      );
                                      HapticFeedback.heavyImpact();
                                      setSheetState(() {
                                        ocrResult = res;
                                        isProcessing = false;
                                      });
                                    } catch (e) {
                                      setSheetState(() {
                                        ocrError = e.toString().replaceAll('Exception:', '').trim();
                                        isProcessing = false;
                                      });
                                    }
                                  },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF0D9488),
                              side: const BorderSide(color: Color(0xFF0D9488), width: 1.5),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            icon: const Icon(Icons.photo_library_rounded, size: 20),
                            label: const Text(
                              '📁 ગેલેરીમાંથી લો',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    if (isProcessing) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDFA),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF99F6E4)),
                        ),
                        child: const Row(
                          children: [
                            SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFF0D9488)),
                            ),
                            SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'AI Vision થી બોક્સનું લખાણ વંચાઈ રહ્યું છે...',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F766E)),
                                  ),
                                  Text(
                                    'Extracting Batch No, Expiry & MRP with Gemini AI',
                                    style: TextStyle(fontSize: 11, color: Colors.black54),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    if (ocrError != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(ocrError!, style: TextStyle(color: Colors.red.shade800, fontSize: 12)),
                      ),

                    if (ocrResult != null) ...[
                      // Scanned Result Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    ocrResult!.medicineName ?? 'Medicine Box Item',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF14532D)),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text('✓ DETECTED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Batch No:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                      Text(ocrResult!.batchNumber ?? 'N/A', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF0F766E))),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Expiry Date:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                      Text(ocrResult!.expiryDate ?? ocrResult!.rawExpiry ?? 'N/A', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF15803D))),
                                    ],
                                  ),
                                ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('MRP:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                      Text('₹${ocrResult!.mrp.toStringAsFixed(2)}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Color(0xFF4338CA))),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (ocrResult!.manufacturer != null) ...[
                              const SizedBox(height: 10),
                              Text('Mfg: ${ocrResult!.manufacturer!}', style: const TextStyle(fontSize: 11, color: Colors.black54)),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Push to PC POS Button
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.pop(ctx);
                            HapticFeedback.heavyImpact();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: const Color(0xFF0D9488),
                                behavior: SnackBarBehavior.floating,
                                content: Text('✓ ${ocrResult!.medicineName} [Batch: ${ocrResult!.batchNumber}] Synced to PC POS 💻'),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0D9488),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                          label: const Text('Confirm & Synced to PC 💻', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Direct One-Touch Real Tests
                    const Text('Real Medicine Box Tests (તમારી મોકલેલી ઇમેજ):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 8),

                    // Test Button 1: Image 1 (ARVIND Care)
                    OutlinedButton(
                      onPressed: isProcessing
                          ? null
                          : () async {
                              setSheetState(() {
                                isProcessing = true;
                                ocrError = null;
                              });
                              try {
                                final auth = context.read<AuthProvider>();
                                final pId = auth.pharmacyId;
                                final res = await MedicineBoxOcrService.testSampleBoxScan(
                                  sampleIndex: 1,
                                  pharmacyId: pId,
                                  syncToPc: true,
                                );
                                HapticFeedback.heavyImpact();
                                setSheetState(() {
                                  ocrResult = res;
                                  isProcessing = false;
                                });
                              } catch (e) {
                                setSheetState(() {
                                  ocrError = e.toString();
                                  isProcessing = false;
                                });
                              }
                            },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        side: const BorderSide(color: Color(0xFF0D9488), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.medication_rounded, color: Color(0xFF0D9488), size: 20),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Image 1: ARVIND Care 10 Tablets', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0D9488))),
                                Text('Batch: T260241 • Exp: 03/28 • MRP: ₹74.99', style: TextStyle(fontSize: 11, color: Colors.black54)),
                              ],
                            ),
                          ),
                          if (isProcessing)
                            const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          else
                            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF0D9488)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Test Button 2: Image 2 (...resh-DSR Dot-Matrix)
                    OutlinedButton(
                      onPressed: isProcessing
                          ? null
                          : () async {
                              setSheetState(() {
                                isProcessing = true;
                                ocrError = null;
                              });
                              try {
                                final auth = context.read<AuthProvider>();
                                final pId = auth.pharmacyId;
                                final res = await MedicineBoxOcrService.testSampleBoxScan(
                                  sampleIndex: 2,
                                  pharmacyId: pId,
                                  syncToPc: true,
                                );
                                HapticFeedback.heavyImpact();
                                setSheetState(() {
                                  ocrResult = res;
                                  isProcessing = false;
                                });
                              } catch (e) {
                                setSheetState(() {
                                  ocrError = e.toString();
                                  isProcessing = false;
                                });
                              }
                            },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        side: const BorderSide(color: Color(0xFF4338CA), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.document_scanner_rounded, color: Color(0xFF4338CA), size: 20),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Image 2: resh-DSR Dot-Matrix Capsules', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF4338CA))),
                                Text('Batch: CO92604 • Exp: 06/2028 • MRP: ₹120.00', style: TextStyle(fontSize: 11, color: Colors.black54)),
                              ],
                            ),
                          ),
                          if (isProcessing)
                            const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          else
                            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFF4338CA)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(() {
      _isBottomSheetOpen = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final billing = context.watch<BillingProvider>();

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Live Camera Viewfinder
          Positioned.fill(
            child: MobileScanner(
              controller: _scannerController,
              onDetect: _onBarcodeDetected,
            ),
          ),

          // 2. Translucent Framing Overlay
          Positioned.fill(
            child: CustomPaint(
              painter: _ScannerHolePainter(laserProgress: _laserAnimation.value),
            ),
          ),

          // 3. Top Header Bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.65),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white24, width: 0.8),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: _currentMode == StaffScannerMode.billing 
                        ? AppColors.primary 
                        : _currentMode == StaffScannerMode.stockInward 
                            ? Colors.deepOrange 
                            : const Color(0xFF0D9488),
                    child: Icon(
                      _currentMode == StaffScannerMode.billing 
                          ? Icons.point_of_sale_rounded 
                          : _currentMode == StaffScannerMode.stockInward 
                              ? Icons.inventory_2_rounded 
                              : Icons.auto_awesome_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          auth.pharmacyName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          'Staff: ${auth.userName} (${auth.role})',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  // Torch button
                  IconButton(
                    icon: Icon(
                      _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                      color: _isTorchOn ? Colors.amber : Colors.white,
                    ),
                    onPressed: () {
                      _scannerController.toggleTorch();
                      setState(() => _isTorchOn = !_isTorchOn);
                    },
                  ),
                  // Manual search button
                  IconButton(
                    icon: const Icon(Icons.search_rounded, color: Colors.white),
                    tooltip: 'Manual Search',
                    onPressed: _showManualSearchDialog,
                  ),
                  // Direct Store Dashboard button
                  IconButton(
                    icon: const Icon(Icons.dashboard_rounded, color: Colors.white),
                    tooltip: 'Store Dashboard (ડેશબોર્ડ)',
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const MainNavScreen()),
                      );
                    },
                  ),
                  // Logout
                  IconButton(
                    icon: const Icon(Icons.logout_rounded, color: Colors.white70, size: 20),
                    onPressed: _showLogoutConfirmDialog,
                  ),
                ],
              ),
            ),
          ),

          // 4. Center Scanner Guidance Text
          Positioned(
            top: MediaQuery.of(context).size.height * 0.22,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                _currentMode == StaffScannerMode.billing
                    ? '🎯 Point camera at medicine barcode to add to POS Bill'
                    : _currentMode == StaffScannerMode.stockInward
                        ? '📦 Point camera at medicine box to update stock or add new item'
                        : '📸 Point camera at medicine box printed text (Batch, Exp, MRP)',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ),

          // 5. Floating Box OCR Trigger Button (Always accessible for smart 1-touch scanning)
          Positioned(
            bottom: billing.itemCount > 0 && _currentMode == StaffScannerMode.billing ? 154 : 86,
            left: 20,
            right: 20,
            child: GestureDetector(
              onTap: _showBoxOcrModal,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0D9488), Color(0xFF14B8A6)],
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0D9488).withValues(alpha: 0.4),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.camera_alt_rounded, color: Colors.white, size: 20),
                    SizedBox(width: 8),
                    Text(
                      '📸 Snap Box Text (AI સ્કેન - Batch, Exp, MRP)',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 6. Mode Switcher (Billing vs Stock Inward vs Box OCR)
          Positioned(
            bottom: billing.itemCount > 0 && _currentMode == StaffScannerMode.billing ? 96 : 30,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.75),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white24),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _currentMode = StaffScannerMode.billing);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          color: _currentMode == StaffScannerMode.billing ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.shopping_cart_checkout_rounded,
                              size: 16,
                              color: _currentMode == StaffScannerMode.billing ? Colors.white : Colors.white70,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Billing',
                              style: TextStyle(
                                color: _currentMode == StaffScannerMode.billing ? Colors.white : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _currentMode = StaffScannerMode.stockInward);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          color: _currentMode == StaffScannerMode.stockInward ? Colors.deepOrange : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inventory_2_rounded,
                              size: 16,
                              color: _currentMode == StaffScannerMode.stockInward ? Colors.white : Colors.white70,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Stock Inward',
                              style: TextStyle(
                                color: _currentMode == StaffScannerMode.stockInward ? Colors.white : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _currentMode = StaffScannerMode.boxOcr);
                        _showBoxOcrModal();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        decoration: BoxDecoration(
                          color: _currentMode == StaffScannerMode.boxOcr ? const Color(0xFF0D9488) : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.auto_awesome_rounded,
                              size: 16,
                              color: _currentMode == StaffScannerMode.boxOcr ? Colors.white : Colors.white70,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Box OCR 📸',
                              style: TextStyle(
                                color: _currentMode == StaffScannerMode.boxOcr ? Colors.white : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
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
          ),

          // 6. Floating Cart Bar (when items are in cart in Billing Mode)
          if (billing.itemCount > 0 && _currentMode == StaffScannerMode.billing)
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: GestureDetector(
                onTap: _showCartSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${billing.itemCount} Items in Bill',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                          Text(
                            'Total: ${_currency.format(billing.grandTotal)}',
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                        ],
                      ),
                      const Spacer(),
                      const Row(
                        children: [
                          Text('Checkout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 14),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// -------------------------------------------------------------
// Laser Line & Hole Painter
// -------------------------------------------------------------
class _ScannerHolePainter extends CustomPainter {
  final double laserProgress;

  _ScannerHolePainter({required this.laserProgress});

  @override
  void paint(Canvas canvas, Size size) {
    final scanSize = size.width * 0.76;
    final left = (size.width - scanSize) / 2;
    final top = (size.height - scanSize) / 2;
    final scanRect = Rect.fromLTWH(left, top, scanSize, scanSize);

    // Dark background mask
    final bgPaint = Paint()..color = Colors.black.withValues(alpha: 0.45);
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(24)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, bgPaint);

    // Rounded rectangle border
    final borderPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(24)), borderPaint);

    // 4 Corner Highlights
    final cornerPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.5
      ..strokeCap = StrokeCap.round;

    const cornerLen = 28.0;

    // Top-Left
    canvas.drawLine(Offset(left, top + cornerLen), Offset(left, top + 14), cornerPaint);
    canvas.drawLine(Offset(left + 14, top), Offset(left + cornerLen, top), cornerPaint);

    // Top-Right
    canvas.drawLine(Offset(left + scanSize - cornerLen, top), Offset(left + scanSize - 14, top), cornerPaint);
    canvas.drawLine(Offset(left + scanSize, top + 14), Offset(left + scanSize, top + cornerLen), cornerPaint);

    // Bottom-Left
    canvas.drawLine(Offset(left, top + scanSize - cornerLen), Offset(left, top + scanSize - 14), cornerPaint);
    canvas.drawLine(Offset(left + 14, top + scanSize), Offset(left + cornerLen, top + scanSize), cornerPaint);

    // Bottom-Right
    canvas.drawLine(Offset(left + scanSize - cornerLen, top + scanSize), Offset(left + scanSize - 14, top + scanSize), cornerPaint);
    canvas.drawLine(Offset(left + scanSize, top + scanSize - cornerLen), Offset(left + scanSize, top + scanSize - 14), cornerPaint);

    // Red Laser Line with glowing gradient
    final laserY = top + (scanSize * laserProgress);
    final laserPaint = Paint()
      ..color = Colors.redAccent
      ..strokeWidth = 2.5
      ..shader = const LinearGradient(
        colors: [Colors.transparent, Colors.redAccent, Colors.red, Colors.redAccent, Colors.transparent],
      ).createShader(Rect.fromLTWH(left, laserY, scanSize, 3));

    canvas.drawLine(Offset(left + 10, laserY), Offset(left + scanSize - 10, laserY), laserPaint);
  }

  @override
  bool shouldRepaint(covariant _ScannerHolePainter oldDelegate) {
    return oldDelegate.laserProgress != laserProgress;
  }
}
