import React from 'react';
import { X, Printer, Download, Copy, Check } from 'lucide-react';
import { formatDateDMY, normalizeDocumentId } from '../../context/CRMContext';

const QuotationPDFModal = ({ isOpen, onClose, quotation, clientOrLead }) => {
  const [copiedJSON, setCopiedJSON] = React.useState(false);
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

  // Calculations
  const totalAmount = Number(quotation.total) || (quotation.items ? quotation.items.reduce((s, i) => s + (Number(i.rate) * Number(i.qty || 1)), 0) : 0);
  const advancePaid = quotation.advancePaid !== undefined ? Number(quotation.advancePaid) : 0;
  const remaining = quotation.remaining !== undefined ? Number(quotation.remaining) : (totalAmount - advancePaid);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('quotation-print-area').innerHTML;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}_${displayDocId}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 14mm 10mm 14mm;
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
              font-size: 11px;
              line-height: 1.4;
            }
            .print-container {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
              background: #fff;
            }
            .print-header {
              display: flex !important;
              justify-content: space-between !important;
              align-items: flex-start !important;
              width: 100% !important;
              margin-bottom: 6px !important;
            }
            .print-logo-wrap {
              flex-shrink: 0 !important;
            }
            .print-logo {
              width: 68px !important;
              height: 68px !important;
              max-width: 68px !important;
              max-height: 68px !important;
              object-fit: contain !important;
              display: block !important;
            }
            .print-title-wrap {
              text-align: right !important;
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
            .print-meta-grid {
              display: flex !important;
              justify-content: space-between !important;
              gap: 20px !important;
              margin-top: 6px !important;
            }
            .print-meta-col {
              flex: 1 !important;
              font-size: 11px !important;
              line-height: 1.45 !important;
              color: #0f172a !important;
            }
            .print-meta-col p {
              margin: 1.5px 0 !important;
            }
            .divider-strong {
              border: none !important;
              border-top: 2px solid #0f172a !important;
              margin: 8px 0 10px 0 !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 6px 0 10px 0 !important;
              font-size: 11px !important;
            }
            th, td {
              border: 1px solid #cbd5e1 !important;
              padding: 5.5px 9px !important;
              text-align: left !important;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: 700 !important;
              color: #0f172a !important;
            }
            .section-heading {
              font-size: 11.5px !important;
              font-weight: 700 !important;
              color: #000000 !important;
              margin: 6px 0 3px 0 !important;
            }
            .bullet-list {
              margin: 0 !important;
              padding-left: 18px !important;
              font-size: 10px !important;
              line-height: 1.38 !important;
              color: #1e293b !important;
            }
            .bullet-list li {
              margin-bottom: 2.5px !important;
            }
            .page-break-avoid {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print-footer {
              margin-top: 8px !important;
              font-size: 9.5px !important;
              color: #475569 !important;
              line-height: 1.35 !important;
            }
            .divider-thin {
              border: none !important;
              border-top: 1px solid #e2e8f0 !important;
              margin: 6px 0 4px 0 !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyJSON = () => {
    const jsonPayload = {
      id: displayDocId,
      docNumber: displayDocId,
      docType,
      date: quotation.date || docDate,
      from: {
        company: 'SETU SOLUTION',
        address: 'Naka No. 10, Revti Complex, Nagpur, 440023',
        contact: '+91 7517913795 / +919834856749',
        email: 'official@setusolution.in',
        website: 'https://setusolution.in/'
      },
      to: {
        clientName,
        address: clientAddress,
        email: clientEmail,
        contact: clientPhone
      },
      items: quotation.items || [
        {
          description: quotation.title || 'Project Cost (Solar Business Management )',
          breakdown: formatINR(totalAmount),
          rate: totalAmount,
          qty: 1
        }
      ],
      totalPrice: totalAmount,
      advancePaid,
      remaining,
      renewalTerms: [
        'Standard Annual Maintenance & Renewal: ₹10,000/- per year (Includes domain renewal, hosting renewal, and ongoing maintenance).',
        'Post-1st Year Tracking: ₹100 per active user/month (excluding annual maintenance fees).',
        'Infrastructure Note: The software will be hosted securely on a Google Cloud environment, purchased and managed directly by SETU SOLUTION.'
      ]
    };

    navigator.clipboard.writeText(JSON.stringify(jsonPayload, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-2xl animate-[scaleUp_0.25s_ease-out] flex flex-col max-h-[94vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 text-slate-900">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              isInvoice ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-orange-50 text-orange-600 border border-orange-200'
            }`}>
              {docTitle} Document
            </span>
            <span className="font-mono font-bold text-xs text-slate-700">{displayDocId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Copy JSON Payload"
            >
              {copiedJSON ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedJSON ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF (A4)</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/90 flex justify-center">
          <div 
            id="quotation-print-area" 
            className="w-full max-w-[760px] bg-white text-slate-900 p-8 sm:p-10 shadow-2xl rounded-sm font-sans text-[11px] leading-[1.4]"
            style={{ minHeight: '1050px' }}
          >
            {/* Header: Logo left (68px), Title right */}
            <div className="print-header flex justify-between items-start" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '8px' }}>
              <div className="print-logo-wrap" style={{ flexShrink: 0 }}>
                <img 
                  src="/SETULOGO.png" 
                  alt="SETU Logo" 
                  className="print-logo w-16 h-16 object-contain"
                  style={{ width: '68px', height: '68px', maxWidth: '68px', maxHeight: '68px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/src/assets/SETULOGO.png';
                  }}
                />
              </div>
              <div className="print-title-wrap text-right" style={{ textAlign: 'right' }}>
                <h1 className="print-doc-title text-xl font-black uppercase tracking-wide text-slate-950 m-0" style={{ fontSize: '20px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {docTitle}
                </h1>
                <p className="print-doc-id text-xs font-bold text-slate-800 mt-1 font-mono tracking-tight" style={{ fontSize: '11.5px', fontWeight: 700, margin: '2px 0 0 0', fontFamily: 'monospace' }}>
                  {displayDocId}
                </p>
              </div>
            </div>

            {/* From & To Details Grid */}
            <div className="print-meta-grid" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginTop: '6px' }}>
              {/* From Details */}
              <div className="print-meta-col space-y-0.5 text-[11px]" style={{ flex: 1, fontSize: '11px', lineHeight: '1.45' }}>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">From: SETU SOLUTION</strong></p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Business Address:</strong> Naka No. 10, Revti Complex, Nagpur, 440023</p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Contact:</strong> +91 7517913795 / +919834856749</p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Email:</strong> official@setusolution.in</p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Website:</strong> <a href="https://setusolution.in/" className="text-slate-900 underline" style={{ color: '#0f172a', textDecoration: 'underline' }}>https://setusolution.in/</a></p>
              </div>

              {/* To Details */}
              <div className="print-meta-col space-y-0.5 text-[11px]" style={{ flex: 1, fontSize: '11px', lineHeight: '1.45' }}>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">To:</strong></p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Client Name:</strong> {clientName}</p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Address:</strong> {clientAddress}</p>
                {clientEmail && <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Email:</strong> {clientEmail}</p>}
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Contact:</strong> {clientPhone}</p>
                <p style={{ margin: '1.5px 0' }}><strong className="font-bold text-slate-950">Date:</strong> {docDate}</p>
              </div>
            </div>

            {/* Divider Line */}
            <hr className="divider-strong my-3 border-t-2 border-slate-900" style={{ border: 'none', borderTop: '2px solid #0f172a', margin: '8px 0 10px 0' }} />

            {/* Breakdown Table */}
            <table className="w-full border-collapse border border-slate-300 my-2.5 text-[11px]" style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0 10px 0', fontSize: '11px' }}>
              <thead>
                <tr className="bg-[#f1f5f9] text-slate-950 font-bold border-b border-slate-300" style={{ backgroundColor: '#f1f5f9' }}>
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold w-2/3" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px', textAlign: 'left', fontWeight: 700, width: '68%' }}>
                    Project Description & Billing Breakdown
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold w-1/3" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px', textAlign: 'left', fontWeight: 700, width: '32%' }}>
                    Description (1-Year Plan Breakdown)
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-900">
                {isInvoice ? (
                  <>
                    {/* Invoice View */}
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                        {quotation.items && quotation.items.length > 0 
                          ? quotation.items.map(i => i.description).join(' ,')
                          : 'Project Cost (Solar Business Management ,Employee Tracking Android Application)'}
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                        {formatINR(totalAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                        Advance Paid
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                        {formatINR(advancePaid)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 text-right font-bold" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px', textAlign: 'right', fontWeight: 700 }}>
                        Remaining
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-bold" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px', fontWeight: 700 }}>
                        {formatINR(remaining)}
                      </td>
                    </tr>
                  </>
                ) : (
                  <>
                    {/* Quotation View */}
                    {quotation.items && quotation.items.length > 0 ? (
                      quotation.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                            {item.description}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                            {item.breakdown || (item.rate > 0 ? formatINR(item.rate * (item.qty || 1)) : '-')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr>
                          <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                            Project Cost (Solar Business Management )
                          </td>
                          <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                            30,000
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                            Employee Tracking Android Application
                          </td>
                          <td className="border border-slate-300 px-3 py-2 font-normal" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px' }}>
                            100 ( per user for month )
                          </td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 text-right font-bold" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px', textAlign: 'right', fontWeight: 700 }}>
                        Total price
                      </td>
                      <td className="border border-slate-300 px-3 py-2 font-bold" style={{ border: '1px solid #cbd5e1', padding: '5.5px 9px', fontWeight: 700 }}>
                        {formatINR(totalAmount)}/-
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            {/* Renewal & Maintenance (Post-1st Year) */}
            <div className="page-break-avoid mt-2" style={{ pageBreakInside: 'avoid', marginTop: '6px' }}>
              <h3 className="section-heading text-xs font-bold text-slate-950 mb-1" style={{ fontSize: '11.5px', fontWeight: 700, margin: '6px 0 3px 0' }}>
                Renewal & Maintenance (Post-1st Year)
              </h3>
              <ul className="bullet-list list-disc pl-5 space-y-0.5 text-[10px] text-slate-900 leading-snug" style={{ margin: 0, paddingLeft: '18px', fontSize: '10px', lineHeight: '1.38' }}>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Standard Annual Maintenance & Renewal:</strong> ₹10,000/- per year (Includes domain renewal, hosting renewal, and ongoing maintenance).
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Post-1st Year Tracking:</strong> ₹100 per active user/month (excluding annual maintenance fees).
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Infrastructure Note:</strong> The software will be hosted securely on a Google Cloud environment, purchased and managed directly by <strong>SETU SOLUTION</strong>.
                </li>
              </ul>
            </div>

            {/* Terms & Conditions */}
            <div className="page-break-avoid mt-2.5" style={{ pageBreakInside: 'avoid', marginTop: '8px' }}>
              <h3 className="section-heading text-xs font-bold text-slate-950 mb-1" style={{ fontSize: '11.5px', fontWeight: 700, margin: '6px 0 3px 0' }}>
                Terms & Conditions
              </h3>
              <ul className="bullet-list list-disc pl-5 space-y-0.5 text-[10px] text-slate-900 leading-snug text-justify" style={{ margin: 0, paddingLeft: '18px', fontSize: '10px', lineHeight: '1.38', textAlign: 'justify' }}>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Payment Schedule:</strong> A 50% advance payment is required to initiate the work. The remaining 50% balance is due immediately upon the completion and delivery of the project.
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Payment Default & Project Suspension:</strong> After project delivery, a maximum of three (3) payment reminders will be issued for any pending dues. If the final payment is not received after the third reminder, the project will be temporarily closed and suspended until the full payment is cleared.
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Post-Delivery Updates:</strong> Any new features, custom updates, or changes requested after the delivery of the project will only be accommodated within the first month. All client-requested modifications must be finalized within this one-month timeframe. Additionally, any general feature updates will be initiated automatically in the project at zero extra charge from <strong>SETU SOLUTION</strong>.
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Maintenance Includes:</strong> Website bug fixing & error resolution, security updates & regular monitoring, website backup & recovery support, and SSL & domain configuration support.
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Scope Changes:</strong> Extra features or changes beyond the initially agreed scope will be charged separately after one month.
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Client Responsibilities:</strong> The client must provide required details, content, and approvals on time to ensure timely delivery.
                </li>
                <li style={{ marginBottom: '2.5px' }}>
                  <strong>Refund Policy:</strong> Payments once made are non-refundable after project approval/delivery.
                </li>
              </ul>
            </div>

            {/* Footer Divider & Notice */}
            <div className="print-footer page-break-avoid" style={{ pageBreakInside: 'avoid', marginTop: '8px' }}>
              <hr className="divider-thin my-2 border-t border-slate-300" style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '6px 0 4px 0' }} />
              <p className="text-[9.5px] text-slate-700 text-left leading-normal" style={{ fontSize: '9.5px', color: '#475569', margin: 0, lineHeight: '1.35' }}>
                Thank you for choosing our services. Feel free to reach out through any of the provided contact methods for more information or assistance!
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default QuotationPDFModal;
