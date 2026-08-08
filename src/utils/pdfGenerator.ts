import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generatePdfFromElement = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found");
  
  // Clone element to apply print-specific styling without affecting the actual UI
  const originalDisplay = element.style.display;
  const originalPosition = element.style.position;
  
  // Ensure it's fully visible and unconstrained for capture
  
  const canvas = await html2canvas(element, { 
    scale: 2, 
    useCORS: true, 
    logging: false,
    backgroundColor: '#000000' // Dark theme background
  });
  
  const imgData = canvas.toDataURL('image/png');
  
  // A4 paper ratio is 1:1.414, but we'll use auto height
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  return pdf.output('blob');
};
