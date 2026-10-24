const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

const freshMedicines = [
  { name: 'Grilinctus', generic: 'Dextromethorphan + Chlorpheniramine', category: 'Syrups', strength: '100 ml', sku: 'GRI100', cur: 45, min: 30, price: 115.00, hsn: '3004', gst: 12, mfg: 'Franco-Indian' },
  { name: 'Alex Syrup', generic: 'Dextromethorphan + Phenylephrine', category: 'Syrups', strength: '100 ml', sku: 'ALEX100', cur: 35, min: 40, price: 125.00, hsn: '3004', gst: 12, mfg: 'Glenmark' },
  { name: 'Mucolite', generic: 'Ambroxol', category: 'Syrups', strength: '100 ml', sku: 'MUCO100', cur: 50, min: 30, price: 90.00, hsn: '3004', gst: 12, mfg: 'Dr. Reddys' },
  { name: 'Levolin Inhaler', generic: 'Levosalbutamol', category: 'Inhalers', strength: '50 mcg', sku: 'LEVOINH', cur: 20, min: 15, price: 185.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Seroflo 250', generic: 'Salmeterol + Fluticasone', category: 'Inhalers', strength: '250 mcg', sku: 'SERO250', cur: 15, min: 10, price: 450.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Montek LC', generic: 'Montelukast + Levocetirizine', category: 'Tablets', strength: '10mg+5mg', sku: 'MONTEK', cur: 120, min: 80, price: 165.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
  { name: 'Telekast L', generic: 'Montelukast + Levocetirizine', category: 'Tablets', strength: '10mg+5mg', sku: 'TELEKAST', cur: 90, min: 60, price: 155.00, hsn: '3004', gst: 12, mfg: 'Lupin' },
  { name: 'Nasivion', generic: 'Oxymetazoline', category: 'Drops', strength: '10 ml', sku: 'NASIVION', cur: 45, min: 30, price: 85.00, hsn: '3004', gst: 12, mfg: 'P&G' },
  { name: 'Otrivin', generic: 'Xylometazoline', category: 'Drops', strength: '10 ml', sku: 'OTRIVIN', cur: 60, min: 40, price: 95.00, hsn: '3004', gst: 12, mfg: 'GSK' },
  { name: 'Neosporin', generic: 'Neomycin + Bacitracin + Polymyxin', category: 'Ointments', strength: '5 g', sku: 'NEO5G', cur: 35, min: 25, price: 80.00, hsn: '3004', gst: 12, mfg: 'GSK' },
  { name: 'Lulican', generic: 'Luliconazole', category: 'Ointments', strength: '10 g', sku: 'LULICAN', cur: 25, min: 20, price: 165.00, hsn: '3004', gst: 12, mfg: 'Glenmark' },
  { name: 'Fluka 150', generic: 'Fluconazole', category: 'Tablets', strength: '150 mg', sku: 'FLUKA150', cur: 100, min: 50, price: 14.50, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Zocon 150', generic: 'Fluconazole', category: 'Tablets', strength: '150 mg', sku: 'ZOCON150', cur: 80, min: 50, price: 13.00, hsn: '3004', gst: 12, mfg: 'FDC' },
  { name: 'Terbinaforce', generic: 'Terbinafine', category: 'Tablets', strength: '250 mg', sku: 'TERBI250', cur: 60, min: 40, price: 110.00, hsn: '3004', gst: 12, mfg: 'Mankind' },
  { name: 'Quadriderm', generic: 'Clotrimazole + Beclomethasone + Neomycin', category: 'Ointments', strength: '15 g', sku: 'QUAD15', cur: 45, min: 30, price: 125.00, hsn: '3004', gst: 12, mfg: 'Fulford' },
  { name: 'Lobate GM', generic: 'Clobetasol + Miconazole + Neomycin', category: 'Ointments', strength: '15 g', sku: 'LOBATEGM', cur: 55, min: 40, price: 95.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
  { name: 'Tenovate', generic: 'Clobetasol', category: 'Ointments', strength: '15 g', sku: 'TENO15', cur: 40, min: 30, price: 85.00, hsn: '3004', gst: 12, mfg: 'GSK' },
  { name: 'Mikacin 500', generic: 'Amikacin', category: 'Injections', strength: '500 mg', sku: 'MIKACIN', cur: 30, min: 20, price: 75.00, hsn: '3004', gst: 12, mfg: 'Aristo' },
  { name: 'Pan 40', generic: 'Pantoprazole', category: 'Tablets', strength: '40 mg', sku: 'PAN40', cur: 250, min: 100, price: 145.00, hsn: '3004', gst: 12, mfg: 'Alkem' },
  { name: 'Pantocid 40', generic: 'Pantoprazole', category: 'Tablets', strength: '40 mg', sku: 'PANTOCID', cur: 180, min: 100, price: 155.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
  { name: 'Nexpro 40', generic: 'Esomeprazole', category: 'Tablets', strength: '40 mg', sku: 'NEXPRO40', cur: 120, min: 80, price: 185.00, hsn: '3004', gst: 12, mfg: 'Torrent' },
  { name: 'Sompraz 40', generic: 'Esomeprazole', category: 'Tablets', strength: '40 mg', sku: 'SOMPRAZ', cur: 90, min: 60, price: 170.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
  { name: 'Lanzol 30', generic: 'Lansoprazole', category: 'Capsules', strength: '30 mg', sku: 'LANZOL', cur: 80, min: 50, price: 95.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Aciloc 150', generic: 'Ranitidine', category: 'Tablets', strength: '150 mg', sku: 'ACILOC', cur: 200, min: 100, price: 35.00, hsn: '3004', gst: 12, mfg: 'Cadila' },
  { name: 'Aristozyme', generic: 'Diastase + Pepsin', category: 'Syrups', strength: '200 ml', sku: 'ARISTO200', cur: 60, min: 40, price: 110.00, hsn: '3004', gst: 12, mfg: 'Aristo' },
  { name: 'Unienzyme', generic: 'Fungal Diastase + Papain', category: 'Tablets', strength: 'Standard', sku: 'UNIENZ', cur: 150, min: 80, price: 65.00, hsn: '3004', gst: 12, mfg: 'Torrent' },
  { name: 'Fepanil 500', generic: 'Paracetamol', category: 'Tablets', strength: '500 mg', sku: 'FEPANIL', cur: 180, min: 100, price: 15.00, hsn: '3004', gst: 12, mfg: 'Mankind' },
  { name: 'Ibugesic Plus', generic: 'Ibuprofen + Paracetamol', category: 'Syrups', strength: '60 ml', sku: 'IBUPLUS', cur: 50, min: 30, price: 42.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Flexon', generic: 'Ibuprofen + Paracetamol', category: 'Tablets', strength: '400mg+325mg', sku: 'FLEXON', cur: 140, min: 80, price: 28.00, hsn: '3004', gst: 12, mfg: 'Aristo' },
  { name: 'Myoril 4mg', generic: 'Thiocolchicoside', category: 'Capsules', strength: '4 mg', sku: 'MYORIL4', cur: 60, min: 40, price: 195.00, hsn: '3004', gst: 12, mfg: 'Sanofi' },
  { name: 'Zyloric 100', generic: 'Allopurinol', category: 'Tablets', strength: '100 mg', sku: 'ZYLORIC', cur: 80, min: 50, price: 28.00, hsn: '3004', gst: 12, mfg: 'GSK' },
  { name: 'Feburic 40', generic: 'Febuxostat', category: 'Tablets', strength: '40 mg', sku: 'FEBURIC', cur: 45, min: 30, price: 125.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
  { name: 'Urimax 0.4', generic: 'Tamsulosin', category: 'Capsules', strength: '0.4 mg', sku: 'URIMAX', cur: 70, min: 50, price: 155.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Veltam 0.4', generic: 'Tamsulosin', category: 'Tablets', strength: '0.4 mg', sku: 'VELTAM', cur: 60, min: 40, price: 145.00, hsn: '3004', gst: 12, mfg: 'Intas' },
  { name: 'Dytor 10', generic: 'Torsemide', category: 'Tablets', strength: '10 mg', sku: 'DYTOR10', cur: 90, min: 60, price: 78.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
  { name: 'Lasix 40', generic: 'Furosemide', category: 'Tablets', strength: '40 mg', sku: 'LASIX40', cur: 120, min: 80, price: 12.50, hsn: '3004', gst: 12, mfg: 'Sanofi' },
  { name: 'Eptoin 100', generic: 'Phenytoin', category: 'Tablets', strength: '100 mg', sku: 'EPTOIN', cur: 60, min: 40, price: 32.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
  { name: 'Tegrital 200', generic: 'Carbamazepine', category: 'Tablets', strength: '200 mg', sku: 'TEGRITAL', cur: 80, min: 50, price: 55.00, hsn: '3004', gst: 12, mfg: 'Novartis' },
  { name: 'Levipil 500', generic: 'Levetiracetam', category: 'Tablets', strength: '500 mg', sku: 'LEVIPIL', cur: 75, min: 40, price: 110.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
  { name: 'Galvus Met', generic: 'Vildagliptin + Metformin', category: 'Tablets', strength: '50mg+500mg', sku: 'GALVUS', cur: 110, min: 80, price: 290.00, hsn: '3004', gst: 12, mfg: 'Novartis' },
  { name: 'Jardiance 10', generic: 'Empagliflozin', category: 'Tablets', strength: '10 mg', sku: 'JARDIANCE', cur: 45, min: 30, price: 550.00, hsn: '3004', gst: 12, mfg: 'Boehringer Ingelheim' },
  { name: 'Janumet', generic: 'Sitagliptin + Metformin', category: 'Tablets', strength: '50mg+500mg', sku: 'JANUMET', cur: 60, min: 40, price: 380.00, hsn: '3004', gst: 12, mfg: 'MSD' },
  { name: 'Thyrox 50', generic: 'Thyroxine', category: 'Tablets', strength: '50 mcg', sku: 'THYROX50', cur: 140, min: 80, price: 125.00, hsn: '3004', gst: 12, mfg: 'Macleods' },
  { name: 'Wysolone 10', generic: 'Prednisolone', category: 'Tablets', strength: '10 mg', sku: 'WYSO10', cur: 200, min: 100, price: 15.00, hsn: '3004', gst: 12, mfg: 'Pfizer' },
  { name: 'Dexona', generic: 'Dexamethasone', category: 'Tablets', strength: '0.5 mg', sku: 'DEXONA', cur: 300, min: 150, price: 6.00, hsn: '3004', gst: 12, mfg: 'Zydus' }
];

async function seed() {
  await client.connect();
  console.log('Connected to DB. Inserting 45 MORE completely new medicines WITH manufacturer info...');
  
  let count = 0;
  for (const m of freshMedicines) {
    try {
      const query = `
        INSERT INTO medicines (
          pharmacy_id, name, generic_name, category, strength, sku, 
          current_stock, minimum_stock, selling_price, hsn_code, gst_rate, manufacturer
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (sku) DO NOTHING
      `;
      const values = [
        1, m.name, m.generic, m.category, m.strength, m.sku,
        m.cur, m.min, m.price, m.hsn, m.gst, m.mfg
      ];
      
      const res = await client.query(query, values);
      if (res.rowCount > 0) count++;
    } catch (e) {
      console.error('Error inserting', m.name, e.message);
    }
  }
  
  console.log(`Inserted ${count} brand new unique medicines.`);
  await client.end();
}

seed();
