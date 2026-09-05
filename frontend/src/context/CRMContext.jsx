import React, { createContext, useContext, useState, useEffect } from 'react';

const CRMContext = createContext();

// Helper: Format Date to DD-MM-YYYY
export const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  const clean = String(dateStr).split('T')[0].trim().replace(/\//g, '-');
  const parts = clean.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD -> DD-MM-YYYY
      return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
    }
    return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
  }
  return dateStr;
};

// Helper: Extract DDMMYY accurately from any date format (YYYY-MM-DD, DD-MM-YYYY, or Date)
export const getDDMMYYFromDate = (dateInput) => {
  if (!dateInput) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${d}${m}${y}`;
  }

  if (typeof dateInput === 'string') {
    const clean = dateInput.split('T')[0].trim().replace(/\//g, '-');
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const y = parts[0].slice(-2);
        const m = parts[1].padStart(2, '0');
        const d = parts[2].padStart(2, '0');
        return `${d}${m}${y}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].slice(-2);
        return `${d}${m}${y}`;
      } else if (parts[2].length === 2 && parts[0].length === 2) {
        // DD-MM-YY
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].padStart(2, '0');
        return `${d}${m}${y}`;
      }
    }
  }

  try {
    const dObj = new Date(dateInput);
    if (!isNaN(dObj.getTime())) {
      const d = String(dObj.getDate()).padStart(2, '0');
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const y = String(dObj.getFullYear()).slice(-2);
      return `${d}${m}${y}`;
    }
  } catch (e) {}

  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = String(now.getFullYear()).slice(-2);
  return `${d}${m}${y}`;
};

// Helper: Get current serial counter
export const getCurrentSerialSeq = () => {
  const saved = localStorage.getItem('setu_crm_doc_serial_seq');
  let num = saved ? parseInt(saved, 10) : 59;
  return isNaN(num) ? 59 : num;
};

// Helper: Generate next sequential document number SETU-DDMMYYXXX
export const generateDocumentNumber = (dateStr, increment = false) => {
  const ddmmyy = getDDMMYYFromDate(dateStr);
  let seq = getCurrentSerialSeq();
  const serialStr = String(seq).padStart(3, '0');
  const docId = `SETU-${ddmmyy}${serialStr}`;

  if (increment) {
    localStorage.setItem('setu_crm_doc_serial_seq', String(seq + 1));
  }
  return docId;
};

// Helper: Synchronize document ID with a new date while preserving or incrementing serial number
export const syncDocIdWithDate = (existingDocId, newDateStr, autoIncrement = false) => {
  const ddmmyy = getDDMMYYFromDate(newDateStr);
  let serialOnly = '059';

  if (existingDocId) {
    if (existingDocId.startsWith('SETU-')) {
      const suffix = existingDocId.slice(5);
      const digits = suffix.replace(/[^0-9]/g, '');
      serialOnly = digits.slice(-3) || '059';
    } else {
      const digits = existingDocId.replace(/[^0-9]/g, '');
      serialOnly = digits.slice(-3) || '059';
    }
  } else {
    serialOnly = String(getCurrentSerialSeq()).padStart(3, '0');
  }

  if (autoIncrement) {
    let num = parseInt(serialOnly, 10);
    if (isNaN(num)) num = getCurrentSerialSeq();
    num += 1;
    serialOnly = String(num).padStart(3, '0');
    localStorage.setItem('setu_crm_doc_serial_seq', String(num + 1));
  }

  return `SETU-${ddmmyy}${serialOnly.padStart(3, '0')}`;
};

// Helper: Normalize any legacy ID (e.g. QT-4816, SETU-2608-057) into strict SETU-DDMMYYXXX format
export const normalizeDocumentId = (id, dateStr) => {
  if (!id) return generateDocumentNumber(dateStr, false);
  const targetDatePrefix = getDDMMYYFromDate(dateStr);
  const match = String(id).match(/^SETU-(\d{6})(\d{3})$/);
  if (match) {
    if (dateStr && match[1] !== targetDatePrefix) {
      return `SETU-${targetDatePrefix}${match[2]}`;
    }
    return id;
  }
  return syncDocIdWithDate(id, dateStr, false);
};

