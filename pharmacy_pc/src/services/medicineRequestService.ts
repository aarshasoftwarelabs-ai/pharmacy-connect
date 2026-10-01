import { API_BASE_URL, apiFetch } from '../config/api';
import { MedicineRequest, MedicineRequestStatus } from '../types/medicineRequest';

// Backend DTO
export interface MedicineRequestDTO {
  id: number;
  userId: number;
  pharmacyId: number;
  medicineName: string | null;
  imageReference: string | null;
  status: string;
  responseMessage: string | null;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// Mapper
const mapToUIModel = (dto: MedicineRequestDTO): MedicineRequest => {
  return {
    id: dto.id.toString(),
    medicineName: dto.medicineName || undefined,
    imageAttached: !!dto.imageReference,
    imageUrl: dto.imageReference || undefined,
    customerName: dto.customerName || `User #${dto.userId}`,
    customerPhone: dto.customerPhone || 'N/A',
    pharmacyName: `DavaSetu Pharmacy`,
    requestedAt: dto.createdAt,
    status: dto.status as MedicineRequestStatus,
    responseMessage: dto.responseMessage || undefined,
    customerConfirmation: (dto as any).customerConfirmation || 'PENDING',
    confirmedAt: (dto as any).confirmedAt || undefined,
  };
};

export class MedicineRequestService {
  /**
   * Fetch all requests for a specific pharmacy
   */
  static async getPharmacyRequests(pharmacyId: number, status?: string): Promise<MedicineRequest[]> {
    let url = `${API_BASE_URL}/medicine-requests/pharmacy/${pharmacyId}`;
    if (status && status !== 'ALL') {
      url += `?status=${status}`;
    }

    const response = await apiFetch(url);
    if (!response.ok) {
      if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
      throw new Error('Failed to fetch medicine requests');
    }

    const result = await response.json();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Received an invalid response from the server.');
    }

    return result.data.map(mapToUIModel);
  }

  /**
   * Fetch a single request by ID
   */
  static async getRequestById(requestId: string): Promise<MedicineRequest> {
    const response = await apiFetch(`${API_BASE_URL}/medicine-requests/${requestId}`);
    if (!response.ok) {
      if (response.status === 403) throw new Error('Forbidden: Insufficient permissions');
      throw new Error('Failed to fetch medicine request details');
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error('Received an invalid response from the server.');
    }

    return mapToUIModel(result.data);
  }

  /**
   * Update the status of a request
   */
  static async updateStatus(requestId: string, status: string, responseMessage?: string): Promise<MedicineRequest> {
    const response = await apiFetch(`${API_BASE_URL}/medicine-requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, responseMessage }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Unable to update request. Please try again.');
    }

    if (!result.success || !result.data) {
      throw new Error('Received an invalid response from the server.');
    }

    return mapToUIModel(result.data);
  }
}
