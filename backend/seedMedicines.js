const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.lvitnocuqbgdnoqjadpx:PharmacyDb2026X9@aws-0-ap-south-1.pooler.supabase.com:5432/postgres'
});

const evenMoreMedicines = [
  { name: 'Meftal Spas', generic: 'Mefenamic Acid + Dicyclomine', category: 'Tablets', strength: '250mg + 10mg', sku: 'MEFSPAS', cur: 120, min: 100, price: 46.50, hsn: '3004', gst: 12 },
  { name: 'Cyclopam', generic: 'Dicyclomine + Paracetamol', category: 'Tablets', strength: '20mg + 500mg', sku: 'CYC500', cur: 80, min: 80, price: 52.00, hsn: '3004', gst: 12 },
  { name: 'Buscopan', generic: 'Hyoscine Butylbromide', category: 'Tablets', strength: '10 mg', sku: 'BUSC10', cur: 50, min: 40, price: 34.00, hsn: '3004', gst: 12 },
  { name: 'Soframycin', generic: 'Framycetin', category: 'Ointments', strength: '30 g', sku: 'SOFRA30', cur: 110, min: 50, price: 54.00, hsn: '3004', gst: 12 },
  { name: 'Betadine Solution', generic: 'Povidone Iodine', category: 'Others', strength: '100 ml', sku: 'BETS100', cur: 45, min: 30, price: 120.00, hsn: '3004', gst: 12 },
  { name: 'Ketomac Shampoo', generic: 'Ketoconazole', category: 'Others', strength: '110 ml', sku: 'KETO110', cur: 25, min: 20, price: 210.00, hsn: '3004', gst: 18 },
  { name: 'Candid Mouth Paint', generic: 'Clotrimazole', category: 'Drops', strength: '15 ml', sku: 'CANDMP', cur: 40, min: 20, price: 145.00, hsn: '3004', gst: 12 },
  { name: 'Shelcal XT', generic: 'Calcium + Vitamin D3 + Methylcobalamin', category: 'Tablets', strength: 'Standard', sku: 'SHELXT', cur: 150, min: 100, price: 320.00, hsn: '3004', gst: 12 },
  { name: 'Uprise D3 60K', generic: 'Cholecalciferol', category: 'Capsules', strength: '60000 IU', sku: 'UPRISED3', cur: 200, min: 100, price: 250.00, hsn: '3004', gst: 12 },
  { name: 'Orofer XT', generic: 'Ferrous Ascorbate + Folic Acid', category: 'Tablets', strength: 'Standard', sku: 'OROXT', cur: 180, min: 120, price: 165.00, hsn: '3004', gst: 12 },
  { name: 'Fefol Z', generic: 'Iron + Folic Acid + Zinc', category: 'Capsules', strength: 'Standard', sku: 'FEFOLZ', cur: 90, min: 80, price: 130.00, hsn: '3004', gst: 12 },
  { name: 'Folvite', generic: 'Folic Acid', category: 'Tablets', strength: '5 mg', sku: 'FOLV5', cur: 300, min: 150, price: 72.00, hsn: '3004', gst: 12 },
  { name: 'Ecosprin 150', generic: 'Aspirin', category: 'Tablets', strength: '150 mg', sku: 'ECO150', cur: 250, min: 100, price: 9.00, hsn: '3004', gst: 12 },
  { name: 'Atorva 10', generic: 'Atorvastatin', category: 'Tablets', strength: '10 mg', sku: 'ATOR10', cur: 140, min: 80, price: 75.00, hsn: '3004', gst: 12 },
  { name: 'Atorva 20', generic: 'Atorvastatin', category: 'Tablets', strength: '20 mg', sku: 'ATOR20', cur: 100, min: 60, price: 145.00, hsn: '3004', gst: 12 },
  { name: 'Rosuvas 10', generic: 'Rosuvastatin', category: 'Tablets', strength: '10 mg', sku: 'ROSU10', cur: 180, min: 100, price: 165.00, hsn: '3004', gst: 12 },
  { name: 'Clopilet', generic: 'Clopidogrel', category: 'Tablets', strength: '75 mg', sku: 'CLOPI75', cur: 80, min: 60, price: 95.00, hsn: '3004', gst: 12 },
  { name: 'Udiliv 300', generic: 'Ursodeoxycholic Acid', category: 'Tablets', strength: '300 mg', sku: 'UDI300', cur: 45, min: 30, price: 580.00, hsn: '3004', gst: 12 },
  { name: 'Duphalac', generic: 'Lactulose', category: 'Syrups', strength: '150 ml', sku: 'DUPHA150', cur: 60, min: 40, price: 175.00, hsn: '3004', gst: 12 },
  { name: 'Cremaffin', generic: 'Liquid Paraffin + Milk of Magnesia', category: 'Syrups', strength: '225 ml', sku: 'CREMA225', cur: 80, min: 50, price: 215.00, hsn: '3004', gst: 12 },
  { name: 'Dulcoflex', generic: 'Bisacodyl', category: 'Tablets', strength: '5 mg', sku: 'DULCO5', cur: 400, min: 200, price: 12.00, hsn: '3004', gst: 12 },
  { name: 'Enterogermina', generic: 'Bacillus Clausii', category: 'Others', strength: '5 ml ampoule', sku: 'ENTERO', cur: 120, min: 80, price: 52.00, hsn: '3004', gst: 12 },
  { name: 'Vizylac', generic: 'Lactic Acid Bacillus', category: 'Capsules', strength: 'Standard', sku: 'VIZYLAC', cur: 150, min: 100, price: 65.00, hsn: '3004', gst: 12 },
  { name: 'O2', generic: 'Ofloxacin + Ornidazole', category: 'Tablets', strength: '200mg + 500mg', sku: 'O2TAB', cur: 180, min: 100, price: 145.00, hsn: '3004', gst: 12 },
  { name: 'Norflox TZ', generic: 'Norfloxacin + Tinidazole', category: 'Tablets', strength: '400mg + 600mg', sku: 'NORTZ', cur: 120, min: 80, price: 92.00, hsn: '3004', gst: 12 },
  { name: 'Zenflox TZ', generic: 'Ofloxacin + Tinidazole', category: 'Tablets', strength: '200mg + 600mg', sku: 'ZENTZ', cur: 90, min: 60, price: 110.00, hsn: '3004', gst: 12 },
  { name: 'Taxim O 100', generic: 'Cefixime', category: 'Tablets', strength: '100 mg', sku: 'TAX100', cur: 60, min: 40, price: 75.00, hsn: '3004', gst: 12 },
  { name: 'Cefakind 500', generic: 'Cefuroxime', category: 'Tablets', strength: '500 mg', sku: 'CEFA500', cur: 45, min: 30, price: 385.00, hsn: '3004', gst: 12 },
  { name: 'Novamox 500', generic: 'Amoxicillin', category: 'Capsules', strength: '500 mg', sku: 'NOVA500', cur: 110, min: 80, price: 82.00, hsn: '3004', gst: 12 },
  { name: 'Cetzine', generic: 'Cetirizine', category: 'Tablets', strength: '10 mg', sku: 'CET10', cur: 250, min: 150, price: 19.50, hsn: '3004', gst: 12 },
  { name: 'Alerid', generic: 'Cetirizine', category: 'Tablets', strength: '10 mg', sku: 'ALERID', cur: 120, min: 100, price: 18.00, hsn: '3004', gst: 12 },
  { name: 'Avil', generic: 'Pheniramine Maleate', category: 'Tablets', strength: '25 mg', sku: 'AVIL25', cur: 300, min: 200, price: 11.00, hsn: '3004', gst: 12 },
  { name: 'Caladryl', generic: 'Calamine + Diphenhydramine', category: 'Others', strength: '100 ml', sku: 'CALA100', cur: 60, min: 40, price: 85.00, hsn: '3004', gst: 12 },
  { name: 'Lacto Calamine', generic: 'Calamine', category: 'Others', strength: '120 ml', sku: 'LACTO120', cur: 90, min: 50, price: 199.00, hsn: '3004', gst: 12 },
  { name: 'Candid Dusting Powder', generic: 'Clotrimazole', category: 'Others', strength: '100 g', sku: 'CANDIDP', cur: 140, min: 80, price: 145.00, hsn: '3004', gst: 12 },
  { name: 'Itchguard', generic: 'Clotrimazole', category: 'Ointments', strength: '20 g', sku: 'ITCH20', cur: 80, min: 50, price: 95.00, hsn: '3004', gst: 12 },
  { name: 'Ringguard', generic: 'Miconazole', category: 'Ointments', strength: '20 g', sku: 'RING20', cur: 70, min: 50, price: 85.00, hsn: '3004', gst: 12 },
  { name: 'Krack Cream', generic: 'Ayurvedic Healing Cream', category: 'Ointments', strength: '25 g', sku: 'KRACK25', cur: 90, min: 60, price: 75.00, hsn: '3004', gst: 12 },
  { name: 'Burnol', generic: 'Aminacrine + Cetrimide', category: 'Ointments', strength: '20 g', sku: 'BURNOL', cur: 50, min: 30, price: 65.00, hsn: '3004', gst: 12 },
  { name: 'Zincocet', generic: 'Cetirizine + Paracetamol', category: 'Syrups', strength: '60 ml', sku: 'ZINCSYR', cur: 30, min: 20, price: 55.00, hsn: '3004', gst: 12 }
];

async function seed() {
  await client.connect();
  console.log('Connected to DB. Inserting MORE medicines...');
  
  let count = 0;
  for (const m of evenMoreMedicines) {
    try {
      const query = `
        INSERT INTO medicines (
          pharmacy_id, name, generic_name, category, strength, sku, 
          current_stock, minimum_stock, selling_price, hsn_code, gst_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (sku) DO NOTHING
      `;
      const values = [
        1, m.name, m.generic, m.category, m.strength, m.sku,
        m.cur, m.min, m.price, m.hsn, m.gst
      ];
      
      const res = await client.query(query, values);
      if (res.rowCount > 0) count++;
    } catch (e) {
      console.error('Error inserting', m.name, e.message);
    }
  }
  
  console.log(`Inserted ${count} new medicines.`);
  await client.end();
}

seed();
