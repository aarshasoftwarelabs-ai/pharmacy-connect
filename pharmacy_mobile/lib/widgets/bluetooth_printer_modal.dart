import 'package:flutter/material.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import '../core/constants/app_colors.dart';
import '../core/services/thermal_printer_service.dart';

class BluetoothPrinterModal extends StatefulWidget {
  final Map<String, dynamic>? autoPrintBill;
  final String storeName;

  const BluetoothPrinterModal({
    super.key,
    this.autoPrintBill,
    this.storeName = 'DavaSetu Medicals',
  });

  static Future<void> show(
    BuildContext context, {
    Map<String, dynamic>? autoPrintBill,
    String storeName = 'DavaSetu Medicals',
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BluetoothPrinterModal(
        autoPrintBill: autoPrintBill,
        storeName: storeName,
      ),
    );
  }

  @override
  State<BluetoothPrinterModal> createState() => _BluetoothPrinterModalState();
}

class _BluetoothPrinterModalState extends State<BluetoothPrinterModal> {
  final _service = ThermalPrinterService.instance;
  List<BluetoothInfo> _printers = [];
  String? _savedMac;
  String? _savedName;
  String _paperSize = '58mm';
  bool _isLoading = true;
  bool _isConnecting = false;
  bool _isTesting = false;
  String? _statusMessage;
  bool _statusIsError = false;

  @override
  void initState() {
    super.initState();
    _loadPrinters();
  }

  Future<void> _loadPrinters() async {
    setState(() {
      _isLoading = true;
      _statusMessage = null;
    });

    final savedMac = await _service.getSavedPrinterMac();
    final savedName = await _service.getSavedPrinterName();
    final paperSize = await _service.getPaperSize();
    final list = await _service.getPairedPrinters();

    if (mounted) {
      setState(() {
        _savedMac = savedMac;
        _savedName = savedName;
        _paperSize = paperSize;
        _printers = list;
        _isLoading = false;
      });
    }
  }

  Future<void> _connectAndSave(BluetoothInfo printer) async {
    setState(() {
      _isConnecting = true;
      _statusMessage = 'Connecting to ${printer.name}...';
      _statusIsError = false;
    });

    final ok = await _service.connect(printer.macAdress);

    if (mounted) {
      if (ok) {
        await _service.saveDefaultPrinter(printer.macAdress, printer.name);
        setState(() {
          _savedMac = printer.macAdress;
          _savedName = printer.name;
          _isConnecting = false;
          _statusMessage = 'Connected to ${printer.name}!';
          _statusIsError = false;
        });

        // If a bill was queued for print, print it now
        if (widget.autoPrintBill != null) {
          _printBill(widget.autoPrintBill!);
        }
      } else {
        setState(() {
          _isConnecting = false;
          _statusMessage = 'Failed to connect. Ensure printer is ON & in range.';
          _statusIsError = true;
        });
      }
    }
  }

  Future<void> _printBill(Map<String, dynamic> bill) async {
    setState(() {
      _statusMessage = 'Sending receipt to printer...';
      _statusIsError = false;
    });

    final ok = await _service.printViaBluetooth(
      billData: bill,
      storeName: widget.storeName,
    );

    if (mounted) {
      if (ok) {
        setState(() {
          _statusMessage = 'Receipt printed successfully!';
          _statusIsError = false;
        });
        Future.delayed(const Duration(milliseconds: 1400), () {
          if (mounted) Navigator.pop(context, true);
        });
      } else {
        setState(() {
          _statusMessage = 'Printing failed. Check printer paper & connection.';
          _statusIsError = true;
        });
      }
    }
  }

