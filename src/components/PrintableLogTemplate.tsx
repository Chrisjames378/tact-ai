import React from 'react';

interface Props {
  logs: string[];
  report: any;
  deviceName: string;
  invoiceDetails?: {
    customerName: string;
    cost: string;
    notes: string;
  };
}

export const PrintableLogTemplate: React.FC<Props> = ({ logs, report, deviceName, invoiceDetails }) => {
  return (
    <div id="printable-log-container" className="p-8 bg-white text-black font-mono w-[800px] mx-auto absolute top-0 left-[-9999px]">
      <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-black uppercase mb-1">Tact AI Diagnostics & Repair</h1>
            <p className="text-sm font-semibold">Device: {deviceName}</p>
            <p className="text-sm">Date: {new Date().toLocaleString()}</p>
        </div>
        <div className="text-right">
            <h2 className="text-xl font-bold uppercase">Invoice / Log</h2>
            <p className="text-sm">Record # {Math.floor(Math.random() * 100000)}</p>
        </div>
      </div>

      {invoiceDetails && (invoiceDetails.customerName || invoiceDetails.cost) && (
        <div className="mb-6 p-4 border border-gray-300 bg-gray-50">
            <h2 className="text-lg font-bold mb-2 uppercase border-b border-gray-200 pb-1">Client Invoice Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Client Name:</strong> {invoiceDetails.customerName || 'N/A'}</div>
                <div><strong>Total Cost:</strong> ${invoiceDetails.cost || '0.00'}</div>
                <div className="col-span-2"><strong>Technician Notes:</strong> {invoiceDetails.notes || 'N/A'}</div>
            </div>
        </div>
      )}

      {report && (
        <div className="mb-6 p-4 border border-gray-300">
          <h2 className="text-lg font-bold mb-2 uppercase border-b border-gray-200 pb-1">Integrity Report</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Status:</strong> {report.status}</div>
            <div><strong>Stability Score:</strong> {report.stabilityScore}%</div>
            <div><strong>Peak Temp:</strong> {report.peakTemp}°C</div>
            <div><strong>Throttled:</strong> {report.throttled ? 'Yes' : 'No'}</div>
          </div>
          <p className="mt-2 text-sm italic">{report.notes}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold mb-3 uppercase border-b border-gray-200 pb-1">Session Logs</h2>
        <div className="text-[10px] leading-relaxed font-mono space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="pb-1 border-b border-gray-100 last:border-0">{log}</div>
          ))}
          {logs.length === 0 && <p className="text-gray-500 italic">No logs recorded for this session.</p>}
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-black text-center text-[10px] uppercase font-bold">
        Certified by Tact AI Automated Repair Systems
      </div>
    </div>
  );
};
