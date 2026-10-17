import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  subscribeCollection, 
  saveFirestoreDoc, 
  deleteFirestoreDoc, 
  seedCollectionIfEmpty,
  findEmployeeByEmail
} from '../services/crmService';
import { 
  loginWithEmail, 
  registerWithEmail,
  logoutUser, 
  subscribeToAuth 
} from '../services/authService';

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

// Helper: Normalize Phone Number (Removes non-digits, strips +91, 91, or leading 0 for uniform comparison)
export const normalizePhoneNumber = (rawPhone) => {
  if (!rawPhone) return '';
  let digits = String(rawPhone).trim().replace(/[^0-9]/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length >= 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

// Helper: Format Phone Number for Display
export const formatPhoneForDisplay = (rawPhone) => {
  const norm = normalizePhoneNumber(rawPhone);
  if (norm.length === 10) {
    return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return rawPhone || '';
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

// Known dummy/mock IDs to permanently remove from system
export const DUMMY_SEED_IDS = new Set([
  // Employees
  'EMP-101', 'EMP-102', 'EMP-103',
  // Leads
  'L-101', 'L-102', 'L-103', 'L-104',
  // Clients
  'C-101', 'C-102', 'C-103',
  // Quotations
  'SETU-310826057', 'SETU-050926059', 'QT-1001', 'QT-1002', 'QT-1003',
  // Payments
  'P-201', 'P-202', 'P-203',
  // Follow-ups
  'FU-101', 'FU-102', 'FU-103',
  // Reminders
  'REM-301', 'REM-302', 'REM-303', 'REM-304',
  // WhatsApp Logs
  'WA-401', 'WA-402', 'WA-403', 'WA-404', 'WA-405', 'WA-406', 'WA-407', 'WA-408', 'WA-409', 'WA-410'
]);

// Master Super Admin email identifier
export const SUPER_ADMIN_EMAIL = 'admin@setusolution.com';

export const isSuperAdminEmail = (email) => {
  if (!email) return false;
  return String(email).trim().toLowerCase() === SUPER_ADMIN_EMAIL;
};

// Helper to filter out dummy data from any array
export const filterOutDummyData = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && !DUMMY_SEED_IDS.has(item.id) && item.email?.toLowerCase().trim() !== SUPER_ADMIN_EMAIL);
};

// Seed Mock Data Helper with auto-migration of legacy QT- IDs and dummy data filtering
const getInitialData = (key, fallback = []) => {
  const data = localStorage.getItem(`setu_crm_${key}`);
  if (!data) return fallback;
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const cleanList = filterOutDummyData(parsed);
      // Migrate any legacy QT- IDs in quotations
      if (key === 'quotations') {
        return cleanList.map((q) => {
          const qDate = q.date || '2026-09-05';
          const normId = normalizeDocumentId(q.id, qDate);
          return {
            ...q,
            id: normId,
            docNumber: normId
          };
        });
      }
      return cleanList;
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
  // 1. Firebase Authentication State (Super Admin & Employees)
  const [authUser, setAuthUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 1.1 Employees State (Clean empty initial state without dummy data)
  const [employees, setEmployees] = useState(() => getInitialData('employees', []));

  // Purge any residual dummy records from browser LocalStorage
  useEffect(() => {
    ['leads', 'clients', 'quotations', 'payments', 'employees', 'reminders', 'whatsapp_logs', 'followups', 'expenses', 'cold_leads'].forEach(key => {
      const raw = localStorage.getItem(`setu_crm_${key}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = filterOutDummyData(parsed);
            if (cleaned.length !== parsed.length) {
              localStorage.setItem(`setu_crm_${key}`, JSON.stringify(cleaned));
            }
          }
        } catch (e) {}
      }
    });
  }, []);

  useEffect(() => {
    const unsubAuth = subscribeToAuth(async (user) => {
      if (user) {
        setAuthUser(user);
        const cleanEmail = user.email ? user.email.toLowerCase().trim() : '';

        // Master Super Admin Account Explicit Check
        if (cleanEmail === SUPER_ADMIN_EMAIL) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: 'SETU Super Admin',
            role: 'Super Admin',
            position: 'Super Admin',
            department: 'Executive Management',
            permissions: ['*']
          });
          setAuthLoading(false);
          return;
        }

        const emp = await findEmployeeByEmail(cleanEmail);
        
        if (emp) {
          if (emp.status === 'Inactive') {
            await logoutUser();
            setAuthUser(null);
            setCurrentUser(null);
            setAuthError('Your employee account has been deactivated by the Super Admin.');
            setAuthLoading(false);
            return;
          }
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: emp.name,
            role: emp.role || 'Staff',
            position: emp.position,
            department: emp.department,
            permissions: emp.permissions || ['dashboard', 'leads', 'clients', 'quotations', 'payments', 'expenses'],
            employeeId: emp.id
          });
        } else {
          // Super Admin Account (Firebase Console Admin)
          const namePart = user.displayName || (user.email ? user.email.split('@')[0] : 'Super Admin');
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            role: 'Super Admin',
            permissions: ['*']
          });
        }
      } else {
        setAuthUser(null);
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    const cleanEmail = String(email).trim().toLowerCase();

    // Verify employee status before login (skip for master Super Admin)
    if (cleanEmail !== SUPER_ADMIN_EMAIL) {
      const emp = await findEmployeeByEmail(cleanEmail);
      if (emp) {
        if (emp.status === 'Inactive') {
          return { 
            success: false, 
            error: 'Your employee account has been deactivated by Super Admin. Please contact administration.' 
          };
        }
        if (emp.status === 'Pending Password Setup') {
          return { 
            success: false, 
            error: 'First-time password setup is pending! Please click "First-Time Account Setup" below to create your password.' 
          };
        }
      }
    }

    const res = await loginWithEmail(cleanEmail, password);
    if (res.error) {
      // Auto-register first-time account if not found in Firebase Auth
      if (
        res.error.includes('auth/user-not-found') || 
        res.error.includes('auth/invalid-credential')
      ) {
        const emp = await findEmployeeByEmail(cleanEmail);
        const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL || (employees || []).length === 0;
        
        if (!emp || emp.status === 'Pending Password Setup' || isSuperAdmin) {
          const regRes = await registerWithEmail(cleanEmail, password, emp?.name || (isSuperAdmin ? 'Super Admin' : 'Staff User'));
          if (regRes.user) {
            if (emp) {
              const updatedEmp = { ...emp, status: 'Active', activatedAt: new Date().toISOString() };
              setEmployees(prev => prev.map(e => e.id === emp.id ? updatedEmp : e));
              saveFirestoreDoc('employees', emp.id, updatedEmp);
            }
            return { success: true, user: regRes.user };
          }
        }
      }
      setAuthError(res.error);
      return { success: false, error: res.error };
    }
    return { success: true, user: res.user };
  };

  const logout = async () => {
    await logoutUser();
    setAuthUser(null);
    setCurrentUser(null);
  };

  // 1.2 First-Time Password Setup Functions
  const verifyEmployeeForSetup = async (email) => {
    if (!email || !email.includes('@')) {
      return { eligible: false, error: 'Please enter a valid email address.' };
    }
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in-memory employees state first
    let emp = (employees || []).find(e => e.email && e.email.trim().toLowerCase() === cleanEmail);

    // 2. Check localStorage (persisted employees list)
    if (!emp) {
      try {
        const raw = localStorage.getItem('setu_crm_employees');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            emp = list.find(e => e.email && e.email.trim().toLowerCase() === cleanEmail);
          }
        }
      } catch (e) {}
    }

    // 3. Check Cloud Firestore (for remote/cross-device verification)
    if (!emp) {
      emp = await findEmployeeByEmail(cleanEmail);
    }

    if (!emp) {
      // Auto-initialize new profile if not registered yet so user is never blocked
      const isSuper = cleanEmail === SUPER_ADMIN_EMAIL || (employees || []).length === 0;
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const newEmpDraft = {
        id: `EMP-${Date.now().toString().slice(-4)}`,
        name: formattedName,
        email: cleanEmail,
        position: isSuper ? 'Master Administrator' : 'Team Member',
        department: isSuper ? 'Administration' : 'Sales',
        role: isSuper ? 'Super Admin' : 'Staff',
        permissions: ['*'],
        status: 'Pending Password Setup',
        createdAt: getTodayDateString(),
        isAutoInitialized: true
      };
      return { eligible: true, employee: newEmpDraft };
    }
    if (emp.status === 'Inactive') {
      return { 
        eligible: false, 
        error: 'This employee account has been deactivated by Super Admin. Please contact administration.' 
      };
    }
    if (emp.status === 'Active') {
      return { 
        eligible: false, 
        error: 'Password already configured! Please sign in using your existing password on the Sign In tab.' 
      };
    }
    if (emp.status === 'Pending Password Setup') {
      return { eligible: true, employee: emp };
    }
    return { eligible: false, error: 'Account is not eligible for initial setup.' };
  };

  const completeEmployeePasswordSetup = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const check = await verifyEmployeeForSetup(cleanEmail);
    if (!check.eligible) {
      return { success: false, error: check.error };
    }
    const emp = check.employee;

    // 1. Create user in Firebase Auth
    const regResult = await registerWithEmail(cleanEmail, password, emp.name);
    if (regResult.error) {
      if (regResult.error.includes('auth/email-already-in-use')) {
        const logRes = await loginWithEmail(cleanEmail, password);
        if (logRes.error) {
          return { success: false, error: 'An authentication record already exists for this email with a different password. Please contact Super Admin.' };
        }
      } else {
        return { success: false, error: regResult.error };
      }
    }

    // 2. Mark account as Active in Firestore and LocalStorage
    const updatedEmp = {
      ...emp,
      status: 'Active',
      activatedAt: new Date().toISOString(),
      setupToken: null
    };

    // Update local state and localStorage immediately
    setEmployees(prev => {
      const exists = prev.some(e => e.id === emp.id || e.email === cleanEmail);
      const next = exists 
        ? prev.map(e => (e.id === emp.id || e.email === cleanEmail) ? updatedEmp : e)
        : [updatedEmp, ...prev];
      try {
        localStorage.setItem('setu_crm_employees', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setCurrentUser({
      uid: regResult.user?.uid || emp.id,
      email: cleanEmail,
      name: emp.name,
      role: emp.role || 'Staff',
      position: emp.position,
      department: emp.department,
      permissions: emp.permissions || ['dashboard', 'leads', 'clients', 'quotations', 'payments', 'expenses'],
      employeeId: emp.id
    });

    await saveFirestoreDoc('employees', emp.id, updatedEmp);

    return { success: true, employee: updatedEmp };
  };
  
  // Clean empty states for production data
  const [leads, setLeads] = useState(() => getInitialData('leads', []));
  const [clients, setClients] = useState(() => getInitialData('clients', []));
  const [quotations, setQuotations] = useState(() => getInitialData('quotations', []));
  const [payments, setPayments] = useState(() => getInitialData('payments', []));
  const [reminders, setReminders] = useState(() => getInitialData('reminders', []));
  const [whatsappLogs, setWhatsappLogs] = useState(() => getInitialData('whatsapp_logs', []));
  const [templates, setTemplates] = useState(() => getInitialData('templates', defaultTemplates));
  const [followUps, setFollowUps] = useState(() => getInitialData('followups', []));
  const [expenses, setExpenses] = useState(() => getInitialData('expenses', []));
  const [coldLeads, setColdLeads] = useState(() => getInitialData('cold_leads', []));

  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connecting'); // 'connected' | 'connecting' | 'offline'

  // 1.5. Real-time Cloud Firestore Subscriptions (Active when authenticated)
  useEffect(() => {
    if (!authUser) {
      setCloudSyncStatus('offline');
      return;
    }

    let mounted = true;
    setCloudSyncStatus('connecting');

    // Helper to sanitize cloud items and delete residual seeded dummy docs from Firestore
    const sanitizeCloudDocs = (cloudItems, collectionName) => {
      if (!Array.isArray(cloudItems)) return [];
      const clean = [];
      cloudItems.forEach(item => {
        if (item && DUMMY_SEED_IDS.has(item.id)) {
          // Permanently purge seeded dummy item from Firestore
          deleteFirestoreDoc(collectionName, item.id);
        } else if (item) {
          clean.push(item);
        }
      });
      return clean;
    };

    // A. Leads Subscription
    const unsubLeads = subscribeCollection('leads', (cloudLeads) => {
      if (!mounted) return;
      const cleanLeads = sanitizeCloudDocs(cloudLeads, 'leads');
      setLeads(cleanLeads);
      setCloudSyncStatus('connected');
    }, () => { if (mounted) setCloudSyncStatus('offline'); });

    // B. Clients Subscription
    const unsubClients = subscribeCollection('clients', (cloudClients) => {
      if (!mounted) return;
      const cleanClients = sanitizeCloudDocs(cloudClients, 'clients');
      setClients(cleanClients);
    });

    // C. Quotations Subscription
    const unsubQuotes = subscribeCollection('quotations', (cloudQuotes) => {
      if (!mounted) return;
      const cleanQuotes = sanitizeCloudDocs(cloudQuotes, 'quotations');
      setQuotations(cleanQuotes);
    });

    // D. Payments Subscription
    const unsubPayments = subscribeCollection('payments', (cloudPayments) => {
      if (!mounted) return;
      const cleanPayments = sanitizeCloudDocs(cloudPayments, 'payments');
      setPayments(cleanPayments);
    });

    // E. Follow-ups Subscription
    const unsubFollowups = subscribeCollection('followups', (cloudFollowups) => {
      if (!mounted) return;
      const cleanFollowups = sanitizeCloudDocs(cloudFollowups, 'followups');
      setFollowUps(cleanFollowups);
    });

    // F. Reminders Subscription
    const unsubReminders = subscribeCollection('reminders', (cloudReminders) => {
      if (!mounted) return;
      const cleanReminders = sanitizeCloudDocs(cloudReminders, 'reminders');
      setReminders(cleanReminders);
    });

    // G. WhatsApp Logs Subscription
    const unsubLogs = subscribeCollection('whatsapp_logs', (cloudLogs) => {
      if (!mounted) return;
      const cleanLogs = sanitizeCloudDocs(cloudLogs, 'whatsapp_logs');
      setWhatsappLogs(cleanLogs);
    });

    // H. Templates Subscription (Keep default system templates if empty)
    const unsubTemplates = subscribeCollection('templates', (cloudTemplates) => {
      if (!mounted) return;
      if (cloudTemplates && cloudTemplates.length > 0) {
        setTemplates(cloudTemplates);
      } else {
        seedCollectionIfEmpty('templates', defaultTemplates);
      }
    });

    // I. Employees Subscription
    const unsubEmployees = subscribeCollection('employees', (cloudEmps) => {
      if (!mounted) return;
      const cleanEmployees = sanitizeCloudDocs(cloudEmps, 'employees');
      setEmployees(cleanEmployees);
    });

    // J. Expenses Subscription
    const unsubExpenses = subscribeCollection('expenses', (cloudExpenses) => {
      if (!mounted) return;
      const cleanExpenses = sanitizeCloudDocs(cloudExpenses, 'expenses');
      setExpenses(cleanExpenses);
    });

    // K. Cold Leads Subscription
    const unsubColdLeads = subscribeCollection('cold_leads', (cloudCold) => {
      if (!mounted) return;
      const cleanCold = sanitizeCloudDocs(cloudCold, 'cold_leads');
      setColdLeads(cleanCold);
    });

    return () => {
      mounted = false;
      unsubLeads();
      unsubClients();
      unsubQuotes();
      unsubPayments();
      unsubFollowups();
      unsubReminders();
      unsubLogs();
      unsubTemplates();
      unsubEmployees();
      unsubExpenses();
      unsubColdLeads();
    };
  }, [authUser]);

  // 2. Sync to LocalStorage (Instant offline persistence)
  useEffect(() => {
    localStorage.setItem('setu_crm_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('setu_crm_employees', JSON.stringify(employees));
  }, [employees]);

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

  useEffect(() => {
    localStorage.setItem('setu_crm_followups', JSON.stringify(followUps));
  }, [followUps]);

  useEffect(() => {
    localStorage.setItem('setu_crm_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('setu_crm_cold_leads', JSON.stringify(coldLeads));
  }, [coldLeads]);

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
    saveFirestoreDoc('whatsapp_logs', newMsg.id, newMsg);

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
        saveFirestoreDoc('whatsapp_logs', inboundMsg.id, inboundMsg);
      }, 2000);
    }
  };

  // 3. Lead Actions
  const addLead = (leadData) => {
    if (!leadData.name || !leadData.phone) {
      return { success: false, error: 'Contact Name and Phone Number are required.' };
    }

    const normPhone = normalizePhoneNumber(leadData.phone);
    if (!normPhone || normPhone.length < 8) {
      return { success: false, error: 'Please enter a valid phone number (at least 8 digits).' };
    }

    // Phone duplicate detection across Cold Leads, Leads, and Clients
    const dupCheck = detectPhoneDuplicate(normPhone);
    if (dupCheck.exists && !leadData.forceAdd) {
      return {
        success: false,
        isDuplicate: true,
        duplicateInfo: dupCheck,
        error: dupCheck.message
      };
    }

    const today = getTodayDateString();
    const isoNow = new Date().toISOString();
    const newLead = {
      id: `L-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      name: leadData.name.trim(),
      phone: leadData.phone.trim(),
      normalizedPhone: normPhone,
      company: (leadData.company || '').trim(),
      email: (leadData.email || '').trim(),
      address: (leadData.address || '').trim(),
      source: (leadData.source || 'Direct Lead').trim(),
      notes: (leadData.notes || '').trim(),
      status: leadData.status || 'New',
      assignedTo: leadData.assignedTo || currentUser?.name || 'Staff',
      assignedToId: leadData.assignedToId || currentUser?.employeeId || '',
      isDNC: false,
      callLogs: [],
      callCount: 0,
      createdDate: today,
      createdAt: isoNow,
      createdBy: {
        id: currentUser?.employeeId || currentUser?.uid || 'user',
        name: currentUser?.name || 'Super Admin',
        email: currentUser?.email || ''
      }
    };

    setLeads(prev => [newLead, ...prev]);
    saveFirestoreDoc('leads', newLead.id, newLead);

    // Log WhatsApp notification for new lead status (automatic trigger)
    const text = compileTemplate('lead_status_changed', {
      leadName: newLead.name,
      status: newLead.status,
      assignedTo: newLead.assignedTo
    });
    addWhatsAppLog(newLead.phone, text, 'outbound');
    return { success: true, lead: newLead };
  };

  const updateLead = (leadId, updatedData) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const merged = { ...lead, ...updatedData };
        if (updatedData.phone) {
          merged.normalizedPhone = normalizePhoneNumber(updatedData.phone);
        }
        saveFirestoreDoc('leads', leadId, merged);
        return merged;
      }
      return lead;
    }));
  };

  const updateLeadStatus = (leadId, newStatus) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        if (lead.status === newStatus) return lead;
        const updatedLead = { ...lead, status: newStatus };
        saveFirestoreDoc('leads', leadId, updatedLead);
        
        // Trigger status notification
        const text = compileTemplate('lead_status_changed', {
          leadName: updatedLead.name,
          status: newStatus,
          assignedTo: updatedLead.assignedTo
        });
        addWhatsAppLog(updatedLead.phone, text, 'outbound');

        // Check if Won -> Unified Idempotent Conversion to Client & Payment Schedule
        if (newStatus === 'Won') {
          convertWonLeadToClient(updatedLead);
        }
        return updatedLead;
      }
      return lead;
    }));
  };

  const deleteLead = (leadId) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return false;
    setLeads(prev => prev.filter(lead => lead.id !== leadId));
    deleteFirestoreDoc('leads', leadId);
    return true;
  };

  // 3.1 Telecaller Workflow Actions (for Leads in Pipeline)
  const recordCallAttempt = (leadId, callData) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return { success: false, error: 'Lead not found.' };

    const callerId = callData.callerId || currentUser?.employeeId || currentUser?.uid || '';
    const callerName = callData.callerName || currentUser?.name || 'Telecaller';
    const timestamp = getTimeString();
    const today = getTodayDateString();

    // Ownership claim protection:
    // If lead was unassigned, caller claims it; if already assigned, caller does NOT silently overwrite owner!
    const finalAssignedTo = targetLead.assignedTo || callerName;
    const finalAssignedToId = targetLead.assignedToId || callerId;

    const callEntry = {
      id: `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      date: today,
      outcome: callData.outcome,
      notes: callData.notes || '',
      duration: callData.duration || '',
      callerName,
      callerId,
      callerEmail: callData.callerEmail || currentUser?.email || '',
      nextFollowUpDate: callData.nextFollowUpDate || null,
      nextFollowUpTime: callData.nextFollowUpTime || null,
      nextFollowUpReason: callData.nextFollowUpReason || ''
    };

    const existingLogs = Array.isArray(targetLead.callLogs) ? targetLead.callLogs : [];
    const updatedCallLogs = [callEntry, ...existingLogs];

    // Auto-compute stage from call outcome unless caller explicitly set newStage
    let nextStage = targetLead.status;
    if (callData.newStage && ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'].includes(callData.newStage)) {
      nextStage = callData.newStage;
    } else {
      const outcome = (callData.outcome || '').toLowerCase();
      if (outcome.includes('not interested') || outcome === 'do not call') {
        nextStage = 'Lost';
      } else if (outcome.includes('negotiat')) {
        nextStage = 'Negotiation';
      } else if (outcome.includes('won') || outcome.includes('deal closed') || outcome.includes('converted')) {
        nextStage = 'Won';
      } else if (targetLead.status === 'New' && (outcome.includes('connected') || outcome.includes('interested') || outcome.includes('callback') || outcome.includes('follow'))) {
        nextStage = 'Contacted';
      }
    }

    // DNC support on leads
    const isDNC = callData.outcome === 'Do Not Call' || targetLead.isDNC;
    const dncReason = callData.outcome === 'Do Not Call' 
      ? (callData.notes || 'Added to DNC during telecaller call') 
      : (targetLead.dncReason || '');

    const updatedLeadFields = {
      ...targetLead,
      assignedTo: finalAssignedTo,
      assignedToId: finalAssignedToId,
      status: nextStage,
      isDNC,
      dncReason,
      callLogs: updatedCallLogs,
      callCount: (targetLead.callCount || 0) + 1,
      lastCallOutcome: callData.outcome,
      lastCallDate: today,
      lastCallTimestamp: timestamp,
      lastCallNotes: callData.notes || '',
      lastCallerName: callerName,
      updatedAt: timestamp
    };

    // Update lead in state & Firestore
    updateLead(leadId, updatedLeadFields);

    // If caller explicitly moved stage to Won, invoke unified conversion
    if (nextStage === 'Won' && targetLead.status !== 'Won') {
      convertWonLeadToClient(updatedLeadFields);
    }

    // Follow-up integration: strictly reuse existing Follow-up module & prevent duplicate records
    const existingPendingFU = followUps.find(f => f.leadId === leadId && f.status === 'Pending');

    if (callData.nextFollowUpDate && !isDNC && callData.outcome !== 'Not Interested' && callData.outcome !== 'Connected — Not Interested' && callData.outcome !== 'Wrong Number') {
      if (existingPendingFU) {
        rescheduleFollowUp(
          existingPendingFU.id,
          callData.nextFollowUpDate,
          callData.nextFollowUpTime || '11:00',
          callData.nextFollowUpReason || callData.notes || `Telecaller Call: ${callData.outcome}`
        );
      } else {
        addFollowUp({
          leadId: targetLead.id,
          leadName: targetLead.name,
          leadPhone: targetLead.phone,
          type: 'Call',
          title: `Follow-up: ${targetLead.name}`,
          notes: callData.nextFollowUpReason || callData.notes || `Scheduled via Telecaller (${callData.outcome})`,
          dueDate: callData.nextFollowUpDate,
          dueTime: callData.nextFollowUpTime || '11:00',
          priority: (callData.outcome === 'Interested' || callData.outcome === 'Connected — Interested') ? 'High' : 'Medium'
        });
      }
    } else if (existingPendingFU && (isDNC || callData.outcome === 'Converted' || callData.outcome === 'Converted / Closed' || callData.outcome === 'Not Interested' || callData.outcome === 'Connected — Not Interested' || callData.outcome === 'Wrong Number')) {
      completeFollowUp(existingPendingFU.id, `Closed via Telecaller call outcome: ${callData.outcome}`, false);
    }

    return { success: true, callEntry, lead: updatedLeadFields };
  };

  const bulkAssignLeads = (leadIds, assignedToName, assignedToId = '') => {
    if (!Array.isArray(leadIds) || leadIds.length === 0) return;

    setLeads(prev => prev.map(lead => {
      if (leadIds.includes(lead.id)) {
        const updated = {
          ...lead,
          assignedTo: assignedToName,
          assignedToId: assignedToId || lead.assignedToId || ''
        };
        saveFirestoreDoc('leads', lead.id, updated);
        return updated;
      }
      return lead;
    }));
  };

  // 3.2 Cold Calling Actions & Workflows

  // Phone duplicate detection across Cold Leads, Leads, and Clients
  const detectPhoneDuplicate = (phone, excludeId = null, excludeType = null) => {
    const norm = normalizePhoneNumber(phone);
    if (!norm || norm.length < 8) return { exists: false };

    // 1. Check in Clients
    if (excludeType !== 'client') {
      const matchedClient = (clients || []).find(c => normalizePhoneNumber(c.phone) === norm);
      if (matchedClient) {
        return {
          exists: true,
          type: 'Client',
          record: matchedClient,
          message: `Existing Client found: "${matchedClient.name}" (${matchedClient.company || 'Direct'})`
        };
      }
    }

    // 2. Check in Leads
    if (excludeType !== 'lead') {
      const matchedLead = (leads || []).find(l => l.id !== excludeId && normalizePhoneNumber(l.phone) === norm);
      if (matchedLead) {
        return {
          exists: true,
          type: 'Lead',
          record: matchedLead,
          message: `Existing Lead found: "${matchedLead.name}" (Status: ${matchedLead.status}, Owner: ${matchedLead.assignedTo || 'Unassigned'})`
        };
      }
    }

    // 3. Check in Cold Leads
    if (excludeType !== 'cold_lead') {
      const matchedCold = (coldLeads || []).find(c => c.id !== excludeId && normalizePhoneNumber(c.phone) === norm);
      if (matchedCold) {
        return {
          exists: true,
          type: 'Cold Lead',
          record: matchedCold,
          message: `Existing Cold Lead found: "${matchedCold.name}" (Owner: ${matchedCold.assignedToName || 'Unassigned'}, Status: ${matchedCold.status})`
        };
      }
    }

    return { exists: false };
  };

  const addColdLead = (data) => {
    const normPhone = normalizePhoneNumber(data.phone);
    if (!data.name || !data.phone) {
      return { success: false, error: 'Name and Phone Number are mandatory.' };
    }
    if (!normPhone || normPhone.length < 8) {
      return { success: false, error: 'Invalid phone number format.' };
    }

    // Duplicate check
    const dupCheck = detectPhoneDuplicate(normPhone);
    if (dupCheck.exists && !data.forceAdd) {
      return {
        success: false,
        isDuplicate: true,
        duplicateInfo: dupCheck,
        error: dupCheck.message
      };
    }

    const today = getTodayDateString();
    const isoNow = new Date().toISOString();
    const newColdLead = {
      id: `COLD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      normalizedPhone: normPhone,
      company: (data.company || '').trim(),
      email: (data.email || '').trim(),
      address: (data.address || '').trim(),
      city: (data.city || '').trim(),
      state: (data.state || '').trim(),
      category: (data.category || data.industry || 'General').trim(),
      notes: (data.notes || '').trim(),
      source: (data.source || 'Manual Entry').trim(),
      status: data.assignedToId ? 'Assigned' : 'Unassigned',
      isDNC: false,
      dncReason: '',
      assignedToId: data.assignedToId || null,
      assignedToName: data.assignedToName || null,
      assignedAt: data.assignedToId ? isoNow : null,
      callLogs: [],
      callCount: 0,
      lastCallOutcome: null,
      lastCallDate: null,
      lastCallTimestamp: null,
      lastCallNotes: '',
      lastCallerName: '',
      createdDate: today,
      createdAt: isoNow,
      createdBy: {
        id: currentUser?.employeeId || currentUser?.uid || 'user',
        name: currentUser?.name || 'Super Admin',
        email: currentUser?.email || ''
      }
    };

    setColdLeads(prev => [newColdLead, ...prev]);
    saveFirestoreDoc('cold_leads', newColdLead.id, newColdLead);
    return { success: true, coldLead: newColdLead };
  };

  const bulkImportColdLeads = (records) => {
    if (!Array.isArray(records) || records.length === 0) {
      return { success: false, importedCount: 0, errors: [{ row: 0, error: 'No records provided' }] };
    }

    const today = getTodayDateString();
    const isoNow = new Date().toISOString();
    const createdBy = {
      id: currentUser?.employeeId || currentUser?.uid || 'user',
      name: currentUser?.name || 'Super Admin',
      email: currentUser?.email || ''
    };

    const importedList = [];
    const errors = [];
    const duplicates = [];

    records.forEach((raw, idx) => {
      const rowNum = idx + 1;
      const name = (raw.name || '').trim();
      const phone = (raw.phone || '').trim();

      if (!name) {
        errors.push({ row: rowNum, error: 'Name is mandatory' });
        return;
      }
      if (!phone) {
        errors.push({ row: rowNum, error: 'Phone is mandatory' });
        return;
      }

      const normPhone = normalizePhoneNumber(phone);
      if (!normPhone || normPhone.length < 8) {
        errors.push({ row: rowNum, error: `Invalid phone format: "${phone}"` });
        return;
      }

      // Check within current batch
      if (importedList.some(item => item.normalizedPhone === normPhone)) {
        duplicates.push({ row: rowNum, name, phone, reason: 'Duplicate phone in same file' });
        return;
      }

      // Check existing in CRM
      const dup = detectPhoneDuplicate(normPhone);
      if (dup.exists && !raw.allowDuplicate) {
        duplicates.push({ row: rowNum, name, phone, reason: dup.message });
        return;
      }

      const newColdLead = {
        id: `COLD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 900 + 100)}`,
        name,
        phone,
        normalizedPhone: normPhone,
        company: (raw.company || '').trim(),
        email: (raw.email || '').trim(),
        address: (raw.address || '').trim(),
        city: (raw.city || '').trim(),
        state: (raw.state || '').trim(),
        category: (raw.category || raw.industry || 'General').trim(),
        notes: (raw.notes || '').trim(),
        source: (raw.source || 'Bulk Import').trim(),
        status: raw.assignedToId ? 'Assigned' : 'Unassigned',
        isDNC: false,
        dncReason: '',
        assignedToId: raw.assignedToId || null,
        assignedToName: raw.assignedToName || null,
        assignedAt: raw.assignedToId ? isoNow : null,
        callLogs: [],
        callCount: 0,
        lastCallOutcome: null,
        lastCallDate: null,
        lastCallTimestamp: null,
        lastCallNotes: '',
        lastCallerName: '',
        createdDate: today,
        createdAt: isoNow,
        createdBy
      };

      importedList.push(newColdLead);
    });

    if (importedList.length > 0) {
      setColdLeads(prev => [...importedList, ...prev]);
      importedList.forEach(item => {
        saveFirestoreDoc('cold_leads', item.id, item);
      });
    }

    return {
      success: true,
      importedCount: importedList.length,
      errors,
      duplicates,
      importedList
    };
  };

  const recordColdCallAttempt = (coldLeadId, callData) => {
    const target = (coldLeads || []).find(c => c.id === coldLeadId);
    if (!target) return { success: false, error: 'Cold record not found.' };

    const callerId = callData.callerId || currentUser?.employeeId || currentUser?.uid || '';
    const callerName = callData.callerName || currentUser?.name || 'Telecaller';
    const timestamp = getTimeString();
    const today = getTodayDateString();

    // Guard Against Simultaneous Claims & Protect Ownership:
    // If this unassigned record was just claimed by someone else in a parallel session, notify caller
    if (callData.wasUnassignedWhenOpened && target.assignedToId && target.assignedToId !== callerId) {
      return {
        success: false,
        alreadyClaimed: true,
        owner: target.assignedToName,
        error: `Simultaneous claim prevented: This record was just claimed by ${target.assignedToName || 'another employee'}.`
      };
    }

    // Auto-assign to employee upon saving call log if unassigned
    const willBeAssigned = !target.assignedToId;
    // Later calls must NOT silently replace the owner
    const newAssignedToId = target.assignedToId || callerId;
    const newAssignedToName = target.assignedToName || callerName;
    const assignedAt = target.assignedAt || (willBeAssigned ? timestamp : null);

    const callEntry = {
      id: `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      coldLeadId,
      timestamp,
      date: today,
      outcome: callData.outcome,
      notes: callData.notes || '',
      duration: callData.duration || '',
      callerId,
      callerName,
      callerEmail: callData.callerEmail || currentUser?.email || '',
      nextFollowUpDate: callData.nextFollowUpDate || null,
      nextFollowUpTime: callData.nextFollowUpTime || null,
      nextFollowUpReason: callData.nextFollowUpReason || ''
    };

    const existingLogs = Array.isArray(target.callLogs) ? target.callLogs : [];
    const updatedCallLogs = [callEntry, ...existingLogs];

    // Determine status & DNC from the 8 canonical outcomes
    let nextStatus = target.status;
    let isDNC = target.isDNC || false;
    let dncReason = target.dncReason || '';

    if (callData.outcome === 'Do Not Call') {
      nextStatus = 'Do Not Call';
      isDNC = true;
      dncReason = callData.notes || 'Added to DNC during cold call';
    } else if (callData.outcome === 'Converted' || callData.outcome === 'Converted / Closed') {
      nextStatus = 'Converted';
    } else if (callData.outcome === 'Interested' || callData.outcome === 'Connected — Interested') {
      nextStatus = 'Interested';
    } else if (callData.outcome === 'Not Interested' || callData.outcome === 'Connected — Not Interested') {
      nextStatus = 'Not Interested';
    } else if (callData.outcome === 'Wrong Number') {
      nextStatus = 'Closed';
    } else if (callData.outcome === 'Follow-up Required' || callData.outcome === 'Busy' || callData.outcome === 'Busy / Call Later' || callData.nextFollowUpDate) {
      nextStatus = 'Follow-up Due';
    } else {
      nextStatus = 'Called';
    }

    const updatedColdLead = {
      ...target,
      assignedToId: newAssignedToId,
      assignedToName: newAssignedToName,
      assignedAt,
      status: nextStatus,
      isDNC,
      dncReason,
      callLogs: updatedCallLogs,
      callCount: (target.callCount || 0) + 1,
      lastCallOutcome: callData.outcome,
      lastCallDate: today,
      lastCallTimestamp: timestamp,
      lastCallNotes: callData.notes || '',
      lastCallerName: callerName,
      updatedAt: timestamp
    };

    setColdLeads(prev => prev.map(c => c.id === coldLeadId ? updatedColdLead : c));
    saveFirestoreDoc('cold_leads', coldLeadId, updatedColdLead);

    // Follow-up Section Integration (reuses existing CRM Follow-up collection):
    const norm = target.normalizedPhone || normalizePhoneNumber(target.phone);
    const existingPendingFU = followUps.find(f => 
      (f.coldLeadId === coldLeadId || (f.leadPhone && normalizePhoneNumber(f.leadPhone) === norm)) && 
      f.status === 'Pending'
    );

    if (callData.nextFollowUpDate && !isDNC && nextStatus !== 'Not Interested' && nextStatus !== 'Closed') {
      if (existingPendingFU) {
        rescheduleFollowUp(
          existingPendingFU.id,
          callData.nextFollowUpDate,
          callData.nextFollowUpTime || '11:00',
          callData.nextFollowUpReason || callData.notes || `Cold Call Follow-up: ${callData.outcome}`
        );
      } else {
        addFollowUp({
          coldLeadId: target.id,
          leadName: target.name,
          leadPhone: target.phone,
          type: 'Call',
          title: `Cold Call Follow-up: ${target.name}`,
          notes: callData.nextFollowUpReason || callData.notes || `Scheduled via Cold Calling (${callData.outcome})`,
          dueDate: callData.nextFollowUpDate,
          dueTime: callData.nextFollowUpTime || '11:00',
          priority: (callData.outcome === 'Interested' || callData.outcome === 'Connected — Interested') ? 'High' : 'Medium'
        });
      }
    } else if (existingPendingFU && (isDNC || nextStatus === 'Not Interested' || nextStatus === 'Converted' || nextStatus === 'Closed')) {
      completeFollowUp(existingPendingFU.id, `Completed via Cold Call outcome: ${callData.outcome}`, false);
    }

    return { success: true, callEntry, coldLead: updatedColdLead };
  };

  const convertColdLeadToLead = (coldLeadId, leadOverrides = {}) => {
    const target = (coldLeads || []).find(c => c.id === coldLeadId);
    if (!target) return { success: false, error: 'Cold record not found.' };

    // Retry-safe & idempotent check:
    // Check if target is already converted OR if a lead with matching coldLeadId already exists
    const existingPromotedLead = leads.find(l => l.coldLeadId === target.id);
    if ((target.status === 'Converted' && target.convertedLeadId) || existingPromotedLead) {
      const existingId = target.convertedLeadId || existingPromotedLead?.id;
      return { 
        success: false, 
        alreadyConverted: true, 
        leadId: existingId,
        lead: existingPromotedLead || leads.find(l => l.id === existingId),
        error: 'This cold calling record has already been converted to a Lead.' 
      };
    }

    const norm = target.normalizedPhone || normalizePhoneNumber(target.phone);
    const existingLead = leads.find(l => normalizePhoneNumber(l.phone) === norm);

    if (existingLead && !leadOverrides.forceLinkToExisting) {
      return {
        success: false,
        isDuplicate: true,
        existingLead,
        error: `A matching lead already exists for phone "${target.phone}": ${existingLead.name} (${existingLead.status}).`
      };
    }

    if (existingLead && leadOverrides.forceLinkToExisting) {
      // Merge cold calling activity and call logs into existing lead
      const combinedLogs = [...(target.callLogs || []), ...(existingLead.callLogs || [])];
      const mergedNotes = existingLead.notes 
        ? `${existingLead.notes}\n[Cold Call History]: ${target.notes || ''}`
        : (target.notes || '');

      const updatedLeadData = {
        ...existingLead,
        coldLeadId: target.id,
        callLogs: combinedLogs,
        notes: mergedNotes
      };
      updateLead(existingLead.id, updatedLeadData);

      const updatedCold = {
        ...target,
        status: 'Converted',
        convertedLeadId: existingLead.id,
        convertedAt: new Date().toISOString()
      };
      setColdLeads(prev => prev.map(c => c.id === coldLeadId ? updatedCold : c));
      saveFirestoreDoc('cold_leads', coldLeadId, updatedCold);

      return { success: true, lead: existingLead, merged: true };
    }

    // Create regular lead via standard lead schema
    const newLead = {
      id: `L-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      name: (leadOverrides.name || target.name).trim(),
      phone: target.phone.trim(),
      normalizedPhone: norm,
      email: (leadOverrides.email || target.email || '').trim(),
      address: (leadOverrides.address || target.address || '').trim(),
      company: (leadOverrides.company || target.company || '').trim(),
      source: (leadOverrides.source || 'Cold Call').trim(),
      notes: (leadOverrides.notes || target.notes || `Promoted from Cold Calling (${target.id})`).trim(),
      assignedTo: leadOverrides.assignedTo || target.assignedToName || currentUser?.name || 'Staff',
      assignedToId: leadOverrides.assignedToId || target.assignedToId || currentUser?.employeeId || '',
      status: leadOverrides.status || 'Contacted',
      coldLeadId: target.id,
      callLogs: target.callLogs || [],
      callCount: target.callCount || 0,
      lastCallOutcome: target.lastCallOutcome || null,
      lastCallDate: target.lastCallDate || null,
      createdDate: getTodayDateString(),
      createdAt: new Date().toISOString()
    };

    setLeads(prev => [newLead, ...prev]);
    saveFirestoreDoc('leads', newLead.id, newLead);

    // Mark cold record as converted
    const updatedCold = {
      ...target,
      status: 'Converted',
      convertedLeadId: newLead.id,
      convertedAt: new Date().toISOString()
    };
    setColdLeads(prev => prev.map(c => c.id === coldLeadId ? updatedCold : c));
    saveFirestoreDoc('cold_leads', coldLeadId, updatedCold);

    // Re-link any pending follow-up from cold lead to new lead
    setFollowUps(prev => prev.map(fu => {
      if (fu.coldLeadId === coldLeadId && fu.status === 'Pending') {
        const updatedFU = { ...fu, leadId: newLead.id, leadName: newLead.name };
        saveFirestoreDoc('followups', fu.id, updatedFU);
        return updatedFU;
      }
      return fu;
    }));

    return { success: true, lead: newLead };
  };

  const updateColdLead = (coldLeadId, updates) => {
    setColdLeads(prev => prev.map(c => {
      if (c.id === coldLeadId) {
        const merged = { ...c, ...updates, updatedAt: new Date().toISOString() };
        if (updates.phone) {
          merged.normalizedPhone = normalizePhoneNumber(updates.phone);
        }
        saveFirestoreDoc('cold_leads', coldLeadId, merged);
        return merged;
      }
      return c;
    }));
    return { success: true };
  };

  const deleteColdLead = (coldLeadId) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return false;
    setColdLeads(prev => prev.filter(c => c.id !== coldLeadId));
    deleteFirestoreDoc('cold_leads', coldLeadId);
    return true;
  };

  const bulkAssignColdLeads = (coldLeadIds, employeeId, employeeName) => {
    if (!Array.isArray(coldLeadIds) || coldLeadIds.length === 0) return { success: false };
    const isoNow = new Date().toISOString();

    setColdLeads(prev => prev.map(c => {
      if (coldLeadIds.includes(c.id)) {
        const isAssigned = !!employeeId;
        const nextStatus = isAssigned 
          ? (c.status === 'Unassigned' ? 'Assigned' : c.status)
          : 'Unassigned';

        const updated = {
          ...c,
          assignedToId: employeeId || null,
          assignedToName: employeeName || null,
          assignedAt: isAssigned ? isoNow : null,
          status: nextStatus,
          updatedAt: isoNow
        };
        saveFirestoreDoc('cold_leads', c.id, updated);
        return updated;
      }
      return c;
    }));
    return { success: true };
  };

  const toggleColdLeadDNC = (coldLeadId, reason = '', isDNC = true) => {
    setColdLeads(prev => prev.map(c => {
      if (c.id === coldLeadId) {
        const updated = {
          ...c,
          isDNC,
          dncReason: isDNC ? (reason || 'Marked as Do Not Call') : '',
          status: isDNC ? 'Do Not Call' : (c.assignedToId ? 'Assigned' : 'Unassigned'),
          updatedAt: new Date().toISOString()
        };
        saveFirestoreDoc('cold_leads', coldLeadId, updated);
        return updated;
      }
      return c;
    }));
    return { success: true };
  };

  // 4. Unified Idempotent Won Conversion (Both Lead Won and Quote Accepted converge here)
  const convertWonLeadToClient = (leadIdOrLead, quoteId = null, acceptedTerms = null) => {
    let lead = null;
    if (typeof leadIdOrLead === 'object' && leadIdOrLead !== null) {
      lead = leadIdOrLead;
    } else if (leadIdOrLead) {
      lead = leads.find(l => l.id === leadIdOrLead);
    }

    // If quotation was passed directly with a client ID (already a client)
    if (!lead && quoteId) {
      const q = quotations.find(item => item.id === quoteId);
      if (q && q.type === 'client') {
        const client = clients.find(c => c.id === q.clientOrLeadId);
        if (client) {
          createPaymentRecordForQuotation(q, client, acceptedTerms);
          return { success: true, client, quotation: q };
        }
      }
    }

    if (!lead) return { success: false, error: 'Originating Lead record not found.' };

    const normPhone = normalizePhoneNumber(lead.phone);
    const isoNow = new Date().toISOString();
    const today = getTodayDateString();

    // Idempotent client check: match by originatingLeadId, normalized phone, or exact email
    let client = clients.find(c => 
      c.originatingLeadId === lead.id || 
      (normPhone && normPhone.length >= 8 && normalizePhoneNumber(c.phone) === normPhone) ||
      (lead.email && c.email && c.email.toLowerCase().trim() === lead.email.toLowerCase().trim())
    );

    let createdNewClient = false;
    if (!client) {
      createdNewClient = true;
      const clientCompany = lead.company || lead.companyName || `${lead.name}`;
      client = {
        id: `C-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
        name: lead.name.trim(),
        phone: lead.phone.trim(),
        normalizedPhone: normPhone,
        email: (lead.email || '').trim(),
        companyName: clientCompany.trim(),
        address: (lead.address || '').trim(),
        source: lead.source || 'Converted Lead',
        notes: lead.notes || `Official Client created from Won Lead (${lead.id})`,
        originatingLeadId: lead.id,
        originatingQuoteId: quoteId || lead.quotation?.id || null,
        convertedDate: today,
        convertedAt: isoNow,
        convertedBy: {
          id: currentUser?.employeeId || currentUser?.uid || 'user',
          name: currentUser?.name || 'Super Admin'
        }
      };

      setClients(prev => {
        if (prev.some(c => c.id === client.id || (normPhone && normalizePhoneNumber(c.phone) === normPhone))) {
          return prev;
        }
        return [...prev, client];
      });
      saveFirestoreDoc('clients', client.id, client);
    }

    // Update Lead to Won with reference to official Client (Idempotent)
    const updatedLead = {
      ...lead,
      status: 'Won',
      convertedClientId: client.id,
      wonAt: lead.wonAt || isoNow,
      wonQuoteId: quoteId || lead.wonQuoteId || null,
      updatedAt: isoNow
    };
    setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
    saveFirestoreDoc('leads', lead.id, updatedLead);

    // Update matching lead quotations to type 'client' and link to client ID
    let targetQuote = null;
    setQuotations(prev => prev.map(q => {
      const isMatchingLeadQuote = q.clientOrLeadId === lead.id || (lead.quotation && lead.quotation.id === q.id);
      const isTargetQuote = quoteId ? q.id === quoteId : isMatchingLeadQuote;

      if (isMatchingLeadQuote || isTargetQuote) {
        const nextStatus = (quoteId && q.id === quoteId) || q.status === 'Accepted' ? 'Accepted' : (q.status || 'Sent');
        const updatedQ = {
          ...q,
          clientOrLeadId: client.id,
          type: 'client',
          originatingLeadId: lead.id,
          status: nextStatus,
          acceptedAt: nextStatus === 'Accepted' ? (q.acceptedAt || isoNow) : null
        };
        if (isTargetQuote) {
          targetQuote = updatedQ;
        }
        saveFirestoreDoc('quotations', updatedQ.id, updatedQ);
        return updatedQ;
      }
      return q;
    }));

    if (!targetQuote) {
      targetQuote = quotations.find(q => 
        (q.clientOrLeadId === client.id || q.clientOrLeadId === lead.id) && 
        (q.status === 'Accepted' || quoteId === q.id)
      ) || quotations.find(q => q.clientOrLeadId === client.id || q.clientOrLeadId === lead.id);
    }

    // Generate Payment record & instalment schedule idempotently
    if (targetQuote) {
      createPaymentRecordForQuotation(targetQuote, client, acceptedTerms);
    }

    return { success: true, client, lead: updatedLead, quotation: targetQuote, createdNewClient };
  };

  // Backwards compatibility alias
  const convertToClient = (lead) => convertWonLeadToClient(lead);

  const updateClient = (clientId, updatedData) => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        const merged = { ...client, ...updatedData };
        saveFirestoreDoc('clients', clientId, merged);
        return merged;
      }
      return client;
    }));
  };

  const deleteClient = (clientId) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return false;
    setClients(prev => prev.filter(c => c.id !== clientId));
    deleteFirestoreDoc('clients', clientId);
    return true;
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
    saveFirestoreDoc('quotations', newQuote.id, newQuote);

    // Save quotation directly inside Lead in JSON format if linked to lead
    if (newQuote.type === 'lead' || newQuote.clientOrLeadId?.startsWith('L-')) {
      saveLeadQuotationJSON(newQuote.clientOrLeadId, newQuote);
      const linkedLead = leads.find(l => l.id === newQuote.clientOrLeadId);
      if (linkedLead && (linkedLead.status === 'New' || linkedLead.status === 'Contacted')) {
        updateLeadStatus(newQuote.clientOrLeadId, 'Quoted');
      }
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
        saveFirestoreDoc('quotations', merged.id, merged);
        if (merged.type === 'lead' || merged.clientOrLeadId?.startsWith('L-')) {
          saveLeadQuotationJSON(merged.clientOrLeadId, merged);
        }
        return merged;
      }
      return q;
    }));
  };

  const updateQuotationStatus = (quoteId, status) => {
    let targetQuote = null;
    setQuotations(prev => prev.map(q => {
      if (q.id === quoteId) {
        const updated = { 
          ...q, 
          status,
          acceptedAt: status === 'Accepted' ? (q.acceptedAt || new Date().toISOString()) : q.acceptedAt
        };
        targetQuote = updated;
        saveFirestoreDoc('quotations', updated.id, updated);
        if (status === 'Sent') {
          sendQuotationWhatsApp(updated);
        }
        // Sync to lead
        if (updated.type === 'lead' || updated.clientOrLeadId?.startsWith('L-')) {
          saveLeadQuotationJSON(updated.clientOrLeadId, updated);
        }
        return updated;
      }
      return q;
    }));

    // If accepted, invoke single idempotent Won conversion (Unifies Lead Won and Quote Acceptance)
    if (status === 'Accepted' && targetQuote) {
      if (targetQuote.type === 'lead' || targetQuote.clientOrLeadId?.startsWith('L-') || targetQuote.originatingLeadId) {
        convertWonLeadToClient(targetQuote.clientOrLeadId || targetQuote.originatingLeadId, quoteId);
      } else if (targetQuote.type === 'client') {
        const client = clients.find(c => c.id === targetQuote.clientOrLeadId);
        if (client) {
          createPaymentRecordForQuotation(targetQuote, client);
        }
      }
    }
  };

  const deleteQuotation = (quoteId) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return false;
    setQuotations(prev => prev.filter(q => q.id !== quoteId));
    deleteFirestoreDoc('quotations', quoteId);
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

    // Truthful activity logging: dispatch link/template prepared
    addWhatsAppLog(target.phone, text, 'outbound');
  };

  // 6. Payment Actions & Automatic Creator on Quote Acceptance
  const createPaymentRecordForQuotation = (quote, clientRecord = null, customTerms = null) => {
    // Check if payment already exists for this quotation (Idempotent)
    const existing = payments.find(p => p.quotationId === quote.id);
    if (existing) return existing;

    const client = clientRecord || clients.find(c => c.id === quote.clientOrLeadId);
    if (!client) return null;

    let instalments = [];
    if (customTerms && Array.isArray(customTerms.instalments) && customTerms.instalments.length > 0) {
      instalments = customTerms.instalments.map((inst, idx) => ({
        id: `INST-${Date.now()}-${idx + 1}-${Math.floor(Math.random() * 1000)}`,
        amount: Number(inst.amount) || 0,
        dueDate: inst.dueDate || getTodayDateString(),
        paidDate: null,
        status: 'Pending'
      }));
    } else if (quote.paymentTerms && Array.isArray(quote.paymentTerms.instalments) && quote.paymentTerms.instalments.length > 0) {
      instalments = quote.paymentTerms.instalments;
    } else {
      // Configurable standard default: 2-instalment schedule (50/50 split)
      const half = Math.round(quote.total / 2);
      const due1 = quote.date || getTodayDateString();
      const due2 = new Date();
      due2.setDate(due2.getDate() + 30); // 30 days later
      const due2Str = due2.toISOString().split('T')[0];

      instalments = [
        { id: `INST-${Date.now()}-1-${Math.floor(Math.random() * 1000)}`, amount: half, dueDate: due1, paidDate: null, status: 'Pending' },
        { id: `INST-${Date.now()}-2-${Math.floor(Math.random() * 1000)}`, amount: quote.total - half, dueDate: due2Str, paidDate: null, status: 'Pending' }
      ];
    }

    const newPayment = {
      id: `P-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
      clientId: client.id,
      clientName: client.name,
      quotationId: quote.id,
      quoteTitle: quote.title,
      totalAmount: quote.total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      instalments
    };

    setPayments(prev => {
      if (prev.some(p => p.quotationId === quote.id)) return prev;
      return [...prev, newPayment];
    });
    saveFirestoreDoc('payments', newPayment.id, newPayment);
    scheduleRemindersForInstalments(client, newPayment.instalments);
    return newPayment;
  };

  // Schedule auto-reminders based on instalment due dates
  const scheduleRemindersForInstalments = (client, instalments) => {
    const newRems = [];
    instalments.forEach((inst, idx) => {
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

      const salt = `${idx}-${Math.floor(Math.random() * 9000 + 1000)}`;
      newRems.push(
        { id: `REM-${Date.now()}-A-${salt}`, clientId: client.id, clientName: client.name, phone: client.phone, amount: inst.amount, dueDate: inst.dueDate, scheduledFor: oneDayBeforeStr, triggerType: '1_day_before', status: 'Pending', sentDate: null },
        { id: `REM-${Date.now()}-B-${salt}`, clientId: client.id, clientName: client.name, phone: client.phone, amount: inst.amount, dueDate: inst.dueDate, scheduledFor: dueDayStr, triggerType: 'due_day', status: 'Pending', sentDate: null },
        { id: `REM-${Date.now()}-C-${salt}`, clientId: client.id, clientName: client.name, phone: client.phone, amount: inst.amount, dueDate: inst.dueDate, scheduledFor: threeDaysAfterStr, triggerType: '3_days_after', status: 'Pending', sentDate: null }
      );
    });
    setReminders(prev => [...prev, ...newRems]);
    newRems.forEach(r => saveFirestoreDoc('reminders', r.id, r));
  };

  const recordPaymentPayment = (paymentId, instalmentId, paidDate = getTodayDateString()) => {
    let clientPhone = '';
    let clientName = '';
    let quoteTitle = '';
    let paidAmt = 0;
    let balance = 0;
    let alreadyPaid = false;

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

        const matchedInst = p.instalments.find(i => i.id === instalmentId);
        if (matchedInst && matchedInst.status === 'Paid') {
          alreadyPaid = true;
          return p; // Idempotent: don't double collect
        }

        const updatedInstalments = p.instalments.map(inst => {
          if (inst.id === instalmentId) {
            paidAmt = inst.amount;
            return { 
              ...inst, 
              status: 'Paid', 
              paidDate,
              collectedBy: currentUser?.name || 'Super Admin',
              collectedById: currentUser?.employeeId || currentUser?.uid || ''
            };
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
        balance = Math.max(0, p.totalAmount - totalPaid);

        // Cancel scheduled reminders for this specific instalment (mark as complete / Sent)
        if (matchedInst) {
          setReminders(rPrev => rPrev.map(rem => {
            if (rem.clientId === p.clientId && rem.amount === matchedInst.amount && rem.dueDate === matchedInst.dueDate && rem.status === 'Pending') {
              const updatedRem = { ...rem, status: 'Sent', sentDate: paidDate };
              saveFirestoreDoc('reminders', rem.id, updatedRem);
              return updatedRem;
            }
            return rem;
          }));
        }

        const updatedPayment = { 
          ...p, 
          status: pStatus, 
          balanceRemaining: balance,
          instalments: updatedInstalments,
          lastPaymentDate: paidDate,
          updatedAt: new Date().toISOString()
        };
        saveFirestoreDoc('payments', p.id, updatedPayment);
        return updatedPayment;
      }
      return p;
    }));

    if (alreadyPaid) {
      return { success: true, message: 'Instalment was already recorded as paid.' };
    }

    // Trigger WhatsApp Notification receipt
    if (clientPhone) {
      const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paidAmt);
      const formattedBal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balance);
      
      const text = compileTemplate('payment_received', {
        clientName,
        amount: formattedAmt,
        quoteTitle: quoteTitle || 'Services',
        balance: formattedBal
      });
      addWhatsAppLog(clientPhone, text, 'outbound');
    }

    return { success: true, collectedAmount: paidAmt, balanceRemaining: balance };
  };

  const deletePayment = (paymentId) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return false;
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    deleteFirestoreDoc('payments', paymentId);
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
    saveFirestoreDoc('payments', newPayment.id, newPayment);

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

        const updatedRem = { ...rem, status: 'Sent', sentDate: getTodayDateString() };
        saveFirestoreDoc('reminders', rem.id, updatedRem);
        return updatedRem;
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
    saveFirestoreDoc('reminders', newLog.id, newLog);
  };

  const deleteReminder = (remId) => {
    if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') return false;
    setReminders(prev => prev.filter(r => r.id !== remId));
    deleteFirestoreDoc('reminders', remId);
    return true;
  };

  // 8. Template editing action
  const updateTemplate = (id, newText) => {
    setTemplates(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, template: newText };
        saveFirestoreDoc('templates', id, updated);
        return updated;
      }
      return t;
    }));
  };

  // 9. Follow-up & Scheduled Tasks Actions
  const addFollowUp = (data) => {
    const newFU = {
      id: `FU-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      createdAt: getTodayDateString(),
      completedAt: null,
      ...data
    };
    setFollowUps(prev => [newFU, ...prev]);
    saveFirestoreDoc('followups', newFU.id, newFU);

    // Send WhatsApp notification log simulation
    if (newFU.leadPhone) {
      addWhatsAppLog(newFU.leadPhone, `Reminder scheduled: "${newFU.title}" on ${newFU.dueDate} at ${newFU.dueTime || '10:00 AM'}.`, 'outbound');
    }
    return newFU;
  };

  const completeFollowUp = (followUpId, customNotes = '', shouldResetStatusToNew = true) => {
    let affectedLeadId = null;
    let affectedLeadName = '';

    setFollowUps(prev => prev.map(fu => {
      if (fu.id === followUpId) {
        affectedLeadId = fu.leadId;
        affectedLeadName = fu.leadName;
        const updated = {
          ...fu,
          status: 'Completed',
          completedAt: getTimeString(),
          completionNotes: customNotes
        };
        saveFirestoreDoc('followups', fu.id, updated);
        return updated;
      }
      return fu;
    }));

    // User requirement: "Done hone pe unhe new lead me daldo" (only if requested and lead is not Won or Lost)
    if (affectedLeadId && shouldResetStatusToNew) {
      const targetLead = leads.find(l => l.id === affectedLeadId);
      if (targetLead && targetLead.status !== 'Won' && targetLead.status !== 'Lost') {
        updateLeadStatus(affectedLeadId, 'New');
      }
    }
  };

  const rescheduleFollowUp = (followUpId, newDate, newTime, reason = '') => {
    setFollowUps(prev => prev.map(fu => {
      if (fu.id === followUpId) {
        const updated = {
          ...fu,
          dueDate: newDate,
          dueTime: newTime || fu.dueTime,
          status: 'Pending',
          rescheduledReason: reason,
          rescheduledAt: getTimeString()
        };
        saveFirestoreDoc('followups', fu.id, updated);
        return updated;
      }
      return fu;
    }));

    // Reset dismissed state so alert can re-fire on the newly scheduled date
    setDismissedAlertIds(prev => prev.filter(id => id !== followUpId));
  };

  const deleteFollowUp = (followUpId) => {
    setFollowUps(prev => prev.filter(fu => fu.id !== followUpId));
    deleteFirestoreDoc('followups', followUpId);
  };

  const dismissFollowUpAlert = (followUpId) => {
    setDismissedAlertIds(prev => [...new Set([...prev, followUpId])]);
  };

  // 10. Employee Management Actions (Super Admin)
  const addEmployee = async (employeeData) => {
    if (!employeeData.name || !employeeData.email || !employeeData.position) {
      return { success: false, error: 'Name, Email, and Position are mandatory fields.' };
    }

    const cleanEmail = employeeData.email.trim().toLowerCase();
    
    // Validate email format
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const isSuper = cleanEmail === SUPER_ADMIN_EMAIL;

    // Check duplicate email
    if (employees.some(e => e.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: `An employee with email "${cleanEmail}" is already registered.` };
    }

    // Generate or validate unique Employee ID
    let empId = employeeData.id ? employeeData.id.trim().toUpperCase() : '';
    if (!empId) {
      const highestNum = employees.reduce((max, e) => {
        const num = parseInt(String(e.id).replace(/[^0-9]/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 100);
      empId = `EMP-${highestNum + 1}`;
    }

    if (employees.some(e => e.id === empId)) {
      return { success: false, error: `Employee ID "${empId}" is already assigned to another employee.` };
    }

    const newEmp = {
      id: empId,
      name: employeeData.name.trim(),
      email: cleanEmail,
      phone: employeeData.phone?.trim() || '',
      position: employeeData.position.trim(),
      department: employeeData.department || 'Sales',
      role: isSuper ? 'Super Admin' : (employeeData.role || 'Staff'),
      permissions: isSuper ? ['*'] : (employeeData.permissions || ['dashboard', 'leads', 'clients', 'quotations', 'payments', 'expenses']),
      status: 'Pending Password Setup', // Initial account state
      setupToken: `SETU-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      createdAt: getTodayDateString(),
      activatedAt: null,
      createdBy: currentUser?.name || 'Super Admin'
    };

    const updatedEmployees = [newEmp, ...employees];
    setEmployees(updatedEmployees);
    try {
      localStorage.setItem('setu_crm_employees', JSON.stringify(updatedEmployees));
    } catch (e) {}
    await saveFirestoreDoc('employees', newEmp.id, newEmp);

    return { success: true, employee: newEmp };
  };

  const updateEmployee = async (empId, updatedData) => {
    if (updatedData.email) {
      const cleanEmail = updatedData.email.trim().toLowerCase();
      if (employees.some(e => e.id !== empId && e.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: `Email "${cleanEmail}" is already used by another employee.` };
      }
      updatedData.email = cleanEmail;
    }

    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        const merged = { ...e, ...updatedData };
        saveFirestoreDoc('employees', empId, merged);
        return merged;
      }
      return e;
    }));
    return { success: true };
  };

  const toggleEmployeeStatus = async (empId) => {
    let newStatus = 'Active';
    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        newStatus = e.status === 'Active' ? 'Inactive' : 'Active';
        const updated = { ...e, status: newStatus };
        saveFirestoreDoc('employees', empId, updated);
        return updated;
      }
      return e;
    }));
    return { success: true, newStatus };
  };

  const deleteEmployee = async (empId) => {
    if (currentUser?.role !== 'Super Admin') return false;
    setEmployees(prev => prev.filter(e => e.id !== empId));
    await deleteFirestoreDoc('employees', empId);
    return true;
  };

  // 1.6 Expense Management Methods & Workflows
  // Auto-approval rule: Admin designation or Super Admin requires NO approval
  const isAutoApproveEligible = (userObj) => {
    if (!userObj) return false;
    if (userObj.role === 'Super Admin' || userObj.role === 'Admin') return true;
    const pos = (userObj.position || '').toLowerCase();
    return pos.includes('admin') || pos.includes('director') || pos.includes('manager') || pos.includes('lead');
  };

  const addExpense = async (expenseData) => {
    const highestNum = (expenses || []).reduce((max, exp) => {
      const num = parseInt(String(exp.id).replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 1000);
    const expId = `EXP-${highestNum + 1}`;

    const autoApprove = isAutoApproveEligible(currentUser);

    const newExpense = {
      id: expId,
      title: expenseData.title?.trim() || `${expenseData.category || 'General'} Expense`,
      category: expenseData.category || 'Fuel', // Fuel, Food, Travel, Other
      expenseType: expenseData.expenseType || (expenseData.clientId ? 'client' : 'daily'), // 'daily' | 'client'
      clientId: expenseData.clientId || null,
      clientName: expenseData.clientName || '',
      amount: parseFloat(expenseData.amount) || 0,
      date: expenseData.date || getTodayDateString(),
      description: expenseData.description?.trim() || '',
      receiptNo: expenseData.receiptNo?.trim() || '',
      createdBy: {
        id: currentUser?.employeeId || currentUser?.uid || 'super-admin',
        name: currentUser?.name || 'Super Admin',
        email: currentUser?.email || '',
        role: currentUser?.role || 'Super Admin',
        position: currentUser?.position || (currentUser?.role === 'Super Admin' ? 'Super Admin' : 'Staff'),
        department: currentUser?.department || 'Operations'
      },
      status: autoApprove ? 'Approved' : 'Pending', // Admin: Approved directly; Other designations: Pending
      approvedBy: autoApprove ? (currentUser?.name || 'Super Admin') : null,
      approvedAt: autoApprove ? new Date().toISOString() : null,
      approvalNote: autoApprove ? 'Auto-approved for Admin designation' : null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextExpenses = [newExpense, ...expenses];
    setExpenses(nextExpenses);
    try {
      localStorage.setItem('setu_crm_expenses', JSON.stringify(nextExpenses));
    } catch (e) {}

    await saveFirestoreDoc('expenses', newExpense.id, newExpense);
    return { success: true, expense: newExpense };
  };

  const updateExpense = async (id, updatedFields) => {
    const existing = expenses.find(e => e.id === id);
    if (!existing) return { success: false, error: 'Expense not found' };

    const updated = {
      ...existing,
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    const next = expenses.map(e => e.id === id ? updated : e);
    setExpenses(next);
    try {
      localStorage.setItem('setu_crm_expenses', JSON.stringify(next));
    } catch (e) {}

    await saveFirestoreDoc('expenses', id, updated);
    return { success: true, expense: updated };
  };

  const approveExpense = async (id, note = '') => {
    const existing = expenses.find(e => e.id === id);
    if (!existing) return { success: false, error: 'Expense not found' };

    const updated = {
      ...existing,
      status: 'Approved',
      approvedBy: currentUser?.name || 'Super Admin',
      approvedAt: new Date().toISOString(),
      approvalNote: note || 'Approved by Administrator',
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    };

    const next = expenses.map(e => e.id === id ? updated : e);
    setExpenses(next);
    try {
      localStorage.setItem('setu_crm_expenses', JSON.stringify(next));
    } catch (e) {}

    await saveFirestoreDoc('expenses', id, updated);
    return { success: true, expense: updated };
  };

  const rejectExpense = async (id, reason = '') => {
    const existing = expenses.find(e => e.id === id);
    if (!existing) return { success: false, error: 'Expense not found' };

    const updated = {
      ...existing,
      status: 'Rejected',
      rejectedBy: currentUser?.name || 'Super Admin',
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason || 'Rejected by Administrator',
      updatedAt: new Date().toISOString()
    };

    const next = expenses.map(e => e.id === id ? updated : e);
    setExpenses(next);
    try {
      localStorage.setItem('setu_crm_expenses', JSON.stringify(next));
    } catch (e) {}

    await saveFirestoreDoc('expenses', id, updated);
    return { success: true, expense: updated };
  };

  const deleteExpense = async (id) => {
    const next = expenses.filter(e => e.id !== id);
    setExpenses(next);
    try {
      localStorage.setItem('setu_crm_expenses', JSON.stringify(next));
    } catch (e) {}

    await deleteFirestoreDoc('expenses', id);
    return { success: true };
  };

  return (
    <CRMContext.Provider value={{
      authUser,
      currentUser,
      setCurrentUser,
      authLoading,
      authError,
      setAuthError,
      login,
      logout,
      employees,
      setEmployees,
      addEmployee,
      updateEmployee,
      toggleEmployeeStatus,
      deleteEmployee,
      verifyEmployeeForSetup,
      completeEmployeePasswordSetup,
      leads,
      setLeads,
      clients,
      quotations,
      payments,
      reminders,
      whatsappLogs,
      templates,
      followUps,
      expenses,
      setExpenses,
      addExpense,
      updateExpense,
      approveExpense,
      rejectExpense,
      deleteExpense,
      isAutoApproveEligible,
      dismissedAlertIds,
      cloudSyncStatus,
      addFollowUp,
      completeFollowUp,
      rescheduleFollowUp,
      deleteFollowUp,
      dismissFollowUpAlert,
      getTodayDateString,
      addLead,
      updateLead,
      updateLeadStatus,
      deleteLead,
      convertWonLeadToClient,
      convertToClient,
      updateClient,
      deleteClient,
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
      addWhatsAppLog,
      recordCallAttempt,
      bulkAssignLeads,
      coldLeads,
      setColdLeads,
      detectPhoneDuplicate,
      addColdLead,
      bulkImportColdLeads,
      recordColdCallAttempt,
      convertColdLeadToLead,
      updateColdLead,
      deleteColdLead,
      bulkAssignColdLeads,
      toggleColdLeadDNC,
      normalizePhoneNumber,
      formatPhoneForDisplay
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => useContext(CRMContext);
