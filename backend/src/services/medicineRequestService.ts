import pool from '../config/database';
import { ApiError } from '../middleware/errorHandler';

export interface CreateMedicineRequestDTO {
  userId: number;
  pharmacyId: number;
  medicineName?: string | null;
  imageReference?: string | null;
}

export interface UpdateMedicineRequestStatusDTO {
  status: 'AVAILABLE' | 'CAN_ARRANGE' | 'NOT_AVAILABLE';
  responseMessage?: string;
}

export class MedicineRequestService {
  /**
   * Create a new medicine request.
   */
  static async createRequest(data: CreateMedicineRequestDTO) {
    const medicineName = data.medicineName?.trim() || null;
    const imageReference = data.imageReference?.trim() || null;

    if (!medicineName && !imageReference) {
      const error = new Error('Medicine name or image is required') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const query = `
      INSERT INTO medicine_requests (user_id, pharmacy_id, medicine_name, image_reference, status)
      VALUES ($1, $2, $3, $4, 'WAITING')
      RETURNING id, user_id AS "userId", pharmacy_id AS "pharmacyId", medicine_name AS "medicineName",
                image_reference AS "imageReference", status, response_message AS "responseMessage",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    const values = [data.userId, data.pharmacyId, medicineName, imageReference];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23503') { // Foreign key violation
        const err = new Error('Invalid user ID or pharmacy ID') as ApiError;
        err.statusCode = 400;
        throw err;
      }
      throw error;
    }
  }

  /**
   * Get all requests for a specific user.
   */
  static async getUserRequests(userId: number) {
    const query = `
      SELECT m.id, m.user_id AS "userId", m.pharmacy_id AS "pharmacyId", m.medicine_name AS "medicineName",
             m.image_reference AS "imageReference", m.status, m.response_message AS "responseMessage",
             m.customer_confirmation AS "customerConfirmation", m.confirmed_at AS "confirmedAt",
             m.created_at AS "createdAt", m.updated_at AS "updatedAt",
             u.name AS "customerName", u.phone AS "customerPhone",
             p.name AS "pharmacyName", p.address AS "pharmacyAddress"
      FROM medicine_requests m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get all requests for a specific pharmacy, optionally filtered by status.
   */
  static async getPharmacyRequests(pharmacyId: number, status?: string) {
    let query = `
      SELECT m.id, m.user_id AS "userId", m.pharmacy_id AS "pharmacyId", m.medicine_name AS "medicineName",
             m.image_reference AS "imageReference", m.status, m.response_message AS "responseMessage",
             m.customer_confirmation AS "customerConfirmation", m.confirmed_at AS "confirmedAt",
             m.created_at AS "createdAt", m.updated_at AS "updatedAt",
             u.name AS "customerName", u.phone AS "customerPhone",
             p.name AS "pharmacyName", p.address AS "pharmacyAddress"
      FROM medicine_requests m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.pharmacy_id = $1
    `;
    const values: any[] = [pharmacyId];

    if (status) {
      query += ` AND m.status = $2`;
      values.push(status);
    }

    query += ` ORDER BY m.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get a specific request by ID.
   */
  static async getRequestById(id: number) {
    const query = `
      SELECT m.id, m.user_id AS "userId", m.pharmacy_id AS "pharmacyId", m.medicine_name AS "medicineName",
             m.image_reference AS "imageReference", m.status, m.response_message AS "responseMessage",
             m.customer_confirmation AS "customerConfirmation", m.confirmed_at AS "confirmedAt",
             m.created_at AS "createdAt", m.updated_at AS "updatedAt",
             u.name AS "customerName", u.phone AS "customerPhone",
             p.name AS "pharmacyName", p.address AS "pharmacyAddress"
      FROM medicine_requests m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN pharmacies p ON m.pharmacy_id = p.id
      WHERE m.id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      const error = new Error('Medicine request not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  /**
   * Update the status of a request (Pharmacy response).
   */
  static async updateStatus(id: number, updateData: UpdateMedicineRequestStatusDTO) {
    // 1. Fetch current request to check status transition
    const request = await this.getRequestById(id);

    // Optional: We can allow status changes anytime, or restrict if customer already confirmed.
    // For now, allow pharmacy to change status if they made a mistake.
    if (request.customerConfirmation === 'CONFIRMED' || request.customerConfirmation === 'CANCELLED') {
      const error = new Error('Cannot change status of a request that has already been confirmed or cancelled by the customer') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // 2. Set default message if not provided
    let message = updateData.responseMessage;
    if (message === undefined || message === null) {
      if (updateData.status === 'AVAILABLE') message = 'Medicine marked as available.';
      else if (updateData.status === 'CAN_ARRANGE') message = 'Medicine can be arranged.';
      else if (updateData.status === 'NOT_AVAILABLE') message = 'Medicine is currently unavailable.';
    }

    const query = `
      UPDATE medicine_requests
      SET status = $1, response_message = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await pool.query(query, [updateData.status, message, id]);
    return await this.getRequestById(id);
  }

  /**
   * Customer confirms the medicine request.
   */
  static async confirmRequest(id: number) {
    const request = await this.getRequestById(id);

    if (request.status !== 'AVAILABLE' && request.status !== 'CAN_ARRANGE') {
      const error = new Error('Can only confirm requests that are AVAILABLE or CAN_ARRANGE') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    if (request.customerConfirmation !== 'PENDING') {
      const error = new Error('Request has already been confirmed or cancelled') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const query = `
      UPDATE medicine_requests
      SET customer_confirmation = 'CONFIRMED', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await pool.query(query, [id]);
    return await this.getRequestById(id);
  }

  /**
   * Customer cancels/declines the medicine request.
   */
  static async cancelRequest(id: number) {
    const request = await this.getRequestById(id);

    if (request.customerConfirmation !== 'PENDING') {
      const error = new Error('Request has already been confirmed or cancelled') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const query = `
      UPDATE medicine_requests
      SET customer_confirmation = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await pool.query(query, [id]);
    return await this.getRequestById(id);
  }
}
