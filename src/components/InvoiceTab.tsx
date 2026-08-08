import { HelpCircle } from "lucide-react";
import React, { useState } from 'react';
import { Download, Cloud, Printer, FileText, CheckCircle } from 'lucide-react';
import { uploadPdfToDrive } from '../utils/driveUploader';
import { generatePdfFromElement } from '../utils/pdfGenerator';
import { PrintableLogTemplate } from './PrintableLogTemplate';

interface Props {
  logs: string[];
  report: any;
  deviceName: string;
  token?: string | null;
}

export default function InvoiceTab({ logs, report, deviceName, token }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const getInvoiceDetails = () => ({ customerName, cost, notes });

  const handleSavePdf = async () => {
    setIsExporting(true);
    setMessage('Generating PDF...');
    try {
      const pdfBlob = await generatePdfFromElement('printable-log-container');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tact_AI_Invoice_${deviceName.replace(/\\s+/g, '_')}.pdf`;
      a.click();
      setMessage('PDF downloaded successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to generate PDF.');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleUploadDrive = async () => {
    if (!token) {
      setMessage('Not authenticated. Please enable Google Drive in Agent settings first.');
      return;
    }
    setIsUploading(true);
    setMessage('Generating and uploading to Drive...');
    try {
      const pdfBlob = await generatePdfFromElement('printable-log-container');
      await uploadPdfToDrive(token, pdfBlob, `Tact_AI_Invoice_${deviceName}.pdf`);
      setMessage('Successfully uploaded to Google Drive!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Upload failed. See console.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePrint = () => {
    // Generate the PDF and open it in a new window for printing, or use browser print
    // The easiest way to print the component is to use window.print() but we need to hide the rest of the UI.
    // A better approach is to create an iframe with the content or just temporarily add a print stylesheet.
    const originalStyles = document.head.innerHTML;
    const printStyles = document.createElement('style');
    printStyles.innerHTML = `
      body * { visibility: hidden; }
      #printable-log-container, #printable-log-container * { visibility: visible; }
      #printable-log-container { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
    `;
    document.head.appendChild(printStyles);
    window.print();
    document.head.removeChild(printStyles);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 space-y-6 overflow-y-auto">
      {/* Hidden element for PDF rendering */}
      <PrintableLogTemplate 
        logs={logs} 
        report={report} 
        deviceName={deviceName} 
        invoiceDetails={getInvoiceDetails()}
      />
      
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-5 h-5 text-purple-400" />
        <h2 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-widest">
          Generate Log / Invoice
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80">
            <h3 className="text-xs font-bold font-mono text-zinc-300 uppercase mb-4">Client Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Client Name</label>
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-sans text-zinc-200 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Total Cost ($)</label>
                <input 
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-sans text-zinc-200 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1">Technician Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Services rendered..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-sans text-zinc-200 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex flex-col justify-start">
          <div className="bg-zinc-900/60 p-4 rounded-lg border border-zinc-800/80 h-full flex flex-col">
            <h3 className="text-xs font-bold font-mono text-zinc-300 uppercase mb-4">Export Actions</h3>
            <div className="space-y-3 flex-1">
              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-md transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">Print Document</span>
                </div>
              </button>

              <button 
                onClick={handleSavePdf}
                disabled={isExporting}
                className="w-full flex items-center justify-between px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                    {isExporting ? 'Generating...' : 'Save as PDF'}
                  </span>
                </div>
              </button>

              <button 
                onClick={handleUploadDrive}
                disabled={isUploading}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                    {isUploading ? 'Uploading...' : 'Save to Google Drive'}
                  </span>
                </div>
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded border text-xs font-mono font-bold flex items-center gap-2 ${message.includes('fail') || message.includes('Not') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                {message.includes('fail') || message.includes('Not') ? <HelpCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
