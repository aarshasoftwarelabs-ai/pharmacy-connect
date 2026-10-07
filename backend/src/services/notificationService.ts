import pool from '../config/database';
import { getIo } from '../socket';

export enum NotificationType {
  MEDICINE_REQUEST_CREATED = 'MEDICINE_REQUEST_CREATED',
  MEDICINE_REQUEST_AVAILABLE = 'MEDICINE_REQUEST_AVAILABLE',
  MEDICINE_REQUEST_CAN_ARRANGE = 'MEDICINE_REQUEST_CAN_ARRANGE',
  MEDICINE_REQUEST_NOT_AVAILABLE = 'MEDICINE_REQUEST_NOT_AVAILABLE',
  CUSTOMER_CONFIRMATION_RECEIVED = 'CUSTOMER_CONFIRMATION_RECEIVED',
  CUSTOMER_REQUEST_CANCELLED = 'CUSTOMER_REQUEST_CANCELLED',
  BILL_CREATED = 'BILL_CREATED',
  BILL_READY = 'BILL_READY',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  NEAR_EXPIRY_ALERT = 'NEAR_EXPIRY_ALERT',
  STAFF_PERMISSION_CHANGED = 'STAFF_PERMISSION_CHANGED',
  STAFF_ACCOUNT_CREATED = 'STAFF_ACCOUNT_CREATED',
  STAFF_ACCOUNT_DEACTIVATED = 'STAFF_ACCOUNT_DEACTIVATED'
}

export interface NotificationPayload {
  recipient_user_id: number;
  pharmacy_id?: number | null;
  type: NotificationType;
  title: string;
  message: string;
  reference_type?: string | null;
  reference_id?: number | null;
  data?: any;
}

export const NotificationService = {
  createNotification: async (payload: NotificationPayload) => {
    try {
      const result = await pool.query(
        `INSERT INTO notifications 
         (recipient_user_id, pharmacy_id, type, title, message, reference_type, reference_id, data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          payload.recipient_user_id,
          payload.pharmacy_id || null,
          payload.type,
          payload.title,
          payload.message,
          payload.reference_type || null,
          payload.reference_id || null,
          payload.data ? JSON.stringify(payload.data) : null
        ]
      );
      
      const notification = result.rows[0];

      // Realtime Delivery
      try {
        const io = getIo();
        
        // Emitting to the specific user room
        io.to(`user_${payload.recipient_user_id}`).emit('new_notification', notification);
        
        // If it's a pharmacy notification (e.g. for staff), emit to the pharmacy room as well if we want
        // But better is to just rely on user rooms for specificity, or emit to pharmacy and let frontend filter by recipient_user_id.
        if (payload.pharmacy_id) {
            io.to(`pharmacy_${payload.pharmacy_id}`).emit('new_pharmacy_notification', notification);
        }
      } catch (err) {
        console.error('Socket error (non-fatal):', err);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      // We don't throw to prevent crashing the main transaction
      return null;
    }
  },

  notifyPharmacyUsers: async (pharmacyId: number, permissionKey: string, payloadTemplate: Omit<NotificationPayload, 'recipient_user_id' | 'pharmacy_id'>) => {
    try {
      // Find all owners for the pharmacy
      const ownerResult = await pool.query(
        `SELECT id FROM users WHERE pharmacy_id = $1 AND role = 'OWNER'`,
        [pharmacyId]
      );
      
      // Find all staff who have the specific permission
      const staffResult = await pool.query(
        `SELECT u.id FROM users u 
         JOIN staff_members sm ON sm.phone = u.phone OR sm.email = u.email
         JOIN staff_permissions sp ON sp.staff_id = sm.id 
         WHERE sm.pharmacy_id = $1 AND sp.permission_key = $2 AND sp.granted = TRUE AND u.is_staff = TRUE`,
        [pharmacyId, permissionKey]
      );

      const userIds = new Set<number>();
      ownerResult.rows.forEach(r => userIds.add(r.id));
      staffResult.rows.forEach(r => userIds.add(r.id));

      const payloads: NotificationPayload[] = Array.from(userIds).map(userId => ({
        ...payloadTemplate,
        recipient_user_id: userId,
        pharmacy_id: pharmacyId
      }));

      await NotificationService.createBulkNotifications(payloads);
    } catch (error) {
      console.error('Failed to notify pharmacy users:', error);
    }
  },

  notifyStaffMember: async (staffId: number, pharmacyId: number, payloadTemplate: Omit<NotificationPayload, 'recipient_user_id' | 'pharmacy_id'>) => {
    try {
      const userResult = await pool.query(
        `SELECT u.id FROM users u
         JOIN staff_members sm ON (sm.phone = u.phone OR sm.email = u.email)
         WHERE sm.id = $1 AND sm.pharmacy_id = $2 AND u.is_staff = TRUE`,
        [staffId, pharmacyId]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        await NotificationService.createNotification({
          ...payloadTemplate,
          recipient_user_id: userId,
          pharmacy_id: pharmacyId
        });
      }
    } catch (error) {
      console.error('Failed to notify staff member:', error);
    }
  },

  createBulkNotifications: async (payloads: NotificationPayload[]) => {
    const created = [];
    for (const payload of payloads) {
      const notif = await NotificationService.createNotification(payload);
      if (notif) created.push(notif);
    }
    return created;
  },

  getUserNotifications: async (userId: number, limit = 50, offset = 0) => {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE recipient_user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  getUnreadCount: async (userId: number) => {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications 
       WHERE recipient_user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  markAsRead: async (userId: number, notificationId: number) => {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND recipient_user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  },

  markAllAsRead: async (userId: number) => {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
       WHERE recipient_user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return { success: true };
  }
};