// Seed Mock Data Helper with auto-migration of legacy QT- IDs
const getInitialData = (key, fallback) => {
  const data = localStorage.getItem(`setu_crm_${key}`);
  if (!data) return fallback;
  try {
    const parsed = JSON.parse(data);
    // Migrate any legacy QT- IDs in quotations
    if (key === 'quotations' && Array.isArray(parsed)) {
      return parsed.map((q, idx) => {
        const qDate = q.date || '2026-09-05';
        const normId = normalizeDocumentId(q.id, qDate);
        return {
          ...q,
          id: normId,
          docNumber: normId
        };
      });
    }
    // Migrate any legacy QT- IDs in lead.quotation
    if (key === 'leads' && Array.isArray(parsed)) {
      return parsed.map((lead, idx) => {
        if (lead.quotation) {
          const q = lead.quotation;
          const qDate = q.date || lead.createdDate || '2026-09-05';
          const normId = normalizeDocumentId(q.id || q.docNumber, qDate);
          return {
            ...lead,
            quotation: {
              ...q,
              id: normId,
              docNumber: normId
            }
          };
        }
        return lead;
      });
    }
    // Migrate any legacy QT- IDs in payments
    if (key === 'payments' && Array.isArray(parsed)) {
      return parsed.map((p, idx) => {
        if (p.quotationId && (!p.quotationId.startsWith('SETU-') || p.quotationId.startsWith('QT-'))) {
          const serial = String(59 + idx).padStart(3, '0');
          return { ...p, quotationId: `SETU-050926${serial}` };
        }
        return p;
      });
    }
    return parsed;
  } catch (e) {
    return fallback;
  }
};

const defaultTemplates = [
  { id: 'quote_sent', name: 'Quotation Sent', template: 'Hi {{clientName}}, here is your quotation {{quoteId}} for {{totalAmount}} from SETU SOLUTION. Click here to review: {{pdfUrl}}' },
  { id: 'invoice_sent', name: 'Invoice Sent', template: 'Dear {{clientName}}, here is your invoice {{quoteId}} for {{totalAmount}} from SETU SOLUTION. Balance remaining: {{balance}}.' },
  { id: 'payment_received', name: 'Payment Received', template: 'Thank you {{clientName}}! We have successfully received your payment of {{amount}} for {{quoteTitle}}. Outstanding balance: {{balance}}.' },
  { id: 'reminder_due', name: 'Payment Reminder Due', template: 'Dear {{clientName}}, this is a friendly reminder that your payment of {{amount}} is due on {{dueDate}}. Please process it at your earliest convenience. Thank you, SETU SOLUTION.' },
  { id: 'lead_status_changed', name: 'Lead Status Changed', template: 'Notice: The status of lead {{leadName}} has been updated to {{status}} (Assigned: {{assignedTo}}).' }
];

