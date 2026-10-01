enum MedicineRequestStatus {
  waiting,
  available,
  canArrange,
  notAvailable,
}

enum CustomerConfirmationStatus {
  pending,
  confirmed,
  cancelled,
}

class MedicineRequest {
  final int id;
  final int userId;
  final int pharmacyId;
  final String? medicineName;
  final String? imageReference;
  final String pharmacyName;
  final String pharmacyAddress;
  final DateTime createdAt;
  final MedicineRequestStatus status;
  final String? responseMessage;
  final CustomerConfirmationStatus customerConfirmation;
  final DateTime? confirmedAt;

  MedicineRequest({
    required this.id,
    required this.userId,
    required this.pharmacyId,
    this.medicineName,
    this.imageReference,
    required this.pharmacyName,
    required this.pharmacyAddress,
    required this.createdAt,
    required this.status,
    this.responseMessage,
    required this.customerConfirmation,
    this.confirmedAt,
  });

  factory MedicineRequest.fromJson(Map<String, dynamic> json) {
    MedicineRequestStatus parseStatus(String s) {
      switch (s) {
        case 'AVAILABLE': return MedicineRequestStatus.available;
        case 'CAN_ARRANGE': return MedicineRequestStatus.canArrange;
        case 'NOT_AVAILABLE': return MedicineRequestStatus.notAvailable;
        default: return MedicineRequestStatus.waiting;
      }
    }

    CustomerConfirmationStatus parseConfirmation(String s) {
      switch (s) {
        case 'CONFIRMED': return CustomerConfirmationStatus.confirmed;
        case 'CANCELLED': return CustomerConfirmationStatus.cancelled;
        default: return CustomerConfirmationStatus.pending;
      }
    }

    return MedicineRequest(
      id: json['id'] as int,
      userId: json['userId'] as int,
      pharmacyId: json['pharmacyId'] as int,
      medicineName: json['medicineName'] as String?,
      imageReference: json['imageReference'] as String?,
      pharmacyName: json['pharmacyName'] as String? ?? 'Pharmacy #${json['pharmacyId']}',
      pharmacyAddress: json['pharmacyAddress'] as String? ?? 'Verified Pharmacy',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      status: parseStatus(json['status'] as String? ?? 'WAITING'),
      responseMessage: json['responseMessage'] as String?,
      customerConfirmation: parseConfirmation(json['customerConfirmation'] as String? ?? 'PENDING'),
      confirmedAt: json['confirmedAt'] != null ? DateTime.tryParse(json['confirmedAt'].toString()) : null,
    );
  }
}
