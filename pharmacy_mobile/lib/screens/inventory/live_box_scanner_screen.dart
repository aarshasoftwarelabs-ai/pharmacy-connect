import 'dart:async';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/services/medicine_box_ocr_service.dart';
import '../../providers/auth_provider.dart';

/// Live-action camera scanner for medicine boxes and strips without barcodes.
/// Continuously reads frames from the live camera preview and auto-fills details.
class LiveBoxScannerScreen extends StatefulWidget {
  const LiveBoxScannerScreen({super.key});

  static Future<BoxOcrResult?> scan(BuildContext context) {
    return Navigator.push<BoxOcrResult?>(
      context,
      MaterialPageRoute(builder: (_) => const LiveBoxScannerScreen()),
    );
  }

  @override
  State<LiveBoxScannerScreen> createState() => _LiveBoxScannerScreenState();
}

class _LiveBoxScannerScreenState extends State<LiveBoxScannerScreen>
    with SingleTickerProviderStateMixin {
  CameraController? _controller;
  late final AnimationController _laserCtrl;
  late final Animation<double> _laserAnim;

  bool _isInitialized = false;
  String? _cameraError;
  bool _isTorchOn = false;
  bool _isScanningFrame = false;
  bool _isLocked = false;
  bool _disposed = false;
  int _scanCount = 0;

  BoxOcrResult? _accumulated;

  @override
  void initState() {
    super.initState();
    _laserCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _laserAnim = Tween<double>(begin: 0.08, end: 0.92).animate(
      CurvedAnimation(parent: _laserCtrl, curve: Curves.easeInOut),
    );
    _initCamera();
  }

  @override
  void dispose() {
    _disposed = true;
    _laserCtrl.dispose();
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      if (_disposed) return;
      if (cameras.isEmpty) {
        setState(() => _cameraError = 'No camera detected on this device.');
        return;
      }

      final backCam = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      final ctrl = CameraController(
        backCam,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await ctrl.initialize();
      if (_disposed) {
        await ctrl.dispose();
        return;
      }

      try {
        await ctrl.setFocusMode(FocusMode.auto);
      } catch (_) {}

      setState(() {
        _controller = ctrl;
        _isInitialized = true;
      });

      _runLiveScanLoop();
    } catch (e) {
      if (!_disposed && mounted) {
        setState(() {
          _cameraError = 'Camera permission is required for live scanning.';
        });
      }
    }
  }

  bool _isCompleteLock(BoxOcrResult r) {
    final hasBatch = r.batchNumber != null && r.batchNumber!.trim().isNotEmpty;
    final hasExpiry = (r.rawExpiry != null && r.rawExpiry!.trim().isNotEmpty) ||
        (r.expiryDate != null && r.expiryDate!.trim().isNotEmpty);
    final hasMrp = r.mrp > 0;
    return (hasBatch && (hasExpiry || hasMrp)) ||
        (r.medicineName != null && r.medicineName!.trim().isNotEmpty && hasExpiry && hasMrp);
  }

  Future<void> _runLiveScanLoop() async {
    await Future.delayed(const Duration(milliseconds: 450));
    while (!_disposed && !_isLocked && mounted) {
      await _captureAndAnalyzeFrame();
      if (_disposed || _isLocked || !mounted) break;
      await Future.delayed(const Duration(milliseconds: 950));
    }
  }

  Future<void> _captureAndAnalyzeFrame() async {
    final ctrl = _controller;
    if (_disposed ||
        _isLocked ||
        _isScanningFrame ||
        ctrl == null ||
        !ctrl.value.isInitialized ||
        ctrl.value.isTakingPicture) {
      return;
    }

    _isScanningFrame = true;
    if (mounted) setState(() {});

    String? tempPath;
    try {
      final XFile shot = await ctrl.takePicture();
      tempPath = shot.path;
      if (_disposed || !mounted) return;

      final auth = context.read<AuthProvider>();
      final frameRes = await MedicineBoxOcrService.scanLiveCameraFrame(
        imagePath: tempPath,
        pharmacyId: auth.pharmacyId,
      );
      if (_disposed || !mounted) return;

      _scanCount++;
      if (frameRes.hasRealData) {
        final merged = _accumulated == null
            ? frameRes
            : MedicineBoxOcrService.mergeOcrResults(frameRes, _accumulated!);
        setState(() {
          _accumulated = merged;
        });

        if (_isCompleteLock(merged)) {
          _finishWithResult(merged);
        }
      }
    } catch (_) {
      // Ignore transient capture focus frames cleanly
    } finally {
      if (tempPath != null) {
        File(tempPath).delete().catchError((_) => File(tempPath!));
      }
      _isScanningFrame = false;
      if (!_disposed && mounted) setState(() {});
    }
  }

  void _finishWithResult(BoxOcrResult result) {
    if (_isLocked || _disposed || !mounted) return;
    _isLocked = true;
    HapticFeedback.mediumImpact();
    SystemSound.play(SystemSoundType.click);
    setState(() {});

    Future.delayed(const Duration(milliseconds: 350), () {
      if (mounted) {
        Navigator.pop(context, result);
      }
    });
  }

  Future<void> _toggleTorch() async {
    final ctrl = _controller;
    if (ctrl == null || !ctrl.value.isInitialized) return;
    try {
      final next = !_isTorchOn;
      await ctrl.setFlashMode(next ? FlashMode.torch : FlashMode.off);
      if (mounted) setState(() => _isTorchOn = next);
    } catch (_) {}
  }

  List<String> _buildDetectedChips(BoxOcrResult? res) {
    if (res == null) return [];
    final chips = <String>[];
    if (res.medicineName != null && res.medicineName!.trim().isNotEmpty) {
      chips.add('Name: ${res.medicineName}');
    }
    if (res.batchNumber != null && res.batchNumber!.trim().isNotEmpty) {
      chips.add('Batch: ${res.batchNumber}');
    }
    if (res.mfgDate != null && res.mfgDate!.trim().isNotEmpty) {
      chips.add('Mfg: ${res.mfgDate}');
    }
    final exp = res.rawExpiry ?? res.expiryDate;
    if (exp != null && exp.trim().isNotEmpty) {
      chips.add('Exp: $exp');
    }
    if (res.mrp > 0) {
      chips.add('MRP: ₹${res.mrp.toStringAsFixed(2)}');
    }
    return chips;
  }

  @override
  Widget build(BuildContext context) {
    final chips = _buildDetectedChips(_accumulated);
    final screenW = MediaQuery.of(context).size.width;
    final boxW = screenW * 0.84;
    final boxH = boxW * 0.62;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_cameraError != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.videocam_off_rounded, color: Colors.white70, size: 52),
                    const SizedBox(height: 14),
                    Text(
                      _cameraError!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 15),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Go Back'),
                    ),
                  ],
                ),
              ),
            )
          else if (!_isInitialized || _controller == null)
            const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Color(0xFF10B981)),
                  SizedBox(height: 12),
                  Text(
                    'Starting Live Scanner...',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            )
          else
            Center(child: CameraPreview(_controller!)),

          // Dark cutout overlay with horizontal rectangular scan window & animated laser
          IgnorePointer(
            child: AnimatedBuilder(
              animation: _laserAnim,
              builder: (context, _) => CustomPaint(
                painter: _BoxViewfinderPainter(
                  boxWidth: boxW,
                  boxHeight: boxH,
                  laserProgress: _laserAnim.value,
                  isLocked: _isLocked,
                ),
                size: Size.infinite,
              ),
            ),
          ),

          // Top bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context, _accumulated),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                  style: IconButton.styleFrom(backgroundColor: Colors.black54),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Live Medicine Scanner',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Point at Batch, Mfg, Exp & MRP — auto-fills live',
                        style: TextStyle(color: Colors.white70, fontSize: 11.5),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: _toggleTorch,
                  icon: Icon(
                    _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                    color: _isTorchOn ? Colors.amber : Colors.white,
                  ),
                  style: IconButton.styleFrom(backgroundColor: Colors.black54),
                ),
              ],
            ),
          ),

          // Bottom live detected status & actions
          Positioned(
            left: 16,
            right: 16,
            bottom: MediaQuery.of(context).padding.bottom + 18,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _isLocked ? const Color(0xFF22C55E) : Colors.white24,
                  width: 1.5,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _isLocked
                              ? const Color(0xFF22C55E)
                              : (_isScanningFrame ? Colors.amber : const Color(0xFF10B981)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _isLocked
                              ? 'Details Locked! Filling form...'
                              : (_isScanningFrame
                                  ? 'Reading medicine text live...'
                                  : (_scanCount == 0
                                      ? 'Hold steady over Batch / Exp / MRP...'
                                      : 'Auto-scanning... rotate box to add Name or Batch')),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (chips.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: chips
                          .map(
                            (c) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFF065F46),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFF34D399)),
                              ),
                              child: Text(
                                c,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isScanningFrame ? null : _captureAndAnalyzeFrame,
                          icon: const Icon(Icons.center_focus_strong_rounded, size: 17),
                          label: const Text('Scan Now', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white38),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      if (_accumulated != null && _accumulated!.hasRealData) ...[
                        const SizedBox(width: 10),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton.icon(
                            onPressed: () => _finishWithResult(_accumulated!),
                            icon: const Icon(Icons.check_circle_rounded, size: 18),
                            label: const Text(
                              'Use Detected Data',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 11),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BoxViewfinderPainter extends CustomPainter {
  final double boxWidth;
  final double boxHeight;
  final double laserProgress;
  final bool isLocked;

  _BoxViewfinderPainter({
    required this.boxWidth,
    required this.boxHeight,
    required this.laserProgress,
    required this.isLocked,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final left = (size.width - boxWidth) / 2;
    final top = (size.height - boxHeight) * 0.42;
    final rect = Rect.fromLTWH(left, top, boxWidth, boxHeight);

    final bgPaint = Paint()..color = Colors.black.withValues(alpha: 0.48);
    final maskPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(rect, const Radius.circular(18)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(maskPath, bgPaint);

    final accent = isLocked ? const Color(0xFF22C55E) : const Color(0xFF10B981);
    final cornerPaint = Paint()
      ..color = accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;

    const cLen = 26.0;
    // Top-left
    canvas.drawLine(Offset(left, top + cLen), Offset(left, top), cornerPaint);
    canvas.drawLine(Offset(left, top), Offset(left + cLen, top), cornerPaint);
    // Top-right
    canvas.drawLine(Offset(left + boxWidth - cLen, top), Offset(left + boxWidth, top), cornerPaint);
    canvas.drawLine(Offset(left + boxWidth, top), Offset(left + boxWidth, top + cLen), cornerPaint);
    // Bottom-left
    canvas.drawLine(Offset(left, top + boxHeight - cLen), Offset(left, top + boxHeight), cornerPaint);
    canvas.drawLine(Offset(left, top + boxHeight), Offset(left + cLen, top + boxHeight), cornerPaint);
    // Bottom-right
    canvas.drawLine(Offset(left + boxWidth - cLen, top + boxHeight), Offset(left + boxWidth, top + boxHeight), cornerPaint);
    canvas.drawLine(Offset(left + boxWidth, top + boxHeight - cLen), Offset(left + boxWidth, top + boxHeight), cornerPaint);

    final laserY = top + (boxHeight * laserProgress);
    final laserPaint = Paint()
      ..strokeWidth = 2.5
      ..shader = LinearGradient(
        colors: [Colors.transparent, accent, Colors.transparent],
      ).createShader(Rect.fromLTWH(left, laserY, boxWidth, 3));
    canvas.drawLine(Offset(left + 12, laserY), Offset(left + boxWidth - 12, laserY), laserPaint);
  }

  @override
  bool shouldRepaint(covariant _BoxViewfinderPainter oldDelegate) {
    return oldDelegate.laserProgress != laserProgress || oldDelegate.isLocked != isLocked;
  }
}
