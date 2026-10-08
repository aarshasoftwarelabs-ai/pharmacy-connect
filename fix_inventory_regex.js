const fs = require('fs');
const path = require('path');
const inventoryPath = path.join(__dirname, 'pharmacy_pc', 'src', 'pages', 'Inventory.tsx');
let file = fs.readFileSync(inventoryPath, 'utf8');

// Replace handleStartScan
const startScanRegex = /const \[isScannerOpen, setIsScannerOpen\] = useState\(false\);[\s\S]*?\}, 2500\);\s*\};/;
const newHandleStartScanStr = `const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleStartScan = () => {
    setIsScannerOpen(true);
    setScannerError(null);
    setIsScanning(false);
    setBarcodeInput('');
  };

  useEffect(() => {
    if (!isScannerOpen || isScanning || scannerError) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (barcodeInput.length > 3) {
          setIsScanning(true);
          
          setTimeout(() => {
            setIsScanning(false);
            setIsScannerOpen(false);
            
            const scannedMed = {
              name: 'Amoxycillin 500mg',
              genericName: 'Amoxicillin',
              category: 'Tablets',
              strength: '500 mg',
              dosageForm: 'Tablet',
              mrp: 120,
              sellingPrice: 100,
              currentStock: 50,
              barcode: barcodeInput,
              manufacturer: 'Generic Company'
            };
            setSelectedMedicine(scannedMed as any);
            setIsAddModalOpen(true);
            setBarcodeInput('');
          }, 2000);
        }
      } else if (e.key.length === 1) {
        setBarcodeInput(prev => prev + e.key);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScannerOpen, isScanning, scannerError, barcodeInput]);`;

file = file.replace(startScanRegex, newHandleStartScanStr);

// Replace UI
const scanningUiRegex = /\{\/\* Scanning Animation \*\/\}\s*\{isScanning && \([\s\S]*?Position barcode within frame\.\.\.<\/p>\s*<\/>\s*\)\}/;
const newScanningUi = `{/* Waiting State */}
                  {!isScanning && (
                    <div className="absolute inset-x-8 inset-y-12 border-2 border-white/10 rounded-lg flex flex-col items-center justify-center">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white/30 -mt-[2px] -ml-[2px] rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white/30 -mt-[2px] -mr-[2px] rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white/30 -mb-[2px] -ml-[2px] rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white/30 -mb-[2px] -mr-[2px] rounded-br"></div>
                      <p className="text-white/40 text-xs font-medium text-center px-4 animate-pulse">Waiting for Scanner Input...</p>
                      <div className="mt-2 text-[10px] text-white/30 border border-white/10 px-2 py-1 rounded bg-black/20">
                        {barcodeInput ? \`Input: \${barcodeInput}\` : 'Scan now'}
                      </div>
                    </div>
                  )}
                  
                  {/* Scanning Animation */}
                  {isScanning && (
                    <>
                      <div className="absolute left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_3px_rgba(34,197,94,0.6)] z-10" style={{ animation: 'scanAnim 1.5s infinite linear' }}></div>
                      <style>{\`
                        @keyframes scanAnim {
                          0% { top: 10%; }
                          50% { top: 90%; }
                          100% { top: 10%; }
                        }
                      \`}</style>
                      <div className="absolute inset-x-8 inset-y-12 border-2 border-green-500/30 rounded-lg flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-[2px] -ml-[2px] rounded-tl"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-[2px] -mr-[2px] rounded-tr"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-[2px] -ml-[2px] rounded-bl"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-[2px] -mr-[2px] rounded-br"></div>
                        <p className="text-green-400 text-sm font-bold text-center px-4 animate-bounce">Processing...</p>
                      </div>
                    </>
                  )}`;

file = file.replace(scanningUiRegex, newScanningUi);

fs.writeFileSync(inventoryPath, file);
console.log("Success");
