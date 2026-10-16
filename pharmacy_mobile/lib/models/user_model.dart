class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? role;
  final String? pharmacyId;
  final String? pharmacyName;
  final bool isStaff;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.role,
    this.pharmacyId,
    this.pharmacyName,
    this.isStaff = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final roleStr = json['role']?.toString().toUpperCase() ?? 'PHARMACIST';
    final isStaffFlag = json['isStaff'] == true ||
        json['is_staff'] == true ||
        (roleStr != 'OWNER' && roleStr != 'ADMIN');

    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? json['full_name'] ?? 'User',
      email: json['email'] ?? '',
      phone: json['phone']?.toString(),
      role: roleStr,
      pharmacyId: json['pharmacy_id']?.toString() ?? json['pharmacyId']?.toString(),
      pharmacyName: json['pharmacy_name'] ?? json['pharmacy']?['name'] ?? 'DavaSetu Pharmacy',
      isStaff: isStaffFlag,
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
      'isStaff': isStaff,
    };
  }
}
