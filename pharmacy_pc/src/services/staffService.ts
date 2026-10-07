import { API_BASE_URL as API_URL, apiFetch as fetch } from '../config/api';

export interface StaffMember {
  id: number;
  pharmacy_id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'OWNER' | 'MANAGER' | 'PHARMACIST' | 'BILLER';
  pin?: string;
  is_active: boolean;
  created_at: string;
}

export interface StaffPermission {
  permission_key: string;
  granted: boolean;
}

export const StaffService = {
  getPharmacyStaff: async (pharmacyId: number): Promise<StaffMember[]> => {
    try {
      const response = await fetch(`${API_URL}/api/staff/pharmacy/${pharmacyId}`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return await response.json();
    } catch (error) {
      console.error('Error fetching staff:', error);
      return [];
    }
  },

  addStaff: async (pharmacyId: number, data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await fetch(`${API_URL}/api/staff/pharmacy/${pharmacyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add staff');
    return await response.json();
  },

  updateStaff: async (id: number, data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await fetch(`${API_URL}/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update staff');
    return await response.json();
  },

  deleteStaff: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/staff/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete staff');
  },

  getPermissions: async (id: number): Promise<StaffPermission[]> => {
    const response = await fetch(`${API_URL}/api/staff/${id}/permissions`);
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return await response.json();
  },

  updatePermissions: async (id: number, permissions: StaffPermission[]): Promise<void> => {
    const response = await fetch(`${API_URL}/api/staff/${id}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
    if (!response.ok) throw new Error('Failed to update permissions');
  }
};
