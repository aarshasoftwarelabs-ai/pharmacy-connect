class SubscriptionModel {
  final int pharmacyId;
  final String pharmacyName;
  final String planType;
  final String planName;
  final String? trialStartDate;
  final String? subscriptionEndDate;
  final int daysRemaining;
  final int rawDaysRemaining;
  final String status; // 'ACTIVE', 'TRIAL', 'EXPIRING_SOON', 'GRACE_PERIOD', 'EXPIRED'
  final bool canBill;
  final bool isMobileOnly;
  final bool supportsPc;
  final double mobileYearlyPrice;
  final double originalPrice;
  final String dailyPrice;
  final int discountPercent;

  SubscriptionModel({
    required this.pharmacyId,
    required this.pharmacyName,
    required this.planType,
    required this.planName,
    this.trialStartDate,
    this.subscriptionEndDate,
    required this.daysRemaining,
    required this.rawDaysRemaining,
    required this.status,
    required this.canBill,
    this.isMobileOnly = false,
    this.supportsPc = true,
    this.mobileYearlyPrice = 1499.0,
    this.originalPrice = 2499.0,
    this.dailyPrice = '4.10',
    this.discountPercent = 40,
  });

  bool get isExpired => status == 'EXPIRED';
  bool get isExpiringSoon => status == 'EXPIRING_SOON' || status == 'GRACE_PERIOD';
  bool get isLifetime => planType == 'LIFETIME';
  bool get isTrial => status == 'TRIAL';
  bool get isActive => status == 'ACTIVE' || status == 'TRIAL';
  bool get isMobileYearly => planType == 'MOBILE_YEARLY';

  factory SubscriptionModel.fromJson(Map<String, dynamic> json) {
    final pricing = json['pricing'] is Map
        ? Map<String, dynamic>.from(json['pricing'] as Map)
        : <String, dynamic>{};
    final plan = json['planType']?.toString() ?? 'FREE_TRIAL';
    final isMobile = json['isMobileOnly'] == true || plan == 'MOBILE_YEARLY';
    final hasPcSupport = json['supportsPc'] != null ? json['supportsPc'] == true : (plan != 'MOBILE_YEARLY');

    return SubscriptionModel(
      pharmacyId: json['pharmacyId'] is int ? json['pharmacyId'] : int.tryParse(json['pharmacyId']?.toString() ?? '1') ?? 1,
      pharmacyName: json['pharmacyName']?.toString() ?? 'Pharmacy Store',
      planType: plan,
      planName: plan == 'MOBILE_YEARLY'
          ? 'Mobile-Only Pro (1-Year Pass)'
          : (json['planName']?.toString() ?? '14-Day Free Trial'),
      trialStartDate: json['trialStartDate']?.toString(),
      subscriptionEndDate: json['subscriptionEndDate']?.toString(),
      daysRemaining: json['daysRemaining'] is int ? json['daysRemaining'] : int.tryParse(json['daysRemaining']?.toString() ?? '0') ?? 0,
      rawDaysRemaining: json['rawDaysRemaining'] is int ? json['rawDaysRemaining'] : int.tryParse(json['rawDaysRemaining']?.toString() ?? '0') ?? 0,
      status: json['status']?.toString() ?? 'ACTIVE',
      canBill: json['canBill'] == true,
      isMobileOnly: isMobile,
      supportsPc: hasPcSupport,
      mobileYearlyPrice: (pricing['mobileYearly'] as num?)?.toDouble() ?? 1499.0,
      originalPrice: (pricing['originalPrice'] as num?)?.toDouble() ?? 2499.0,
      dailyPrice: pricing['dailyPrice']?.toString() ?? '4.10',
      discountPercent: (pricing['discountPercent'] as num?)?.toInt() ?? 40,
    );
  }

  factory SubscriptionModel.defaultFallback(int pharmacyId, String name) {
    return SubscriptionModel(
      pharmacyId: pharmacyId,
      pharmacyName: name,
      planType: 'FREE_TRIAL',
      planName: '14-Day Free Trial',
      daysRemaining: 14,
      rawDaysRemaining: 14,
      status: 'TRIAL',
      canBill: true,
      isMobileOnly: false,
      supportsPc: true,
      mobileYearlyPrice: 1499.0,
      originalPrice: 2499.0,
      dailyPrice: '4.10',
      discountPercent: 40,
    );
  }
}
