import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/medicine_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';
import '../../core/services/barcode_medicine_service.dart';
import '../auth/login_screen.dart';
import '../navigation/main_nav_screen.dart';

enum StaffScannerMode { billing, stockInward }

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

  void _handleScannedBarcode(String code) {
    final inventory = context.read<InventoryProvider>();
    final medicine = inventory.findByBarcode(code);

    if (_currentMode == StaffScannerMode.billing) {
      if (medicine != null) {
        _showAddToCartSheet(medicine);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.error,
            duration: const Duration(seconds: 3),
            content: Text('No medicine found for barcode: $code'),
            action: SnackBarAction(
              label: 'Add to Stock',
              textColor: Colors.white,
              onPressed: () {
                setState(() => _currentMode = StaffScannerMode.stockInward);
                _showNewMedicineSheet(code);
              },
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
            final maxQty = medicine.stock > 0 ? medicine.stock : 1;

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
                      onPressed: isOutOfStock
                          ? null
                          : () {
                              final billing = context.read<BillingProvider>();
                              for (int i = 0; i < quantity; i++) {
                                billing.addToCart(medicine);
                              }
                              Navigator.pop(ctx);
                              HapticFeedback.lightImpact();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  backgroundColor: AppColors.success,
                                  duration: const Duration(milliseconds: 900),
                                  content: Text('Added $quantity x ${medicine.name} to Bill'),
                                ),
                              );
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
                      label: Text(
                        isOutOfStock ? 'Cannot Add (Out of Stock)' : 'Add to Bill (${_currency.format(medicine.sellingPrice * quantity)})',
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
                    backgroundColor: _currentMode == StaffScannerMode.billing ? AppColors.primary : Colors.deepOrange,
                    child: Icon(
                      _currentMode == StaffScannerMode.billing ? Icons.point_of_sale_rounded : Icons.inventory_2_rounded,
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
                    : '📦 Point camera at medicine box to update stock or add new item',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ),

          // 5. Mode Switcher (Billing vs Stock Inward)
          Positioned(
            bottom: billing.itemCount > 0 && _currentMode == StaffScannerMode.billing ? 96 : 30,
            left: 20,
            right: 20,
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
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _currentMode == StaffScannerMode.billing ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.shopping_cart_checkout_rounded,
                              size: 18,
                              color: _currentMode == StaffScannerMode.billing ? Colors.white : Colors.white70,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Billing Mode (વેચાણ)',
                              style: TextStyle(
                                color: _currentMode == StaffScannerMode.billing ? Colors.white : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
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
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _currentMode == StaffScannerMode.stockInward ? Colors.deepOrange : Colors.transparent,
                          borderRadius: BorderRadius.circular(26),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inventory_2_rounded,
                              size: 18,
                              color: _currentMode == StaffScannerMode.stockInward ? Colors.white : Colors.white70,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Stock Inward (નવો માલ)',
                              style: TextStyle(
                                color: _currentMode == StaffScannerMode.stockInward ? Colors.white : Colors.white70,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
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
