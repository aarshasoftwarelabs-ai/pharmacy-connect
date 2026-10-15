class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? role;
  final String? pharmacyId;
  final String? pharmacyName;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.role,
    this.pharmacyId,
    this.pharmacyName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? json['full_name'] ?? 'User',
      email: json['email'] ?? '',
      phone: json['phone']?.toString(),
      role: json['role'] ?? 'pharmacist',
      pharmacyId: json['pharmacy_id']?.toString() ?? json['pharmacyId']?.toString(),
      pharmacyName: json['pharmacy_name'] ?? json['pharmacy']?['name'] ?? 'DavaSetu Pharmacy',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'pharmacy_id': pharmacyId,
      'pharmacy_name': pharmacyName,
    };
  }
}
