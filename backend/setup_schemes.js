const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS b2b_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pharmacy_id INTEGER NOT NULL,
      scheme_name VARCHAR(100) NOT NULL,
      medicine_id INTEGER,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      free_quantity INTEGER NOT NULL DEFAULT 0,
      discount_percent DECIMAL(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      valid_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pharmacy_id) REFERENCES users(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating b2b_schemes table', err);
    } else {
      console.log('Successfully created b2b_schemes table');
    }
    db.close();
  });
});
