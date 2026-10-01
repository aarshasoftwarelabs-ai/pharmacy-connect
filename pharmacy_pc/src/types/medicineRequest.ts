export type MedicineRequestStatus = 'WAITING' | 'AVAILABLE' | 'CAN_ARRANGE' | 'NOT_AVAILABLE';
export type CustomerConfirmationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface MedicineRequest {
  id: string;
  medicineName?: string;
  imageAttached: boolean;
  imageUrl?: string;
  customerName: string;
  customerPhone: string;
  pharmacyName: string;
  requestedAt: string;
  status: MedicineRequestStatus;
  responseMessage?: string;
  customerConfirmation: CustomerConfirmationStatus;
  confirmedAt?: string;
}
