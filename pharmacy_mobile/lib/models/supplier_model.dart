class SupplierModel {
  final int id;
  final String supplierName;
  final String? mobile;
  final String? city;
  final String? address;
  final String? email;
  final bool isActive;

  SupplierModel({
    required this.id,
    required this.supplierName,
    this.mobile,
    this.city,
    this.address,
    this.email,
    this.isActive = true,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    return SupplierModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      supplierName: json['supplier_name'] ?? json['name'] ?? 'Supplier',
      mobile: json['mobile']?.toString() ?? json['phone']?.toString(),
      city: json['city']?.toString(),
      address: json['address']?.toString(),
      email: json['email']?.toString(),
      isActive: json['is_active'] != false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'supplier_name': supplierName,
      'mobile': mobile,
      'city': city,
      'address': address,
      'email': email,
    };
  }
}
