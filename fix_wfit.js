const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'pharmacy_pc/src/pages');

fs.readdirSync(directoryPath).forEach((file) => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(directoryPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find className containing bg-clip-text and bg-gradient-to-r
        const regex = /className="([^"]*bg-clip-text bg-gradient-to-r[^"]*)"/g;
        
        let updated = false;
        content = content.replace(regex, (match, classes) => {
            if (!classes.includes('w-fit') && !classes.includes('inline-block') && !classes.includes('inline-flex')) {
                updated = true;
                // Add w-fit to ensure the background gradient stops exactly at the end of the text
                return `className="${classes} w-fit"`;
            }
            return match;
        });
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    }
});
