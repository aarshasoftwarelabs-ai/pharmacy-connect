import '../models/medicine_request.dart';

class MockMedicineRequests {
  static final List<MedicineRequest> myRequests = [
    MedicineRequest(
      id: 1,
      userId: 1,
      pharmacyId: 1,
      medicineName: 'Paracetamol',
      pharmacyName: 'Shree Pharmacy',
      pharmacyAddress: 'Station Road',
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      status: MedicineRequestStatus.available,
      customerConfirmation: CustomerConfirmationStatus.pending,
    ),
    MedicineRequest(
      id: 2,
      userId: 1,
      pharmacyId: 2,
      medicineName: 'Azithromycin 500',
      pharmacyName: 'HealthPlus Medical',
      pharmacyAddress: 'City Center',
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
      status: MedicineRequestStatus.notAvailable,
      customerConfirmation: CustomerConfirmationStatus.pending,
    ),
  ];

  static void addRequest(MedicineRequest request) {
    myRequests.insert(0, request);
  }
}
