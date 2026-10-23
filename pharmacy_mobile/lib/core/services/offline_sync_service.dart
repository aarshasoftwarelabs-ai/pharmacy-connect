import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_endpoints.dart';
import '../api/api_service.dart';
import '../../models/medicine_model.dart';
import 'storage_service.dart';

class OfflineSyncService {
  OfflineSyncService._();
  static final OfflineSyncService instance = OfflineSyncService._();

  static const String _keyQueue = 'offline_bills_queue';
  static const String _keyCachedMedicines = 'offline_cached_medicines';

  final ValueNotifier<int> pendingCountNotifier = ValueNotifier<int>(0);
  bool _isSyncing = false;

  Future<void> init() async {
    final count = await getPendingCount();
    pendingCountNotifier.value = count;
  }

  // --- Catalog Caching ---
  Future<void> cacheMedicines(List<MedicineModel> medicines) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = medicines.map((m) => m.toJson()).toList();
      await prefs.setString(_keyCachedMedicines, jsonEncode(list));
    } catch (e) {
      debugPrint('[OfflineSyncService] Error caching medicines: $e');
    }
  }

  Future<List<MedicineModel>> getCachedMedicines() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(_keyCachedMedicines);
      if (data == null) return [];
      final List list = jsonDecode(data) as List;
      return list.map((json) => MedicineModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('[OfflineSyncService] Error reading cached medicines: $e');
      return [];
    }
  }

  // --- Offline Bill Queue ---
  Future<List<Map<String, dynamic>>> getQueuedBills() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(_keyQueue);
      if (data == null) return [];
      final List list = jsonDecode(data) as List;
      return list.map((item) => Map<String, dynamic>.from(item as Map)).toList();
    } catch (e) {
      debugPrint('[OfflineSyncService] Error reading queued bills: $e');
      return [];
    }
  }

  Future<int> getPendingCount() async {
    final bills = await getQueuedBills();
    return bills.length;
  }

  Future<Map<String, dynamic>> queueBill(Map<String, dynamic> billPayload) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = await getQueuedBills();

    final localBillNo = 'OFFLINE-${DateTime.now().millisecondsSinceEpoch % 100000}';
    final queuedRecord = {
      ...billPayload,
      'offline_id': 'offline_${DateTime.now().millisecondsSinceEpoch}',
      'bill_number': localBillNo,
      'is_offline': true,
      'queued_at': DateTime.now().toIso8601String(),
    };

    queue.add(queuedRecord);
    await prefs.setString(_keyQueue, jsonEncode(queue));
    pendingCountNotifier.value = queue.length;

    return queuedRecord;
  }

  // --- Auto-Sync Engine ---
  Future<int> syncQueue() async {
    if (_isSyncing) return 0;
    _isSyncing = true;

    try {
      final queue = await getQueuedBills();
      if (queue.isEmpty) {
        _isSyncing = false;
        return 0;
      }

      int syncedCount = 0;
      final List<Map<String, dynamic>> remainingQueue = [];

      for (final bill in queue) {
        try {
          final payload = Map<String, dynamic>.from(bill);
          payload.remove('offline_id');
          payload.remove('is_offline');
          payload.remove('queued_at');

          final response = await ApiService.post(ApiEndpoints.createBill, payload);
          if (response.success) {
            syncedCount++;
          } else {
            remainingQueue.add(bill);
          }
        } catch (_) {
          // If still offline, keep in queue
          remainingQueue.add(bill);
        }
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_keyQueue, jsonEncode(remainingQueue));
      pendingCountNotifier.value = remainingQueue.length;

      return syncedCount;
    } finally {
      _isSyncing = false;
    }
  }
}
