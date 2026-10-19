import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatDateDMY, normalizeDocumentId } from '../../context/CRMContext';

const QuotationPDFModal = ({ isOpen, onClose, quotation, clientOrLead }) => {
  if (!isOpen || !quotation) return null;

  const docType = quotation.docType || (quotation.id?.includes('INV') ? 'Invoice' : 'Quotation');
  const isInvoice = docType.toLowerCase() === 'invoice';
  const docTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
  const displayDocId = normalizeDocumentId(quotation.id || quotation.docNumber, quotation.date);

  // Client Details resolution
  const clientName = quotation.clientName || clientOrLead?.companyName || clientOrLead?.name || 'Valued Client';
  const clientAddress = quotation.address || clientOrLead?.address || '';
  const clientEmail = quotation.email || clientOrLead?.email || '';
  const clientPhone = quotation.phone || clientOrLead?.phone || '';
  const docDate = formatDateDMY(quotation.date) || formatDateDMY(new Date().toISOString().split('T')[0]);

  // Calculations & Pricing
  const totalAmount = Number(quotation.total) || (quotation.items ? quotation.items.reduce((s, i) => s + (Number(i.rate) * Number(i.qty || 1)), 0) : 0);
  const originalTotal = Number(quotation.originalTotal) || totalAmount;
  const hasDiscount = Boolean(quotation.discountPrice && Number(quotation.discountPrice) < originalTotal);
  
  const advancePaid = quotation.advancePaid !== undefined ? Number(quotation.advancePaid) : 0;
  const remaining = quotation.remaining !== undefined ? Number(quotation.remaining) : (totalAmount - advancePaid);

  const renewalPrice = Number(quotation.renewalPrice !== undefined ? quotation.renewalPrice : 10000) || 0;
  const renewalTrackingPrice = Number(quotation.renewalTrackingPrice !== undefined ? quotation.renewalTrackingPrice : 100) || 0;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(val) || 0);
  };

  const handlePrint = () => {
    const printArea = document.getElementById('quotation-print-area');
    if (!printArea) return;

    const logoOriginUrl = `${window.location.origin}/SETULOGO.png`;
    let printHtml = printArea.innerHTML;
    printHtml = printHtml.replaceAll('src="/SETULOGO.png"', `src="${logoOriginUrl}"`);
    printHtml = printHtml.replaceAll('src="/src/assets/SETULOGO.png"', `src="${logoOriginUrl}"`);

    const printWindow = window.open('', '_blank', 'width=920,height=1050');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}_${displayDocId}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 7mm 10mm 7mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #ffffff;
              color: #0f172a;
              margin: 0;
              padding: 0;
              font-size: 10.5px;
              line-height: 1.35;
            }
            .print-container {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
              background: #fff;
            }
            .letterhead-frame {
              position: relative !important;
              border: 1.5px solid #000000 !important;
              padding: 16px 20px !important;
              width: 100% !important;
              box-sizing: border-box !important;
              min-height: 275mm !important;
              max-height: 278mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }
            .watermark-layer {
              position: absolute !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 380px !important;
              max-width: 65% !important;
              opacity: 0.085 !important;
              pointer-events: none !important;
              z-index: 0 !important;
              user-select: none !important;
            }
            .watermark-layer img {
              width: 100% !important;
              height: auto !important;
              display: block !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .letterhead-body {
              position: relative !important;
              z-index: 1 !important;
            }
            .print-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              width: 100% !important;
              margin-bottom: 6px !important;
            }
            .print-logo {
              width: 68px !important;
              height: 68px !important;
              max-width: 68px !important;
              max-height: 68px !important;
              object-fit: contain !important;
              display: block !important;
            }
            .print-doc-title {
              font-size: 20px !important;
              font-weight: 900 !important;
              color: #000000 !important;
              margin: 0 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
            }
            .print-doc-id {
              font-size: 11.5px !important;
              font-weight: 700 !important;
              color: #1e293b !important;
              margin: 2px 0 0 0 !important;
              font-family: monospace !important;
            }
            .meta-block {
              font-size: 10.5px !important;
              line-height: 1.38 !important;
              color: #0f172a !important;
              margin-top: 6px !important;
            }
            .meta-block p {
              margin: 1.5px 0 !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 6px 0 8px 0 !important;
              font-size: 10.5px !important;
            }
            th, td {
              border: 1px solid #cbd5e1 !important;
              padding: 4.5px 8px !important;
              text-align: left !important;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 700 !important;
              color: #0f172a !important;
            }
            .section-heading {
              font-size: 11px !important;
              font-weight: 700 !important;
              color: #000000 !important;
              margin: 5px 0 2px 0 !important;
            }
            .bullet-list {
              margin: 0 !important;
              padding-left: 17px !important;
              font-size: 9.5px !important;
              line-height: 1.32 !important;
              color: #1e293b !important;
            }
            .bullet-list li {
              margin-bottom: 2px !important;
            }
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-footer {
              margin-top: 6px !important;
              font-size: 9px !important;
              color: #475569 !important;
              line-height: 1.3 !important;
            }
            .divider-thin {
              border: none !important;
              border-top: 1px solid #cbd5e1 !important;
              margin: 5px 0 3px 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-2xl animate-[scaleUp_0.25s_ease-out] flex flex-col max-h-[94vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-slate-200 bg-slate-50/80 text-slate-900 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <span className={`px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 ${
              isInvoice ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-orange-50 text-orange-600 border border-orange-200'
            }`}>
              {docTitle}
            </span>
            <span className="font-mono font-bold text-xs text-slate-700 truncate">{displayDocId}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF (A4 Format)</span>
              <span className="sm:hidden">Print PDF</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PDF Render Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/80 flex justify-center">
          <div 
            id="quotation-print-area" 
            className="w-full max-w-[760px] bg-white text-slate-900 shadow-2xl font-sans"
          >
            {/* Outer Letterhead Frame with Watermark */}
            <div 
              className="letterhead-frame"
              style={{
                position: 'relative',
                border: '1.5px solid #000000',
                padding: '16px 20px',
                width: '100%',
                boxSizing: 'border-box',
                minHeight: '1040px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Background Logo Watermark */}
              <div 
                className="watermark-layer"
                style={{
                  position: 'absolute',
                  top: '52%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '380px',
                  maxWidth: '65%',
                  opacity: 0.085,
                  pointerEvents: 'none',
                  zIndex: 0,
                  userSelect: 'none'
                }}
              >
                <img 
                  src="/SETULOGO.png" 
                  alt="Watermark" 
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/src/assets/SETULOGO.png';
                  }}
                />
              </div>

              {/* Foreground Letterhead Content */}
              <div className="letterhead-body" style={{ position: 'relative', zIndex: 1 }}>
                
                {/* Header: Logo Left, Title & DocID Right */}
                <div 
                  className="print-header"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '6px' }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <img 
                      src="/SETULOGO.png" 
                      alt="SETU Logo" 
                      className="print-logo"
                      style={{ width: '68px', height: '68px', maxWidth: '68px', maxHeight: '68px', objectFit: 'contain', display: 'block' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/src/assets/SETULOGO.png';
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 
                      className="print-doc-title"
                      style={{ fontSize: '20px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#000000' }}
                    >
                      {docTitle}
                    </h1>
                    <p 
                      className="print-doc-id"
                      style={{ fontSize: '11.5px', fontWeight: 700, margin: '2px 0 0 0', fontFamily: 'monospace', color: '#1e293b' }}
                    >
                      {displayDocId}
                    </p>
                  </div>
                </div>

                {/* From & To Details Block (Matching Letterhead Style) */}
                <div className="meta-block" style={{ fontSize: '10.5px', lineHeight: '1.38', color: '#0f172a', marginTop: '6px' }}>
                  <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>From: SETU SOLUTION</strong></p>
                  <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Business Address:</strong> Naka No. 10, Revti Complex, Nagpur, 440023</p>
                  <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Contact:</strong> +91 7517913795 / +919834856749</p>
                  <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Email:</strong> official@setusolution.in</p>
                  <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Website:</strong> <span style={{ textDecoration: 'none' }}>https://setusolution.in/</span></p>

                  <div style={{ marginTop: '5px' }}>
                    <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>To:</strong></p>
                    <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Client Name:</strong> {clientName}</p>
                    <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Address:</strong> {clientAddress}</p>
                    {clientEmail && <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Email:</strong> {clientEmail}</p>}
                    <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Contact:</strong> {clientPhone}</p>
                    <p style={{ margin: '1px 0' }}><strong style={{ fontWeight: 700 }}>Date:</strong> {docDate}</p>
                  </div>
                </div>

                {/* Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0 8px 0', fontSize: '10.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'left', fontWeight: 700, width: '68%' }}>
                        Project Description & Billing Breakdown
                      </th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '5px 8px', textAlign: 'left', fontWeight: 700, width: '32%' }}>
                        Description (1-Year Plan Breakdown)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isInvoice ? (
                      <>
                        {/* Invoice Rows */}
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                            {quotation.items && quotation.items.length > 0 
                              ? quotation.items.map(i => i.description).join(' , ')
                              : (quotation.title || 'Project Cost (Solar Business Management ,Employee Tracking Android Application)')}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                            {formatINR(totalAmount)}/-
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                            Advance Paid
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                            {formatINR(advancePaid)}/-
                          </td>
                        </tr>
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', textAlign: 'right', fontWeight: 700 }}>
                            Remaining
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 700 }}>
                            {formatINR(remaining)}/-
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        {/* Quotation Rows */}
                        {quotation.items && quotation.items.length > 0 ? (
                          quotation.items.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                                {item.description}
                              </td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                                {item.breakdown || (item.rate > 0 ? `${formatINR(item.rate * (item.qty || 1))}/-` : '-')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                                Project Cost (Solar Business Management )
                              </td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                                30,000/-
                              </td>
                            </tr>
                            <tr>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                                Employee Tracking Android Application
                              </td>
                              <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 'normal' }}>
                                100 ( per user for month )
                              </td>
                            </tr>
                          </>
                        )}

                        {/* Total or Discounted Price Row */}
                        <tr>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', textAlign: 'right', fontWeight: 700 }}>
                            {hasDiscount ? 'Total discounted price' : 'Total price'}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4.5px 8px', fontWeight: 700 }}>
                            {hasDiscount ? (
                              <span>
                                <span style={{ textDecoration: 'line-through', color: '#dc2626', fontSize: '9.5px', marginRight: '6px' }}>
                                  {formatINR(originalTotal)}/-
                                </span>
                                <span>{formatINR(totalAmount)}/-</span>
                              </span>
                            ) : (
                              `${formatINR(totalAmount)}/-`
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                {/* Renewal & Maintenance (Post-1st Year) */}
                <div className="page-break-avoid" style={{ marginTop: '5px' }}>
                  <h3 className="section-heading" style={{ fontSize: '11px', fontWeight: 700, margin: '5px 0 2px 0', color: '#000000' }}>
                    Renewal & Maintenance (Post-1st Year)
                  </h3>
                  <ul className="bullet-list" style={{ margin: 0, paddingLeft: '17px', fontSize: '9.5px', lineHeight: '1.32', color: '#1e293b' }}>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Standard Annual Maintenance & Renewal:</strong> ₹{formatINR(renewalPrice)}/- per year (Includes domain renewal, hosting renewal, and ongoing maintenance).
                    </li>
                    {Number(renewalTrackingPrice) > 0 && (
                      <li style={{ marginBottom: '2px' }}>
                        <strong style={{ fontWeight: 700 }}>Post-1st Year Tracking:</strong> ₹{formatINR(renewalTrackingPrice)} per active user/month (excluding annual maintenance fees).
                      </li>
                    )}
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Infrastructure Note:</strong> The software will be hosted securely on a Google Cloud environment, purchased and managed directly by <strong style={{ fontWeight: 700 }}>SETU SOLUTION</strong>.
                    </li>
                  </ul>
                </div>

                {/* Terms & Conditions */}
                <div className="page-break-avoid" style={{ marginTop: '6px' }}>
                  <h3 className="section-heading" style={{ fontSize: '11px', fontWeight: 700, margin: '5px 0 2px 0', color: '#000000' }}>
                    Terms & Conditions
                  </h3>
                  <ul className="bullet-list" style={{ margin: 0, paddingLeft: '17px', fontSize: '9.5px', lineHeight: '1.32', color: '#1e293b', textAlign: 'justify' }}>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Payment Schedule:</strong> A 50% advance payment is required to initiate the work. The remaining 50% balance is due immediately upon the completion and delivery of the project.
                    </li>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Payment Default & Project Suspension:</strong> After project delivery, a maximum of three (3) payment reminders will be issued for any pending dues. If the final payment is not received after the third reminder, the project will be temporarily closed and suspended until the full payment is cleared.
                    </li>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Post-Delivery Updates:</strong> Any new features, custom updates, or changes requested after the delivery of the project will only be accommodated within the first month. All client-requested modifications must be finalized within this one-month timeframe. Additionally, any general feature updates will be initiated automatically in the project at zero extra charge from <strong style={{ fontWeight: 700 }}>SETU SOLUTION</strong>.
                    </li>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Maintenance Includes:</strong> Website bug fixing & error resolution, security updates & regular monitoring, website backup & recovery support, and SSL & domain configuration support.
                    </li>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Scope Changes:</strong> Extra features or changes beyond the initially agreed scope will be charged separately after one month.
                    </li>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Client Responsibilities:</strong> The client must provide required details, content, and approvals on time to ensure timely delivery.
                    </li>
                    <li style={{ marginBottom: '2px' }}>
                      <strong style={{ fontWeight: 700 }}>Refund Policy:</strong> Payments once made are non-refundable after project approval/delivery.
                    </li>
                  </ul>
                </div>

              </div>

              {/* Letterhead Footer Notice */}
              <div className="print-footer page-break-avoid" style={{ position: 'relative', zIndex: 1, marginTop: '6px' }}>
                <hr className="divider-thin" style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '5px 0 3px 0' }} />
                <p style={{ fontSize: '9px', color: '#475569', margin: 0, lineHeight: '1.3', textAlign: 'left' }}>
                  Thank you for choosing our services. Feel free to reach out through any of the provided contact methods for more information or assistance!
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuotationPDFModal;
