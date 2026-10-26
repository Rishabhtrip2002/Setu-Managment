import React from 'react';
import { X, Printer, Edit3, Trash2 } from 'lucide-react';
import { formatDateDMY, normalizeDocumentId } from '../../context/CRMContext';

const QuotationPDFModal = ({ isOpen, onClose, quotation, clientOrLead, onEdit, onDelete }) => {
  if (!isOpen || !quotation) return null;

  const docType = quotation.docType || (quotation.id?.includes('INV') ? 'Invoice' : 'Quotation');
  const isInvoice = docType.toLowerCase() === 'invoice';
  const docTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
  const displayDocId = normalizeDocumentId(quotation.id || quotation.docNumber, quotation.date);

  const clientName = quotation.clientName || clientOrLead?.companyName || clientOrLead?.name || 'Valued Client';
  const clientAddress = quotation.address || clientOrLead?.address || '';
  const clientEmail = quotation.email || clientOrLead?.email || '';
  const clientPhone = quotation.phone || clientOrLead?.phone || '';
  const docDate = formatDateDMY(quotation.date) || formatDateDMY(new Date().toISOString().split('T')[0]);

  const totalAmount = Number(quotation.total) || (quotation.items ? quotation.items.reduce((s, i) => s + (Number(i.rate) * Number(i.qty || 1)), 0) : 0);
  const originalTotal = Number(quotation.originalTotal) || totalAmount;
  const hasDiscount = Boolean(quotation.discountPrice && Number(quotation.discountPrice) < originalTotal);

  const advancePaid = quotation.advancePaid !== undefined ? Number(quotation.advancePaid) : 0;
  const remaining = quotation.remaining !== undefined ? Number(quotation.remaining) : (totalAmount - advancePaid);

  // Accurate renewal cost from quotation / client, without hardcoding
  const renewalPrice = Number(
    quotation.renewalCost !== undefined ? quotation.renewalCost :
    quotation.renewalPrice !== undefined ? quotation.renewalPrice :
    clientOrLead?.renewalCost !== undefined ? clientOrLead?.renewalCost :
    clientOrLead?.renewalPrice !== undefined ? clientOrLead?.renewalPrice : 10000
  ) || 0;

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(val) || 0);
  };

  const printStyles = `
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #fff;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.5;
    }
    .print-container {
      width: 100%;
      margin: 0 auto;
    }
    .letterhead-frame {
      position: relative;
      border: 2px solid #1e293b;
      padding: 22px 26px 14px;
      width: 100%;
      height: 279mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
      page-break-inside: avoid;
    }
    .watermark-layer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 360px;
      max-width: 60%;
      opacity: 0.06;
      pointer-events: none;
      z-index: 0;
      user-select: none;
    }
    .watermark-layer img {
      width: 100%;
      height: auto;
      display: block;
    }
    .letterhead-body {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 3px solid #f97316;
    }
    .print-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      display: block;
    }
    .print-doc-title {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .print-doc-id {
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      margin: 3px 0 0 0;
      font-family: monospace;
    }
    .meta-grid {
      display: flex;
      gap: 0;
      margin-bottom: 16px;
    }
    .meta-from, .meta-to {
      font-size: 11px;
      line-height: 1.55;
      color: #0f172a;
    }
    .meta-from {
      flex: 1;
      padding-right: 22px;
      border-right: 1.5px solid #e2e8f0;
    }
    .meta-to {
      flex: 1;
      padding-left: 22px;
    }
    .meta-label {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #ea580c;
      margin: 0 0 4px 0;
    }
    .meta-from p, .meta-to p {
      margin: 2px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 14px 0;
      font-size: 11.5px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 800;
      color: #0f172a;
      font-size: 11.5px;
    }
    td.amount-cell, th.amount-col {
      text-align: right;
    }
    .total-row td {
      font-weight: 800;
      background-color: #f8fafc;
      font-size: 12px;
    }
    .grand-total-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #fff7ed;
      border: 2px solid #fdba74;
      border-radius: 8px;
      padding: 10px 18px;
      margin: 0 0 14px 0;
    }
    .grand-total-label {
      font-size: 11.5px;
      font-weight: 800;
      color: #9a3412;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .grand-total-sub {
      font-size: 10px;
      color: #c2410c;
      font-weight: 600;
      margin-top: 1px;
    }
    .grand-total-amount {
      font-size: 18px;
      font-weight: 900;
      color: #9a3412;
      font-family: monospace;
    }
    .section-heading {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin: 12px 0 6px 0;
      padding-bottom: 3px;
      border-bottom: 1.5px solid #e2e8f0;
    }
    .bullet-list {
      margin: 0;
      padding-left: 16px;
      font-size: 10.5px;
      line-height: 1.55;
      color: #334155;
      text-align: justify;
    }
    .bullet-list li {
      margin-bottom: 4px;
    }
    .bullet-list li strong {
      color: #0f172a;
    }
    .signature-grid {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .signature-box {
      width: 240px;
    }
    .signature-line {
      border-bottom: 1.5px solid #94a3b8;
      height: 38px;
    }
    .signature-caption {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 6px;
    }
    .signature-sub {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .print-footer {
      position: relative;
      z-index: 1;
      margin-top: auto;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
    }
    .print-footer p {
      font-size: 9.5px;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
      text-align: center;
    }
  `;

  const handlePrint = () => {
    const printArea = document.getElementById('quotation-print-area');
    if (!printArea) return;

    const logoOriginUrl = `${window.location.origin}/SETULOGO.png`;
    let printHtml = printArea.innerHTML;
    printHtml = printHtml.replaceAll('src="/SETULOGO.png"', `src="${logoOriginUrl}"`);
    printHtml = printHtml.replaceAll('src="/src/assets/SETULOGO.png"', `src="${logoOriginUrl}"`);
    printHtml = printHtml.replaceAll('src="/SETULOGO_WHITE.png"', `src="${logoOriginUrl}"`);

    const printWindow = window.open('', '_blank', 'width=920,height=1050');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups for this site to print.');
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${docTitle}_${displayDocId}</title><style>${printStyles}</style></head><body><div class="print-container">${printHtml}</div><script>window.onload=function(){setTimeout(function(){window.focus();window.print();},400)}<\/script></body></html>`);
    printWindow.document.close();
  };

  /* Inline styles mirror the print stylesheet so the preview matches the PDF and fits A4 page proportionally */
  const S = {
    frame: {
      position: 'relative',
      border: '2px solid #1e293b',
      padding: '22px 26px 14px',
      width: '100%',
      boxSizing: 'border-box',
      minHeight: '1120px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: '#ffffff'
    },
    watermark: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '360px',
      maxWidth: '60%',
      opacity: 0.06,
      pointerEvents: 'none',
      zIndex: 0,
      userSelect: 'none'
    },
    body: { position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '14px',
      paddingBottom: '10px',
      borderBottom: '3px solid #f97316'
    },
    logo: { width: '60px', height: '60px', objectFit: 'contain', display: 'block' },
    title: { fontSize: '24px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0f172a' },
    docId: { fontSize: '11.5px', fontWeight: 700, margin: '3px 0 0 0', fontFamily: 'monospace', color: '#475569' },
    metaGrid: { display: 'flex', gap: 0, marginBottom: '16px' },
    metaFrom: { flex: 1, paddingRight: '22px', borderRight: '1.5px solid #e2e8f0', fontSize: '11px', lineHeight: '1.55', color: '#0f172a' },
    metaTo: { flex: 1, paddingLeft: '22px', fontSize: '11px', lineHeight: '1.55', color: '#0f172a' },
    metaLabel: { fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#ea580c', margin: '0 0 4px 0' },
    metaP: { margin: '2px 0' },
    table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 14px 0', fontSize: '11.5px' },
    th: { border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'left', backgroundColor: '#f1f5f9', fontWeight: 800, color: '#0f172a', fontSize: '11.5px' },
    thRight: { border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'right', backgroundColor: '#f1f5f9', fontWeight: 800, color: '#0f172a', fontSize: '11.5px' },
    td: { border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'left', fontWeight: 'normal' },
    tdRightPlain: { border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'right', fontWeight: 'normal', fontSize: '12px' },
    tdBold: { border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'right', fontWeight: 800, fontSize: '12.5px' },
    tdRight: { border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'right', fontWeight: 800, fontSize: '12px' },
    totalRow: { backgroundColor: '#f8fafc' },
    grandTotalBox: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: '#fff7ed', border: '2px solid #fdba74', borderRadius: '8px',
      padding: '10px 18px', margin: '0 0 14px 0'
    },
    grandTotalLabel: { fontSize: '11.5px', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.6px' },
    grandTotalSub: { fontSize: '10px', color: '#c2410c', fontWeight: 600, marginTop: '1px' },
    grandTotalAmount: { fontSize: '18px', fontWeight: 900, color: '#9a3412', fontFamily: 'monospace' },
    sectionH: { fontSize: '12px', fontWeight: 800, color: '#0f172a', margin: '12px 0 6px 0', paddingBottom: '3px', borderBottom: '1.5px solid #e2e8f0' },
    ul: { margin: 0, paddingLeft: '16px', fontSize: '10.5px', lineHeight: '1.55', color: '#334155', textAlign: 'justify' },
    li: { marginBottom: '4px' },
    signatureGrid: { display: 'flex', justifyContent: 'flex-end', marginTop: '24px' },
    signatureBox: { width: '240px' },
    signatureLine: { borderBottom: '1.5px solid #94a3b8', height: '38px' },
    signatureCaption: { fontSize: '11px', fontWeight: 800, color: '#0f172a', marginTop: '6px' },
    signatureSub: { fontSize: '9.5px', color: '#64748b', marginTop: '1px' },
    footer: { position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #cbd5e1' },
    footerP: { fontSize: '9.5px', color: '#64748b', margin: 0, lineHeight: '1.4', textAlign: 'center' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-2xl animate-[scaleUp_0.25s_ease-out] flex flex-col max-h-[95vh]">

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
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(quotation);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all hover-scale cursor-pointer"
                title={`Edit this ${docTitle}`}
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Edit {docTitle}</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete this ${docTitle} (${displayDocId})?`)) {
                    onClose();
                    onDelete(quotation);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all hover-scale cursor-pointer"
                title={`Delete this ${docTitle}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale transition-all shadow-xs cursor-pointer whitespace-nowrap"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 flex justify-center">
          <div
            id="quotation-print-area"
            className="w-full max-w-[780px] bg-white text-slate-900 shadow-2xl font-sans"
          >
            <div className="letterhead-frame" style={S.frame}>

              {/* Background Logo Watermark */}
              <div className="watermark-layer" style={S.watermark}>
                <img
                  src="/SETULOGO.png"
                  alt="Watermark"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  onError={(e) => { e.target.onerror = null; e.target.src = '/SETULOGO_WHITE.png'; }}
                />
              </div>

              {/* Main Content */}
              <div className="letterhead-body" style={S.body}>

                {/* Header: Logo + Title */}
                <div className="print-header" style={S.header}>
                  <div style={{ flexShrink: 0 }}>
                    <img
                      src="/SETULOGO.png"
                      alt="SETU Logo"
                      className="print-logo"
                      style={S.logo}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/SETULOGO_WHITE.png'; }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 className="print-doc-title" style={S.title}>{docTitle}</h1>
                    <p className="print-doc-id" style={S.docId}>{displayDocId}</p>
                  </div>
                </div>

                {/* From / To — side by side */}
                <div className="meta-grid" style={S.metaGrid}>
                  <div className="meta-from" style={S.metaFrom}>
                    <p className="meta-label" style={S.metaLabel}>From</p>
                    <p style={{ ...S.metaP, fontWeight: 800, fontSize: '12px' }}>SETU SOLUTION</p>
                    <p style={S.metaP}>Naka No. 10, Revti Complex, Nagpur, 440023</p>
                    <p style={S.metaP}>+91 7517913795 / +919834856749</p>
                    <p style={S.metaP}>official@setusolution.in</p>
                    <p style={S.metaP}>https://setusolution.in/</p>
                  </div>
                  <div className="meta-to" style={S.metaTo}>
                    <p className="meta-label" style={S.metaLabel}>To</p>
                    <p style={{ ...S.metaP, fontWeight: 800, fontSize: '12px' }}>{clientName}</p>
                    {clientAddress && <p style={S.metaP}>{clientAddress}</p>}
                    {clientPhone && <p style={S.metaP}>{clientPhone}</p>}
                    {clientEmail && <p style={S.metaP}>{clientEmail}</p>}
                    <p style={{ ...S.metaP, marginTop: '4px', color: '#64748b', fontSize: '11px' }}>
                      <strong style={{ fontWeight: 800, color: '#0f172a' }}>Date:</strong> {docDate}
                    </p>
                  </div>
                </div>

                {/* Breakdown Table */}
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, width: '65%' }}>Project Description & Billing Breakdown</th>
                      <th style={{ ...S.thRight, width: '35%' }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isInvoice ? (
                      <>
                        <tr>
                          <td style={S.td}>
                            {quotation.items && quotation.items.length > 0
                              ? quotation.items.map(i => i.description).join(', ')
                              : (quotation.title || 'Project Cost')}
                          </td>
                          <td style={S.tdRightPlain}>{formatINR(totalAmount)}/-</td>
                        </tr>
                        <tr>
                          <td style={S.td}>Advance Paid</td>
                          <td style={S.tdRightPlain}>{formatINR(advancePaid)}/-</td>
                        </tr>
                        <tr style={S.totalRow}>
                          <td style={S.tdRight}>Remaining</td>
                          <td style={S.tdBold}>{formatINR(remaining)}/-</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        {quotation.items && quotation.items.length > 0 ? (
                          quotation.items.map((item, idx) => (
                            <tr key={idx}>
                              <td style={S.td}>{item.description}</td>
                              <td style={S.tdRightPlain}>
                                {item.breakdown || (item.rate > 0 ? `${formatINR(item.rate * (item.qty || 1))}/-` : '-')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr>
                              <td style={S.td}>Project Cost (Solar Business Management)</td>
                              <td style={S.tdRightPlain}>30,000/-</td>
                            </tr>
                            <tr>
                              <td style={S.td}>Employee Tracking Android Application</td>
                              <td style={S.tdRightPlain}>100 (per user for month)</td>
                            </tr>
                          </>
                        )}
                        <tr style={S.totalRow}>
                          <td style={S.tdRight}>{hasDiscount ? 'Total discounted price' : 'Total price'}</td>
                          <td style={S.tdBold}>
                            {hasDiscount ? (
                              <span>
                                <span style={{ textDecoration: 'line-through', color: '#dc2626', fontSize: '10.5px', marginRight: '6px' }}>
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

                {/* Grand Total Highlight */}
                <div className="grand-total-box" style={S.grandTotalBox}>
                  <div>
                    <div className="grand-total-label" style={S.grandTotalLabel}>
                      {isInvoice ? 'Balance Due' : 'Total Investment'}
                    </div>
                    <div className="grand-total-sub" style={S.grandTotalSub}>
                      {isInvoice ? 'Payable as per the breakdown above' : 'Inclusive of all services listed above'}
                    </div>
                  </div>
                  <div className="grand-total-amount" style={S.grandTotalAmount}>
                    ₹{formatINR(isInvoice ? remaining : totalAmount)}/-
                  </div>
                </div>

                {/* Renewal & Maintenance */}
                <h3 className="section-heading" style={S.sectionH}>Renewal & Maintenance (Post-1st Year)</h3>
                <ul className="bullet-list" style={S.ul}>
                  <li style={S.li}>
                    <strong>Standard Annual Maintenance & Renewal:</strong> ₹{formatINR(renewalPrice)}/- per year (includes domain renewal, hosting renewal, and ongoing maintenance).
                  </li>
                  <li style={S.li}>
                    <strong>Infrastructure Note:</strong> The software will be hosted securely on a Google Cloud environment, purchased and managed directly by <strong>SETU SOLUTION</strong>.
                  </li>
                </ul>

                {/* Terms & Conditions */}
                <h3 className="section-heading" style={S.sectionH}>Terms & Conditions</h3>
                <ul className="bullet-list" style={S.ul}>
                  <li style={S.li}>
                    <strong>Payment Schedule:</strong> A 50% advance payment is required to initiate the work. The remaining 50% balance is due immediately upon the completion and delivery of the project.
                  </li>
                  <li style={S.li}>
                    <strong>Payment Default & Project Suspension:</strong> After project delivery, a maximum of three (3) payment reminders will be issued for any pending dues. If the final payment is not received after the third reminder, the project will be temporarily closed and suspended until the full payment is cleared.
                  </li>
                  <li style={S.li}>
                    <strong>Post-Delivery Updates:</strong> Any new features, custom updates, or changes requested after the delivery of the project will only be accommodated within the first month. All client-requested modifications must be finalized within this one-month timeframe. Additionally, any general feature updates will be initiated automatically in the project at zero extra charge from <strong>SETU SOLUTION</strong>.
                  </li>
                  <li style={S.li}>
                    <strong>Maintenance Includes:</strong> Website bug fixing & error resolution, security updates & regular monitoring, website backup & recovery support, and SSL & domain configuration support.
                  </li>
                  <li style={S.li}>
                    <strong>Scope Changes:</strong> Extra features or changes beyond the initially agreed scope will be charged separately after one month.
                  </li>
                  <li style={S.li}>
                    <strong>Client Responsibilities:</strong> The client must provide required details, content, and approvals on time to ensure timely delivery.
                  </li>
                  <li style={S.li}>
                    <strong>Refund Policy:</strong> Payments once made are non-refundable after project approval/delivery.
                  </li>
                </ul>

                {/* Signature Section - Company Authorized Signatory */}
                <div className="signature-grid" style={S.signatureGrid}>
                  <div className="signature-box" style={S.signatureBox}>
                    <div className="signature-line" style={S.signatureLine}></div>
                    <p className="signature-caption" style={S.signatureCaption}>For SETU SOLUTION</p>
                    <p className="signature-sub" style={S.signatureSub}>Authorized Signatory</p>
                  </div>
                </div>
              </div>

              {/* Footer — pushed to bottom via margin-top: auto */}
              <div className="print-footer" style={S.footer}>
                <p style={S.footerP}>
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
