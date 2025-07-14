import { Download, Printer, FileText } from 'lucide-react';

const InvoiceGenerator = ({ booking, onDownload, onPrint }) => {
  const generateInvoiceData = () => {
    const invoiceNumber = `INV-${booking.id}`;
    const issueDate = new Date(booking.bookingDate).toLocaleDateString();
    
    return {
      invoiceNumber,
      issueDate,
      booking,
      companyInfo: {
        name: 'Travora Travel Services',
        address: '123 Travel Street, City, State 12345',
        phone: '+1 (555) 123-4567',
        email: 'billing@travora.com'
      }
    };
  };

  const handleDownload = () => {
    const invoiceData = generateInvoiceData();
    
    // Create a simple HTML invoice
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { margin-bottom: 30px; }
          .invoice-details { margin-bottom: 30px; }
          .booking-details { margin-bottom: 30px; }
          .total { font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>${invoiceData.companyInfo.name}</h2>
        </div>
        
        <div class="company-info">
          <p>${invoiceData.companyInfo.address}</p>
          <p>Phone: ${invoiceData.companyInfo.phone}</p>
          <p>Email: ${invoiceData.companyInfo.email}</p>
        </div>
        
        <div class="invoice-details">
          <table>
            <tr>
              <td><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</td>
              <td class="text-right"><strong>Date:</strong> ${invoiceData.issueDate}</td>
            </tr>
            <tr>
              <td><strong>Booking ID:</strong> ${booking.id}</td>
              <td class="text-right"><strong>Status:</strong> ${booking.status}</td>
            </tr>
          </table>
        </div>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <table>
            <tr>
              <td><strong>Service:</strong></td>
              <td>${booking.type === 'hotel' ? booking.hotelName : 
                   booking.type === 'flight' ? `${booking.airline} ${booking.flightNumber}` :
                   booking.packageName || 'Travel Package'}</td>
            </tr>
            ${booking.type === 'hotel' ? `
              <tr>
                <td><strong>Check-in:</strong></td>
                <td>${new Date(booking.checkIn).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Check-out:</strong></td>
                <td>${new Date(booking.checkOut).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Guests:</strong></td>
                <td>${booking.guests}</td>
              </tr>
            ` : ''}
            ${booking.type === 'flight' ? `
              <tr>
                <td><strong>Route:</strong></td>
                <td>${booking.from} → ${booking.to}</td>
              </tr>
              <tr>
                <td><strong>Departure:</strong></td>
                <td>${new Date(booking.departureDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Passengers:</strong></td>
                <td>${booking.passengers}</td>
              </tr>
            ` : ''}
            <tr class="total">
              <td><strong>Total Amount:</strong></td>
              <td><strong>$${booking.totalPrice || booking.price}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 50px; text-align: center; color: #666;">
          <p>Thank you for choosing Travora!</p>
          <p>For support, contact us at support@travora.com</p>
        </div>
      </body>
      </html>
    `;
    
    // Create and download the file
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoiceData.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    if (onDownload) onDownload();
  };

  const handlePrint = () => {
    const invoiceData = generateInvoiceData();
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { margin-bottom: 30px; }
          .invoice-details { margin-bottom: 30px; }
          .booking-details { margin-bottom: 30px; }
          .total { font-size: 18px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .text-right { text-align: right; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>${invoiceData.companyInfo.name}</h2>
        </div>
        
        <div class="company-info">
          <p>${invoiceData.companyInfo.address}</p>
          <p>Phone: ${invoiceData.companyInfo.phone}</p>
          <p>Email: ${invoiceData.companyInfo.email}</p>
        </div>
        
        <div class="invoice-details">
          <table>
            <tr>
              <td><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</td>
              <td class="text-right"><strong>Date:</strong> ${invoiceData.issueDate}</td>
            </tr>
            <tr>
              <td><strong>Booking ID:</strong> ${booking.id}</td>
              <td class="text-right"><strong>Status:</strong> ${booking.status}</td>
            </tr>
          </table>
        </div>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <table>
            <tr>
              <td><strong>Service:</strong></td>
              <td>${booking.type === 'hotel' ? booking.hotelName : 
                   booking.type === 'flight' ? `${booking.airline} ${booking.flightNumber}` :
                   booking.packageName || 'Travel Package'}</td>
            </tr>
            ${booking.type === 'hotel' ? `
              <tr>
                <td><strong>Check-in:</strong></td>
                <td>${new Date(booking.checkIn).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Check-out:</strong></td>
                <td>${new Date(booking.checkOut).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Guests:</strong></td>
                <td>${booking.guests}</td>
              </tr>
            ` : ''}
            ${booking.type === 'flight' ? `
              <tr>
                <td><strong>Route:</strong></td>
                <td>${booking.from} → ${booking.to}</td>
              </tr>
              <tr>
                <td><strong>Departure:</strong></td>
                <td>${new Date(booking.departureDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Passengers:</strong></td>
                <td>${booking.passengers}</td>
              </tr>
            ` : ''}
            <tr class="total">
              <td><strong>Total Amount:</strong></td>
              <td><strong>$${booking.totalPrice || booking.price}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 50px; text-align: center; color: #666;">
          <p>Thank you for choosing Travora!</p>
          <p>For support, contact us at support@travora.com</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    
    if (onPrint) onPrint();
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleDownload}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Download</span>
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <Printer className="w-4 h-4" />
        <span>Print</span>
      </button>
    </div>
  );
};

export default InvoiceGenerator;