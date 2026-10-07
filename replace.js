const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'pharmacy_pc/src');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    let filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}
const files = walk(dir);
files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('DEV_PHARMACY_ID')) {
      content = content.replace(/DEV_PHARMACY_ID/g, 'getPharmacyId()');
      content = content.replace(/import\s+\{\s*getPharmacyId\(\)\s*\}\s*from\s*(['"].*config\/development['"]);/g, "import { getPharmacyId } from $1;");
      content = content.replace(/import\s+\{\s*getPharmacyId\(\)\s*\}\s*from/g, "import { getPharmacyId } from");
      // Double check any weird imports
      content = content.replace(/getPharmacyId\(\) as DEV_PHARMACY_ID/g, "getPharmacyId as DEV_PHARMACY_ID"); // just in case
      fs.writeFileSync(file, content);
      console.log('Updated: ' + file);
    }
  }
});
