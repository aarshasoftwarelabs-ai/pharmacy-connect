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

  static int _parseInt(dynamic val) {
    if (val is int) return val;
    if (val is num) return val.toInt();
    return int.tryParse(val?.toString() ?? '') ?? 0;
  }

  static double _parseDouble(dynamic val) {
    if (val is num) return val.toDouble();
    return double.tryParse(val?.toString() ?? '') ?? 0.0;
  }

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: _parseInt(json['id']),
      displayName: json['display_name']?.toString() ?? json['name']?.toString() ?? 'Customer',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      address: json['address']?.toString(),
      notes: json['notes']?.toString(),
      totalBills: _parseInt(json['total_bills']),
      totalSpend: _parseDouble(json['total_spend']),
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
