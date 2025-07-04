"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePdf = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const puppeteer = require("puppeteer");
admin.initializeApp();
/**
 * Generates an HTML string for an invoice.
 * @param invoiceData The invoice data.
 * @returns The HTML string.
 */
function generateInvoiceHtml(invoiceData) {
    let itemsHtml = '';
    invoiceData.items.forEach((item) => {
        itemsHtml += `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.unitPrice.toFixed(2)}</td>
        <td>${item.total.toFixed(2)}</td>
      </tr>
    `;
    });
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .totals { margin-top: 20px; text-align: right; } 
      </style>
    </head>
    <body>
      <h1>Invoice #${invoiceData.invoiceNumber}</h1>
      <p><strong>Issue Date:</strong> ${invoiceData.issueDate}</p>
      <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
      <p><strong>Customer ID:</strong> ${invoiceData.customerId}</p>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <p>Subtotal: ${invoiceData.subtotal.toFixed(2)}</p>
        <p>Tax: ${invoiceData.tax.toFixed(2)}</p>
        <h3>Total Amount: ${invoiceData.totalAmount.toFixed(2)}</h3>
      </div>
    </body>
    </html>
  `;
}
/**
 * Cloud Function to generate a PDF invoice from invoice data.
 * Triggered by an HTTP request.
 */
exports.generateInvoicePdf = (0, https_1.onCall)(async (request) => {
    // Check if the user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const invoiceData = request.data.invoice;
    if (!invoiceData) {
        throw new https_1.HttpsError('invalid-argument', 'Invoice data is required.');
    }
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true, // Use 'new' for new headless mode
        });
        const page = await browser.newPage();
        const htmlContent = generateInvoiceHtml(invoiceData);
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4' });
        // You can save this PDF to Firebase Storage or return it as a base64 string
        // For now, we'll return it as a base64 string
        return { pdf: pdfBuffer.toString('base64') };
    }
    catch (error) {
        console.error("Error generating PDF:", error);
        throw new https_1.HttpsError('internal', 'Failed to generate PDF.', error);
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
});
//# sourceMappingURL=generateInvoicePdf.js.map