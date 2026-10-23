import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class ThermalPrinterService {
  ThermalPrinterService._();
  static final ThermalPrinterService instance = ThermalPrinterService._();

  static const String _keyPrinterMac = 'default_bluetooth_printer_mac';
  static const String _keyPrinterName = 'default_bluetooth_printer_name';
  static const String _keyPaperSize = 'thermal_paper_size'; // '58mm' or '80mm'

  final NumberFormat _currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs.', decimalDigits: 2);

  /// Check whether Bluetooth permissions are granted on the phone
  Future<bool> checkPermissions() async {
    try {
      return await PrintBluetoothThermal.isPermissionBluetoothGranted;
    } catch (_) {
      return false;
    }
  }

  /// Check whether Bluetooth is physically switched on
  Future<bool> isBluetoothEnabled() async {
    try {
      return await PrintBluetoothThermal.bluetoothEnabled;
    } catch (_) {
      return false;
    }
  }

  /// Check active connection status with printer
  Future<bool> isConnected() async {
    try {
      return await PrintBluetoothThermal.connectionStatus;
    } catch (_) {
      return false;
    }
  }

  /// Get list of paired Bluetooth thermal printers
  Future<List<BluetoothInfo>> getPairedPrinters() async {
    try {
      final List<BluetoothInfo> list = await PrintBluetoothThermal.pairedBluetooths;
      return list;
    } catch (e) {
      debugPrint('[ThermalPrinterService] Error getting paired printers: $e');
      return [];
    }
  }

  /// Connect to a Bluetooth printer by MAC address
  Future<bool> connect(String macAddress) async {
    try {
      final isConn = await isConnected();
      if (isConn) {
        await disconnect();
      }
      final bool result = await PrintBluetoothThermal.connect(macPrinterAddress: macAddress);
      return result;
    } catch (e) {
      debugPrint('[ThermalPrinterService] Connect error: $e');
      return false;
    }
  }

  /// Disconnect current printer
  Future<bool> disconnect() async {
    try {
      return await PrintBluetoothThermal.disconnect;
    } catch (_) {
      return false;
    }
  }

  /// Get saved default printer MAC
  Future<String?> getSavedPrinterMac() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyPrinterMac);
  }

  /// Get saved default printer Name
  Future<String?> getSavedPrinterName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyPrinterName);
  }

  /// Save default printer
  Future<void> saveDefaultPrinter(String mac, String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPrinterMac, mac);
    await prefs.setString(_keyPrinterName, name);
  }

  /// Clear saved default printer
  Future<void> clearDefaultPrinter() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPrinterMac);
    await prefs.remove(_keyPrinterName);
  }

  /// Get configured roll paper size ('58mm' or '80mm')
  Future<String> getPaperSize() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyPaperSize) ?? '58mm';
  }

  /// Save paper size ('58mm' or '80mm')
  Future<void> savePaperSize(String size) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPaperSize, size);
  }

  /// Generate ESC/POS byte sequence for thermal receipt
  Future<List<int>> generateEscPosTicket({
    required Map<String, dynamic> billData,
    required String storeName,
    String? ownerName,
    String? gstin,
    String? dlNo,
    String? phone,
    String? address,
    String paperSize = '58mm',
  }) async {
    final profile = await CapabilityProfile.load();
    final is58 = paperSize == '58mm';
    final generator = Generator(is58 ? PaperSize.mm58 : PaperSize.mm80, profile);
    List<int> bytes = [];

    // Header: Store Name
    bytes += generator.reset();
    bytes += generator.text(
      storeName.toUpperCase(),
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );

    if (ownerName != null && ownerName.isNotEmpty) {
      bytes += generator.text('Prop: $ownerName', styles: const PosStyles(align: PosAlign.center));
    }
    if (address != null && address.isNotEmpty) {
      bytes += generator.text(address, styles: const PosStyles(align: PosAlign.center));
    }
    if (phone != null && phone.isNotEmpty) {
      bytes += generator.text('Ph: $phone', styles: const PosStyles(align: PosAlign.center));
    }
    if (gstin != null && gstin.isNotEmpty) {
      bytes += generator.text('GSTIN: $gstin', styles: const PosStyles(align: PosAlign.center));
    }
    if (dlNo != null && dlNo.isNotEmpty) {
      bytes += generator.text('D.L. No: $dlNo', styles: const PosStyles(align: PosAlign.center));
    }

    bytes += generator.hr(ch: '=');
    bytes += generator.text(
      is58 ? 'RETAIL PHARMACY SLIP' : 'RETAIL TAX INVOICE',
      styles: const PosStyles(align: PosAlign.center, bold: true),
    );
    bytes += generator.hr(ch: '-');

    // Bill metadata
    final billNo = billData['bill_number'] ?? billData['billNumber'] ?? 'POS-${DateTime.now().millisecondsSinceEpoch % 10000}';
    final dateStr = billData['date'] ?? DateFormat('dd/MM/yyyy hh:mm a').format(DateTime.now());
    final customerName = billData['customer_name'] ?? billData['customerName'] ?? 'Walk-in Customer';
    final customerPhone = billData['customer_phone'] ?? billData['customerPhone'] ?? '';

    bytes += generator.row([
      PosColumn(text: 'Bill: $billNo', width: 6, styles: const PosStyles(bold: true)),
      PosColumn(text: dateStr, width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]);

    bytes += generator.text('Customer: $customerName');
    if (customerPhone.isNotEmpty) {
      bytes += generator.text('Phone: $customerPhone');
    }
    bytes += generator.hr(ch: '-');

    // Items list header
    if (is58) {
      bytes += generator.row([
        PosColumn(text: 'ITEM', width: 7, styles: const PosStyles(bold: true)),
        PosColumn(text: 'QTY', width: 2, styles: const PosStyles(align: PosAlign.center, bold: true)),
        PosColumn(text: 'AMT', width: 3, styles: const PosStyles(align: PosAlign.right, bold: true)),
      ]);
    } else {
      bytes += generator.row([
        PosColumn(text: 'ITEM NAME', width: 5, styles: const PosStyles(bold: true)),
        PosColumn(text: 'QTY', width: 2, styles: const PosStyles(align: PosAlign.center, bold: true)),
        PosColumn(text: 'RATE', width: 2, styles: const PosStyles(align: PosAlign.right, bold: true)),
        PosColumn(text: 'AMOUNT', width: 3, styles: const PosStyles(align: PosAlign.right, bold: true)),
      ]);
    }
    bytes += generator.hr(ch: '-');

    // Items content
    final List items = (billData['items'] as List?) ?? [];
    double subtotal = 0.0;

    for (final item in items) {
      final name = (item['medicine_name'] ?? item['medicineName'] ?? item['name'] ?? 'Medicine').toString();
      final qty = (item['quantity'] ?? item['qty'] ?? 1).toString();
      final price = double.tryParse((item['price'] ?? item['unit_price'] ?? item['unitPrice'] ?? 0).toString()) ?? 0.0;
      final lineTotal = double.tryParse((item['total'] ?? item['line_total'] ?? item['lineTotal'] ?? 0).toString()) ?? (price * (int.tryParse(qty) ?? 1));
      subtotal += lineTotal;

      if (is58) {
        bytes += generator.row([
          PosColumn(text: name, width: 7),
          PosColumn(text: qty, width: 2, styles: const PosStyles(align: PosAlign.center)),
          PosColumn(text: lineTotal.toStringAsFixed(1), width: 3, styles: const PosStyles(align: PosAlign.right)),
        ]);
      } else {
        bytes += generator.row([
          PosColumn(text: name, width: 5),
          PosColumn(text: qty, width: 2, styles: const PosStyles(align: PosAlign.center)),
          PosColumn(text: price.toStringAsFixed(1), width: 2, styles: const PosStyles(align: PosAlign.right)),
          PosColumn(text: lineTotal.toStringAsFixed(2), width: 3, styles: const PosStyles(align: PosAlign.right)),
        ]);
      }
    }

    if (items.isEmpty && billData['items_summary'] != null) {
      bytes += generator.text((billData['items_summary'] as String).replaceAll('*', ''));
    }

    bytes += generator.hr(ch: '-');

    // Totals
    final discount = double.tryParse((billData['discount'] ?? 0).toString()) ?? 0.0;
    final total = double.tryParse((billData['total'] ?? billData['total_amount'] ?? subtotal).toString()) ?? subtotal;
    final paymentMode = billData['payment_mode'] ?? billData['paymentMode'] ?? 'CASH';

    bytes += generator.row([
      PosColumn(text: 'Subtotal:', width: 7),
      PosColumn(text: 'Rs.${subtotal.toStringAsFixed(2)}', width: 5, styles: const PosStyles(align: PosAlign.right)),
    ]);

    if (discount > 0) {
      bytes += generator.row([
        PosColumn(text: 'Discount:', width: 7),
        PosColumn(text: '-Rs.${discount.toStringAsFixed(2)}', width: 5, styles: const PosStyles(align: PosAlign.right)),
      ]);
    }

    bytes += generator.hr(ch: '=');

    // Grand Total in Bold Double
    bytes += generator.row([
      PosColumn(
        text: 'GRAND TOTAL:',
        width: 6,
        styles: const PosStyles(bold: true, height: PosTextSize.size2),
      ),
      PosColumn(
        text: 'Rs.${total.toStringAsFixed(2)}',
        width: 6,
        styles: const PosStyles(bold: true, align: PosAlign.right, height: PosTextSize.size2),
      ),
    ]);

    bytes += generator.hr(ch: '-');
    bytes += generator.text('Payment: $paymentMode', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.feed(1);

    // Footer
    bytes += generator.text('Wish you a speedy recovery!', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('Thank you for choosing us!', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('Powered by DavaSetu Pharmacy', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.feed(2);
    bytes += generator.cut();

    return bytes;
  }

  /// Print directly to a Bluetooth thermal printer
  Future<bool> printViaBluetooth({
    required Map<String, dynamic> billData,
    required String storeName,
    String? ownerName,
    String? gstin,
    String? dlNo,
    String? phone,
    String? address,
    String? targetMac,
  }) async {
    try {
      final mac = targetMac ?? await getSavedPrinterMac();
      if (mac == null || mac.isEmpty) {
        return false;
      }

      // Check / establish connection
      bool isConnectedStatus = await isConnected();
      if (!isConnectedStatus) {
        final ok = await connect(mac);
        if (!ok) return false;
      }

      final paperSize = await getPaperSize();
      final bytes = await generateEscPosTicket(
        billData: billData,
        storeName: storeName,
        ownerName: ownerName,
        gstin: gstin,
        dlNo: dlNo,
        phone: phone,
        address: address,
        paperSize: paperSize,
      );

      final bool success = await PrintBluetoothThermal.writeBytes(bytes);
      return success;
    } catch (e) {
      debugPrint('[ThermalPrinterService] Print error: $e');
      return false;
    }
  }

  /// Print test slip to verify hardware connection
  Future<bool> printTestSlip({String? targetMac, String storeName = 'DavaSetu Medicals'}) async {
    final dummyBill = {
      'bill_number': 'TEST-${DateTime.now().millisecondsSinceEpoch % 1000}',
      'date': DateFormat('dd/MM/yyyy hh:mm a').format(DateTime.now()),
      'customer_name': 'Hardware Test Slip',
      'customer_phone': '9876543210',
      'items': [
        {'name': 'Dolo 650mg Tab', 'qty': 2, 'price': 30.0, 'total': 60.0},
        {'name': 'Azithral 500mg', 'qty': 1, 'price': 120.0, 'total': 120.0},
      ],
      'discount': 0.0,
      'total': 180.0,
      'payment_mode': 'CASH',
    };

    return await printViaBluetooth(
      billData: dummyBill,
      storeName: storeName,
      targetMac: targetMac,
    );
  }

  /// Fallback: Print or save thermal receipt as standard PDF / Android Print Spooler
  Future<void> printViaPdf(
    BuildContext context, {
    required Map<String, dynamic> billData,
    required String storeName,
    String? ownerName,
    String? gstin,
    String? dlNo,
    String? phone,
    String? address,
  }) async {
    final paperSize = await getPaperSize();
    final is58 = paperSize == '58mm';
    final rollWidth = is58 ? 58.0 * PdfPageFormat.mm : 80.0 * PdfPageFormat.mm;

    final doc = pw.Document();

    final billNo = billData['bill_number'] ?? billData['billNumber'] ?? 'POS-${DateTime.now().millisecondsSinceEpoch % 10000}';
    final dateStr = billData['date'] ?? DateFormat('dd/MM/yyyy hh:mm a').format(DateTime.now());
    final customerName = billData['customer_name'] ?? billData['customerName'] ?? 'Walk-in Customer';
    final customerPhone = billData['customer_phone'] ?? billData['customerPhone'] ?? '';
    final List items = (billData['items'] as List?) ?? [];
    final discount = double.tryParse((billData['discount'] ?? 0).toString()) ?? 0.0;
    final total = double.tryParse((billData['total'] ?? billData['total_amount'] ?? 0).toString()) ?? 0.0;
    final paymentMode = billData['payment_mode'] ?? billData['paymentMode'] ?? 'CASH';

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat(rollWidth, double.infinity, marginAll: 3 * PdfPageFormat.mm),
        build: (pw.Context ctx) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.Text(
                storeName.toUpperCase(),
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13),
                textAlign: pw.TextAlign.center,
              ),
              if (address != null && address.isNotEmpty)
                pw.Text(address, style: const pw.TextStyle(fontSize: 8), textAlign: pw.TextAlign.center),
              if (phone != null && phone.isNotEmpty)
                pw.Text('Ph: $phone', style: const pw.TextStyle(fontSize: 8)),
              if (gstin != null && gstin.isNotEmpty)
                pw.Text('GSTIN: $gstin', style: const pw.TextStyle(fontSize: 8)),
              if (dlNo != null && dlNo.isNotEmpty)
                pw.Text('D.L. No: $dlNo', style: const pw.TextStyle(fontSize: 8)),
              pw.Divider(thickness: 1, height: 8),
              pw.Text(
                is58 ? 'RETAIL PHARMACY SLIP' : 'RETAIL TAX INVOICE',
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9),
              ),
              pw.Divider(thickness: 0.5, height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Bill: $billNo', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8)),
                  pw.Text(dateStr, style: const pw.TextStyle(fontSize: 8)),
                ],
              ),
              pw.Align(
                alignment: pw.Alignment.centerLeft,
                child: pw.Text('Customer: $customerName', style: const pw.TextStyle(fontSize: 8)),
              ),
              if (customerPhone.isNotEmpty)
                pw.Align(
                  alignment: pw.Alignment.centerLeft,
                  child: pw.Text('Phone: $customerPhone', style: const pw.TextStyle(fontSize: 8)),
                ),
              pw.Divider(thickness: 0.5, height: 6),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Expanded(flex: 5, child: pw.Text('ITEM', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8))),
                  pw.Expanded(flex: 2, child: pw.Text('QTY', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8))),
                  pw.Expanded(flex: 3, child: pw.Text('AMT', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8))),
                ],
              ),
              pw.Divider(thickness: 0.5, height: 4),
              ...items.map((it) {
                final name = (it['medicine_name'] ?? it['medicineName'] ?? it['name'] ?? 'Item').toString();
                final qty = (it['quantity'] ?? it['qty'] ?? 1).toString();
                final amt = double.tryParse((it['total'] ?? it['line_total'] ?? 0).toString()) ?? 0.0;
                return pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 1),
                  child: pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Expanded(flex: 5, child: pw.Text(name, style: const pw.TextStyle(fontSize: 7.5))),
                      pw.Expanded(flex: 2, child: pw.Text(qty, textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 7.5))),
                      pw.Expanded(flex: 3, child: pw.Text('Rs.${amt.toStringAsFixed(1)}', textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 7.5))),
                    ],
                  ),
                );
              }),
              pw.Divider(thickness: 0.5, height: 6),
              if (discount > 0)
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Discount:', style: const pw.TextStyle(fontSize: 8)),
                    pw.Text('-Rs.${discount.toStringAsFixed(2)}', style: const pw.TextStyle(fontSize: 8)),
                  ],
                ),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('TOTAL:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                  pw.Text('Rs.${total.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                ],
              ),
              pw.Divider(thickness: 1, height: 8),
              pw.Text('Payment: $paymentMode', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8)),
              pw.SizedBox(height: 4),
              pw.Text('Wish you a speedy recovery!', style: const pw.TextStyle(fontSize: 7.5)),
              pw.Text('Powered by DavaSetu', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 7.5)),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'Invoice-$billNo.pdf',
    );
  }
}
