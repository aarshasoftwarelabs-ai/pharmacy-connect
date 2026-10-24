const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  const pharmRes = await client.query('SELECT id FROM pharmacies');
  if (pharmRes.rows.length === 0) {
      console.log('No pharmacies found!');
      await client.end();
      return;
  }
  const pharmacies = pharmRes.rows;
  console.log(`Found ${pharmacies.length} pharmacies. Inserting medicines...`);

  const batch4Medicines = [
    { name: 'Calcium Sandoz', generic: 'Calcium Gluconate', category: 'Tablets', strength: '500 mg', sku: 'CALSAN500', cur: 150, min: 100, price: 45.00, hsn: '3004', gst: 12, mfg: 'Novartis' },
    { name: 'Azee 250', generic: 'Azithromycin', category: 'Tablets', strength: '250 mg', sku: 'AZEE250', cur: 80, min: 50, price: 71.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
    { name: 'Omnacortil 10', generic: 'Prednisolone', category: 'Tablets', strength: '10 mg', sku: 'OMNA10', cur: 200, min: 100, price: 9.50, hsn: '3004', gst: 12, mfg: 'Macleods' },
    { name: 'Omnacortil 20', generic: 'Prednisolone', category: 'Tablets', strength: '20 mg', sku: 'OMNA20', cur: 150, min: 80, price: 18.00, hsn: '3004', gst: 12, mfg: 'Macleods' },
    { name: 'Thyronorm 100mcg', generic: 'Thyroxine', category: 'Tablets', strength: '100 mcg', sku: 'THY100', cur: 120, min: 60, price: 165.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
    { name: 'Thyronorm 25mcg', generic: 'Thyroxine', category: 'Tablets', strength: '25 mcg', sku: 'THY25MCG', cur: 100, min: 50, price: 120.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
    { name: 'Novomix 30 Flexpen', generic: 'Biphasic Insulin Aspart', category: 'Injections', strength: '100 IU/ml', sku: 'NOVOMIX30', cur: 30, min: 15, price: 680.00, hsn: '3004', gst: 12, mfg: 'Novo Nordisk' },
    { name: 'Mixtard 30 HM', generic: 'Biphasic Isophane Insulin', category: 'Injections', strength: '40 IU/ml', sku: 'MIXTARD30', cur: 45, min: 20, price: 165.00, hsn: '3004', gst: 12, mfg: 'Novo Nordisk' },
    { name: 'Lantus', generic: 'Insulin Glargine', category: 'Injections', strength: '100 IU/ml', sku: 'LANTUS', cur: 25, min: 10, price: 785.00, hsn: '3004', gst: 12, mfg: 'Sanofi' },
    { name: 'Prazopress 1', generic: 'Prazosin', category: 'Tablets', strength: '1 mg', sku: 'PRAZO1', cur: 60, min: 40, price: 75.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
    { name: 'Minipress XL 2.5', generic: 'Prazosin', category: 'Tablets', strength: '2.5 mg', sku: 'MINI2.5', cur: 50, min: 30, price: 125.00, hsn: '3004', gst: 12, mfg: 'Pfizer' },
    { name: 'Cilnidipine 10', generic: 'Cilnidipine', category: 'Tablets', strength: '10 mg', sku: 'CILNI10', cur: 180, min: 100, price: 85.00, hsn: '3004', gst: 12, mfg: 'Generic' },
    { name: 'Amlodac 5', generic: 'Amlodipine', category: 'Tablets', strength: '5 mg', sku: 'AMLODAC5', cur: 300, min: 150, price: 25.00, hsn: '3004', gst: 12, mfg: 'Zydus' },
    { name: 'Metolar XR 50', generic: 'Metoprolol', category: 'Tablets', strength: '50 mg', sku: 'METXR50', cur: 140, min: 80, price: 68.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
    { name: 'Metpure XL 25', generic: 'Metoprolol', category: 'Tablets', strength: '25 mg', sku: 'METXL25', cur: 110, min: 60, price: 55.00, hsn: '3004', gst: 12, mfg: 'Emcure' },
    { name: 'Concor 5', generic: 'Bisoprolol', category: 'Tablets', strength: '5 mg', sku: 'CONCOR5', cur: 90, min: 50, price: 85.00, hsn: '3004', gst: 12, mfg: 'Merck' },
    { name: 'Inderal 10', generic: 'Propranolol', category: 'Tablets', strength: '10 mg', sku: 'INDERAL10', cur: 160, min: 100, price: 22.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
    { name: 'Aldactone 25', generic: 'Spironolactone', category: 'Tablets', strength: '25 mg', sku: 'ALDA25', cur: 80, min: 50, price: 34.00, hsn: '3004', gst: 12, mfg: 'RPG' },
    { name: 'Cardace 2.5', generic: 'Ramipril', category: 'Tablets', strength: '2.5 mg', sku: 'CARD2.5', cur: 120, min: 80, price: 55.00, hsn: '3004', gst: 12, mfg: 'Sanofi' },
    { name: 'Cardace 5', generic: 'Ramipril', category: 'Tablets', strength: '5 mg', sku: 'CARD5', cur: 100, min: 60, price: 95.00, hsn: '3004', gst: 12, mfg: 'Sanofi' },
    { name: 'Amlokind 5', generic: 'Amlodipine', category: 'Tablets', strength: '5 mg', sku: 'AMLOKIND5', cur: 400, min: 200, price: 18.00, hsn: '3004', gst: 12, mfg: 'Mankind' },
    { name: 'Nebicard 5', generic: 'Nebivolol', category: 'Tablets', strength: '5 mg', sku: 'NEBICARD5', cur: 70, min: 40, price: 85.00, hsn: '3004', gst: 12, mfg: 'Torrent' },
    { name: 'Glycomet 500', generic: 'Metformin', category: 'Tablets', strength: '500 mg', sku: 'GLY500', cur: 500, min: 200, price: 24.00, hsn: '3004', gst: 12, mfg: 'USV' },
    { name: 'Glycomet 1000', generic: 'Metformin', category: 'Tablets', strength: '1000 mg', sku: 'GLY1000', cur: 300, min: 150, price: 42.00, hsn: '3004', gst: 12, mfg: 'USV' },
    { name: 'Amaryl 1mg', generic: 'Glimepiride', category: 'Tablets', strength: '1 mg', sku: 'AMARYL1', cur: 150, min: 80, price: 55.00, hsn: '3004', gst: 12, mfg: 'Sanofi' },
    { name: 'Amaryl 2mg', generic: 'Glimepiride', category: 'Tablets', strength: '2 mg', sku: 'AMARYL2', cur: 120, min: 60, price: 95.00, hsn: '3004', gst: 12, mfg: 'Sanofi' },
    { name: 'Diamicron MR', generic: 'Gliclazide', category: 'Tablets', strength: '30 mg', sku: 'DIAMI30', cur: 80, min: 50, price: 135.00, hsn: '3004', gst: 12, mfg: 'Serdia' },
    { name: 'Galvus 50', generic: 'Vildagliptin', category: 'Tablets', strength: '50 mg', sku: 'GALVUS50', cur: 60, min: 30, price: 245.00, hsn: '3004', gst: 12, mfg: 'Novartis' },
    { name: 'Jalra M', generic: 'Vildagliptin + Metformin', category: 'Tablets', strength: '50mg+500mg', sku: 'JALRAM', cur: 70, min: 40, price: 285.00, hsn: '3004', gst: 12, mfg: 'USV' },
    { name: 'Forxiga 10', generic: 'Dapagliflozin', category: 'Tablets', strength: '10 mg', sku: 'FORX10', cur: 45, min: 20, price: 560.00, hsn: '3004', gst: 12, mfg: 'AstraZeneca' },
    { name: 'Istamet', generic: 'Sitagliptin + Metformin', category: 'Tablets', strength: '50mg+500mg', sku: 'ISTAMET', cur: 55, min: 30, price: 410.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
    { name: 'Volini Spray', generic: 'Diclofenac Diethylamine', category: 'Others', strength: '40 g', sku: 'VOLSPRAY', cur: 120, min: 60, price: 155.00, hsn: '3004', gst: 12, mfg: 'Sun Pharma' },
    { name: 'Relispray', generic: 'Ayurvedic Pain Spray', category: 'Others', strength: '50 g', sku: 'RELISPRAY', cur: 80, min: 40, price: 145.00, hsn: '3004', gst: 12, mfg: 'Midas Care' },
    { name: 'Fastum Gel', generic: 'Ketoprofen', category: 'Ointments', strength: '30 g', sku: 'FASTUM', cur: 40, min: 20, price: 135.00, hsn: '3004', gst: 12, mfg: 'Menarini' },
    { name: 'Voveran Emulgel', generic: 'Diclofenac', category: 'Ointments', strength: '30 g', sku: 'VOVEMUL', cur: 90, min: 50, price: 165.00, hsn: '3004', gst: 12, mfg: 'Novartis' },
    { name: 'Himalaya Cystone', generic: 'Ayurvedic', category: 'Tablets', strength: '60 tabs', sku: 'CYSTONE', cur: 150, min: 80, price: 135.00, hsn: '3004', gst: 12, mfg: 'Himalaya' },
    { name: 'Himalaya Septilin', generic: 'Ayurvedic', category: 'Tablets', strength: '60 tabs', sku: 'SEPTILIN', cur: 120, min: 60, price: 145.00, hsn: '3004', gst: 12, mfg: 'Himalaya' },
    { name: 'Himalaya Speman', generic: 'Ayurvedic', category: 'Tablets', strength: '60 tabs', sku: 'SPEMAN', cur: 80, min: 40, price: 165.00, hsn: '3004', gst: 12, mfg: 'Himalaya' },
    { name: 'Zandu Balm', generic: 'Ayurvedic Balm', category: 'Ointments', strength: '25 ml', sku: 'ZANDU', cur: 200, min: 100, price: 45.00, hsn: '3004', gst: 12, mfg: 'Zandu' },
    { name: 'Amrutanjan', generic: 'Ayurvedic Balm', category: 'Ointments', strength: '30 g', sku: 'AMRUT', cur: 150, min: 80, price: 55.00, hsn: '3004', gst: 12, mfg: 'Amrutanjan' },
    { name: 'Honitus Syrup', generic: 'Ayurvedic Cough Syrup', category: 'Syrups', strength: '100 ml', sku: 'HONITUS', cur: 180, min: 100, price: 95.00, hsn: '3004', gst: 12, mfg: 'Dabur' },
    { name: 'Koflet Syrup', generic: 'Ayurvedic Cough Syrup', category: 'Syrups', strength: '100 ml', sku: 'KOFLET', cur: 120, min: 60, price: 85.00, hsn: '3004', gst: 12, mfg: 'Himalaya' },
    { name: 'Tixylix', generic: 'Pholcodine + Promethazine', category: 'Syrups', strength: '60 ml', sku: 'TIXYLIX', cur: 50, min: 30, price: 95.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
    { name: 'Zedex Syrup', generic: 'Dextromethorphan + Bromhexine', category: 'Syrups', strength: '100 ml', sku: 'ZEDEX', cur: 90, min: 50, price: 135.00, hsn: '3004', gst: 12, mfg: 'Wockhardt' },
    { name: 'Asthalin Syrup', generic: 'Salbutamol', category: 'Syrups', strength: '100 ml', sku: 'ASTSYR', cur: 60, min: 30, price: 18.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
    { name: 'Bro-Zedex', generic: 'Terbutaline + Bromhexine', category: 'Syrups', strength: '100 ml', sku: 'BROZEDEX', cur: 70, min: 40, price: 145.00, hsn: '3004', gst: 12, mfg: 'Wockhardt' },
    { name: 'Mucinac 600', generic: 'Acetylcysteine', category: 'Tablets', strength: '600 mg', sku: 'MUCINAC600', cur: 45, min: 25, price: 195.00, hsn: '3004', gst: 12, mfg: 'Cipla' },
    { name: 'Limcee Plus', generic: 'Vitamin C + Zinc', category: 'Tablets', strength: 'Standard', sku: 'LIMPLUS', cur: 150, min: 80, price: 45.00, hsn: '3004', gst: 12, mfg: 'Abbott' },
    { name: 'Supradyn Daily', generic: 'Multivitamin', category: 'Tablets', strength: 'Standard', sku: 'SUPDAILY', cur: 200, min: 100, price: 55.00, hsn: '3004', gst: 12, mfg: 'Bayer' },
    { name: 'Zincold', generic: 'Paracetamol + Phenylephrine + Cetirizine', category: 'Tablets', strength: 'Standard', sku: 'ZINCOLD', cur: 80, min: 40, price: 42.00, hsn: '3004', gst: 12, mfg: 'Medley' }
  ];

  for (const pharm of pharmacies) {
    let count = 0;
    for (const m of batch4Medicines) {
        try {
            const query = `
              INSERT INTO medicines (
                pharmacy_id, name, generic_name, category, strength, sku, 
                current_stock, minimum_stock, selling_price, hsn_code, gst_rate, manufacturer
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT ON CONSTRAINT medicines_sku_pharmacy_id_key DO NOTHING
            `;
            const values = [
              pharm.id, m.name, m.generic, m.category, m.strength, m.sku,
              m.cur, m.min, m.price, m.hsn, m.gst, m.mfg
            ];
            const res = await client.query(query, values);
            if (res.rowCount > 0) count++;
        } catch (e) {
            // Some databases just use ON CONFLICT (sku) if it's unique across DB, let's try that fallback
            try {
                const query2 = `
                  INSERT INTO medicines (
                    pharmacy_id, name, generic_name, category, strength, sku, 
                    current_stock, minimum_stock, selling_price, hsn_code, gst_rate, manufacturer
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                  ON CONFLICT (sku) DO NOTHING
                `;
                const values = [
                  pharm.id, m.name, m.generic, m.category, m.strength, m.sku,
                  m.cur, m.min, m.price, m.hsn, m.gst, m.mfg
                ];
                const res = await client.query(query2, values);
                if (res.rowCount > 0) count++;
            } catch (err) {
                // ignore
            }
        }
    }
    console.log(`Inserted ${count} medicines for pharmacy ${pharm.id}`);
  }
  
  await client.end();
}

run().catch(console.error);
