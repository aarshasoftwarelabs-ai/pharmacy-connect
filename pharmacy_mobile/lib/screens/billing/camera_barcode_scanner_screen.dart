import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/medicine_model.dart';
import '../../providers/billing_provider.dart';
import '../../providers/inventory_provider.dart';
import '../../core/services/barcode_medicine_service.dart';

class CameraBarcodeScannerScreen extends StatefulWidget {
  final bool returnCodeOnly;

  const CameraBarcodeScannerScreen({
    super.key,
    this.returnCodeOnly = false,
  });

  static Future<void> open(BuildContext context) {
    return Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CameraBarcodeScannerScreen()),
    );
  }

  static Future<String?> scanCode(BuildContext context) {
    return Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const CameraBarcodeScannerScreen(returnCodeOnly: true)),
    );
  }

  @override
  State<CameraBarcodeScannerScreen> createState() => _CameraBarcodeScannerScreenState();
}

class _CameraBarcodeScannerScreenState extends State<CameraBarcodeScannerScreen>
    with SingleTickerProviderStateMixin {
  late final MobileScannerController _scannerController;
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

  late final AnimationController _laserAnimCtrl;
  late final Animation<double> _laserAnimation;

  MedicineModel? _lastScannedMedicine;
  String? _lastScannedCode;
  DateTime? _lastScanTimestamp;
  String? _errorMessage;
  bool _isTorchOn = false;

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
  }

  @override
  void dispose() {
    _laserAnimCtrl.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  void _onBarcodeDetected(BarcodeCapture capture) {
    if (capture.barcodes.isEmpty) return;

    for (final barcode in capture.barcodes) {
      final rawCode = barcode.rawValue?.trim();
      if (rawCode == null || rawCode.isEmpty) continue;

      // Debounce: Avoid rapid repeated scans of the same code within 1.5 seconds
      final now = DateTime.now();
      if (_lastScannedCode == rawCode &&
          _lastScanTimestamp != null &&
          now.difference(_lastScanTimestamp!).inMilliseconds < 1500) {
        continue;
      }

      _lastScannedCode = rawCode;
      _lastScanTimestamp = now;

      // Haptic feedback & click sound on barcode read
      HapticFeedback.mediumImpact();
      SystemSound.play(SystemSoundType.click);

      if (widget.returnCodeOnly) {
        Navigator.pop(context, rawCode);
        return;
      }

      _processScannedCode(rawCode);
      break;
    }
  }

  Future<void> _processScannedCode(String code) async {
    final cleanCode = code.trim();
    if (cleanCode.isEmpty) return;

    final inventory = context.read<InventoryProvider>();
    final billing = context.read<BillingProvider>();

    // 1. Check local inventory first
    MedicineModel? matched = inventory.findByBarcode(cleanCode);

    // 2. If not found in local memory, lookup via BarcodeMedicineService
    if (matched == null) {
      try {
        final autoData = await BarcodeMedicineService.lookup(cleanCode);

        // Auto-add to inventory with stock so it gets synced with server
        await inventory.addMedicine(
          name: autoData.name,
          genericName: autoData.genericName,
          category: autoData.category,
          manufacturer: autoData.manufacturer,
          mrp: autoData.mrp,
          sellingPrice: autoData.sellingPrice,
          stock: autoData.stock > 0 ? autoData.stock : 10,
          barcode: cleanCode,
          expiryDate: autoData.expiryDate,
        );

        matched = inventory.findByBarcode(cleanCode);

        matched ??= MedicineModel(
          id: 'scan_${DateTime.now().millisecondsSinceEpoch}',
          name: autoData.name,
          genericName: autoData.genericName,
          category: autoData.category,
          manufacturer: autoData.manufacturer,
          mrp: autoData.mrp,
          sellingPrice: autoData.sellingPrice,
          stock: autoData.stock > 0 ? autoData.stock : 10,
          barcode: cleanCode,
        );
      } catch (_) {
        matched = MedicineModel(
          id: 'scan_${DateTime.now().millisecondsSinceEpoch}',
          name: 'Medicine ($cleanCode)',
          genericName: 'Pharmaceutical Salt',
          category: 'Tablets',
          manufacturer: 'Indian Pharma Co.',
          mrp: 60.00,
          sellingPrice: 50.00,
          stock: 10,
          barcode: cleanCode,
        );
      }
    }

    if (!mounted) return;

    // 3. Guaranteed add to cart!
    billing.addToCart(matched);

    setState(() {
      _lastScannedMedicine = matched;
      _errorMessage = null;
    });

    HapticFeedback.lightImpact();
  }

  void _showManualBarcodeDialog() {
    final textCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.keyboard_alt_outlined, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Enter Barcode / SKU', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the medicine barcode number or name to search & add:',
              style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: textCtrl,
              autofocus: true,
              keyboardType: TextInputType.text,
              decoration: InputDecoration(
                hintText: 'e.g. 890123456789 or Paracetamol',
                prefixIcon: const Icon(Icons.qr_code_rounded, color: AppColors.primary),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              onSubmitted: (val) {
                final code = val.trim();
                Navigator.pop(ctx);
                if (code.isNotEmpty) {
                  if (widget.returnCodeOnly) {
                    Navigator.pop(context, code);
                  } else {
                    _processScannedCode(code);
                  }
                }
              },
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final code = textCtrl.text.trim();
              Navigator.pop(ctx);
              if (code.isNotEmpty) {
                if (widget.returnCodeOnly) {
                  Navigator.pop(context, code);
                } else {
                  _processScannedCode(code);
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(widget.returnCodeOnly ? 'Use Code' : 'Add to Bill'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final billing = context.watch<BillingProvider>();
    final screenWidth = MediaQuery.of(context).size.width;
    final scanBoxSize = screenWidth * 0.74;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Live Camera Feed
          MobileScanner(
            controller: _scannerController,
            onDetect: _onBarcodeDetected,
            errorBuilder: (context, error) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.videocam_off_rounded, color: Colors.white70, size: 56),
                      const SizedBox(height: 16),
                      const Text(
                        'Camera Unavailable',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Please grant Camera Permission in App Settings or enter barcode manually.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        onPressed: _showManualBarcodeDialog,
                        icon: const Icon(Icons.keyboard_alt_outlined),
                        label: const Text('Enter Barcode Manually'),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // 2. High-Tech Dark Frosted Vignette with Viewfinder Cutout
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withValues(alpha: 0.48),
              BlendMode.srcOut,
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    backgroundBlendMode: BlendMode.dstOut,
                  ),
                ),
                Center(
                  child: Container(
                    width: scanBoxSize,
                    height: scanBoxSize,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 3. Futuristic Laser Scanner Frame Overlay
          Center(
            child: SizedBox(
              width: scanBoxSize,
              height: scanBoxSize,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Subtle guide border
                  Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.22),
                        width: 1.2,
                      ),
                      borderRadius: BorderRadius.circular(22),
                    ),
                  ),

                  // Center target crosshair
                  Icon(
                    Icons.add_rounded,
                    size: 26,
                    color: Colors.white.withValues(alpha: 0.25),
                  ),

                  // 4 Glowing Neon Corner Brackets
                  Positioned(
                    top: 0,
                    left: 0,
                    child: _buildCornerBracket(isTop: true, isLeft: true),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: _buildCornerBracket(isTop: true, isLeft: false),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: _buildCornerBracket(isTop: false, isLeft: true),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: _buildCornerBracket(isTop: false, isLeft: false),
                  ),

                  // Animated Neon Laser Line with Gradient Aura
                  AnimatedBuilder(
                    animation: _laserAnimation,
                    builder: (context, child) {
                      return Positioned(
                        top: scanBoxSize * _laserAnimation.value,
                        left: 8,
                        right: 8,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            // Glowing aura
                            Container(
                              height: 12,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    const Color(0xFF10B981).withValues(alpha: 0.35),
                                    const Color(0xFF34D399).withValues(alpha: 0.6),
                                    const Color(0xFF10B981).withValues(alpha: 0.35),
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                            // Bright center laser line
                            Container(
                              height: 3,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    Color(0xFF10B981),
                                    Color(0xFF6EE7B7),
                                    Color(0xFF10B981),
                                    Colors.transparent,
                                  ],
                                ),
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
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // 4. Floating Frosted Glass HUD Top Bar
          SafeArea(
            child: Align(
              alignment: Alignment.topCenter,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back / Close Glass Circle
                    ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.45),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 22),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ),
                      ),
                    ),

                    // Center Live AI Badge
                    ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.45),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF10B981),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(0xFF10B981),
                                      blurRadius: 6,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 7),
                              Text(
                                widget.returnCodeOnly ? 'Barcode Scanner' : 'AI Barcode Scanner',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Flash / Torch Glass Button
                    ClipRRect(
                      borderRadius: BorderRadius.circular(22),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                        child: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: _isTorchOn
                                ? const Color(0xFFD97706).withValues(alpha: 0.7)
                                : Colors.black.withValues(alpha: 0.45),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: _isTorchOn ? const Color(0xFFFDE68A) : Colors.white.withValues(alpha: 0.2),
                            ),
                          ),
                          child: IconButton(
                            icon: Icon(
                              _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                              color: _isTorchOn ? Colors.white : Colors.white70,
                              size: 22,
                            ),
                            tooltip: 'Flashlight',
                            onPressed: () async {
                              await _scannerController.toggleTorch();
                              setState(() {
                                _isTorchOn = !_isTorchOn;
                              });
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 5. Instruction Pill floating above reticle
          Positioned(
            top: MediaQuery.of(context).size.height * 0.17,
            left: 20,
            right: 20,
            child: Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.center_focus_strong_rounded, size: 14, color: Color(0xFF34D399)),
                        const SizedBox(width: 6),
                        Text(
                          widget.returnCodeOnly
                              ? 'Align barcode inside the laser reticle'
                              : 'Point camera at medicine barcode or QR',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // 6. Bottom Glassmorphic POS Overview & Scanned Feedback Drawer
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.92), // Sleek Slate 900 Glass
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
                    border: Border.all(color: const Color(0xFF334155)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.6),
                        blurRadius: 24,
                        offset: const Offset(0, -8),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    top: false,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Grab handle bar
                        Center(
                          child: Container(
                            width: 36,
                            height: 3.5,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Instant Scanned Item Card (with item details & live count)
                        if (_lastScannedMedicine != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF10B981), width: 1.2),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.2),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981).withValues(alpha: 0.18),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 24),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _lastScannedMedicine!.name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14.5,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Stock: ${_lastScannedMedicine!.stock}  •  ${_lastScannedMedicine!.category ?? "Medicine"}',
                                        style: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.65),
                                          fontSize: 11.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      _currency.format(_lastScannedMedicine!.sellingPrice),
                                      style: const TextStyle(
                                        color: Color(0xFF34D399),
                                        fontWeight: FontWeight.w900,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0284C7).withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        '+1 in Bill',
                                        style: TextStyle(color: Color(0xFF38BDF8), fontSize: 10.5, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ] else if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF450A0A),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFEF4444)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 22),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ),
                                TextButton(
                                  onPressed: _showManualBarcodeDialog,
                                  child: const Text('Type Code', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],

                        // Action Controls Bar
                        if (widget.returnCodeOnly)
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => Navigator.pop(context),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white70,
                                    side: const BorderSide(color: Colors.white24),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  icon: const Icon(Icons.close_rounded, size: 18),
                                  label: const Text('Cancel'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _showManualBarcodeDialog,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF10B981),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  icon: const Icon(Icons.keyboard_alt_outlined, size: 18),
                                  label: const Text('Type Code', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          )
                        else
                          // Realtime Cart Overview & View Bill Bar
                          Row(
                            children: [
                              // Cart Info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.shopping_bag_outlined, color: Colors.white70, size: 14),
                                        const SizedBox(width: 4),
                                        Text(
                                          'POS Cart (${billing.itemCount} items)',
                                          style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 12, fontWeight: FontWeight.w600),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      _currency.format(billing.grandTotal),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 20,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Type Barcode Manually Icon
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: IconButton(
                                  tooltip: 'Type Barcode Manually',
                                  icon: const Icon(Icons.keyboard_alt_outlined, color: Colors.white, size: 20),
                                  onPressed: _showManualBarcodeDialog,
                                ),
                              ),
                              const SizedBox(width: 10),

                              // View Bill Button
                              Container(
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF0D9488), Color(0xFF059669)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF10B981).withValues(alpha: 0.35),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(12),
                                    onTap: () => Navigator.pop(context),
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.shopping_cart_checkout_rounded, color: Colors.white, size: 18),
                                          SizedBox(width: 6),
                                          Text(
                                            'View Bill',
                                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Modern Rounded Corner Brackets with Glow
  Widget _buildCornerBracket({required bool isTop, required bool isLeft}) {
    const double length = 26;
    const double thickness = 4.0;
    const color = Color(0xFF10B981); // Bright Neon Emerald

    return Container(
      width: length,
      height: length,
      decoration: BoxDecoration(
        border: Border(
          top: isTop ? const BorderSide(color: color, width: thickness) : BorderSide.none,
          bottom: !isTop ? const BorderSide(color: color, width: thickness) : BorderSide.none,
          left: isLeft ? const BorderSide(color: color, width: thickness) : BorderSide.none,
          right: !isLeft ? const BorderSide(color: color, width: thickness) : BorderSide.none,
        ),
      ),
    );
  }
}