export const CRMProvider = ({ children }) => {
  // 1. Core State
  const [currentUser, setCurrentUser] = useState(getInitialData('current_user', { name: 'Siddharth Shah', role: 'Admin' })); // Roles: Admin, Staff
  
  const [leads, setLeads] = useState(() => getInitialData('leads', [
    {
      id: 'L-101',
      name: 'TARANG SOLAR SYSTEMS',
      phone: '+91 8830487351',
      email: 'info@tarangsolarsystems.com',
      address: 'Plot no. 69 Sitanagar near Dhawad Polytechnic College Wardha road Nagpur 440025',
      source: 'Website',
      notes: 'Interested in Solar Business Management software and Employee Tracking Android App.',
      assignedTo: 'Siddharth Shah',
      status: 'Quoted',
      createdDate: '2026-08-31',
      quotation: {
        id: 'SETU-310826057',
        docType: 'Quotation',
        docNumber: 'SETU-310826057',
        date: '2026-08-31',
        clientName: 'TARANG SOLAR SYSTEMS',
        address: 'Plot no. 69 Sitanagar near Dhawad Polytechnic College Wardha road Nagpur 440025',
        phone: '+91 8830487351',
        email: 'info@tarangsolarsystems.com',
        items: [
          { description: 'Project Cost (Solar Business Management )', breakdown: '30,000', qty: 1, rate: 30000 },
          { description: 'Employee Tracking Android Application', breakdown: '100 ( per user for month )', qty: 1, rate: 0 }
        ],
        total: 30000,
        advancePaid: 0,
        remaining: 30000,
        useGST: false,
        taxRate: 0,
        notes: ''
      }
    },
    {
      id: 'L-102',
      name: "Tarang Solar System's",
      phone: '+91 8830487351',
      email: 'tarangsolar@gmail.com',
      address: 'Building No.: 69, Sita Nagar Road, Near Satish Bakery, Sita Nagar Nagpur, Maharashtra PIN Code: 440025',
      source: 'Referral',
      notes: 'Project Cost (Solar Business Management ,Employee Tracking Android Application) with advance payment.',
      assignedTo: 'Siddharth Shah',
      status: 'Won',
      createdDate: '2026-09-05',
      quotation: {
        id: 'SETU-050926059',
        docType: 'Invoice',
        docNumber: 'SETU-050926059',
        date: '2026-09-05',
        clientName: "Tarang Solar System's",
        address: 'Building No.: 69, Sita Nagar Road, Near Satish Bakery, Sita Nagar Nagpur, Maharashtra PIN Code: 440025',
        phone: '+91 8830487351',
        email: 'tarangsolar@gmail.com',
        items: [
          { description: 'Project Cost (Solar Business Management ,Employee Tracking Android Application)', breakdown: '30,000', qty: 1, rate: 30000 }
        ],
        total: 30000,
        advancePaid: 14000,
        remaining: 16000,
        useGST: false,
        taxRate: 0,
        notes: ''
      }
    },
    {
      id: 'L-103',
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh@kumartech.in',
      address: 'Office 402, Tech Park, IT Corridor, Nagpur, 440010',
      source: 'Website',
      notes: 'Interested in bespoke ERP development. Budget around 5L.',
      assignedTo: 'Siddharth Shah',
      status: 'New',
      createdDate: '2026-06-10',
      quotation: null
    },
    {
      id: 'L-104',
      name: 'Priya Sharma',
      phone: '9123456789',
      email: 'priya@sharmadesign.co',
      address: '12-B, Green View Avenue, Nagpur, 440015',
      source: 'Referral',
      notes: 'Needs an e-commerce platform with Shopify integration.',
      assignedTo: 'Siddharth Shah',
      status: 'Contacted',
      createdDate: '2026-06-12',
      quotation: null
    }
  ]));

  const [clients, setClients] = useState(() => getInitialData('clients', [
    {
      id: 'C-101',
      name: "Tarang Solar System's",
      phone: '+91 8830487351',
      email: 'tarangsolar@gmail.com',
      companyName: "Tarang Solar System's",
      address: 'Building No.: 69, Sita Nagar Road, Near Satish Bakery, Sita Nagar Nagpur, Maharashtra PIN Code: 440025',
      source: 'Referral',
      notes: 'Solar Business Management and Android Tracking Application.',
      convertedDate: '2026-09-05'
    },
    {
      id: 'C-102',
      name: 'Sunita Rao',
      phone: '9876123450',
      email: 'sunita@raosolutions.com',
      companyName: 'Rao IT Solutions',
      address: 'Plot 45, MIDC Industrial Area, Hingna, Nagpur 440028',
      source: 'Referral',
      notes: 'Legacy system cloud migration. Won from previous lead pipeline.',
      convertedDate: '2026-05-20'
    },
    {
      id: 'C-103',
      name: 'Deepak Gupta',
      phone: '9345678901',
      email: 'deepak@guptafoundation.org',
      companyName: 'Gupta Foundation',
      address: '77, Civil Lines, Near High Court, Nagpur 440001',
      source: 'Website',
      notes: 'Custom NGO donor management system.',
      convertedDate: '2026-04-15'
    }
  ]));

  const [quotations, setQuotations] = useState(() => getInitialData('quotations', [
    {
      id: 'SETU-310826057',
      docType: 'Quotation',
      docNumber: 'SETU-310826057',
      title: 'Solar Business Management & Employee Tracking',
      clientOrLeadId: 'L-101',
      type: 'lead',
      date: '2026-08-31',
      status: 'Sent',
      address: 'Plot no. 69 Sitanagar near Dhawad Polytechnic College Wardha road Nagpur 440025',
      items: [
        { description: 'Project Cost (Solar Business Management )', breakdown: '30,000', qty: 1, rate: 30000 },
        { description: 'Employee Tracking Android Application', breakdown: '100 ( per user for month )', qty: 1, rate: 0 }
      ],
      useGST: false,
      taxRate: 0,
      total: 30000,
      advancePaid: 0,
      remaining: 30000,
      notes: ''
    },
    {
      id: 'SETU-050926059',
      docType: 'Invoice',
      docNumber: 'SETU-050926059',
      title: 'Solar Business Management ,Employee Tracking Android Application',
      clientOrLeadId: 'C-101',
      type: 'client',
      date: '2026-09-05',
      status: 'Accepted',
      address: 'Building No.: 69, Sita Nagar Road, Near Satish Bakery, Sita Nagar Nagpur, Maharashtra PIN Code: 440025',
      items: [
        { description: 'Project Cost (Solar Business Management ,Employee Tracking Android Application)', breakdown: '30,000', qty: 1, rate: 30000 }
      ],
      useGST: false,
      taxRate: 0,
      total: 30000,
      advancePaid: 14000,
      remaining: 16000,
      notes: ''
    }
  ]));

  const [payments, setPayments] = useState(() => getInitialData('payments', [
    {
      id: 'P-201',
      clientId: 'C-101',
      quotationId: 'SETU-050926059',
      totalAmount: 159300,
      status: 'Partial', // Pending, Partial, Paid in Full
      instalments: [
        { id: 'INST-01', amount: 79650, dueDate: '2026-06-08', paidDate: '2026-06-08', status: 'Paid' },
        { id: 'INST-02', amount: 79650, dueDate: '2026-06-30', paidDate: null, status: 'Pending' }
      ]
    },
    {
      id: 'P-202',
      clientId: 'C-102',
      quotationId: 'SETU-310826057',
      totalAmount: 283200,
      status: 'Paid in Full',
      instalments: [
        { id: 'INST-03', amount: 141600, dueDate: '2026-05-25', paidDate: '2026-05-24', status: 'Paid' },
        { id: 'INST-04', amount: 141600, dueDate: '2026-06-15', paidDate: '2026-06-15', status: 'Paid' }
      ]
    },
    {
      id: 'P-203',
      clientId: 'C-103',
      quotationId: 'QT-1003',
      totalAmount: 120000,
      status: 'Pending',
      instalments: [
        { id: 'INST-05', amount: 120000, dueDate: '2026-05-01', paidDate: null, status: 'Pending' }
      ]
    }
  ]));

  const [reminders, setReminders] = useState(() => getInitialData('reminders', [
    { id: 'REM-301', clientId: 'C-101', clientName: 'Vikram Singh', phone: '9000111222', amount: 79650, dueDate: '2026-06-30', scheduledFor: '2026-06-29', triggerType: '1_day_before', status: 'Pending', sentDate: null },
    { id: 'REM-302', clientId: 'C-102', clientName: 'Sunita Rao', phone: '9876123450', amount: 141600, dueDate: '2026-06-15', scheduledFor: '2026-06-14', triggerType: '1_day_before', status: 'Sent', sentDate: '2026-06-14' },
    { id: 'REM-303', clientId: 'C-102', clientName: 'Sunita Rao', phone: '9876123450', amount: 141600, dueDate: '2026-06-15', scheduledFor: '2026-06-15', triggerType: 'due_day', status: 'Sent', sentDate: '2026-06-15' },
    { id: 'REM-304', clientId: 'C-103', clientName: 'Deepak Gupta', phone: '9345678901', amount: 120000, dueDate: '2026-05-01', scheduledFor: '2026-05-04', triggerType: '3_days_after', status: 'Failed', sentDate: '2026-05-04' }
  ]));

  const [whatsappLogs, setWhatsappLogs] = useState(() => getInitialData('whatsapp_logs', [
    { id: 'WA-401', clientPhone: '9000111222', direction: 'outbound', text: 'Hi Vikram Singh, here is your quotation QT-1001 for ₹1,59,300. Click here to review: https://setusolution.com/quote/QT-1001', timestamp: '2026-06-06 14:05:00' },
    { id: 'WA-402', clientPhone: '9000111222', direction: 'inbound', text: 'Looks perfect Siddharth. Accept the quote.', timestamp: '2026-06-06 15:30:00' },
    { id: 'WA-403', clientPhone: '9000111222', direction: 'outbound', text: 'Thank you Vikram! We have successfully received your payment of ₹79,650. Outstanding balance: ₹79,650.', timestamp: '2026-06-08 11:20:00' },
    { id: 'WA-404', clientPhone: '9876123450', direction: 'outbound', text: 'Hi Sunita Rao, here is your quotation QT-1002 for ₹2,83,200. Click here to review: https://setusolution.com/quote/QT-1002', timestamp: '2026-05-21 10:15:00' },
    { id: 'WA-405', clientPhone: '9876123450', direction: 'outbound', text: 'Dear Sunita Rao, this is a friendly reminder that your payment of ₹1,41,600 is due tomorrow. Please process it. Thank you.', timestamp: '2026-06-14 09:00:00' },
    { id: 'WA-406', clientPhone: '9876123450', direction: 'outbound', text: 'Dear Sunita Rao, this is a friendly reminder that your payment of ₹1,41,600 is due today. Please process it. Thank you.', timestamp: '2026-06-15 09:00:00' },
    { id: 'WA-407', clientPhone: '9876123450', direction: 'inbound', text: 'Sent. Please check transaction ID TXN998822.', timestamp: '2026-06-15 10:30:00' },
    { id: 'WA-408', clientPhone: '9876123450', direction: 'outbound', text: 'Thank you Sunita! We have successfully received your payment of ₹1,41,600. Outstanding balance: ₹0.', timestamp: '2026-06-15 11:00:00' },
    { id: 'WA-409', clientPhone: '9345678901', direction: 'outbound', text: 'Hi Deepak Gupta, here is your quotation QT-1003 for ₹1,20,000. Click here to review: https://setusolution.com/quote/QT-1003', timestamp: '2026-04-16 11:22:00' },
    { id: 'WA-410', clientPhone: '9345678901', direction: 'outbound', text: 'Dear Deepak Gupta, this is a friendly reminder that your payment of ₹1,20,000 is overdue by 3 days. Please process it.', timestamp: '2026-05-04 09:00:00' }
  ]));

  const [templates, setTemplates] = useState(() => getInitialData('templates', defaultTemplates));

  // 2. Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('setu_crm_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('setu_crm_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('setu_crm_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('setu_crm_quotations', JSON.stringify(quotations));
  }, [quotations]);

  useEffect(() => {
    localStorage.setItem('setu_crm_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('setu_crm_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('setu_crm_whatsapp_logs', JSON.stringify(whatsappLogs));
  }, [whatsappLogs]);

  useEffect(() => {
    localStorage.setItem('setu_crm_templates', JSON.stringify(templates));
  }, [templates]);

  // Helper date formatter
  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getTimeString = () => {
    const d = new Date();
    return d.toISOString().replace('T', ' ').substring(0, 19);
  };

  // Helper template formatter
  const compileTemplate = (templateId, replacements) => {
    const item = templates.find(t => t.id === templateId);
    if (!item) return '';
    let msg = item.template;
    Object.keys(replacements).forEach(key => {
      msg = msg.replaceAll(`{{${key}}}`, replacements[key]);
    });
    return msg;
  };

  // Trigger outbound WhatsApp simulation
  const addWhatsAppLog = (phone, text, direction = 'outbound') => {
    const newMsg = {
      id: `WA-${Date.now()}`,
      clientPhone: phone,
      direction,
      text,
      timestamp: getTimeString()
    };
    setWhatsappLogs(prev => [...prev, newMsg]);

    // Simulate Client Auto-Reply if message is outbound
    if (direction === 'outbound') {
      setTimeout(() => {
        const responses = [
          "Thank you for the update. We will check and get back to you.",
          "Received! We are processing this now.",
          "Noted. Thanks for sharing the document.",
          "Will check this shortly.",
          "Okay, thank you!"
        ];
        const randomReply = responses[Math.floor(Math.random() * responses.length)];
        const inboundMsg = {
          id: `WA-${Date.now() + 1}`,
          clientPhone: phone,
          direction: 'inbound',
          text: randomReply,
          timestamp: getTimeString()
        };
        setWhatsappLogs(prev => [...prev, inboundMsg]);
      }, 2000);
    }
  };

  // 3. Lead Actions
  const addLead = (leadData) => {
    const newLead = {
      id: `L-${Date.now().toString().slice(-3)}`,
      createdDate: getTodayDateString(),
      ...leadData
    };
    setLeads(prev => [newLead, ...prev]);

    // Log WhatsApp notification for new lead status (automatic trigger)
    const text = compileTemplate('lead_status_changed', {
      leadName: newLead.name,
      status: newLead.status,
      assignedTo: newLead.assignedTo
    });
    addWhatsAppLog(newLead.phone, text, 'outbound');
  };

  const updateLeadStatus = (leadId, newStatus) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const updatedLead = { ...lead, status: newStatus };
        
        // Trigger status notification
        const text = compileTemplate('lead_status_changed', {
          leadName: updatedLead.name,
          status: newStatus,
          assignedTo: updatedLead.assignedTo
        });
        addWhatsAppLog(updatedLead.phone, text, 'outbound');

        // Check if Won -> Convert to Client
        if (newStatus === 'Won') {
          convertToClient(updatedLead);
        }
        return updatedLead;
      }
      return lead;
    }));
  };

  const deleteLead = (leadId) => {
    if (currentUser.role !== 'Admin') return false;
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    return true;
  };

  // 4. Convert Won Lead to Client
  const convertToClient = (lead) => {
    // Check if client already exists
    if (clients.some(c => c.phone === lead.phone || c.email === lead.email)) return;

    const newClient = {
      id: `C-${Date.now().toString().slice(-3)}`,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      companyName: lead.name + ' Corp',
      source: lead.source,
      notes: lead.notes || 'Converted from Lead',
      convertedDate: getTodayDateString()
    };
    setClients(prev => [...prev, newClient]);

    // Update matching lead quotations to type 'client' and link to new client ID
    setQuotations(prev => prev.map(q => {
      if (q.clientOrLeadId === lead.id) {
        return { ...q, clientOrLeadId: newClient.id, type: 'client' };
      }
      return q;
    }));
  };

  // 5. Quotation & Invoice Actions
  const saveLeadQuotationJSON = (leadId, quotationData) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          address: quotationData.address || lead.address,
          quotation: quotationData
        };
      }
      return lead;
    }));
  };

  const addQuotation = (quoteData) => {
    const quoteDate = quoteData.date || getTodayDateString();
    const docId = normalizeDocumentId(quoteData.id || generateDocumentNumber(quoteDate), quoteDate);
    const newQuote = {
      id: docId,
      docType: quoteData.docType || 'Quotation',
      date: quoteDate,
      advancePaid: Number(quoteData.advancePaid) || 0,
      remaining: (Number(quoteData.total) || 0) - (Number(quoteData.advancePaid) || 0),
      ...quoteData,
      id: docId
    };

    setQuotations(prev => [newQuote, ...prev]);

    // Save quotation directly inside Lead in JSON format if linked to lead
    if (newQuote.type === 'lead' || newQuote.clientOrLeadId?.startsWith('L-')) {
      saveLeadQuotationJSON(newQuote.clientOrLeadId, newQuote);
    }

    // Trigger WhatsApp notification if sent
    if (newQuote.status === 'Sent') {
      sendQuotationWhatsApp(newQuote);
    }
    return newQuote;
  };

  const updateQuotation = (quoteId, updatedData) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === quoteId) {
        const docDate = updatedData.date || q.date || getTodayDateString();
        const normalizedId = normalizeDocumentId(updatedData.id || q.id, docDate);
        const merged = { ...q, ...updatedData, id: normalizedId, date: docDate };
        if (merged.type === 'lead' || merged.clientOrLeadId?.startsWith('L-')) {
          saveLeadQuotationJSON(merged.clientOrLeadId, merged);
        }
        return merged;
      }
      return q;
    }));
  };

  const updateQuotationStatus = (quoteId, status) => {
    setQuotations(prev => prev.map(q => {
      if (q.id === quoteId) {
        const updated = { ...q, status };
        if (status === 'Sent') {
          sendQuotationWhatsApp(updated);
        }
        // Sync to lead
        if (updated.type === 'lead' || updated.clientOrLeadId?.startsWith('L-')) {
          saveLeadQuotationJSON(updated.clientOrLeadId, updated);
        }
        // If accepted and is client, generate Payment record and schedule reminders
        if (status === 'Accepted' && updated.type === 'client') {
          createPaymentRecordForQuotation(updated);
        }
        return updated;
      }
      return q;
    }));
  };

  const deleteQuotation = (quoteId) => {
    if (currentUser.role !== 'Admin') return false;
    setQuotations(prev => prev.filter(q => q.id !== quoteId));
    return true;
  };

  const sendQuotationWhatsApp = (quote) => {
    // Lookup client or lead
    let target = null;
    if (quote.type === 'client') {
      target = clients.find(c => c.id === quote.clientOrLeadId);
    } else {
      target = leads.find(l => l.id === quote.clientOrLeadId);
    }

    if (!target) return;

    const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(quote.total);
    const templateId = quote.docType === 'Invoice' ? 'invoice_sent' : 'quote_sent';
    const text = compileTemplate(templateId, {
      clientName: target.name,
      quoteId: quote.id,
      totalAmount: formattedTotal,
      balance: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(quote.remaining || quote.total),
      pdfUrl: `https://setusolution.in/doc/${quote.id}`
    });

    addWhatsAppLog(target.phone, text, 'outbound');
  };

  // 6. Payment Actions & Automatic Creator on Quote Acceptance
  const createPaymentRecordForQuotation = (quote) => {
    // Check if payment already exists
    if (payments.some(p => p.quotationId === quote.id)) return;

    const client = clients.find(c => c.id === quote.clientOrLeadId);
    if (!client) return;

    // Create a 2-instalment schedule by default
    const half = Math.round(quote.total / 2);
    const due1 = getTodayDateString();
    const due2 = new Date();
    due2.setDate(due2.getDate() + 30); // 30 days later
    const due2Str = due2.toISOString().split('T')[0];

    const newPayment = {
      id: `P-${Date.now().toString().slice(-3)}`,
      clientId: client.id,
      quotationId: quote.id,
      totalAmount: quote.total,
      status: 'Pending',
      instalments: [
        { id: `INST-${Date.now()}-1`, amount: half, dueDate: due1, paidDate: null, status: 'Pending' },
        { id: `INST-${Date.now()}-2`, amount: quote.total - half, dueDate: due2Str, paidDate: null, status: 'Pending' }
      ]
    };

    setPayments(prev => [...prev, newPayment]);
    scheduleRemindersForInstalments(client, newPayment.instalments);
  };

  // Schedule auto-reminders based on instalment due dates
  const scheduleRemindersForInstalments = (client, instalments) => {
    const newRems = [];
    instalments.forEach(inst => {
      const due = new Date(inst.dueDate);
      
      // 1 day before
      const oneDayBefore = new Date(due);
      oneDayBefore.setDate(due.getDate() - 1);
      const oneDayBeforeStr = oneDayBefore.toISOString().split('T')[0];

      // on due date
      const dueDayStr = inst.dueDate;

      // 3 days after
      const threeDaysAfter = new Date(due);
      threeDaysAfter.setDate(due.getDate() + 3);
      const threeDaysAfterStr = threeDaysAfter.toISOString().split('T')[0];

      newRems.push(
        { id: `REM-${Date.now()}-A`, clientId: client.id, clientName: client.name, phone: client.phone, amount: inst.amount, dueDate: inst.dueDate, scheduledFor: oneDayBeforeStr, triggerType: '1_day_before', status: 'Pending', sentDate: null },
        { id: `REM-${Date.now()}-B`, clientId: client.id, clientName: client.name, phone: client.phone, amount: inst.amount, dueDate: inst.dueDate, scheduledFor: dueDayStr, triggerType: 'due_day', status: 'Pending', sentDate: null },
        { id: `REM-${Date.now()}-C`, clientId: client.id, clientName: client.name, phone: client.phone, amount: inst.amount, dueDate: inst.dueDate, scheduledFor: threeDaysAfterStr, triggerType: '3_days_after', status: 'Pending', sentDate: null }
      );
    });
    setReminders(prev => [...prev, ...newRems]);
  };

  const recordPaymentPayment = (paymentId, instalmentId, paidDate = getTodayDateString()) => {
    let clientPhone = '';
    let clientName = '';
    let quoteTitle = '';
    let totalAmt = 0;
    let paidAmt = 0;

    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        // Find Client
        const client = clients.find(c => c.id === p.clientId);
        if (client) {
          clientPhone = client.phone;
          clientName = client.name;
        }

        // Find Quotation
        const quote = quotations.find(q => q.id === p.quotationId);
        if (quote) quoteTitle = quote.title;

        const updatedInstalments = p.instalments.map(inst => {
          if (inst.id === instalmentId) {
            paidAmt = inst.amount;
            return { ...inst, status: 'Paid', paidDate };
          }
          return inst;
        });

        // Recompute payment status
        const totalInstalments = updatedInstalments.length;
        const paidInstalments = updatedInstalments.filter(i => i.status === 'Paid').length;
        let pStatus = 'Pending';
        if (paidInstalments === totalInstalments) {
          pStatus = 'Paid in Full';
        } else if (paidInstalments > 0) {
          pStatus = 'Partial';
        }

        // Calculate current balance
        const totalPaid = updatedInstalments.filter(i => i.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
        const balance = p.totalAmount - totalPaid;

        // Trigger WhatsApp Notification
        const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paidAmt);
        const formattedBal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balance);
        
        const text = compileTemplate('payment_received', {
          clientName,
          amount: formattedAmt,
          quoteTitle,
          balance: formattedBal
        });
        addWhatsAppLog(clientPhone, text, 'outbound');

        // Cancel scheduled reminders for this specific instalment (mark as complete / Sent)
        const matchedInstalment = p.instalments.find(i => i.id === instalmentId);
        if (matchedInstalment) {
          setReminders(rPrev => rPrev.map(rem => {
            if (rem.clientId === p.clientId && rem.amount === matchedInstalment.amount && rem.dueDate === matchedInstalment.dueDate && rem.status === 'Pending') {
              return { ...rem, status: 'Sent', sentDate: paidDate }; // auto mark complete
            }
            return rem;
          }));
        }

        return { ...p, status: pStatus, instalments: updatedInstalments };
      }
      return p;
    }));
  };

  const deletePayment = (paymentId) => {
    if (currentUser.role !== 'Admin') return false;
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    return true;
  };

  // Custom function to add manual payment tracking record
  const addCustomPayment = (clientId, quoteId, totalAmount, instalmentsList) => {
    const newPayment = {
      id: `P-${Date.now().toString().slice(-3)}`,
      clientId,
      quotationId: quoteId,
      totalAmount,
      status: 'Pending',
      instalments: instalmentsList.map((inst, index) => ({
        id: `INST-${Date.now()}-${index}`,
        amount: Number(inst.amount),
        dueDate: inst.dueDate,
        paidDate: null,
        status: 'Pending'
      }))
    };
    setPayments(prev => [...prev, newPayment]);

    const client = clients.find(c => c.id === clientId);
    if (client) {
      scheduleRemindersForInstalments(client, newPayment.instalments);
    }
  };

  // 7. Reminder Actions
  const triggerManualReminder = (reminderId) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === reminderId) {
        // Send WhatsApp Message immediately
        const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rem.amount);
        const text = compileTemplate('reminder_due', {
          clientName: rem.clientName,
          amount: formattedAmt,
          dueDate: rem.dueDate
        });
        addWhatsAppLog(rem.phone, text, 'outbound');

        return { ...rem, status: 'Sent', sentDate: getTodayDateString() };
      }
      return rem;
    }));
  };

  // Trigger manual reminder directly against a client
  const triggerClientReminderImmediately = (client, amount, dueDate) => {
    const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    const text = compileTemplate('reminder_due', {
      clientName: client.name,
      amount: formattedAmt,
      dueDate: dueDate
    });
    
    addWhatsAppLog(client.phone, text, 'outbound');

    // Append to reminder logs
    const newLog = {
      id: `REM-${Date.now()}-M`,
      clientId: client.id,
      clientName: client.name,
      phone: client.phone,
      amount: amount,
      dueDate: dueDate,
      scheduledFor: getTodayDateString(),
      triggerType: 'manual',
      status: 'Sent',
      sentDate: getTodayDateString()
    };
    setReminders(prev => [newLog, ...prev]);
  };

  const deleteReminder = (remId) => {
    if (currentUser.role !== 'Admin') return false;
    setReminders(prev => prev.filter(r => r.id !== remId));
    return true;
  };

  // 8. Template editing action
  const updateTemplate = (id, newText) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, template: newText };
      }
      return t;
    }));
  };

  return (
    <CRMContext.Provider value={{
      currentUser,
      setCurrentUser,
      leads,
      setLeads,
      clients,
      quotations,
      payments,
      reminders,
      whatsappLogs,
      templates,
      getTodayDateString,
      addLead,
      updateLeadStatus,
      deleteLead,
      addQuotation,
      updateQuotation,
      updateQuotationStatus,
      deleteQuotation,
      saveLeadQuotationJSON,
      formatDateDMY,
      generateDocumentNumber,
      recordPaymentPayment,
      deletePayment,
      addCustomPayment,
      triggerManualReminder,
      triggerClientReminderImmediately,
      deleteReminder,
      updateTemplate,
      addWhatsAppLog
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => useContext(CRMContext);
