class CustomerModel {
  final int id;
  final String displayName;
  final String? phone;
  final String? email;
  final String? address;
  final String? notes;
  final int totalBills;
  final double totalSpend;
  final String? lastPurchaseDate;
  final bool isRefillDue;

  CustomerModel({
    required this.id,
    required this.displayName,
    this.phone,
    this.email,
    this.address,
    this.notes,
    this.totalBills = 0,
    this.totalSpend = 0.0,
    this.lastPurchaseDate,
    this.isRefillDue = false,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      displayName: json['display_name'] ?? json['name'] ?? 'Customer',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      address: json['address']?.toString(),
      notes: json['notes']?.toString(),
      totalBills: json['total_bills'] is int
          ? json['total_bills']
          : int.tryParse('${json['total_bills']}') ?? 0,
      totalSpend: json['total_spend'] != null
          ? (json['total_spend'] as num).toDouble()
          : 0.0,
      lastPurchaseDate: json['last_purchase_date']?.toString(),
      isRefillDue: json['refill_due'] == true || json['is_refill_due'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'display_name': displayName,
      'phone': phone,
      'email': email,
      'address': address,
      'notes': notes,
    };
  }
}
