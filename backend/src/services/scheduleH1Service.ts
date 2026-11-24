import pool from '../config/database';

export const SCHEDULE_H1_DRUGS_REGEX = new RegExp(
  '\\b(alprazolam|balofloxacin|bedaquiline|buprenorphine|capreomycin|cefdinir|cefditoren|cefepime|cefixime|cefotaxime|cefpodoxime|ceftazidime|ceftriaxone|chlordiazepoxide|clofazimine|clobazam|clonazepam|clorazepate|cycloserine|delamanid|diazepam|diphenoxylate|doripenem|ertapenem|ethambutol|ethionamide|faropenem|flurazepam|gemifloxacin|imipenem|isoniazid|ketamine|levofloxacin|linezolid|lorazepam|meropenem|midazolam|moxifloxacin|nitrazepam|oxazepam|pentazocine|pyrazinamide|rifabutin|rifampicin|rifapentine|sparfloxacin|streptomycin|tigecycline|tramadol|zolpidem)\\b',
  'i'
);

export interface ScheduleH1RecordInput {
  pharmacyId: number;
  billId?: number | null;
  billNumber?: string | null;
  supplyDate?: string;
  patientName: string;
  patientPhone?: string | null;
  patientAddress?: string | null;
  doctorName: string;
  doctorRegNo?: string | null;
  doctorAddress?: string | null;
  medicineId?: number | null;
  medicineName: string;
  genericName?: string | null;
  batchNumber: string;
  quantity: number;
  unit?: string;
}

export class ScheduleH1Service {
  /**
   * Check if a drug belongs to Schedule H1 under Drugs & Cosmetics Rules 1945
   */
  static isScheduleH1Drug(name: string, genericName?: string | null, isFlagged?: boolean | null): boolean {
    if (isFlagged === true) return true;
    const nameStr = (name || '').trim();
    const genericStr = (genericName || '').trim();
    return SCHEDULE_H1_DRUGS_REGEX.test(nameStr) || (genericStr.length > 0 && SCHEDULE_H1_DRUGS_REGEX.test(genericStr));
  }

  /**
   * Record a Schedule H1 dispensation into statutory digital register
   */
  static async recordDispensation(input: ScheduleH1RecordInput) {
    const query = `
      INSERT INTO schedule_h1_register (
        pharmacy_id, bill_id, bill_number, supply_date,
        patient_name, patient_phone, patient_address,
        doctor_name, doctor_reg_no, doctor_address,
        medicine_id, medicine_name, generic_name,
        batch_number, quantity, unit
      ) VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      input.pharmacyId,
      input.billId || null,
      input.billNumber || null,
      input.supplyDate || null,
      input.patientName.trim(),
      input.patientPhone ? input.patientPhone.trim() : null,
      input.patientAddress ? input.patientAddress.trim() : 'Local Patient',
      input.doctorName.trim(),
      input.doctorRegNo ? input.doctorRegNo.trim() : null,
      input.doctorAddress ? input.doctorAddress.trim() : null,
      input.medicineId || null,
      input.medicineName.trim(),
      input.genericName ? input.genericName.trim() : null,
      input.batchNumber.trim().toUpperCase(),
      input.quantity,
      input.unit || 'Strip'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Fetch statutory Schedule H1 Register entries with search & date filtering
   */
  static async getRegister(pharmacyId: number, options: {
    startDate?: string;
    endDate?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const offset = Math.max(0, options.offset || 0);

    const conditions: string[] = ['r.pharmacy_id = $1'];
    const params: any[] = [pharmacyId];
    let paramIdx = 2;

    if (options.startDate) {
      conditions.push(`r.supply_date >= $${paramIdx}`);
      params.push(options.startDate);
      paramIdx++;
    }

    if (options.endDate) {
      conditions.push(`r.supply_date <= $${paramIdx}`);
      params.push(options.endDate);
      paramIdx++;
    }

    if (options.search && options.search.trim()) {
      const q = `%${options.search.trim().toLowerCase()}%`;
      conditions.push(`(
        LOWER(r.patient_name) LIKE $${paramIdx} OR
        LOWER(r.doctor_name) LIKE $${paramIdx} OR
        LOWER(r.medicine_name) LIKE $${paramIdx} OR
        LOWER(r.batch_number) LIKE $${paramIdx} OR
        LOWER(COALESCE(r.bill_number, '')) LIKE $${paramIdx}
      )`);
      params.push(q);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) FROM schedule_h1_register r WHERE ${whereClause}`;
    const countRes = await pool.query(countQuery, params);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const listQuery = `
      SELECT r.*,
             m.manufacturer,
             m.strength
      FROM schedule_h1_register r
      LEFT JOIN medicines m ON r.medicine_id = m.id
      WHERE ${whereClause}
      ORDER BY r.supply_date DESC, r.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(limit, offset);

    const listRes = await pool.query(listQuery, params);

    return {
      total: totalCount,
      limit,
      offset,
      data: listRes.rows
    };
  }

  /**
   * Get Schedule H1 Compliance Statistics
   */
  static async getStats(pharmacyId: number) {
    const query = `
      SELECT 
        COUNT(*)::int AS total_dispensed_entries,
        COALESCE(SUM(quantity), 0)::int AS total_units_dispensed,
        COUNT(DISTINCT patient_name)::int AS unique_patients,
        COUNT(DISTINCT doctor_name)::int AS unique_doctors,
        COUNT(DISTINCT medicine_name)::int AS unique_h1_medicines
      FROM schedule_h1_register
      WHERE pharmacy_id = $1
    `;
    const res = await pool.query(query, [pharmacyId]);
    return res.rows[0];
  }
}
