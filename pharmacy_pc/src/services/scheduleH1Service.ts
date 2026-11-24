import { API_BASE_URL, apiFetch } from '../config/api';

export const SCHEDULE_H1_SALT_REGEX = new RegExp(
  '\\b(alprazolam|balofloxacin|bedaquiline|buprenorphine|capreomycin|cefdinir|cefditoren|cefepime|cefixime|cefotaxime|cefpodoxime|ceftazidime|ceftriaxone|chlordiazepoxide|clofazimine|clobazam|clonazepam|clorazepate|cycloserine|delamanid|diazepam|diphenoxylate|doripenem|ertapenem|ethambutol|ethionamide|faropenem|flurazepam|gemifloxacin|imipenem|isoniazid|ketamine|levofloxacin|linezolid|lorazepam|meropenem|midazolam|moxifloxacin|nitrazepam|oxazepam|pentazocine|pyrazinamide|rifabutin|rifampicin|rifapentine|sparfloxacin|streptomycin|tigecycline|tramadol|zolpidem)\\b',
  'i'
);

export function isScheduleH1MedicineName(name: string, genericName?: string): boolean {
  const n = (name || '').trim();
  const g = (genericName || '').trim();
  return SCHEDULE_H1_SALT_REGEX.test(n) || (g.length > 0 && SCHEDULE_H1_SALT_REGEX.test(g));
}

export interface ScheduleH1Entry {
  id: number;
  pharmacy_id: number;
  bill_id?: number | null;
  bill_number?: string | null;
  supply_date: string;
  patient_name: string;
  patient_phone?: string | null;
  patient_address?: string | null;
  doctor_name: string;
  doctor_reg_no?: string | null;
  doctor_address?: string | null;
  medicine_id?: number | null;
  medicine_name: string;
  generic_name?: string | null;
  batch_number: string;
  quantity: number;
  unit: string;
  manufacturer?: string | null;
  strength?: string | null;
  created_at?: string;
}

export interface ScheduleH1Stats {
  total_dispensed_entries: number;
  total_units_dispensed: number;
  unique_patients: number;
  unique_doctors: number;
  unique_h1_medicines: number;
}

export class ScheduleH1Service {
  static async fetchRegister(options?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ScheduleH1Entry[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (options?.startDate) params.set('startDate', options.startDate);
      if (options?.endDate) params.set('endDate', options.endDate);
      if (options?.search) params.set('search', options.search);
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.offset) params.set('offset', String(options.offset));

      const res = await apiFetch(`${API_BASE_URL}/schedule-h1?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return { data: json.data || [], total: json.total || 0 };
      }
    } catch (e) {
      console.warn('Network issue fetching Schedule H1 register:', e);
    }
    return { data: [], total: 0 };
  }

  static async fetchStats(): Promise<ScheduleH1Stats> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/schedule-h1/stats`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Network issue fetching Schedule H1 stats:', e);
    }
    return {
      total_dispensed_entries: 0,
      total_units_dispensed: 0,
      unique_patients: 0,
      unique_doctors: 0,
      unique_h1_medicines: 0
    };
  }

  static async fetchH1Medicines(): Promise<any[]> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/schedule-h1/medicines`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {
      console.warn('Network issue fetching H1 medicines:', e);
    }
    return [];
  }

  static async createManualEntry(data: Partial<ScheduleH1Entry>): Promise<ScheduleH1Entry> {
    const res = await apiFetch(`${API_BASE_URL}/schedule-h1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to record Schedule H1 entry');
    }
    return json.data;
  }
}
