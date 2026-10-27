class SupplierModel {
  final int id;
  final String supplierName;
  final String? contactPerson;
  final String? mobile;
  final String? alternatePhone;
  final String? city;
  final String? state;
  final String? pincode;
  final String? address;
  final String? email;
  final String? gstin;
  final String? drugLicenseNumber;
  final String? fssaiNumber;
  final String? panNumber;
  final int? creditPeriodDays;
  final double? openingBalance;
  final double? currentBalance;
  final String? bankName;
  final String? accountNumber;
  final String? ifscCode;
  final String? branchName;
  final String? upiId;
  final String? dealsInBrands;
  final String? notes;
  final bool isActive;

  SupplierModel({
    required this.id,
    required this.supplierName,
    this.contactPerson,
    this.mobile,
    this.alternatePhone,
    this.city,
    this.state,
    this.pincode,
    this.address,
    this.email,
    this.gstin,
    this.drugLicenseNumber,
    this.fssaiNumber,
    this.panNumber,
    this.creditPeriodDays,
    this.openingBalance,
    this.currentBalance,
    this.bankName,
    this.accountNumber,
    this.ifscCode,
    this.branchName,
    this.upiId,
    this.dealsInBrands,
    this.notes,
    this.isActive = true,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    return SupplierModel(
      id: json['id'] is int ? json['id'] : int.tryParse('${json['id']}') ?? 0,
      supplierName: json['supplier_name'] ?? json['name'] ?? 'Pharma Supplier',
      contactPerson: json['contact_person']?.toString(),
      mobile: json['mobile']?.toString() ?? json['phone']?.toString(),
      alternatePhone: json['alternate_phone']?.toString(),
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      pincode: json['pincode']?.toString(),
      address: json['address']?.toString(),
      email: json['email']?.toString(),
      gstin: json['gstin']?.toString(),
      drugLicenseNumber: json['drug_license_number']?.toString(),
      fssaiNumber: json['fssai_number']?.toString(),
      panNumber: json['pan_number']?.toString(),
      creditPeriodDays: json['credit_period_days'] is int
          ? json['credit_period_days']
          : int.tryParse('${json['credit_period_days']}'),
      openingBalance: json['opening_balance'] != null
          ? double.tryParse('${json['opening_balance']}')
          : null,
      currentBalance: json['current_balance'] != null
          ? double.tryParse('${json['current_balance']}')
          : null,
      bankName: json['bank_name']?.toString(),
      accountNumber: json['account_number']?.toString(),
      ifscCode: json['ifsc_code']?.toString(),
      branchName: json['branch_name']?.toString(),
      upiId: json['upi_id']?.toString(),
      dealsInBrands: json['deals_in_brands']?.toString(),
      notes: json['notes']?.toString(),
      isActive: json['status'] == null ? true : (json['status'] == 'ACTIVE'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'supplier_name': supplierName,
      'contact_person': contactPerson,
      'mobile': mobile,
      'alternate_phone': alternatePhone,
      'city': city,
      'state': state ?? 'Gujarat',
      'pincode': pincode,
      'address': address,
      'email': email,
      'gstin': gstin,
      'drug_license_number': drugLicenseNumber,
      'fssai_number': fssaiNumber,
      'pan_number': panNumber,
      'credit_period_days': creditPeriodDays ?? 21,
      'opening_balance': openingBalance ?? 0,
      'bank_name': bankName,
      'account_number': accountNumber,
      'ifsc_code': ifscCode,
      'branch_name': branchName,
      'upi_id': upiId,
      'deals_in_brands': dealsInBrands,
      'notes': notes,
      'status': isActive ? 'ACTIVE' : 'INACTIVE',
    };
  }
}
