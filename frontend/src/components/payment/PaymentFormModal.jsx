import React, { useState, useEffect, useMemo } from 'react';
import { useCRM, normalizePhoneNumber } from '../../context/CRMContext';
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles, 
  FileText, 
  Clock, 
  Send, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck,
  CreditCard,
  ChevronDown,
  RotateCw
} from 'lucide-react';

const PaymentFormModal = ({ isOpen, onClose, preselectedClientId, preselectedContext, onBillCreated, paymentToEdit = null }) => {
  const { 
    clients, 
    leads, 
    quotations, 
    payments, 
    addCustomPayment, 
    recordFirstPaymentDeal,
    updateFirstPaymentDeal,
    getTodayDateString, 
    currentUser 
  } = useCRM();

  // Mode: 'deal_setup' (1st Payment & Onboarding) or 'existing_quote' (Link Pre-existing Quote)
  const [activeMode, setActiveMode] = useState('deal_setup');

  // Selected Target Entity
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('lead'); // 'lead' | 'client'

  // Client Details (Auto-filled & Editable)
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // 1st Payment / Deal Agreement Fields (As requested by USER)
  // 1. Total Project Amount
  const [totalProjectAmount, setTotalProjectAmount] = useState('');
  // 2. Advance Amount (1st Payment)
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isAdvanceCollected, setIsAdvanceCollected] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, Bank Transfer, Cash, Cheque, Card
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  // 3. Subscription Duration in Months
  const [subscriptionDurationMonths, setSubscriptionDurationMonths] = useState(12);
  // 4. Renewal Cost for Next Year
  const [renewalCost, setRenewalCost] = useState('');
  // 5. Next Installment Date & Splits
  const [nextInstallmentDate, setNextInstallmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [enableCustomSplits, setEnableCustomSplits] = useState(false);
  const [customSplits, setCustomSplits] = useState([]);
  // 6. Product Description & Price Breakdown
  const [productDescription, setProductDescription] = useState('Solar Business Management & Tracking Solution');
  const [priceBreakdownItems, setPriceBreakdownItems] = useState([
    { description: 'Solar Business Management Software License', breakdown: 'Core CRM, Pipeline & Inventory', qty: 1, rate: 0 },
    { description: 'Employee Tracking Android Application', breakdown: 'Field GPS, Attendance & Live Sync', qty: 1, rate: 0 }
  ]);
  const [showItemizedBreakdown, setShowItemizedBreakdown] = useState(false);
  // Other details
  const [dealNotes, setDealNotes] = useState('');
  const [sendWhatsAppReceipt, setSendWhatsAppReceipt] = useState(true);

  // Existing Quote Mode Fields
  const [quoteId, setQuoteId] = useState('');
  const [standardInstalments, setStandardInstalments] = useState([{ amount: '', dueDate: getTodayDateString() }]);
  const [standardTotalAmount, setStandardTotalAmount] = useState(0);

  // Alert & Feedback state
  const [formError, setFormError] = useState('');

  // List of candidate targets (Clients and Won/Pipeline Leads)
  const targetCandidates = useMemo(() => {
    const list = [];
    // 1. Converted / Existing Clients
    clients.forEach(c => {
      list.push({
        id: c.id,
        type: 'client',
        displayName: `${c.name} (${c.companyName || 'Client'})`,
        client: c,
        phone: c.phone,
        email: c.email,
        company: c.companyName,
        badge: 'Client'
      });
    });
    // 2. Won Leads (or active leads)
    leads.forEach(l => {
      // Don't duplicate if already in client list
      const alreadyClient = clients.some(c => c.originatingLeadId === l.id || (l.convertedClientId && c.id === l.convertedClientId));
      if (!alreadyClient) {
        list.push({
          id: l.id,
          type: 'lead',
          displayName: `${l.name} (${l.company || 'Lead'})`,
          lead: l,
          phone: l.phone,
          email: l.email,
          company: l.company,
          badge: l.status === 'Won' ? 'Won Lead' : `${l.status} Lead`
        });
      }
    });
    return list;
  }, [clients, leads]);

  // Hydrate modal whenever opened or preselected ID changes
  useEffect(() => {
    if (!isOpen) {
      setFormError('');
      return;
    }

    const today = getTodayDateString();
    setPaymentDate(today);

    const defaultNextDue = new Date();
    defaultNextDue.setDate(defaultNextDue.getDate() + 30);
    setNextInstallmentDate(defaultNextDue.toISOString().split('T')[0]);

    // Handle Edit Mode for Existing Invoice / Payment
    if (paymentToEdit) {
      setActiveMode('deal_setup');
      const client = clients.find(c => c.id === paymentToEdit.clientId);
      const linkedQuote = quotations.find(q => q.id === paymentToEdit.quotationId);

      setSelectedEntityId(paymentToEdit.clientId || '');
      setSelectedEntityType('client');
      setClientName(paymentToEdit.clientName || client?.name || '');
      setCompanyName(paymentToEdit.companyName || client?.companyName || '');
      setPhone(client?.phone || '');
      setEmail(client?.email || '');
      setAddress(client?.address || linkedQuote?.address || '');

      setTotalProjectAmount(paymentToEdit.totalAmount || '');
      setSubscriptionDurationMonths(paymentToEdit.subscriptionDurationMonths || client?.subscriptionDurationMonths || 12);
      setRenewalCost(paymentToEdit.renewalCost !== undefined ? paymentToEdit.renewalCost : (client?.renewalCost || linkedQuote?.renewalPrice || ''));
      setProductDescription(paymentToEdit.quoteTitle || linkedQuote?.title || 'Solar Business Management & Tracking Solution');

      if (linkedQuote?.items && linkedQuote.items.length > 0) {
        setPriceBreakdownItems(linkedQuote.items);
        setShowItemizedBreakdown(true);
      }

      const insts = paymentToEdit.instalments || [];
      if (insts.length > 0) {
        const first = insts[0];
        setAdvanceAmount(first.amount || '');
        setIsAdvanceCollected(first.status === 'Paid');
        setPaymentMethod(first.paymentMethod || 'UPI');
        setTransactionRef(first.transactionRef || '');
        setPaymentDate(first.paidDate || first.dueDate || today);

        if (insts.length > 2) {
          setEnableCustomSplits(true);
          setCustomSplits(insts.slice(1).map(i => ({ amount: i.amount, dueDate: i.dueDate, notes: i.notes || '' })));
        } else if (insts.length === 2) {
          setEnableCustomSplits(false);
          setNextInstallmentDate(insts[1].dueDate || defaultNextDue.toISOString().split('T')[0]);
        }
      }
      return;
    }

    // Find candidate by preselectedClientId or preselectedContext
    const targetId = preselectedClientId || preselectedContext?.client?.id || preselectedContext?.lead?.id || '';
    
    let resolvedClient = null;
    let resolvedLead = null;

    if (preselectedContext?.client) resolvedClient = preselectedContext.client;
    if (preselectedContext?.lead) resolvedLead = preselectedContext.lead;

    if (!resolvedClient && targetId) {
      resolvedClient = clients.find(c => c.id === targetId || c.originatingLeadId === targetId);
    }
    if (!resolvedLead && targetId) {
      resolvedLead = leads.find(l => l.id === targetId || (resolvedClient && l.id === resolvedClient.originatingLeadId));
    }
    if (!resolvedLead && resolvedClient?.phone) {
      const normCPhone = normalizePhoneNumber(resolvedClient.phone);
      resolvedLead = leads.find(l => normalizePhoneNumber(l.phone) === normCPhone);
    }

    // Determine initial active mode
    if (resolvedClient) {
      setSelectedEntityId(resolvedClient.id);
      setSelectedEntityType('client');
      setClientName(resolvedClient.name || '');
      setCompanyName(resolvedClient.companyName || '');
      setPhone(resolvedClient.phone || '');
      setEmail(resolvedClient.email || '');
      setAddress(resolvedClient.address || '');

      // Check existing payments
      const existingClientPayments = payments.filter(p => p.clientId === resolvedClient.id);
      const acceptedQuotes = quotations.filter(q => q.clientOrLeadId === resolvedClient.id && q.status === 'Accepted');

      if (existingClientPayments.length === 0) {
        setActiveMode('deal_setup');
      } else if (acceptedQuotes.length > 0) {
        // Can offer either, default to deal setup if asked from record installment
        setActiveMode('deal_setup');
      } else {
        setActiveMode('deal_setup');
      }

      // Check if client had previous duration / renewal cost saved
      if (resolvedClient.subscriptionDurationMonths) {
        setSubscriptionDurationMonths(resolvedClient.subscriptionDurationMonths);
      }
      if (resolvedClient.renewalCost) {
        setRenewalCost(resolvedClient.renewalCost);
      }
    } else if (resolvedLead) {
      setSelectedEntityId(resolvedLead.id);
      setSelectedEntityType('lead');
      setClientName(resolvedLead.name || '');
      setCompanyName(resolvedLead.company || resolvedLead.name || '');
      setPhone(resolvedLead.phone || '');
      setEmail(resolvedLead.email || '');
      setAddress(resolvedLead.address || '');
      setActiveMode('deal_setup'); // Always 1st payment deal setup for leads!

      // Check if lead has an attached quotation or deal value
      const leadQuote = quotations.find(q => q.clientOrLeadId === resolvedLead.id);
      if (leadQuote) {
        setTotalProjectAmount(leadQuote.total || '');
        setAdvanceAmount(leadQuote.advancePaid || Math.round((leadQuote.total || 0) / 2));
        if (leadQuote.renewalPrice) setRenewalCost(leadQuote.renewalPrice);
        if (leadQuote.title) setProductDescription(leadQuote.title);
        if (leadQuote.items && leadQuote.items.length > 0) {
          setPriceBreakdownItems(leadQuote.items);
          setShowItemizedBreakdown(true);
        }
      } else if (resolvedLead.dealValue) {
        setTotalProjectAmount(resolvedLead.dealValue);
        setAdvanceAmount(resolvedLead.advancePaid || Math.round(Number(resolvedLead.dealValue) / 2));
      }
    } else {
      // No preselection
      setSelectedEntityId('');
      setClientName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setActiveMode('deal_setup');
    }
  }, [isOpen, preselectedClientId, preselectedContext, paymentToEdit, clients, leads, quotations, payments]);

  // Synchronize itemized breakdown sum with total project amount if user desires
  const itemsTotalSum = useMemo(() => {
    return priceBreakdownItems.reduce((sum, item) => sum + (Number(item.rate) || 0) * (Number(item.qty) || 1), 0);
  }, [priceBreakdownItems]);

  // Derived Financials for Deal Setup
  const numTotal = Math.max(0, Number(totalProjectAmount) || 0);
  const numAdvance = Math.max(0, Number(advanceAmount) || 0);
  const remainingBalance = Math.max(0, numTotal - numAdvance);

  // Auto-calculated Subscription Validity Date
  const subscriptionEndDate = useMemo(() => {
    const start = paymentDate ? new Date(paymentDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(subscriptionDurationMonths || 12));
    const pad = (n) => String(n).padStart(2, '0');
    return `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
  }, [paymentDate, subscriptionDurationMonths]);

  if (!isOpen) return null;

  // Handler: Selecting a candidate from dropdown when opened with no preselection
  const handleSelectCandidate = (candidateId) => {
    setSelectedEntityId(candidateId);
    const candidate = targetCandidates.find(c => c.id === candidateId);
    if (!candidate) return;

    if (candidate.type === 'client') {
      const c = candidate.client;
      setSelectedEntityType('client');
      setClientName(c.name || '');
      setCompanyName(c.companyName || '');
      setPhone(c.phone || '');
      setEmail(c.email || '');
      setAddress(c.address || '');
      if (c.subscriptionDurationMonths) setSubscriptionDurationMonths(c.subscriptionDurationMonths);
      if (c.renewalCost) setRenewalCost(c.renewalCost);
    } else {
      const l = candidate.lead;
      setSelectedEntityType('lead');
      setClientName(l.name || '');
      setCompanyName(l.company || l.name || '');
      setPhone(l.phone || '');
      setEmail(l.email || '');
      setAddress(l.address || '');
      if (l.dealValue) setTotalProjectAmount(l.dealValue);
    }
  };

  // Helper for quick advance percentage buttons
  const handleSetAdvancePercent = (percent) => {
    if (!numTotal) return;
    if (percent === 100) {
      setAdvanceAmount(numTotal);
    } else {
      setAdvanceAmount(Math.round((numTotal * percent) / 100));
    }
  };

  // Price breakdown items handlers
  const handleAddItemRow = () => {
    setPriceBreakdownItems(prev => [
      ...prev,
      { description: '', breakdown: '', qty: 1, rate: 0 }
    ]);
  };

  const handleRemoveItemRow = (idx) => {
    if (priceBreakdownItems.length === 1) return;
    setPriceBreakdownItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (idx, field, value) => {
    setPriceBreakdownItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return {
          ...item,
          [field]: field === 'rate' || field === 'qty' ? Number(value) : value
        };
      }
      return item;
    }));
  };

  // Custom Splits Builder for Remaining Balance
  const handleAddCustomSplit = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (customSplits.length + 2) * 30);
    setCustomSplits(prev => [
      ...prev,
      { amount: '', dueDate: nextDate.toISOString().split('T')[0], notes: `Part ${prev.length + 3}` }
    ]);
  };

  const handleRemoveCustomSplit = (idx) => {
    setCustomSplits(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCustomSplitChange = (idx, field, value) => {
    setCustomSplits(prev => prev.map((split, i) => {
      if (i === idx) {
        return {
          ...split,
          [field]: field === 'amount' ? Number(value) : value
        };
      }
      return split;
    }));
  };

  // -------------------------------------------------------------
  // Existing Quote Mode Handlers
  // -------------------------------------------------------------
  const clientQuotes = quotations.filter(q => q.clientOrLeadId === selectedEntityId && q.status === 'Accepted');

  const handleQuoteChange = (qId) => {
    setQuoteId(qId);
    const quote = quotations.find(q => q.id === qId);
    if (quote) {
      setStandardTotalAmount(quote.total);
      const half = Math.round(quote.total / 2);
      const due2 = new Date();
      due2.setDate(due2.getDate() + 30);
      setStandardInstalments([
        { amount: half, dueDate: getTodayDateString() },
        { amount: quote.total - half, dueDate: due2.toISOString().split('T')[0] }
      ]);
    } else {
      setStandardTotalAmount(0);
      setStandardInstalments([{ amount: '', dueDate: getTodayDateString() }]);
    }
  };

  const handleAddStandardInstalment = () => {
    setStandardInstalments(prev => [...prev, { amount: '', dueDate: getTodayDateString() }]);
  };

  const handleRemoveStandardInstalment = (index) => {
    if (standardInstalments.length === 1) return;
    setStandardInstalments(prev => prev.filter((_, i) => i !== index));
  };

  const handleStandardInstalmentChange = (index, field, value) => {
    setStandardInstalments(prev => prev.map((inst, i) => {
      if (i === index) {
        return { ...inst, [field]: field === 'amount' ? Number(value) : value };
      }
      return inst;
    }));
  };

  // -------------------------------------------------------------
  // Submit Deal Onboarding / 1st Payment
  // -------------------------------------------------------------
  const handleSubmitDealSetup = (e) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim()) {
      setFormError('Please enter the client / customer name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter the client phone number for record and receipts.');
      return;
    }
    if (numTotal <= 0) {
      setFormError('Please enter a valid Total Project Amount (greater than ₹0).');
      return;
    }
    if (numAdvance > numTotal) {
      setFormError(`Advance amount (₹${numAdvance}) cannot exceed the Total Project Amount (₹${numTotal}).`);
      return;
    }

    // Validate custom balance splits if enabled
    let finalCustomSplits = null;
    if (enableCustomSplits && remainingBalance > 0) {
      const splitsSum = customSplits.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      if (Math.abs(splitsSum - remainingBalance) > 1) {
        setFormError(`Sum of custom remaining installments (₹${splitsSum}) must equal remaining balance (₹${remainingBalance}).`);
        return;
      }
      if (customSplits.some(s => !s.dueDate || Number(s.amount) <= 0)) {
        setFormError('Please enter a valid amount and due date for each custom installment.');
        return;
      }
      finalCustomSplits = customSplits;
    }

    // Build items list
    let finalItems = priceBreakdownItems.filter(item => item.description.trim() !== '');
    if (finalItems.length === 0) {
      finalItems = [
        {
          description: productDescription.trim() || 'Software & Implementation Services',
          breakdown: `${subscriptionDurationMonths} Months Active Subscription`,
          qty: 1,
          rate: numTotal
        }
      ];
    }

    // Execute Record or Update First Payment Deal
    try {
      let result;
      if (paymentToEdit) {
        result = updateFirstPaymentDeal({
          paymentId: paymentToEdit.id,
          clientName: clientName.trim(),
          companyName: companyName.trim() || clientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          totalAmount: numTotal,
          advanceAmount: numAdvance,
          subscriptionDurationMonths: Number(subscriptionDurationMonths) || 12,
          renewalCost: Number(renewalCost) || 0,
          nextInstallmentDate: remainingBalance > 0 ? nextInstallmentDate : '',
          productDescription: productDescription.trim(),
          items: finalItems,
          paymentMethod,
          transactionRef: transactionRef.trim(),
          paymentDate: paymentDate || getTodayDateString(),
          isAdvanceCollected,
          customInstalments: finalCustomSplits,
          notes: dealNotes.trim(),
          sendWhatsAppReceipt: false
        });
      } else {
        result = recordFirstPaymentDeal({
          leadId: selectedEntityType === 'lead' ? selectedEntityId : null,
          clientId: selectedEntityType === 'client' ? selectedEntityId : null,
          clientName: clientName.trim(),
          companyName: companyName.trim() || clientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          totalAmount: numTotal,
          advanceAmount: numAdvance,
          subscriptionDurationMonths: Number(subscriptionDurationMonths) || 12,
          renewalCost: Number(renewalCost) || 0,
          nextInstallmentDate: remainingBalance > 0 ? nextInstallmentDate : '',
          productDescription: productDescription.trim(),
          items: finalItems,
          paymentMethod,
          transactionRef: transactionRef.trim(),
          paymentDate: paymentDate || getTodayDateString(),
          isAdvanceCollected,
          customInstalments: finalCustomSplits,
          notes: dealNotes.trim(),
          sendWhatsAppReceipt
        });
      }

      if (result && result.success) {
        if (onBillCreated && result.quotation) {
          onBillCreated(result.quotation, result.client);
        }
        onClose();
      } else {
        setFormError('Failed to record deal. Please verify details and try again.');
      }
    } catch (err) {
      console.error('Error saving deal:', err);
      setFormError(`An error occurred while saving: ${err.message || 'Unknown error'}`);
    }
  };

  // -------------------------------------------------------------
  // Submit Standard Schedule (Existing Quote)
  // -------------------------------------------------------------
  const handleSubmitExistingQuote = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedEntityId) {
      setFormError('Please select a client or lead.');
      return;
    }
    if (!quoteId) {
      setFormError('Please select an accepted quotation.');
      return;
    }

    const instalmentsSum = standardInstalments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    if (Math.abs(instalmentsSum - standardTotalAmount) > 1) {
      setFormError(`Error: The sum of instalments (₹${instalmentsSum}) must match the quotation total (₹${standardTotalAmount}).`);
      return;
    }

    if (standardInstalments.some(inst => !inst.dueDate || inst.amount <= 0)) {
      setFormError('Please enter a valid amount and due date for all instalments.');
      return;
    }

    addCustomPayment(selectedEntityId, quoteId, standardTotalAmount, standardInstalments);
    const linkedQuote = quotations.find(q => q.id === quoteId);
    const targetClient = clients.find(c => c.id === selectedEntityId);
    if (onBillCreated && linkedQuote) {
      onBillCreated(linkedQuote, targetClient);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-3xl overflow-hidden border border-slate-200 bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* ======================================================== */}
        {/* Modal Header with Glassmorphic Gradient                  */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-orange-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  {paymentToEdit 
                    ? 'Edit Invoice & Payment Schedule' 
                    : (activeMode === 'deal_setup' ? 'Record 1st Payment & Deal Setup' : 'Set Instalment Schedule')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                  {paymentToEdit ? 'Editing Existing' : (selectedEntityType === 'lead' ? 'Lead Deal' : 'Client Onboarding')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {paymentToEdit 
                  ? 'Update deal value, advance payment, renewal terms, and installment schedule.' 
                  : 'Configure deal value, advance collected, subscription duration & renewal terms.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('deal_setup')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeMode === 'deal_setup'
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1st Payment & Deal Setup (New Contract)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('existing_quote')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeMode === 'existing_quote'
                ? 'border-orange-500 text-orange-600 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Link Pre-existing Quote ({clientQuotes.length})</span>
          </button>
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold animate-[shake_0.2s_ease-in-out]">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* Tab 1: 1st Payment & Deal Setup (The Core User Flow)     */}
        {/* ======================================================== */}
        {activeMode === 'deal_setup' && (
          <form onSubmit={handleSubmitDealSetup} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Target Client / Lead Information Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-500" />
                  <span>Client / Lead Information</span>
                </span>
                {targetCandidates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Change Target:</span>
                    <select
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-orange-500 cursor-pointer font-medium"
                      value={selectedEntityId}
                      onChange={e => handleSelectCandidate(e.target.value)}
                    >
                      <option value="">-- Choose Candidate --</option>
                      {targetCandidates.map(c => (
                        <option key={c.id} value={c.id}>[{c.badge}] {c.displayName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Client Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 transition-all font-medium"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patel Solar Enterprises"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 transition-all font-medium"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 transition-all font-medium"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ramesh@patelsolar.com"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 transition-all font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 1 & 2: Total Project Amount & Advance Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 1. Total Project Amount */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    1. Total Project Amount <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    Deal Value
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50000"
                    className="w-full pl-8 pr-4 py-2.5 text-base font-extrabold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={totalProjectAmount}
                    onChange={e => setTotalProjectAmount(e.target.value)}
                  />
                </div>
                {/* Preset shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[25000, 35000, 50000, 75000, 100000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTotalProjectAmount(val)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors cursor-pointer"
                    >
                      ₹{val / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Advance Amount (1st Payment) */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    2. Advance Amount (1st Payment) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {numTotal > 0 ? `${Math.round((numAdvance / numTotal) * 100) || 0}% of Total` : '1st Payment'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={numTotal || undefined}
                    required
                    placeholder="e.g. 20000"
                    className="w-full pl-8 pr-4 py-2.5 text-base font-extrabold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    value={advanceAmount}
                    onChange={e => setAdvanceAmount(e.target.value)}
                  />
                </div>
                {/* Advance percentage shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSetAdvancePercent(100)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    100% (Full Pay)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAdvancePercent(50)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    50% Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAdvancePercent(30)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                  >
                    30% Advance
                  </button>
                </div>
              </div>

            </div>

            {/* Advance Payment Collection Details */}
            <div className="p-4 bg-orange-50/40 border border-orange-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-orange-600" />
                  <span>1st Payment Mode & Reference</span>
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                    checked={isAdvanceCollected}
                    onChange={e => setIsAdvanceCollected(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {isAdvanceCollected ? 'Mark Collected (Paid Now)' : 'Pending Advance Collection'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Payment Method
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 cursor-pointer font-medium"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Credit Card">Credit Card / Debit Card</option>
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    Payment / Effective Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 cursor-pointer font-medium"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                  />
                </div>

                {/* Transaction Ref */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                    UTR / Txn Ref / Cheque No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR198273648"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 font-medium"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 3 & 4: Subscription Duration & Renewal Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 3. Subscription Duration in Months */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    3. Subscription Duration (Months) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Valid: {subscriptionDurationMonths} Months
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    className="w-full px-4 py-2 text-sm font-bold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all"
                    value={subscriptionDurationMonths}
                    onChange={e => setSubscriptionDurationMonths(e.target.value)}
                  />
                </div>
                {/* Quick month duration chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { label: '1M', val: 1 },
                    { label: '3M', val: 3 },
                    { label: '6M', val: 6 },
                    { label: '12M (1 Year)', val: 12 },
                    { label: '24M (2 Years)', val: 24 }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSubscriptionDurationMonths(item.val)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        Number(subscriptionDurationMonths) === item.val
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Active Period: <span className="text-slate-800 font-bold">{paymentDate || 'Today'}</span> to <span className="text-orange-600 font-bold">{subscriptionEndDate}</span>
                </p>
              </div>

              {/* 4. Renewal Cost for Next Year */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    4. Renewal Cost for Next Year (₹)
                  </label>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    Annual AMC / Renewal
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 10000"
                    className="w-full pl-8 pr-4 py-2 text-sm font-bold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all"
                    value={renewalCost}
                    onChange={e => setRenewalCost(e.target.value)}
                  />
                </div>
                {/* Renewal presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[5000, 10000, 15000, 20000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRenewalCost(val)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors cursor-pointer"
                    >
                      ₹{val / 1000}k/yr
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Renewal Due on: <span className="text-purple-700 font-bold">{subscriptionEndDate}</span>
                </p>
              </div>

            </div>

            {/* Section 5: Next Installment Date & Balance Splits */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    5. Next Installment Date & Balance Schedule
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total: ₹{new Intl.NumberFormat('en-IN').format(numTotal)} | Advance: ₹{new Intl.NumberFormat('en-IN').format(numAdvance)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Balance</span>
                  <span className={`text-base font-black ${remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ₹{new Intl.NumberFormat('en-IN').format(remainingBalance)}
                  </span>
                </div>
              </div>

              {remainingBalance > 0 ? (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                        Next Installment Due Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500 font-medium cursor-pointer"
                        value={nextInstallmentDate}
                        onChange={e => setNextInstallmentDate(e.target.value)}
                      />
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Part 2 Due Amount</span>
                        <p className="text-xs font-black text-rose-600 mt-0.5">
                          ₹{new Intl.NumberFormat('en-IN').format(remainingBalance)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEnableCustomSplits(!enableCustomSplits);
                          if (!enableCustomSplits && customSplits.length === 0) {
                            const halfBal = Math.round(remainingBalance / 2);
                            const d1 = nextInstallmentDate;
                            const d2 = new Date(nextInstallmentDate);
                            d2.setDate(d2.getDate() + 30);
                            setCustomSplits([
                              { amount: halfBal, dueDate: d1, notes: 'Part 2' },
                              { amount: remainingBalance - halfBal, dueDate: d2.toISOString().split('T')[0], notes: 'Part 3' }
                            ]);
                          }
                        }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                      >
                        {enableCustomSplits ? 'Revert to Single Next Date' : '+ Split into Multiple Parts'}
                      </button>
                    </div>
                  </div>

                  {/* Optional Multi-part splits for balance */}
                  {enableCustomSplits && (
                    <div className="space-y-2 p-3 bg-white border border-orange-200 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                          Configure Balance Installments (Sum must equal ₹{remainingBalance})
                        </span>
                        <button
                          type="button"
                          onClick={handleAddCustomSplit}
                          className="flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Split</span>
                        </button>
                      </div>
                      {customSplits.map((split, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-12">Part #{sIdx + 2}</span>
                          <div className="flex-1 relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              required
                              placeholder="Amount"
                              className="w-full pl-6 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                              value={split.amount}
                              onChange={e => handleCustomSplitChange(sIdx, 'amount', e.target.value)}
                            />
                          </div>
                          <input
                            type="date"
                            required
                            className="w-36 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                            value={split.dueDate}
                            onChange={e => handleCustomSplitChange(sIdx, 'dueDate', e.target.value)}
                          />
                          {customSplits.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomSplit(sIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% Full Payment Received upfront! No remaining installment schedule needed.</span>
                </div>
              )}
            </div>

            {/* Section 6: Product Description / Price Breakdown */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    6. Product Description & Price Breakdown <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5">Title and scope included in client invoice / official bill.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowItemizedBreakdown(!showItemizedBreakdown)}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                >
                  {showItemizedBreakdown ? 'Hide Itemized Breakdown' : '+ Show Itemized Breakdown'}
                </button>
              </div>

              {/* Product Title */}
              <div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Business Management ERP & Field Tracking App"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all"
                  value={productDescription}
                  onChange={e => setProductDescription(e.target.value)}
                />
              </div>

              {/* Itemized Breakdown Table */}
              {showItemizedBreakdown && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Price Breakdown Items
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {priceBreakdownItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            placeholder="Item description (e.g. CRM License)"
                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                            value={item.description}
                            onChange={e => handleItemFieldChange(idx, 'description', e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-44">
                          <input
                            type="text"
                            placeholder="Breakdown / note"
                            className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500"
                            value={item.breakdown}
                            onChange={e => handleItemFieldChange(idx, 'breakdown', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-36">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1 text-xs text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Rate"
                              className="w-full pl-5 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-orange-500 font-bold"
                              value={item.rate || ''}
                              onChange={e => handleItemFieldChange(idx, 'rate', e.target.value)}
                            />
                          </div>
                          {priceBreakdownItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {itemsTotalSum > 0 && itemsTotalSum !== numTotal && (
                    <div className="flex justify-between items-center text-[11px] p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                      <span>Breakdown Total: <strong>₹{new Intl.NumberFormat('en-IN').format(itemsTotalSum)}</strong></span>
                      <button
                        type="button"
                        onClick={() => setTotalProjectAmount(itemsTotalSum)}
                        className="text-orange-700 font-bold underline cursor-pointer"
                      >
                        Set Total to ₹{new Intl.NumberFormat('en-IN').format(itemsTotalSum)}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other Details: Address, Notes, WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Billing Address
                </label>
                <textarea
                  rows="2"
                  placeholder="Client office address, City, State..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
                  Deal Notes / Terms
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Includes 3 staff onboarding sessions..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-orange-500"
                  value={dealNotes}
                  onChange={e => setDealNotes(e.target.value)}
                />
              </div>
            </div>

            {/* WhatsApp Receipt Toggle */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Send WhatsApp Confirmation Receipt</p>
                  <p className="text-[10px] text-slate-500">Automatically logs and fires payment receipt to {phone || 'client phone'}</p>
                </div>
              </div>
              <input
                type="checkbox"
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                checked={sendWhatsAppReceipt}
                onChange={e => setSendWhatsAppReceipt(e.target.checked)}
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{paymentToEdit ? 'Update Invoice & Schedule' : 'Save Deal & Record 1st Payment'}</span>
              </button>
            </div>

          </form>
        )}

        {/* ======================================================== */}
        {/* Tab 2: Existing Quote Mode (Backward Compatible)         */}
        {/* ======================================================== */}
        {activeMode === 'existing_quote' && (
          <form onSubmit={handleSubmitExistingQuote} className="flex-1 overflow-y-auto p-6 space-y-4">
            
            {/* Target Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Select Client or Lead <span className="text-red-500">*</span>
              </label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-xs outline-none transition-all cursor-pointer font-medium"
                value={selectedEntityId}
                onChange={e => handleSelectCandidate(e.target.value)}
              >
                <option value="">-- Choose Client or Won Lead --</option>
                {targetCandidates.map(c => (
                  <option key={c.id} value={c.id}>[{c.badge}] {c.displayName}</option>
                ))}
              </select>
            </div>

            {/* Quotation Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Linked Quotation (Accepted Only) <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={!selectedEntityId}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-xs outline-none transition-all disabled:opacity-50 cursor-pointer font-medium"
                value={quoteId}
                onChange={e => handleQuoteChange(e.target.value)}
              >
                <option value="">-- Choose Quote --</option>
                {clientQuotes.map(q => (
                  <option key={q.id} value={q.id}>{q.id} - {q.title} (₹{q.total})</option>
                ))}
              </select>
              {clientQuotes.length === 0 && selectedEntityId && (
                <p className="text-[11px] text-amber-700 mt-1.5 font-medium">
                  Notice: No accepted quotes found for this record. Switch to the <strong>"1st Payment & Deal Setup"</strong> tab above to record payments directly!
                </p>
              )}
            </div>

            {/* Quotation Total Indicator */}
            {standardTotalAmount > 0 && (
              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex justify-between text-xs">
                <span className="text-slate-700 font-semibold">Quotation Total Amount:</span>
                <span className="font-black text-orange-600">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(standardTotalAmount)}
                </span>
              </div>
            )}

            {/* Standard Instalment Splits */}
            {quoteId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Configure Instalment Splits
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStandardInstalment}
                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Split Instalment</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {standardInstalments.map((inst, index) => (
                    <div key={index} className="flex gap-3 items-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-xs font-bold text-slate-500 min-w-[50px]">Part #{index + 1}</span>
                      
                      {/* Amount */}
                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 font-bold">₹</span>
                        <input
                          type="number"
                          required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-orange-500"
                          placeholder="Amount"
                          value={inst.amount}
                          onChange={e => handleStandardInstalmentChange(index, 'amount', e.target.value)}
                        />
                      </div>

                      {/* Due Date */}
                      <div className="flex-1">
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-orange-500"
                          value={inst.dueDate}
                          onChange={e => handleStandardInstalmentChange(index, 'dueDate', e.target.value)}
                        />
                      </div>

                      {/* Delete item button */}
                      {standardInstalments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStandardInstalment(index)}
                          className="p-2 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg bg-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!quoteId}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Save Schedule
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

export default PaymentFormModal;
