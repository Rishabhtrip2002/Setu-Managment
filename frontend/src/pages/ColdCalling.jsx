import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import ColdLeadFormModal from '../components/coldcalling/ColdLeadFormModal';
import ColdBulkImportModal from '../components/coldcalling/ColdBulkImportModal';
import ConvertColdLeadModal from '../components/coldcalling/ConvertColdLeadModal';
import ColdLeadDetailsDrawer from '../components/coldcalling/ColdLeadDetailsDrawer';
import CallLogModal from '../components/telecaller/CallLogModal';
import { 
  PhoneCall, 
  Phone, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  UserCheck, 
  Users, 
  Clock, 
  Calendar, 
  CalendarClock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Eye, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  CheckSquare, 
  Square,
  Building,
  RefreshCw,
  PhoneForwarded,
  Layers,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

const OUTCOME_BADGES = {
  'Interested': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Connected — Interested': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Follow-up Required': 'bg-teal-50 text-teal-800 border-teal-200',
  'Follow-up Due': 'bg-teal-50 text-teal-800 border-teal-200',
  'No Answer': 'bg-amber-50 text-amber-800 border-amber-200',
  'Busy / Call Later': 'bg-blue-50 text-blue-800 border-blue-200',
  'Not Interested': 'bg-rose-50 text-rose-800 border-rose-200',
  'Connected — Not Interested': 'bg-rose-50 text-rose-800 border-rose-200',
  'Wrong Number': 'bg-slate-100 text-slate-700 border-slate-300',
  'Converted': 'bg-purple-50 text-purple-800 border-purple-200',
  'Converted / Closed': 'bg-purple-50 text-purple-800 border-purple-200',
  'Do Not Call': 'bg-red-100 text-red-900 border-red-300',
  'Called': 'bg-blue-50 text-blue-800 border-blue-200',
  'Assigned': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Unassigned': 'bg-amber-50 text-amber-800 border-amber-200',
  'Closed': 'bg-slate-100 text-slate-700 border-slate-300'
};

const ITEMS_PER_PAGE = 25;

const ColdCalling = () => {
  const { 
    coldLeads, 
    followUps, 
    currentUser, 
    employees, 
    bulkAssignColdLeads, 
    formatDateDMY, 
    getTodayDateString 
  } = useCRM();

  const today = getTodayDateString();

  // Role check: Admin or Manager can reassign & view all records
  const isManager = 
    currentUser?.role === 'Super Admin' || 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Manager' ||
    (currentUser?.position && /admin|director|manager|lead|supervisor/i.test(currentUser.position));

  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedForCall, setSelectedForCall] = useState(null);
  const [selectedForConvert, setSelectedForConvert] = useState(null);
  const [selectedForDrawer, setSelectedForDrawer] = useState(null);
  const [editingColdLead, setEditingColdLead] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState('unassigned'); 
  // 'unassigned' | 'my_leads' | 'all' | 'followup_due' | 'called' | 'converted' | 'dnc'
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState('ALL');

  // Multi-select bulk assignment
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetAssigneeId, setTargetAssigneeId] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const activeStaff = useMemo(() => {
    return (employees || []).filter(e => e.status === 'Active');
  }, [employees]);

  // Extract unique categories for filter
  const uniqueCategories = useMemo(() => {
    const set = new Set();
    (coldLeads || []).forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [coldLeads]);

  // Summary Counts
  const counts = useMemo(() => {
    const myId = currentUser?.employeeId || currentUser?.uid;
    const myName = currentUser?.name;

    let unassigned = 0;
    let myLeads = 0;
    let followupDue = 0;
    let called = 0;
    let converted = 0;
    let dnc = 0;

    (coldLeads || []).forEach(c => {
      if (!c.assignedToId && c.status !== 'Converted' && !c.isDNC) {
        unassigned++;
      }
      if ((c.assignedToId === myId || c.assignedToName === myName) && c.status !== 'Converted') {
        myLeads++;
      }
      if (c.status === 'Follow-up Due' || (c.lastCallOutcome === 'Follow-up Required' && c.status !== 'Converted')) {
        followupDue++;
      }
      if (c.callCount > 0 && c.status !== 'Converted' && !c.isDNC) {
        called++;
      }
      if (c.status === 'Converted') {
        converted++;
      }
      if (c.isDNC) {
        dnc++;
      }
    });

    return {
      total: (coldLeads || []).length,
      unassigned,
      myLeads,
      followupDue,
      called,
      converted,
      dnc
    };
  }, [coldLeads, currentUser]);

  // Filtered cold leads
  const filteredColdLeads = useMemo(() => {
    const myId = currentUser?.employeeId || currentUser?.uid;
    const myName = currentUser?.name;
    const q = search.trim().toLowerCase();

    return (coldLeads || []).filter(c => {
      // 1. Tab filter
      if (activeTab === 'unassigned') {
        if (c.assignedToId || c.status === 'Converted' || c.isDNC) return false;
      } else if (activeTab === 'my_leads') {
        const isMine = c.assignedToId === myId || c.assignedToName === myName;
        if (!isMine) return false;
      } else if (activeTab === 'followup_due') {
        if (c.status !== 'Follow-up Due' && c.lastCallOutcome !== 'Follow-up Required') return false;
      } else if (activeTab === 'called') {
        if (!c.callCount || c.callCount === 0 || c.status === 'Converted') return false;
      } else if (activeTab === 'converted') {
        if (c.status !== 'Converted') return false;
      } else if (activeTab === 'dnc') {
        if (!c.isDNC && c.status !== 'Do Not Call') return false;
      }

      // 2. Telecaller filter for Manager
      if (isManager && selectedOwnerFilter !== 'ALL') {
        if (selectedOwnerFilter === 'UNASSIGNED') {
          if (c.assignedToId) return false;
        } else {
          if (c.assignedToId !== selectedOwnerFilter) return false;
        }
      }

      // 3. Category filter
      if (categoryFilter !== 'All') {
        if (c.category !== categoryFilter) return false;
      }

      // 4. Search query (matches name, phone, company, city, notes)
      if (q) {
        const matchName = c.name?.toLowerCase().includes(q);
        const matchPhone = c.phone?.includes(q) || c.normalizedPhone?.includes(q);
        const matchCompany = c.company?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        const matchNotes = c.notes?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCompany && !matchCity && !matchNotes) return false;
      }

      return true;
    });
  }, [coldLeads, activeTab, search, categoryFilter, selectedOwnerFilter, isManager, currentUser]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredColdLeads.length / ITEMS_PER_PAGE));
  const paginatedColdLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredColdLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredColdLeads, currentPage]);

  // Multi-select handlers
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedColdLeads.map(c => c.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    if (selectedIds.length === 0) {
      showToast('Please select records to assign.', 'error');
      return;
    }
    const targetEmp = activeStaff.find(s => s.id === targetAssigneeId);
    bulkAssignColdLeads(
      selectedIds, 
      targetEmp ? targetEmp.id : null, 
      targetEmp ? targetEmp.name : null
    );
    showToast(`Successfully assigned ${selectedIds.length} records to ${targetEmp ? targetEmp.name : 'Unassigned Pool'}.`);
    setSelectedIds([]);
  };

  const handleCallSuccess = (callEntry, updatedColdLead) => {
    showToast(`Call logged successfully: "${callEntry.outcome}"! Assigned to your list.`);
    // If drawer is open, refresh entity
    if (selectedForDrawer?.id === updatedColdLead?.id) {
      setSelectedForDrawer(updatedColdLead);
    }
  };

  const handleConvertSuccess = (newLead) => {
    showToast(`Prospect promoted to active Lead: "${newLead.name}" (ID: ${newLead.id})!`);
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-[slideUp_0.25s_ease-out] ${
          toast.type === 'error' 
            ? 'bg-rose-50 text-rose-900 border-rose-300' 
            : 'bg-emerald-50 text-emerald-950 border-emerald-300'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* 1. Header & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-xs">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Cold Calling & Outreach
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Shared unassigned pool, 1-click calling, auto-assignment & lead promotion
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setBulkImportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-orange-500" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingColdLead(null);
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Record</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => { setActiveTab('unassigned'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'unassigned' 
              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20' 
              : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'unassigned' ? 'text-amber-100' : 'text-slate-500'}`}>
              Shared Pool
            </span>
            <Users className={`w-4 h-4 ${activeTab === 'unassigned' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1">{counts.unassigned}</p>
          <p className={`text-[10px] mt-0.5 truncate ${activeTab === 'unassigned' ? 'text-amber-100' : 'text-slate-400'}`}>
            Ready to claim via call
          </p>
        </div>

        <div 
          onClick={() => { setActiveTab('my_leads'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'my_leads' 
              ? 'bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-500/20' 
              : 'bg-white border-slate-200 hover:border-orange-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'my_leads' ? 'text-orange-100' : 'text-slate-500'}`}>
              Assigned to Me
            </span>
            <UserCheck className={`w-4 h-4 ${activeTab === 'my_leads' ? 'text-white' : 'text-orange-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1">{counts.myLeads}</p>
          <p className={`text-[10px] mt-0.5 truncate ${activeTab === 'my_leads' ? 'text-orange-100' : 'text-slate-400'}`}>
            My claimed prospects
          </p>
        </div>

        <div 
          onClick={() => { setActiveTab('followup_due'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'followup_due' 
              ? 'bg-teal-600 text-white border-teal-700 shadow-md ring-2 ring-teal-500/20' 
              : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'followup_due' ? 'text-teal-100' : 'text-slate-500'}`}>
              Follow-up Due
            </span>
            <CalendarClock className={`w-4 h-4 ${activeTab === 'followup_due' ? 'text-white' : 'text-teal-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1">{counts.followupDue}</p>
          <p className={`text-[10px] mt-0.5 truncate ${activeTab === 'followup_due' ? 'text-teal-100' : 'text-slate-400'}`}>
            Callbacks scheduled
          </p>
        </div>

        <div 
          onClick={() => { setActiveTab('called'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'called' 
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-500/20' 
              : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'called' ? 'text-blue-100' : 'text-slate-500'}`}>
              Called Records
            </span>
            <PhoneForwarded className={`w-4 h-4 ${activeTab === 'called' ? 'text-white' : 'text-blue-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1">{counts.called}</p>
          <p className={`text-[10px] mt-0.5 truncate ${activeTab === 'called' ? 'text-blue-100' : 'text-slate-400'}`}>
            At least 1 call logged
          </p>
        </div>

        <div 
          onClick={() => { setActiveTab('converted'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'converted' 
              ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-500/20' 
              : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'converted' ? 'text-purple-100' : 'text-slate-500'}`}>
              Converted
            </span>
            <Sparkles className={`w-4 h-4 ${activeTab === 'converted' ? 'text-white' : 'text-purple-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1">{counts.converted}</p>
          <p className={`text-[10px] mt-0.5 truncate ${activeTab === 'converted' ? 'text-purple-100' : 'text-slate-400'}`}>
            Promoted to regular leads
          </p>
        </div>

        <div 
          onClick={() => { setActiveTab('dnc'); setCurrentPage(1); }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'dnc' 
              ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-500/20' 
              : 'bg-white border-slate-200 hover:border-red-300 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${activeTab === 'dnc' ? 'text-red-100' : 'text-slate-500'}`}>
              Do Not Call
            </span>
            <ShieldAlert className={`w-4 h-4 ${activeTab === 'dnc' ? 'text-white' : 'text-red-500'}`} />
          </div>
          <p className="text-2xl font-bold mt-1">{counts.dnc}</p>
          <p className={`text-[10px] mt-0.5 truncate ${activeTab === 'dnc' ? 'text-red-100' : 'text-slate-400'}`}>
            Opted-out numbers
          </p>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Controls */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {[
            { id: 'unassigned', label: 'Unassigned Pool', count: counts.unassigned },
            { id: 'my_leads', label: 'Assigned to Me', count: counts.myLeads },
            { id: 'followup_due', label: 'Follow-up Due', count: counts.followupDue },
            { id: 'called', label: 'Called', count: counts.called },
            { id: 'all', label: 'All Records', count: counts.total },
            { id: 'converted', label: 'Converted', count: counts.converted },
            { id: 'dnc', label: 'Do Not Call', count: counts.dnc },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-orange-200/60 text-orange-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Dropdown Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, company, city, or note..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-800 outline-none transition-all placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter */}
            {uniqueCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-orange-500"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}

            {/* Manager Telecaller Filter */}
            {isManager && (
              <select
                value={selectedOwnerFilter}
                onChange={e => {
                  setSelectedOwnerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-orange-500"
              >
                <option value="ALL">All Assignees</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {activeStaff.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.position || emp.role})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Manager Multi-Select Assignment Action Bar */}
        {isManager && selectedIds.length > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-2 font-bold text-orange-950">
              <CheckSquare className="w-4 h-4 text-orange-600" />
              <span>{selectedIds.length} records selected</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={targetAssigneeId}
                onChange={e => setTargetAssigneeId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-orange-300 rounded-xl text-slate-800 text-xs outline-none"
              >
                <option value="">— Assign to Unassigned Pool —</option>
                {activeStaff.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    Assign to {emp.name} ({emp.position || emp.role})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkAssign}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Apply Assignment
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900"
              >
                Clear
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 4. Table / Cards View */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {paginatedColdLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-orange-50 border border-orange-100 text-orange-500 mx-auto flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Cold Calling Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search 
                ? 'No prospects match your current search query or filter.' 
                : activeTab === 'unassigned'
                  ? 'Great job! The shared unassigned pool is currently empty. Add new records or import via CSV to replenish.'
                  : 'No records in this tab. Switch tabs or add records to begin outreach.'
              }
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                + Add First Record
              </button>
              <button
                type="button"
                onClick={() => setBulkImportOpen(true)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
              >
                Import CSV
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    {isManager && (
                      <th className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={paginatedColdLeads.length > 0 && paginatedColdLeads.every(c => selectedIds.includes(c.id))}
                          onChange={handleSelectAllOnPage}
                          className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Contact Prospect</th>
                    <th className="px-4 py-3">Phone & Location</th>
                    <th className="px-4 py-3">Ownership</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Call Outcome</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedColdLeads.map(lead => {
                    const isSelected = selectedIds.includes(lead.id);
                    const isClaimedByMe = lead.assignedToId === (currentUser?.employeeId || currentUser?.uid);
                    
                    return (
                      <tr 
                        key={lead.id} 
                        className={`hover:bg-orange-50/40 transition-colors ${
                          isSelected ? 'bg-orange-50/60' : ''
                        }`}
                      >
                        {isManager && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(lead.id)}
                              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                          </td>
                        )}

                        {/* Contact Name & Company */}
                        <td className="px-4 py-3">
                          <div 
                            onClick={() => setSelectedForDrawer(lead)}
                            className="cursor-pointer group"
                          >
                            <p className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                              {lead.name}
                            </p>
                            {lead.company && (
                              <p className="text-[11px] text-slate-500 font-medium">
                                {lead.company}
                              </p>
                            )}
                            <span className="text-[10px] text-slate-400">
                              {lead.category || 'General'}
                            </span>
                          </div>
                        </td>

                        {/* Phone & Location */}
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{lead.phone}</span>
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Start phone call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          {(lead.city || lead.state) && (
                            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                              {[lead.city, lead.state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </td>

                        {/* Ownership */}
                        <td className="px-4 py-3">
                          {lead.assignedToId ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-[10px] flex items-center justify-center">
                                {(lead.assignedToName || 'U').charAt(0)}
                              </div>
                              <div className="truncate max-w-[120px]">
                                <p className="font-semibold text-slate-800 truncate">
                                  {isClaimedByMe ? 'You' : lead.assignedToName}
                                </p>
                                <span className="text-[10px] text-slate-400">Claimed</span>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Shared Pool</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            OUTCOME_BADGES[lead.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {lead.status}
                          </span>
                          {lead.isDNC && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 border border-red-300">
                              DNC
                            </span>
                          )}
                        </td>

                        {/* Last Call Outcome */}
                        <td className="px-4 py-3">
                          {lead.lastCallOutcome ? (
                            <div>
                              <p className="font-semibold text-slate-800 text-[11px]">
                                {lead.lastCallOutcome}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {formatDateDMY(lead.lastCallDate)} by {lead.lastCallerName || 'Telecaller'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Never called</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedForCall(lead)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                              title="Dial phone & log call result"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>{lead.assignedToId ? 'Call' : 'Claim & Call'}</span>
                            </button>

                            {lead.status !== 'Converted' ? (
                              <button
                                type="button"
                                onClick={() => setSelectedForConvert(lead)}
                                className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                                title="Promote to active Lead"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-bold">
                                Converted
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedForDrawer(lead)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              title="View details & timeline"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (No horizontal scrolling on phones) */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedColdLeads.map(lead => (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div onClick={() => setSelectedForDrawer(lead)} className="cursor-pointer">
                      <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                      {lead.company && (
                        <p className="text-xs text-slate-500 font-medium">{lead.company}</p>
                      )}
                      <p className="text-xs font-mono text-orange-600 font-bold mt-0.5">
                        {lead.phone}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        OUTCOME_BADGES[lead.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {lead.status}
                      </span>
                      {lead.isDNC && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-800">
                          DNC
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ownership & Last Call Note */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div>
                      {lead.assignedToId ? (
                        <span>Owner: <strong>{lead.assignedToName}</strong></span>
                      ) : (
                        <span className="text-amber-700 font-bold">Shared Pool</span>
                      )}
                    </div>
                    <div>
                      {lead.callCount > 0 ? (
                        <span>{lead.callCount} calls recorded</span>
                      ) : (
                        <span className="text-slate-400">Uncalled</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Quick Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedForCall(lead)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 active:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{lead.assignedToId ? 'Call' : 'Claim & Call'}</span>
                    </button>

                    {lead.status !== 'Converted' && (
                      <button
                        type="button"
                        onClick={() => setSelectedForConvert(lead)}
                        className="px-3 py-2.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold"
                        title="Promote to regular Lead"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedForDrawer(lead)}
                      className="p-2.5 border border-slate-200 text-slate-600 rounded-xl"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredColdLeads.length)}</strong> of{' '}
                <strong>{filteredColdLeads.length}</strong> records
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="px-2 font-mono font-bold text-slate-800">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {/* 5. Modals & Drawers Integration */}
      <ColdLeadFormModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setEditingColdLead(null);
        }}
        coldLeadToEdit={editingColdLead}
        onSuccess={(savedRecord) => {
          showToast(editingColdLead ? 'Cold calling record updated!' : 'Cold record added to pool!');
        }}
      />

      <ColdBulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={({ imported, duplicatesSkipped, errorsCount }) => {
          showToast(`Bulk imported ${imported} prospects! (${duplicatesSkipped} duplicates skipped, ${errorsCount} errors).`);
        }}
      />

      <CallLogModal
        isOpen={!!selectedForCall}
        onClose={() => setSelectedForCall(null)}
        coldLead={selectedForCall}
        onSuccess={handleCallSuccess}
      />

      <ConvertColdLeadModal
        isOpen={!!selectedForConvert}
        onClose={() => setSelectedForConvert(null)}
        coldLead={selectedForConvert}
        onSuccess={handleConvertSuccess}
      />

      <ColdLeadDetailsDrawer
        isOpen={!!selectedForDrawer}
        onClose={() => setSelectedForDrawer(null)}
        coldLead={selectedForDrawer}
        onOpenCallModal={(cLead) => setSelectedForCall(cLead)}
        onOpenConvertModal={(cLead) => setSelectedForConvert(cLead)}
        onOpenEditModal={(cLead) => {
          setEditingColdLead(cLead);
          setAddModalOpen(true);
        }}
      />

    </div>
  );
};

export default ColdCalling;
