import 'package:flutter/foundation.dart';
import '../models/sponsored_banner_model.dart';
import '../core/api/api_service.dart';
import '../core/api/api_endpoints.dart';

class PromotionProvider with ChangeNotifier {
  List<SponsoredBannerModel> _banners = [];
  bool _isLoading = false;
  String? _errorMessage;
  final Set<int> _recordedImpressions = {};

  List<SponsoredBannerModel> get banners => _banners.isNotEmpty ? _banners : _defaultFallbackBanners;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Fallback banners in case cloud backend is waking up or offline
  static final List<SponsoredBannerModel> _defaultFallbackBanners = [
    SponsoredBannerModel(
      id: 1,
      title: 'Mankind Monsoon Antibiotics & OTC Mega Scheme',
      companyName: 'Mankind Pharma Ltd.',
      badgeText: '10+2 FREE + 6% CASH',
      description: 'Direct distributor dispatch on Dolo-650, Moxikind-CV 625 & Pre-Monsoon stock.',
      schemeOffer: 'Buy 10 Boxes Get 2 Free + 6% Direct Cash Discount',
      bgGradientStart: '#059669',
      bgGradientEnd: '#047857',
      actionType: 'WHATSAPP',
      actionValue: '919876543210',
      contactPerson: 'Mankind Distributor Desk',
      priority: 10,
    ),
    SponsoredBannerModel(
      id: 2,
      title: 'Sun Pharma Pantocid & Volini Direct Wholesale Rate',
      companyName: 'Sun Pharmaceutical Industries',
      badgeText: 'EXTRA 8% MARGIN',
      description: 'Direct wholesale stockist booking for registered retail pharmacies across Gujarat.',
      schemeOffer: 'Pantocid DSR & Volini Gel - Flat 8% Extra Retail Margin',
      bgGradientStart: '#0284c7',
      bgGradientEnd: '#0369a1',
      actionType: 'CALL',
      actionValue: '919825012345',
      contactPerson: 'Sun Pharma Stockists',
      priority: 8,
    ),
    SponsoredBannerModel(
      id: 3,
      title: 'Cipla Asthalin & Foracort Inhalers Wholesaler Deal',
      companyName: 'Cipla Therapeutics',
      badgeText: 'SAME DAY DISPATCH',
      description: 'Instant booking on respiratory care & inhalers with flexible 21-day credit terms.',
      schemeOffer: 'Asthalin / Budecort Inhalers - Same Day Express Dispatch',
      bgGradientStart: '#7c3aed',
      bgGradientEnd: '#6d28d9',
      actionType: 'WHATSAPP',
      actionValue: '919879911223',
      contactPerson: 'Cipla Authorized Depot',
      priority: 6,
    ),
  ];

  Future<void> fetchBanners() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.get(ApiEndpoints.sponsoredBanners);
      if (response.success && response.data != null) {
        final List<dynamic> list = response.data as List<dynamic>;
        _banners = list.map((item) => SponsoredBannerModel.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _errorMessage = 'Failed to load banners: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void recordImpression(int bannerId) {
    if (_recordedImpressions.contains(bannerId)) return;
    _recordedImpressions.add(bannerId);

    // Call API non-blocking
    ApiService.post(ApiEndpoints.trackBannerImpression(bannerId), {}).catchError((_) => ApiResponse(success: false, statusCode: 0));
  }

  void recordClick(int bannerId) {
    ApiService.post(ApiEndpoints.trackBannerClick(bannerId), {}).catchError((_) => ApiResponse(success: false, statusCode: 0));
  }
}
