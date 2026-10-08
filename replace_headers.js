const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'pharmacy_pc/src/pages');

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    
    files.forEach((file) => {
        if (file.endsWith('.tsx') && !file.includes('Wholesale') && file !== 'Login.tsx') {
            const filePath = path.join(directoryPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            const headerRegex = /<(h1|h2) className="([^"]*text-2xl[^"]*(font-bold|font-extrabold)[^"]*text-slate-[89]00[^"]*)"/g;
            
            let updated = false;
            content = content.replace(headerRegex, (match, tag, classes) => {
                let newClasses = classes
                    .replace(/text-2xl/, 'text-3xl')
                    .replace(/sm:text-3xl/, '')
                    .replace(/font-bold/, 'font-extrabold')
                    .replace(/text-slate-[89]00/, 'text-transparent bg-clip-text bg-gradient-to-r from-pharmacy-600 to-blue-600');
                
                if (!newClasses.includes('tracking-tight')) {
                    newClasses += ' tracking-tight';
                }
                
                // Clean up double spaces
                newClasses = newClasses.replace(/\s+/g, ' ').trim();
                
                updated = true;
                return `<${tag} className="${newClasses}"`;
            });
            
            if (updated) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    });
});
