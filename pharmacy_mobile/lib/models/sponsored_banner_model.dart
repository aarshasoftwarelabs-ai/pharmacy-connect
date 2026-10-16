class SponsoredBannerModel {
  final int id;
  final String title;
  final String companyName;
  final String badgeText;
  final String? description;
  final String? schemeOffer;
  final String? bannerImageUrl;
  final String bgGradientStart;
  final String bgGradientEnd;
  final String actionType; // 'WHATSAPP', 'CALL', 'URL', 'INFO'
  final String? actionValue; // Phone number or URL
  final String? contactPerson;
  final int priority;
  final bool isActive;
  final int clickCount;
  final int impressionCount;

  SponsoredBannerModel({
    required this.id,
    required this.title,
    required this.companyName,
    required this.badgeText,
    this.description,
    this.schemeOffer,
    this.bannerImageUrl,
    this.bgGradientStart = '#059669',
    this.bgGradientEnd = '#0f766e',
    this.actionType = 'WHATSAPP',
    this.actionValue,
    this.contactPerson,
    this.priority = 1,
    this.isActive = true,
    this.clickCount = 0,
    this.impressionCount = 0,
  });

  factory SponsoredBannerModel.fromJson(Map<String, dynamic> json) {
    return SponsoredBannerModel(
      id: int.tryParse(json['id']?.toString() ?? '') ?? 0,
      title: json['title']?.toString() ?? '',
      companyName: json['companyName']?.toString() ?? json['company_name']?.toString() ?? 'Pharma Partner',
      badgeText: json['badgeText']?.toString() ?? json['badge_text']?.toString() ?? 'EXCLUSIVE SCHEME',
      description: json['description']?.toString(),
      schemeOffer: json['schemeOffer']?.toString() ?? json['scheme_offer']?.toString(),
      bannerImageUrl: json['bannerImageUrl']?.toString() ?? json['banner_image_url']?.toString(),
      bgGradientStart: json['bgGradientStart']?.toString() ?? json['bg_gradient_start']?.toString() ?? '#059669',
      bgGradientEnd: json['bgGradientEnd']?.toString() ?? json['bg_gradient_end']?.toString() ?? '#0f766e',
      actionType: json['actionType']?.toString() ?? json['action_type']?.toString() ?? 'WHATSAPP',
      actionValue: json['actionValue']?.toString() ?? json['action_value']?.toString(),
      contactPerson: json['contactPerson']?.toString() ?? json['contact_person']?.toString(),
      priority: int.tryParse(json['priority']?.toString() ?? '') ?? 1,
      isActive: json['isActive'] == true || json['is_active'] == true,
      clickCount: int.tryParse(json['clickCount']?.toString() ?? json['click_count']?.toString() ?? '') ?? 0,
      impressionCount: int.tryParse(json['impressionCount']?.toString() ?? json['impression_count']?.toString() ?? '') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'companyName': companyName,
      'badgeText': badgeText,
      'description': description,
      'schemeOffer': schemeOffer,
      'bannerImageUrl': bannerImageUrl,
      'bgGradientStart': bgGradientStart,
      'bgGradientEnd': bgGradientEnd,
      'actionType': actionType,
      'actionValue': actionValue,
      'contactPerson': contactPerson,
      'priority': priority,
      'isActive': isActive,
      'clickCount': clickCount,
      'impressionCount': impressionCount,
    };
  }
}