  Future<void> _testPrint() async {
    setState(() {
      _isTesting = true;
      _statusMessage = 'Printing test slip...';
      _statusIsError = false;
    });

    final ok = await _service.printTestSlip(
      storeName: widget.storeName,
    );

    if (mounted) {
      setState(() {
        _isTesting = false;
        if (ok) {
          _statusMessage = 'Test slip printed successfully!';
          _statusIsError = false;
        } else {
          _statusMessage = 'Test print failed. Tap a printer below to reconnect.';
          _statusIsError = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 12,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag Handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header Row
            Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFDBEAFE)),
                  ),
                  child: const Icon(Icons.print_rounded, color: Color(0xFF2563EB), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Thermal Receipt Printer',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryDark,
                          letterSpacing: -0.3,
                        ),
                      ),
                      Text(
                        _savedName != null ? 'Connected: $_savedName' : 'Connect 58mm / 80mm Bluetooth printer',
                        style: TextStyle(
                          fontSize: 12,
                          color: _savedName != null ? const Color(0xFF15803D) : AppColors.textMuted,
                          fontWeight: _savedName != null ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: _loadPrinters,
                  icon: const Icon(Icons.refresh_rounded, size: 20, color: AppColors.textSecondary),
                  tooltip: 'Refresh devices',
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Paper Roll Size Selector (58mm vs 80mm)
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () async {
                        setState(() => _paperSize = '58mm');
                        await _service.savePaperSize('58mm');
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _paperSize == '58mm' ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _paperSize == '58mm'
                              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))]
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            '58mm (2-inch Mini)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _paperSize == '58mm' ? FontWeight.w800 : FontWeight.w600,
                              color: _paperSize == '58mm' ? AppColors.primaryDark : AppColors.textMuted,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () async {
                        setState(() => _paperSize = '80mm');
                        await _service.savePaperSize('80mm');
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _paperSize == '80mm' ? Colors.white : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _paperSize == '80mm'
                              ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))]
                              : null,
                        ),
                        child: Center(
                          child: Text(
                            '80mm (3-inch Standard)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: _paperSize == '80mm' ? FontWeight.w800 : FontWeight.w600,
                              color: _paperSize == '80mm' ? AppColors.primaryDark : AppColors.textMuted,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            if (_statusMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: _statusIsError ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: _statusIsError ? const Color(0xFFFCA5A5) : const Color(0xFFA7F3D0),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _statusIsError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
                      size: 16,
                      color: _statusIsError ? const Color(0xFFDC2626) : const Color(0xFF059669),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _statusMessage!,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _statusIsError ? const Color(0xFFB91C1C) : const Color(0xFF047857),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 14),

            const Text(
              'PAIRED BLUETOOTH PRINTERS',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.textMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),

            // Devices list
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                ),
              )
            else if (_printers.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.bluetooth_searching_rounded, size: 32, color: AppColors.textMuted),
                    const SizedBox(height: 8),
                    const Text(
                      'No Paired Bluetooth Printers Found',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Turn on your thermal printer and pair it first in your phone\'s Bluetooth Settings (PIN is usually 0000 or 1234).',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary, height: 1.3),
                    ),
                  ],
                ),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 200),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _printers.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (ctx, idx) {
                    final p = _printers[idx];
                    final isSelected = p.macAdress == _savedMac;

                    return InkWell(
                      onTap: _isConnecting ? null : () => _connectAndSave(p),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.bluetooth_rounded,
                              size: 20,
                              color: isSelected ? const Color(0xFF16A34A) : AppColors.textSecondary,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p.name.isNotEmpty ? p.name : 'Thermal POS Printer',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: isSelected ? const Color(0xFF14532D) : AppColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    p.macAdress,
                                    style: const TextStyle(fontSize: 10.5, color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'DEFAULT',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF15803D)),
                                ),
                              )
                            else
                              const Text(
                                'Tap to Connect',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

            const SizedBox(height: 18),

            // Bottom Actions: Test Print & PDF Fallback
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isTesting ? null : _testPrint,
                    icon: _isTesting
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.receipt_long_rounded, size: 16),
                    label: const Text('Test Slip'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      if (widget.autoPrintBill != null) {
                        _service.printViaPdf(
                          context,
                          billData: widget.autoPrintBill!,
                          storeName: widget.storeName,
                        );
                      }
                    },
                    icon: const Icon(Icons.picture_as_pdf_rounded, size: 16),
                    label: const Text('System Print / PDF'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryDark,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
