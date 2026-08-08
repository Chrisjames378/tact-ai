const fs = require('fs');

let content = fs.readFileSync('src/components/RepairToolbox.tsx', 'utf8');

// Insert imports
content = content.replace(
  'import { DiagnosticData } from "../types";',
  'import { DiagnosticData } from "../types";\nimport { PrintableLogTemplate } from "./PrintableLogTemplate";\nimport { generatePdfFromElement } from "../utils/pdfGenerator";\nimport { uploadPdfToDrive } from "../utils/driveUploader";\nimport { getAccessToken } from "../utils/googleAuth";'
);

// Insert states
content = content.replace(
  'const [dataExported, setDataExported] = useState(false);',
  `const [dataExported, setDataExported] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [isDriveUploading, setIsDriveUploading] = useState(false);
  const [driveUploadSuccess, setDriveUploadSuccess] = useState(false);`
);

// Insert handlers
const handlers = `
  const handleExportPDF = async () => {
    setIsPdfExporting(true);
    try {
      const blob = await generatePdfFromElement("printable-log-container");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = \`Tact-AI-Repair-Log-\${new Date().getTime()}.pdf\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
    setIsPdfExporting(false);
  };

  const handleDriveUpload = async () => {
    const token = getAccessToken();
    if (!token) {
      alert("Please link your Google account to use Drive upload.");
      return;
    }
    
    setIsDriveUploading(true);
    try {
      const blob = await generatePdfFromElement("printable-log-container");
      await uploadPdfToDrive(token, blob, \`Tact-AI-Repair-Log-\${new Date().getTime()}.pdf\`);
      setDriveUploadSuccess(true);
      setTimeout(() => setDriveUploadSuccess(false), 3000);
    } catch (e) {
      console.error("Drive upload failed:", e);
      alert("Failed to upload to Google Drive");
    }
    setIsDriveUploading(false);
  };

  const handlePrint = () => {
    window.print();
  };
`;

content = content.replace(
  'const handleExportData = () => {',
  handlers + '\n  const handleExportData = () => {'
);

// Insert buttons
const buttons = `
          <button
            onClick={handlePrint}
            title="Print Log"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          
          <button
            onClick={handleExportPDF}
            disabled={isPdfExporting}
            title="Download PDF"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-md font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            {isPdfExporting ? "Generating..." : "Save PDF"}
          </button>
          
          <button
            onClick={handleDriveUpload}
            disabled={isDriveUploading}
            title="Upload PDF to Google Drive"
            className={\`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-xs font-semibold border transition-all cursor-pointer \${
              driveUploadSuccess
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
            }\`}
          >
            <Cloud className="w-3.5 h-3.5" />
            {isDriveUploading ? "Uploading..." : driveUploadSuccess ? "Saved to Drive!" : "Save to Drive"}
          </button>
`;

content = content.replace(
  '<button\n            onClick={handleExportData}',
  buttons + '\n          <button\n            onClick={handleExportData}'
);

// We need to add Printer, FileText, Cloud to lucide-react imports
content = content.replace(
  'import { Battery, Wifi, Cpu, Wrench, Activity, Mic, Square, Play, Shield, ArrowRight, Smartphone, RefreshCw, XCircle, Settings, Download, Send, RefreshCcw, Maximize, Target, Zap, ZapOff, CheckCircle, Database } from "lucide-react";',
  'import { Battery, Wifi, Cpu, Wrench, Activity, Mic, Square, Play, Shield, ArrowRight, Smartphone, RefreshCw, XCircle, Settings, Download, Send, RefreshCcw, Maximize, Target, Zap, ZapOff, CheckCircle, Database, Printer, FileText, Cloud } from "lucide-react";'
);

// Add PrintableLogTemplate to render
content = content.replace(
  'return (',
  'return (\n    <>\n      <PrintableLogTemplate logs={[...viresScanLogs, ...stressLogs, ...wsLogs, ...repairLogs]} report={stressReport} deviceName={deviceName || "Unknown Device"} />'
);

content = content.replace(
  '</motion.div>\n  );\n}',
  '</motion.div>\n    </>\n  );\n}'
);


fs.writeFileSync('src/components/RepairToolbox.tsx', content);
console.log('Patched');
