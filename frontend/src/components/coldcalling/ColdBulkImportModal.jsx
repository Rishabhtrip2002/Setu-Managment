import React, { useState, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Download, 
  Users, 
  AlertTriangle, 
  ChevronDown, 
  Trash2,
  RefreshCw
} from 'lucide-react';

// Lightweight RFC-4180 compliant CSV / TSV text parser (Zero external dependencies)
export const parseCSVText = (text) => {
  if (!text || !text.trim()) return [];

  // Detect delimiter: comma, tab, or semicolon
  const firstLine = text.split('\n')[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // CRLF
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push last field if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const STANDARD_FIELDS = [
  { id: 'name', label: 'Name (Mandatory)', required: true },
  { id: 'phone', label: 'Phone (Mandatory)', required: true },
  { id: 'company', label: 'Company / Business', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'address', label: 'Address', required: false },
  { id: 'city', label: 'City', required: false },
  { id: 'state', label: 'State', required: false },
  { id: 'category', label: 'Category / Industry', required: false },
  { id: 'notes', label: 'Notes / Remarks', required: false }
];

const ColdBulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const { 
    bulkImportColdLeads, 
    detectPhoneDuplicate, 
    normalizePhoneNumber, 
    employees, 
    currentUser 
  } = useCRM();

  const fileInputRef = useRef(null);

  // Workflow steps: 1 = Upload/Paste, 2 = Column Mapping, 3 = Validation & Review
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedDataRows, setParsedDataRows] = useState([]);
  const [columnMap, setColumnMap] = useState({});

  // Assignment & import options
  const [assignedToId, setAssignedToId] = useState('');
  const [allowDuplicates, setAllowDuplicates] = useState(false);

  // Review states
  const [validRecords, setValidRecords] = useState([]);
  const [rowErrors, setRowErrors] = useState([]);
  const [duplicatesDetected, setDuplicatesDetected] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeStaff = (employees || []).filter(e => e.status === 'Active');

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setRawText('');
    setFileName('');
    setParsedHeaders([]);
    setParsedDataRows([]);
    setColumnMap({});
    setValidRecords([]);
    setRowErrors([]);
    setDuplicatesDetected([]);
    setErrorMsg('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setRawText(text);
      processRawCSV(text);
    };
    reader.readAsText(file);
  };

  const processRawCSV = (text) => {
    setErrorMsg('');
    const rows = parseCSVText(text);
    if (rows.length < 2) {
      setErrorMsg('File must contain at least 1 header row and 1 data row.');
      return;
    }

    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);

    setParsedHeaders(headers);
    setParsedDataRows(dataRows);

    // Auto-map headers
    const autoMap = {};
    headers.forEach((h, colIdx) => {
      const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (/name|contact|prospect|client|person/i.test(cleanH)) {
        if (!autoMap.name) autoMap.name = colIdx;
      } else if (/phone|mobile|cell|contactno|callingno/i.test(cleanH)) {
        if (!autoMap.phone) autoMap.phone = colIdx;
      } else if (/company|business|org|firm|shop/i.test(cleanH)) {
        if (!autoMap.company) autoMap.company = colIdx;
      } else if (/email|mail/i.test(cleanH)) {
        if (!autoMap.email) autoMap.email = colIdx;
      } else if (/address|street|location/i.test(cleanH)) {
        if (!autoMap.address) autoMap.address = colIdx;
      } else if (/city|town/i.test(cleanH)) {
        if (!autoMap.city) autoMap.city = colIdx;
      } else if (/state|province/i.test(cleanH)) {
        if (!autoMap.state) autoMap.state = colIdx;
      } else if (/category|industry|type|segment/i.test(cleanH)) {
        if (!autoMap.category) autoMap.category = colIdx;
      } else if (/note|remark|comment|detail/i.test(cleanH)) {
        if (!autoMap.notes) autoMap.notes = colIdx;
      }
    });

    setColumnMap(autoMap);
    setStep(2);
  };

  const handleProceedToReview = () => {
    if (columnMap.name === undefined || columnMap.name === '') {
      setErrorMsg('Please map the mandatory "Name" column.');
      return;
    }
    if (columnMap.phone === undefined || columnMap.phone === '') {
      setErrorMsg('Please map the mandatory "Phone" column.');
      return;
    }

    setErrorMsg('');

    // Selected Assignee Info
    let targetEmp = null;
    if (assignedToId) {
      targetEmp = activeStaff.find(s => s.id === assignedToId);
    }

    const valid = [];
    const errors = [];
    const dups = [];
    const seenPhonesInBatch = new Set();

    parsedDataRows.forEach((row, idx) => {
      const rowNum = idx + 2; // 1-indexed including header
      const name = (row[columnMap.name] || '').trim();
      const phone = (row[columnMap.phone] || '').trim();
      const company = columnMap.company !== undefined ? (row[columnMap.company] || '').trim() : '';
      const email = columnMap.email !== undefined ? (row[columnMap.email] || '').trim() : '';
      const address = columnMap.address !== undefined ? (row[columnMap.address] || '').trim() : '';
      const city = columnMap.city !== undefined ? (row[columnMap.city] || '').trim() : '';
      const state = columnMap.state !== undefined ? (row[columnMap.state] || '').trim() : '';
      const category = columnMap.category !== undefined ? (row[columnMap.category] || 'General').trim() : 'General';
      const notes = columnMap.notes !== undefined ? (row[columnMap.notes] || '').trim() : '';

      if (!name) {
        errors.push({ row: rowNum, error: 'Missing mandatory name' });
        return;
      }
      if (!phone) {
        errors.push({ row: rowNum, error: 'Missing mandatory phone number' });
        return;
      }

      const norm = normalizePhoneNumber(phone);
      if (!norm || norm.length < 8) {
        errors.push({ row: rowNum, error: `Invalid phone format: "${phone}"` });
        return;
      }

      // Check duplicate within the current file
      if (seenPhonesInBatch.has(norm)) {
        dups.push({ row: rowNum, name, phone, reason: 'Duplicate in current file' });
        return;
      }
      seenPhonesInBatch.add(norm);

      // Check existing duplicate in CRM
      const crmDup = detectPhoneDuplicate(norm);
      if (crmDup.exists) {
        dups.push({ row: rowNum, name, phone, reason: crmDup.message, type: crmDup.type });
        if (!allowDuplicates) return;
      }

      valid.push({
        name,
        phone,
        company,
        email,
        address,
        city,
        state,
        category,
        notes,
        source: fileName ? `Import: ${fileName}` : 'Bulk CSV Import',
        assignedToId: targetEmp ? targetEmp.id : null,
        assignedToName: targetEmp ? targetEmp.name : null,
        allowDuplicate: allowDuplicates
      });
    });

    setValidRecords(valid);
    setRowErrors(errors);
    setDuplicatesDetected(dups);
    setStep(3);
  };

  const handleExecuteImport = () => {
    if (validRecords.length === 0) {
      setErrorMsg('No valid records to import. Please resolve the errors.');
      return;
    }

    setSubmitting(true);
    try {
      const res = bulkImportColdLeads(validRecords);
      if (!res.success) {
        setErrorMsg(res.errors?.[0]?.error || 'Failed to import records.');
        setSubmitting(false);
        return;
      }

      if (onSuccess) {
        onSuccess({
          imported: res.importedCount,
          duplicatesSkipped: duplicatesDetected.length,
          errorsCount: rowErrors.length
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred during bulk import.');
    } finally {
      setSubmitting(false);
    }
  };

  // Download sample CSV
  const handleDownloadSample = () => {
    const csvContent = "Name,Phone,Company,Email,Address,City,Category,Notes\n" +
      "Rajesh Sharma,9876543210,Apex Fitness,rajesh@example.com,MG Road Shop 14,Indore,Gym & Fitness,Owner interested in CRM demo\n" +
      "Priya Verma,9123456780,Verma Logistics,priya@vermalog.com,Ring Road Hub,Bhopal,Manufacturing,Follow up in morning\n" +
      "Amit Patel,9988776655,Patel Electronics,,Station Road,Ahmedabad,Retail & Shops,New inquiry";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_cold_calling_leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-[scaleUp_0.25s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bulk Import Cold Calling Records</h3>
              <p className="text-xs text-slate-500">
                Step {step} of 3 — {step === 1 ? 'Upload File' : step === 2 ? 'Map Columns' : 'Validate & Confirm'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
              title="Download sample CSV template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content By Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* STEP 1: Upload File or Paste CSV */}
          {step === 1 && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-200 hover:border-orange-500 rounded-2xl p-8 text-center bg-orange-50/40 hover:bg-orange-50/70 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Click to browse or drop CSV / TSV file
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports comma-separated or tab-delimited files (.csv, .tsv, .txt)
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-medium text-slate-600 shadow-2xs">
                  <span>Mandatory columns: Name & Phone Number</span>
                </div>
              </div>

              {/* Paste Text Option */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                  <span>Or paste CSV text directly</span>
                  {rawText && (
                    <button 
                      type="button" 
                      onClick={() => setRawText('')} 
                      className="text-orange-600 hover:underline normal-case text-xs"
                    >
                      Clear
                    </button>
                  )}
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={"Name,Phone,Company,Email,Address\nRajesh Sharma,9876543210,Apex Fitness,rajesh@example.com,Indore"}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-800 text-xs font-mono outline-none transition-all resize-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="sm:hidden inline-flex items-center gap-1 text-xs text-orange-600 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
                <div className="flex-1 text-right">
                  <button
                    type="button"
                    disabled={!rawText.trim()}
                    onClick={() => processRawCSV(rawText)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Process & Map Columns</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Map Columns */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span>
                  Found <strong>{parsedDataRows.length}</strong> data rows from file: <strong>{fileName || 'Pasted CSV'}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Change File
                </button>
              </div>

              {/* Column Mapping Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">CRM Field</th>
                      <th className="px-4 py-2.5">Mapped CSV Column</th>
                      <th className="px-4 py-2.5">Sample Value (Row 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {STANDARD_FIELDS.map(f => {
                      const selectedIdx = columnMap[f.id];
                      const sampleVal = selectedIdx !== undefined && parsedDataRows[0] ? parsedDataRows[0][selectedIdx] : '—';
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-medium">
                            <span className={f.required ? 'font-bold text-slate-900' : 'text-slate-700'}>
                              {f.label}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={selectedIdx !== undefined ? selectedIdx : ''}
                              onChange={e => {
                                const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                                setColumnMap(prev => ({ ...prev, [f.id]: val }));
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                                f.required && (selectedIdx === undefined || selectedIdx === '')
                                  ? 'border-rose-300 bg-rose-50 text-rose-900 font-bold'
                                  : 'border-slate-200 bg-white text-slate-800 focus:border-orange-500'
                              }`}
                            >
                              <option value="">— Skip Column —</option>
                              {parsedHeaders.map((h, idx) => (
                                <option key={idx} value={idx}>
                                  Col {idx + 1}: {h}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 text-slate-500 font-mono truncate max-w-[150px]">
                            {sampleVal || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Assignment Setting */}
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-800">
                  Assign this batch to an Employee (Optional)
                </label>
                <select
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-slate-900 text-xs outline-none"
                >
                  <option value="">— Leave in Shared Unassigned Pool (Claimable by any telecaller) —</option>
                  {currentUser && (
                    <option value={currentUser.employeeId || currentUser.uid}>
                      Assign to Me ({currentUser.name})
                    </option>
                  )}
                  {activeStaff
                    .filter(e => e.id !== (currentUser?.employeeId || currentUser?.uid))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position || emp.role})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Step 2 Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToReview}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95"
                >
                  <span>Validate & Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review, Duplicate Resolution & Final Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xl font-bold text-emerald-700">{validRecords.length}</span>
                  <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">Ready to Import</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-xl font-bold text-amber-700">{duplicatesDetected.length}</span>
                  <p className="text-[11px] font-semibold text-amber-800 mt-0.5">Duplicates Found</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-xl font-bold text-rose-700">{rowErrors.length}</span>
                  <p className="text-[11px] font-semibold text-rose-800 mt-0.5">Row Errors</p>
                </div>
              </div>

              {/* Duplicate Handling Option */}
              {duplicatesDetected.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">
                        Duplicate phone numbers detected ({duplicatesDetected.length} records)
                      </p>
                      <p className="text-slate-600 text-[11px]">
                        By default, duplicates are skipped to protect CRM data integrity.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1 border-t border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDuplicates}
                      onChange={e => {
                        setAllowDuplicates(e.target.checked);
                        // Re-run validation to include/exclude duplicates
                        setTimeout(handleProceedToReview, 10);
                      }}
                      className="rounded border-amber-400 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium text-slate-800">
                      Force-import duplicate records anyway
                    </span>
                  </label>
                </div>
              )}

              {/* Row-Level Errors List if any */}
              {rowErrors.length > 0 && (
                <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/60 max-h-36 overflow-y-auto space-y-1">
                  <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Row Validation Errors (These rows will be skipped):</span>
                  </p>
                  {rowErrors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-700 font-mono">
                      • Line {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview Table of Ready Records */}
              {validRecords.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Preview of Valid Records (First 5 of {validRecords.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Destination: {assignedToId ? `Assigned to ${activeStaff.find(s=>s.id===assignedToId)?.name}` : 'Shared Pool'}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-1.5">Name</th>
                          <th className="px-3 py-1.5">Phone</th>
                          <th className="px-3 py-1.5">Company</th>
                          <th className="px-3 py-1.5">Category</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-mono text-[11px]">
                        {validRecords.slice(0, 5).map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 font-bold font-sans text-slate-900">{rec.name}</td>
                            <td className="px-3 py-1.5 text-orange-600">{rec.phone}</td>
                            <td className="px-3 py-1.5 font-sans truncate max-w-[120px]">{rec.company || '—'}</td>
                            <td className="px-3 py-1.5 font-sans">{rec.category || 'General'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 3 Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={validRecords.length === 0 || submitting}
                  onClick={handleExecuteImport}
                  className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting ? 'Importing...' : `Confirm & Import ${validRecords.length} Records`}
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ColdBulkImportModal;
