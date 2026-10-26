import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import CallLogModal from '../components/telecaller/CallLogModal';
import LeadDetailsDrawer from '../components/lead/LeadDetailsDrawer';
import { 
  PhoneCall, 
  Phone, 
  CalendarClock, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  UserCheck, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  ChevronRight, 
  TrendingUp, 
  Calendar, 
  UserPlus, 
  ShieldCheck, 
  Eye, 
  MessageSquare, 
  CheckSquare, 
  Square, 
  Activity, 
  Layers, 
  PhoneForwarded, 
  Flame, 
  Sparkles,
  Timer
} from 'lucide-react';

const Telecaller = ({ addQuoteTrigger, addPaymentTrigger }) => {
  const { 
    leads, 
    followUps, 
    getTodayDateString, 
    currentUser, 
    employees, 
    bulkAssignLeads, 
    updateLead 
  } = useCRM();

  const today = getTodayDateString();

  // Role verification: is the user a Manager or Admin?
  const isManager = 
    currentUser?.role === 'Super Admin' || 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Manager' ||
    (currentUser?.position && /admin|director|manager|lead|supervisor/i.test(currentUser.position));

  // Active top view: 'telecaller' (calling workspace) vs 'manager' (manager console)
  const [workspaceMode, setWorkspaceMode] = useState('telecaller'); // 'telecaller' | 'manager'

  // Telecaller workspace filters
  const [activeQueueTab, setActiveQueueTab] = useState('due_today'); // 'due_today' | 'overdue' | 'all_assigned' | 'history' | 'converted'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [selectedTelecallerFilter, setSelectedTelecallerFilter] = useState(
    isManager ? 'ALL' : (currentUser?.name || 'ME')
  );

  // Manager console filters
  const [managerAssignFilter, setManagerAssignFilter] = useState('Unassigned'); // 'Unassigned' | 'All' | employeeId
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [targetAssignee, setTargetAssignee] = useState('');

  // Modals / Drawers
  const [selectedLeadForCall, setSelectedLeadForCall] = useState(null);
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active employees list for assignment
  const activeStaff = useMemo(() => {
    return employees.filter(e => e.status === 'Active');
  }, [employees]);

  // Set default target assignee if not selected
  useEffectDefaultAssignee: {
    if (!targetAssignee && activeStaff.length > 0) {
      // Find someone with Telecaller or Sales in title, or first active
      const preferred = activeStaff.find(e => /telecaller|sales|executive|calling/i.test(e.position || '')) || activeStaff[0];
      if (preferred) {
        // Will be used in assign dropdown
      }
    }
  }

  // 1. Map Leads with their current follow-up status
  const leadsWithFollowUpInfo = useMemo(() => {
    return leads.map(lead => {
      const pendingFUs = followUps.filter(f => f.leadId === lead.id && f.status === 'Pending');
      // Sort to get earliest due pending follow-up
      pendingFUs.sort((a, b) => (a.dueDate + (a.dueTime || '00:00')).localeCompare(b.dueDate + (b.dueTime || '00:00')));
      const activeFU = pendingFUs[0] || null;

      let followUpState = 'none'; // 'overdue' | 'due_today' | 'upcoming' | 'none'
      let daysDiff = 0;

      if (activeFU && activeFU.dueDate) {
        if (activeFU.dueDate < today) {
          followUpState = 'overdue';
          const t1 = new Date(activeFU.dueDate).getTime();
          const t2 = new Date(today).getTime();
          daysDiff = Math.max(1, Math.round((t2 - t1) / (1000 * 3600 * 24)));
        } else if (activeFU.dueDate === today) {
          followUpState = 'due_today';
        } else {
          followUpState = 'upcoming';
        }
      }

      return {
        ...lead,
        activeFollowUp: activeFU,
        followUpState,
        overdueDays: daysDiff
      };
    });
  }, [leads, followUps, today]);

  // 2. Telecaller Queue Filtering
  const telecallerLeads = useMemo(() => {
    return leadsWithFollowUpInfo.filter(lead => {
      // Role scoping:
      // If NOT manager, strictly show only assigned leads or unassigned
      if (!isManager) {
        const isAssignedToMe = 
          lead.assignedTo === currentUser?.name || 
          lead.assignedTo === currentUser?.email || 
          (lead.assignedToId && lead.assignedToId === currentUser?.employeeId);
        if (!isAssignedToMe) return false;
      } else {
        // Manager can filter by telecaller
        if (selectedTelecallerFilter !== 'ALL') {
          if (selectedTelecallerFilter === 'ME') {
            const isAssignedToMe = lead.assignedTo === currentUser?.name;
            if (!isAssignedToMe) return false;
          } else if (selectedTelecallerFilter === 'Unassigned') {
            if (lead.assignedTo && lead.assignedTo !== 'Unassigned') return false;
          } else {
            if (lead.assignedTo !== selectedTelecallerFilter) return false;
          }
        }
      }

      // Filter by Queue Tab
      if (activeQueueTab === 'due_today') {
        if (lead.followUpState !== 'due_today') return false;
      } else if (activeQueueTab === 'overdue') {
        if (lead.followUpState !== 'overdue') return false;
      } else if (activeQueueTab === 'converted') {
        if (lead.status !== 'Won' && lead.lastCallOutcome !== 'Converted / Closed') return false;
      } else if (activeQueueTab === 'history') {
        if (!lead.callLogs || lead.callLogs.length === 0) return false;
      }

      // Status Filter
      if (statusFilter !== 'All' && lead.status !== statusFilter) return false;

      // Outcome Filter
      if (outcomeFilter !== 'All' && lead.lastCallOutcome !== outcomeFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = 
          lead.name.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          (lead.email && lead.email.toLowerCase().includes(q)) ||
          (lead.notes && lead.notes.toLowerCase().includes(q)) ||
          (lead.lastCallNotes && lead.lastCallNotes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [leadsWithFollowUpInfo, isManager, currentUser, selectedTelecallerFilter, activeQueueTab, statusFilter, outcomeFilter, search]);

  // 3. Statistics Counts for Telecaller Metrics Bar
  const stats = useMemo(() => {
    // Scoped list for counts
    const scopedList = leadsWithFollowUpInfo.filter(lead => {
      if (!isManager) {
        return (
          lead.assignedTo === currentUser?.name || 
          lead.assignedTo === currentUser?.email ||
          (lead.assignedToId && lead.assignedToId === currentUser?.employeeId)
        );
      }
      if (selectedTelecallerFilter !== 'ALL') {
        if (selectedTelecallerFilter === 'ME') return lead.assignedTo === currentUser?.name;
        if (selectedTelecallerFilter === 'Unassigned') return !lead.assignedTo || lead.assignedTo === 'Unassigned';
        return lead.assignedTo === selectedTelecallerFilter;
      }
      return true;
    });

    const totalAssigned = scopedList.length;
    const dueTodayCount = scopedList.filter(l => l.followUpState === 'due_today').length;
    const overdueCount = scopedList.filter(l => l.followUpState === 'overdue').length;
    const convertedCount = scopedList.filter(l => l.status === 'Won' || l.lastCallOutcome === 'Converted / Closed').length;

    // Calls logged today
    let callsTodayCount = 0;
    scopedList.forEach(lead => {
      if (Array.isArray(lead.callLogs)) {
        lead.callLogs.forEach(c => {
          if (c.date === today || (c.timestamp && c.timestamp.startsWith(today))) {
            callsTodayCount++;
          }
        });
      }
    });

    return {
      totalAssigned,
      dueTodayCount,
      overdueCount,
      convertedCount,
      callsTodayCount
    };
  }, [leadsWithFollowUpInfo, isManager, currentUser, selectedTelecallerFilter, today]);

  // 4. Manager Assignment List
  const managerLeadsForAssignment = useMemo(() => {
    return leads.filter(lead => {
      if (managerAssignFilter === 'Unassigned') {
        return !lead.assignedTo || lead.assignedTo === 'Unassigned' || lead.assignedTo === 'Staff';
      }
      if (managerAssignFilter !== 'All') {
        return lead.assignedTo === managerAssignFilter;
      }
      return true;
    });
  }, [leads, managerAssignFilter]);

  // Handle Bulk Assignment
  const handleBulkAssign = () => {
    if (selectedLeadIds.length === 0) {
      alert("Please select at least one lead to assign.");
      return;
    }
    if (!targetAssignee) {
      alert("Please choose a telecaller/staff member.");
      return;
    }

    const matchedStaff = activeStaff.find(e => e.name === targetAssignee);
    bulkAssignLeads(selectedLeadIds, targetAssignee, matchedStaff ? matchedStaff.id : '');
    showToast(`Assigned ${selectedLeadIds.length} lead(s) to ${targetAssignee}!`);
    setSelectedLeadIds([]);
  };

  const handleSelectAllLeads = () => {
    if (selectedLeadIds.length === managerLeadsForAssignment.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(managerLeadsForAssignment.map(l => l.id));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 5. Team Telecaller Performance Leaderboard Data (Manager View)
  const telecallerPerformance = useMemo(() => {
    return activeStaff.map(emp => {
      const empLeads = leadsWithFollowUpInfo.filter(l => l.assignedTo === emp.name || l.assignedToId === emp.id);
      
      let callsToday = 0;
      let interested = 0;
      let notInterested = 0;
      let converted = 0;

      empLeads.forEach(lead => {
        if (Array.isArray(lead.callLogs)) {
          lead.callLogs.forEach(c => {
            if (c.date === today || (c.timestamp && c.timestamp.startsWith(today))) {
              callsToday++;
              if (c.outcome === 'Connected — Interested') interested++;
              if (c.outcome === 'Connected — Not Interested') notInterested++;
              if (c.outcome === 'Converted / Closed') converted++;
            }
          });
        }
      });

      const dueToday = empLeads.filter(l => l.followUpState === 'due_today').length;
      const overdue = empLeads.filter(l => l.followUpState === 'overdue').length;
      const wonLeads = empLeads.filter(l => l.status === 'Won').length;

      return {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        assignedCount: empLeads.length,
        callsToday,
        interested,
        notInterested,
        converted,
        dueToday,
        overdue,
        wonLeads
      };
    });
  }, [activeStaff, leadsWithFollowUpInfo, today]);

  // 6. Live Team Call Stream (Manager View)
  const allTeamCallLogs = useMemo(() => {
    const list = [];
    leads.forEach(lead => {
      if (Array.isArray(lead.callLogs)) {
        lead.callLogs.forEach(c => {
          list.push({
            ...c,
            leadId: lead.id,
            leadName: lead.name,
            leadPhone: lead.phone
          });
        });
      }
    });
    // Sort newest first
    list.sort((a, b) => (b.timestamp || b.date || '').localeCompare(a.timestamp || a.date || ''));
    return list.slice(0, 50); // top 50 recent calls
  }, [leads]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Mode Switcher */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl text-white shadow-lg shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <PhoneCall className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Telecaller & Calling Workflow
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-orange-100 mt-1">
            Streamlined dialer queue, synchronized follow-ups, and live outcome tracking.
          </p>
        </div>

        {/* View Switcher for Managers / Admins */}
        {isManager && (
          <div className="flex items-center bg-black/20 p-1 rounded-2xl backdrop-blur-md self-start md:self-auto">
            <button
              onClick={() => setWorkspaceMode('telecaller')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                workspaceMode === 'telecaller'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Calling Queue</span>
            </button>

            <button
              onClick={() => setWorkspaceMode('manager')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                workspaceMode === 'manager'
                  ? 'bg-white text-orange-600 shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Manager Console</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODE 1: TELECALLER CALLING QUEUE                               */}
      {/* ============================================================== */}
      {workspaceMode === 'telecaller' && (
        <div className="space-y-5">
          
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {/* Due Today */}
            <div 
              onClick={() => setActiveQueueTab('due_today')}
              className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover-scale ${
                activeQueueTab === 'due_today'
                  ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/30 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Due Today</span>
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">{stats.dueTodayCount}</p>
              <span className="text-[10px] font-semibold text-orange-600 mt-0.5 block">Pending Follow-ups</span>
            </div>

            {/* Overdue */}
            <div 
              onClick={() => setActiveQueueTab('overdue')}
              className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover-scale ${
                activeQueueTab === 'overdue'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/30 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Overdue</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1 sm:mt-2">{stats.overdueCount}</p>
              <span className="text-[10px] font-semibold text-rose-600 mt-0.5 block">Needs Immediate Call</span>
            </div>

            {/* Calls Today */}
            <div 
              onClick={() => setActiveQueueTab('history')}
              className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover-scale ${
                activeQueueTab === 'history'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/30 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Calls Today</span>
                <PhoneCall className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">{stats.callsTodayCount}</p>
              <span className="text-[10px] font-semibold text-blue-600 mt-0.5 block">Attempts Logged</span>
            </div>

            {/* Total Assigned */}
            <div 
              onClick={() => setActiveQueueTab('all_assigned')}
              className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover-scale ${
                activeQueueTab === 'all_assigned'
                  ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/30 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Assigned Leads</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 sm:mt-2">{stats.totalAssigned}</p>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5 block">In Your Pipeline</span>
            </div>

            {/* Converted */}
            <div 
              onClick={() => setActiveQueueTab('converted')}
              className={`p-3 sm:p-4 rounded-2xl border cursor-pointer transition-all hover-scale ${
                activeQueueTab === 'converted'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30 shadow-sm'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Converted</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1 sm:mt-2">{stats.convertedCount}</p>
              <span className="text-[10px] font-semibold text-purple-600 mt-0.5 block">Won / Closed Leads</span>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search leads by name, phone, notes or call outcome..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-orange-500 transition-all text-slate-800"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Manager Telecaller Filter Dropdown */}
                {isManager && (
                  <select
                    value={selectedTelecallerFilter}
                    onChange={e => setSelectedTelecallerFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none focus:border-orange-500"
                  >
                    <option value="ALL">All Telecallers (Team)</option>
                    <option value="ME">My Assigned Leads</option>
                    <option value="Unassigned">Unassigned Leads</option>
                    {activeStaff.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
                )}

                {/* Outcome filter */}
                <select
                  value={outcomeFilter}
                  onChange={e => setOutcomeFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="All">All Call Outcomes</option>
                  <option value="Connected — Interested">Interested</option>
                  <option value="Connected — Not Interested">Not Interested</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Busy / Call Later">Busy / Call Later</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Converted / Closed">Converted / Closed</option>
                </select>

                {/* Pipeline Status Filter */}
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="All">All Pipeline Stages</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>
            </div>

            {/* Queue Mode Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 pb-1">
              {[
                { id: 'due_today', label: `Due Today (${stats.dueTodayCount})`, count: stats.dueTodayCount, color: 'text-orange-600' },
                { id: 'overdue', label: `Overdue (${stats.overdueCount})`, count: stats.overdueCount, color: 'text-rose-600' },
                { id: 'all_assigned', label: `All Assigned (${stats.totalAssigned})`, count: stats.totalAssigned },
                { id: 'history', label: `Call History (${stats.callsTodayCount} today)`, count: stats.callsTodayCount },
                { id: 'converted', label: `Converted (${stats.convertedCount})`, count: stats.convertedCount }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveQueueTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeQueueTab === tab.id
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lead List / Cards View (Mobile-First Card Layout) */}
          <div className="space-y-3">
            {telecallerLeads.length === 0 ? (
              <div className="p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No leads in this queue</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {activeQueueTab === 'due_today' 
                    ? 'No follow-up calls scheduled for today! Check Overdue or All Assigned leads.'
                    : 'No leads found matching current queue filters.'}
                </p>
                <button
                  onClick={() => {
                    setActiveQueueTab('all_assigned');
                    setStatusFilter('All');
                    setOutcomeFilter('All');
                    setSearch('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {telecallerLeads.map(lead => {
                  const isOverdue = lead.followUpState === 'overdue';
                  const isDueToday = lead.followUpState === 'due_today';
                  const hasFollowUp = lead.activeFollowUp;

                  return (
                    <div
                      key={lead.id}
                      className={`p-4 bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5 ${
                        isOverdue 
                          ? 'border-rose-300 ring-1 ring-rose-300/40 bg-gradient-to-b from-rose-50/40 to-white' 
                          : isDueToday 
                            ? 'border-orange-300 ring-1 ring-orange-300/40 bg-gradient-to-b from-orange-50/40 to-white' 
                            : 'border-slate-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 
                              onClick={() => setSelectedLeadForDrawer(lead)}
                              className="text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-orange-600 flex items-center gap-1.5"
                            >
                              <span>{lead.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                          </div>

                          {/* Follow-up / Status Badge */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                <span>Overdue ({lead.overdueDays}d)</span>
                              </span>
                            )}
                            {isDueToday && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                <Clock className="w-3 h-3" />
                                <span>Due Today</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                              {lead.status}
                            </span>
                          </div>
                        </div>

                        {/* Active Follow-up info banner if exists */}
                        {hasFollowUp && (
                          <div className={`mt-2.5 p-2 rounded-xl border text-[11px] flex items-start gap-1.5 ${
                            isOverdue ? 'bg-rose-50/90 border-rose-200 text-rose-900' : 'bg-orange-50/80 border-orange-200 text-orange-900'
                          }`}>
                            <CalendarClock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-600" />
                            <div className="min-w-0">
                              <span className="font-bold">Follow-up: </span>
                              <span className="font-mono">{hasFollowUp.dueDate} at {hasFollowUp.dueTime || '11:00'}</span>
                              {hasFollowUp.notes && (
                                <p className="truncate text-[10px] opacity-80 mt-0.5">
                                  Agenda: {hasFollowUp.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Last Call Outcome Badge */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400">Last Outcome:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.lastCallOutcome === 'Converted / Closed' ? 'bg-purple-100 text-purple-700' :
                            lead.lastCallOutcome === 'Connected — Interested' ? 'bg-emerald-100 text-emerald-700' :
                            lead.lastCallOutcome === 'Connected — Not Interested' ? 'bg-rose-100 text-rose-700' :
                            lead.lastCallOutcome ? 'bg-amber-100 text-amber-700' :
                            'text-slate-400 font-normal italic'
                          }`}>
                            {lead.lastCallOutcome || 'Never Called'}
                          </span>
                        </div>

                        {/* Assigned To Tag */}
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Assigned: <span className="font-semibold text-slate-700">{lead.assignedTo || 'Unassigned'}</span></span>
                          {lead.callLogs && lead.callLogs.length > 0 && (
                            <span className="font-mono">{lead.callLogs.length} call attempt{lead.callLogs.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons (Touch-friendly & fast) */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {/* 1. Direct Phone Call (tel:) */}
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={() => setSelectedLeadForCall(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                          title="Call Lead Phone"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>

                        {/* 2. Log Call Outcome */}
                        <button
                          onClick={() => setSelectedLeadForCall(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Log Outcome</span>
                        </button>

                        {/* 3. WhatsApp Quick Link */}
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded-xl transition-colors"
                          title="WhatsApp Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>

                        {/* 4. Full Details */}
                        <button
                          onClick={() => setSelectedLeadForDrawer(lead)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                          title="View Lead Details & Quotations"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: MANAGER CONSOLE & TEAM OVERVIEW                         */}
      {/* ============================================================== */}
      {workspaceMode === 'manager' && isManager && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          
          {/* Manager Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Leads in CRM</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{leads.length}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Entire team repository</span>
            </div>

            <div className="p-4 bg-white border border-amber-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Unassigned Leads</span>
              <p className="text-2xl font-black text-amber-600 mt-2">
                {leads.filter(l => !l.assignedTo || l.assignedTo === 'Unassigned' || l.assignedTo === 'Staff').length}
              </p>
              <span className="text-[10px] text-amber-700 mt-0.5 block">Ready for distribution below</span>
            </div>

            <div className="p-4 bg-white border border-orange-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Calls Logged Today</span>
              <p className="text-2xl font-black text-orange-600 mt-2">
                {allTeamCallLogs.filter(c => c.date === today || (c.timestamp && c.timestamp.startsWith(today))).length}
              </p>
              <span className="text-[10px] text-orange-700 mt-0.5 block">Team dialer attempts</span>
            </div>

            <div className="p-4 bg-white border border-purple-200 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Converted / Won</span>
              <p className="text-2xl font-black text-purple-700 mt-2">
                {leads.filter(l => l.status === 'Won').length}
              </p>
              <span className="text-[10px] text-purple-700 mt-0.5 block">Transformed to active clients</span>
            </div>
          </div>

          {/* Lead Assignment Tool */}
          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-orange-500" />
                  <span>Lead Assignment & Re-allocation Tool</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select unassigned or existing leads and assign them to your calling team.
                </p>
              </div>

              {/* Assignment Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={targetAssignee}
                  onChange={e => setTargetAssignee(e.target.value)}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-500 text-slate-800"
                >
                  <option value="">Select Telecaller to Assign</option>
                  {activeStaff.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.position || 'Staff'})</option>
                  ))}
                  {currentUser && !activeStaff.some(e => e.name === currentUser.name) && (
                    <option value={currentUser.name}>{currentUser.name} (Myself)</option>
                  )}
                </select>

                <button
                  onClick={handleBulkAssign}
                  disabled={selectedLeadIds.length === 0 || !targetAssignee}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 hover-scale transition-all"
                >
                  Assign Selected ({selectedLeadIds.length})
                </button>
              </div>
            </div>

            {/* Filter filter row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllLeads}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100"
                >
                  {selectedLeadIds.length === managerLeadsForAssignment.length && managerLeadsForAssignment.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All ({managerLeadsForAssignment.length})</span>
                </button>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 hidden sm:inline">Show:</span>
                  {['Unassigned', 'All'].map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        setManagerAssignFilter(f);
                        setSelectedLeadIds([]);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        managerAssignFilter === f
                          ? 'bg-orange-50 text-orange-600 border border-orange-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {selectedLeadIds.length} lead(s) selected
              </span>
            </div>

            {/* Table of leads for assignment */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Lead Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Current Assignee</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managerLeadsForAssignment.map(lead => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    return (
                      <tr 
                        key={lead.id}
                        onClick={() => toggleSelectLead(lead.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50/70' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-400"
                          />
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800">{lead.name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{lead.phone}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-slate-700 font-medium">
                            {lead.assignedTo || <span className="text-amber-600 italic">Unassigned</span>}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadForDrawer(lead);
                            }}
                            className="text-orange-600 font-bold hover:underline"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {managerLeadsForAssignment.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400">
                        No leads matching this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Telecaller Performance Leaderboard */}
          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span>Telecaller Team Performance & Conversion Metrics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of calling volume, outcomes, and conversions per team member.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Telecaller / Staff</th>
                    <th className="py-3 px-4">Role / Title</th>
                    <th className="py-3 px-4 text-center">Assigned Leads</th>
                    <th className="py-3 px-4 text-center">Calls Today</th>
                    <th className="py-3 px-4 text-center">Interested</th>
                    <th className="py-3 px-4 text-center">Due Today</th>
                    <th className="py-3 px-4 text-center">Overdue</th>
                    <th className="py-3 px-4 text-center">Won / Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {telecallerPerformance.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{emp.position || 'Staff'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{emp.assignedCount}</td>
                      <td className="py-3 px-4 text-center font-black text-blue-600">{emp.callsToday}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{emp.interested}</td>
                      <td className="py-3 px-4 text-center font-bold text-orange-600">{emp.dueToday}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{emp.overdue}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">
                          {emp.wonLeads}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {telecallerPerformance.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-slate-400">
                        No active employees registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Team Call Activity Feed */}
          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>Live Team Call Activity Stream</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent call attempts recorded across the organization.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {allTeamCallLogs.length} total logs
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allTeamCallLogs.map(log => (
                <div 
                  key={log.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{log.leadName}</span>
                      <span className="text-[10px] font-mono text-slate-400">({log.leadPhone})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.outcome?.includes('Interested') ? 'bg-emerald-100 text-emerald-800' :
                        log.outcome?.includes('Converted') ? 'bg-purple-100 text-purple-800' :
                        log.outcome?.includes('Not') ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {log.outcome}
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
                    {log.duration && (
                      <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                        {log.duration}
                      </span>
                    )}
                    <span>by <span className="font-semibold text-slate-700">{log.callerName || 'Staff'}</span></span>
                    <span className="font-mono text-[10px] text-slate-400">{log.timestamp || log.date}</span>
                  </div>
                </div>
              ))}

              {allTeamCallLogs.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No call activities recorded across the team yet.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-white/95 border border-orange-200 shadow-xl shadow-orange-500/15 rounded-2xl text-slate-800 text-xs font-semibold backdrop-blur-md animate-[slideUp_0.25s_ease-out]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Call Log Modal */}
      {selectedLeadForCall && (
        <CallLogModal
          isOpen={!!selectedLeadForCall}
          onClose={() => setSelectedLeadForCall(null)}
          lead={selectedLeadForCall}
          onSuccess={() => {
            showToast(`Call outcome saved for ${selectedLeadForCall.name}!`);
          }}
        />
      )}

      {/* Lead Details Drawer */}
      {selectedLeadForDrawer && (
        <LeadDetailsDrawer
          isOpen={!!selectedLeadForDrawer}
          onClose={() => setSelectedLeadForDrawer(null)}
          lead={selectedLeadForDrawer}
          onAddQuoteForLead={addQuoteTrigger}
          onAddPaymentForLead={(id, ctx) => addPaymentTrigger(id, ctx || { lead: selectedLeadForDrawer })}
        />
      )}

    </div>
  );
};

export default Telecaller;
