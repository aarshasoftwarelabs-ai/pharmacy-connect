export type MedicineRequestStatus = 'WAITING' | 'AVAILABLE' | 'CAN_ARRANGE' | 'NOT_AVAILABLE';
export type CustomerConfirmationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type RequestType = 'NEW_PRESCRIPTION' | 'REFILL' | 'OTC';

export interface MedicineRequest {
  id: string;
  requestType?: RequestType; // e.g. REFILL, NEW_PRESCRIPTION
  medicineName?: string;
  quantity?: string; // e.g. "10 tablets", "2 strips"
  imageAttached: boolean;
  imageUrl?: string;
  customerName: string;
  customerPhone: string;
  pharmacyName: string;
  requestedAt: string;
  
  // Delivery Preferences
  isDeliveryRequired?: boolean;
  deliveryAddress?: string;
  allowGenericSubstitute?: boolean; // Can pharmacy give alternative medicine?
  
  // Pharmacy Response
  status: MedicineRequestStatus;
  responseMessage?: string;
  estimatedPrice?: number; // Quoted price by pharmacy
  estimatedDeliveryTime?: string; // e.g. "30-45 mins"
  
  // Customer Confirmation
  customerConfirmation: CustomerConfirmationStatus;
  confirmedAt?: string;
}
