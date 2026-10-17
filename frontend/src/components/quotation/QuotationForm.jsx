import React, { useState, useEffect } from 'react';
import { 
  useCRM, 
  generateDocumentNumber, 
  formatDateDMY, 
  syncDocIdWithDate, 
  normalizeDocumentId, 
  getDDMMYYFromDate 
} from '../../context/CRMContext';
import { X, Plus, Trash2, IndianRupee, FileText, Receipt, RotateCw } from 'lucide-react';

const QuotationForm = ({ isOpen, onClose, clientOrLeadId, type, quotationToEdit, defaultDocType = 'Quotation' }) => {
  const { leads, clients, addQuotation, updateQuotation, getTodayDateString } = useCRM();

  const [docType, setDocType] = useState(defaultDocType); // 'Quotation' or 'Invoice'
  const [docId, setDocId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [address, setAddress] = useState('');
  const [selectedEntity, setSelectedEntity] = useState({ id: '', type: 'client' });
  const [items, setItems] = useState([
    { description: 'Project Cost (Solar Business Management )', breakdown: '30,000', qty: 1, rate: 30000 },
    { description: 'Employee Tracking Android Application', breakdown: '100 ( per user for month )', qty: 1, rate: 0 }
  ]);
  const [advancePaid, setAdvancePaid] = useState(14000);
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');

  // Hydrate fields
  useEffect(() => {
    if (quotationToEdit) {
      const editDate = quotationToEdit.date || getTodayDateString();
      setDocType(quotationToEdit.docType || 'Quotation');
      setDocId(normalizeDocumentId(quotationToEdit.id || quotationToEdit.docNumber, editDate));
      setTitle(quotationToEdit.title || '');
      setDate(editDate);
      setAddress(quotationToEdit.address || '');
      setSelectedEntity({ id: quotationToEdit.clientOrLeadId, type: quotationToEdit.type });
      setItems(quotationToEdit.items || [{ description: '', breakdown: '', qty: 1, rate: 0 }]);
      setAdvancePaid(quotationToEdit.advancePaid !== undefined ? quotationToEdit.advancePaid : 0);
      setStatus(quotationToEdit.status || 'Draft');
      setNotes(quotationToEdit.notes || '');
    } else {
      const initialDate = getTodayDateString();
      setDate(initialDate);
      setDocType(defaultDocType);
      setDocId(generateDocumentNumber(initialDate, false));
      
      const targetId = clientOrLeadId || '';
      const targetType = type || 'client';
      setSelectedEntity({ id: targetId, type: targetType });

      // Find address if target selected
      let foundAddr = '';
      if (targetType === 'lead') {
        const l = leads.find(item => item.id === targetId);
        if (l) foundAddr = l.address || '';
      } else {
        const c = clients.find(item => item.id === targetId);
        if (c) foundAddr = c.address || '';
      }
      setAddress(foundAddr);

      if (defaultDocType === 'Invoice') {
        setTitle('Solar Business Management ,Employee Tracking Android Application');
        setItems([
          { description: 'Project Cost (Solar Business Management ,Employee Tracking Android Application)', breakdown: '30,000', qty: 1, rate: 30000 }
        ]);
        setAdvancePaid(14000);
      } else {
        setTitle('Solar Business Management & Employee Tracking');
        setItems([
          { description: 'Project Cost (Solar Business Management )', breakdown: '30,000', qty: 1, rate: 30000 },
          { description: 'Employee Tracking Android Application', breakdown: '100 ( per user for month )', qty: 1, rate: 0 }
        ]);
        setAdvancePaid(0);
      }
      setStatus('Sent');
      setNotes('');
    }
  }, [isOpen, clientOrLeadId, type, quotationToEdit, defaultDocType]);

  // When entity changes, auto-populate address
  const handleEntityChange = (id, eType) => {
    setSelectedEntity({ id, type: eType });
    if (eType === 'lead') {
      const l = leads.find(item => item.id === id);
      if (l && l.address) setAddress(l.address);
    } else {
      const c = clients.find(item => item.id === id);
      if (c && c.address) setAddress(c.address);
    }
  };

  // When date changes, automatically synchronize docId with the new date's DDMMYY
  const handleDateChange = (newDate) => {
    setDate(newDate);
    setDocId(prev => syncDocIdWithDate(prev, newDate, false));
  };

  // Increment serial number on demand
  const handleNextSerial = () => {
    setDocId(prev => syncDocIdWithDate(prev, date, true));
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', breakdown: '', qty: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { 
          ...item, 
          [field]: (field === 'description' || field === 'breakdown') ? value : Number(value) 
        };
      }
      return item;
    }));
  };

  // Calculations
  const calculatedTotal = items.reduce((sum, item) => sum + (item.rate > 0 ? (item.qty * item.rate) : 0), 0) || 30000;
  const remainingAmount = Math.max(0, calculatedTotal - Number(advancePaid));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a document title.");
      return;
    }
    if (!selectedEntity.id) {
      alert("Please select a target client or lead.");
      return;
    }

    // Resolve client / lead info
    let entityName = '';
    let entityPhone = '';
    let entityEmail = '';

    if (selectedEntity.type === 'lead') {
      const l = leads.find(item => item.id === selectedEntity.id);
      if (l) {
        entityName = l.name;
        entityPhone = l.phone;
        entityEmail = l.email;
      }
    } else {
      const c = clients.find(item => item.id === selectedEntity.id);
      if (c) {
        entityName = c.name;
        entityPhone = c.phone;
        entityEmail = c.email;
      }
    }

    const finalDocId = normalizeDocumentId(docId || generateDocumentNumber(date, false), date);

    const payload = {
      id: finalDocId,
      docNumber: finalDocId,
      docType,
      title,
      clientOrLeadId: selectedEntity.id,
      type: selectedEntity.type,
      clientName: entityName,
      address,
      phone: entityPhone,
      email: entityEmail,
      date,
      items,
      total: calculatedTotal,
      advancePaid: docType === 'Invoice' ? Number(advancePaid) : 0,
      remaining: docType === 'Invoice' ? remainingAmount : calculatedTotal,
      useGST: false,
      taxRate: 0,
      notes,
      status
    };

    if (quotationToEdit) {
      updateQuotation(quotationToEdit.id, payload);
    } else {
      addQuotation(payload);
    }
    onClose();
  };

  // Target options
  const targetOptions = [
    ...leads.map(l => ({ id: l.id, name: `${l.name} (Lead - ${l.status})`, type: 'lead' })),
    ...clients.map(c => ({ id: c.id, name: `${c.name} (${c.companyName || 'Client'})`, type: 'client' }))
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-2xl animate-[scaleUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              {quotationToEdit ? `Edit ${docType} ${quotationToEdit.id}` : `Create New ${docType}`}
            </h3>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-orange-50 text-orange-600 border border-orange-200">
              {docId}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          {/* Document Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Document Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocType('Quotation')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  docType === 'Quotation'
                    ? 'bg-orange-50 border-orange-400 text-orange-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-orange-600" />
                <span>QUOTATION</span>
              </button>
              <button
                type="button"
                onClick={() => setDocType('Invoice')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  docType === 'Invoice'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>INVOICE (BILL)</span>
              </button>
            </div>
          </div>

          {/* Doc ID & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleNextSerial}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                  title="Generate next auto-incremented serial number"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>+ Next Serial</span>
                </button>
              </div>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 font-mono text-sm outline-none transition-all"
                placeholder="e.g. SETU-050926059"
                value={docId}
                onChange={e => setDocId(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                Format: <span className="text-orange-600 font-semibold">SETU-DDMMYYXXX</span> (Syncs with date)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Preparation Date (DD-MM-YYYY)
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
                value={date}
                onChange={e => handleDateChange(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Date Code: <span className="font-mono text-slate-700 font-bold">{getDDMMYYFromDate(date)}</span> ({formatDateDMY(date)})
              </p>
            </div>
          </div>

          {/* Associate Entity & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Client / Lead <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all cursor-pointer"
                value={`${selectedEntity.id}:${selectedEntity.type}`}
                onChange={e => {
                  const [id, eType] = e.target.value.split(':');
                  handleEntityChange(id, eType);
                }}
              >
                <option value="">-- Select Client or Lead --</option>
                {targetOptions.map(opt => (
                  <option key={`${opt.id}:${opt.type}`} value={`${opt.id}:${opt.type}`}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Document Status
              </label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all cursor-pointer"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {['Draft', 'Sent', 'Accepted', 'Rejected'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Client Full Address
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              placeholder="e.g. Building No.: 69, Sita Nagar Road, Near Satish Bakery, Sita Nagar Nagpur, Maharashtra PIN Code: 440025"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          {/* Project Title / Scope */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Project Description / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              placeholder="e.g. Solar Business Management, Employee Tracking Android Application"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Line items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Billing Breakdown Rows
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-2xl relative">
                  {/* Item description */}
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Project Cost (Solar Business Management )"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg outline-none text-slate-900"
                      value={item.description}
                      onChange={e => handleItemChange(index, 'description', e.target.value)}
                    />
                  </div>

                  {/* Breakdown text or rate */}
                  <div className="w-full sm:w-44">
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Plan Breakdown</label>
                    <input
                      type="text"
                      placeholder="e.g. 30,000 or 100 ( per user for month )"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg outline-none text-slate-900"
                      value={item.breakdown}
                      onChange={e => handleItemChange(index, 'breakdown', e.target.value)}
                    />
                  </div>

                  {/* Numeric Amount */}
                  <div className="w-full sm:w-28">
                    <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="30000"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg outline-none text-slate-900"
                      value={item.rate}
                      onChange={e => handleItemChange(index, 'rate', e.target.value)}
                    />
                  </div>

                  {/* Remove button */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 hover:border-red-200 rounded-lg self-end sm:self-center mt-4 sm:mt-4 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invoice Advance / Remaining Section */}
          {docType === 'Invoice' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Invoice Payment Splits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 focus:border-amber-500 rounded-xl outline-none text-slate-900 font-bold"
                    placeholder="e.g. 14000"
                    value={advancePaid}
                    onChange={e => setAdvancePaid(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Remaining Balance (₹)
                  </label>
                  <div className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-amber-700 font-black">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(remainingAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing summary */}
          <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-700">Total Project Price:</span>
            <span className="text-base font-black text-orange-600 font-mono">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(calculatedTotal)}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-xs cursor-pointer"
            >
              {quotationToEdit ? 'Save Changes' : `Save & Generate ${docType}`}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default QuotationForm;
