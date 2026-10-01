import { Client } from 'pg';
import { env } from '../config/env';

const seed = async () => {
  const client = new Client({
    connectionString: env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // Seed user for pharmacy owner
    const userResult = await client.query(`
      INSERT INTO users (name, phone)
      VALUES ('Pharmacy Owner', '0000000000')
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    
    const ownerId = userResult.rows[0].id;
    
    // Seed pharmacy (ID 1)
    await client.query(`
      INSERT INTO pharmacies (id, owner_id, name, address, phone)
      VALUES (1, $1, 'DavaSetu Pharmacy', '123 Main St', '9876543210')
      ON CONFLICT (id) DO NOTHING;
    `, [ownerId]);
    
    // Also reset sequence if necessary, but manual insert of 1 might be fine.
    
    // Seed some medicines
    await client.query(`
      INSERT INTO medicines (pharmacy_id, name, generic_name, category, strength, sku, current_stock, minimum_stock, selling_price)
      VALUES 
      (1, 'Paracetamol', 'Acetaminophen', 'Fever & Pain', '650mg', 'MED-001', 12, 20, 20.00),
      (1, 'Azithromycin', 'Azithromycin', 'Antibiotics', '500mg', 'MED-002', 45, 15, 120.00),
      (1, 'Cough Syrup', 'Dextromethorphan', 'Cough & Cold', '100ml', 'MED-003', 5, 10, 85.50),
      (1, 'Vitamin C + Zinc', 'Ascorbic Acid + Zinc', 'Supplements', '500mg', 'MED-004', 120, 30, 45.00),
      (1, 'Amoxicillin', 'Amoxicillin', 'Antibiotics', '250mg', 'MED-005', 25, 20, 60.00)
      ON CONFLICT (sku) DO NOTHING;
    `);

    console.log('Pharmacy and medicines seeded successfully.');
  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    await client.end();
  }
};

seed();
