import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useCRM } from '../context/CRMContext';
import LeadFormModal from '../components/lead/LeadFormModal';
import LeadDetailsDrawer from '../components/lead/LeadDetailsDrawer';
import FollowUpModal from '../components/followup/FollowUpModal';
import CallLogModal from '../components/telecaller/CallLogModal';
import {
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Trash2,
  ArrowDown,
  CheckCircle2,
  CalendarClock,
  Phone,
  PhoneCall,
  GripVertical
} from 'lucide-react';

const Leads = ({ addQuoteTrigger, addPaymentTrigger }) => {
  const { leads, updateLeadStatus, deleteLead, currentUser, followUps, getTodayDateString } = useCRM();

  const [viewMode, setViewMode] = useState('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileActiveStage, setMobileActiveStage] = useState('All');

  const [formOpen, setFormOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [callLogLead, setCallLogLead] = useState(null);

  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const isDraggingRef = useRef(false);
  const [toast, setToast] = useState(null);

  const stages = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
  const today = getTodayDateString();

  const showToast = useCallback((message) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3500);
  }, []);

  // Client-side filtering & sorting via useMemo (Task 6: no DB re-reads on filter change)
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads
      .filter(lead => {
        if (q) {
          const matchSearch = lead.name.toLowerCase().includes(q) ||
                              lead.phone.includes(q) ||
                              (lead.email && lead.email.toLowerCase().includes(q)) ||
                              (lead.notes && lead.notes.toLowerCase().includes(q));
          if (!matchSearch) return false;
        }
        if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
        if (sourceFilter !== 'All' && lead.source !== sourceFilter) return false;
        if (mobileActiveStage !== 'All' && lead.status !== mobileActiveStage) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdDate) - new Date(a.createdDate);
        if (sortBy === 'oldest') return new Date(a.createdDate) - new Date(b.createdDate);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [leads, search, statusFilter, sourceFilter, sortBy, mobileActiveStage]);

  // Unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set();
    leads.forEach(l => { if (l.source) set.add(l.source); });
    return Array.from(set);
  }, [leads]);

  const handleDelete = (e, leadId) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this lead?")) {
      const success = deleteLead(leadId);
      if (!success) {
        alert("Action Denied: Staff roles do not have permission to delete records.");
      }
    }
  };

  const handleOpenEdit = (e, lead) => {
    e.stopPropagation();
    setLeadToEdit(lead);
    setFormOpen(true);
  };

  const handleOpenDrawer = (lead) => {
    if (isDraggingRef.current) return;
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const handleAddLeadClick = () => {
    setLeadToEdit(null);
    setFormOpen(true);
  };

  // Drag & Drop
  const handleDragStart = (e, lead) => {
    isDraggingRef.current = true;
    setDraggedLead(lead);
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
    setTimeout(() => { isDraggingRef.current = false; }, 100);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) setDragOverStage(stage);
  };

  const handleDragEnter = (e, stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = (e, stage) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverStage === stage) setDragOverStage(null);
    }
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLead?.id;
    setDragOverStage(null);
    setDraggedLead(null);
    setTimeout(() => { isDraggingRef.current = false; }, 100);

    if (!leadId) return;
    const currentLead = leads.find(l => l.id === leadId);
    if (!currentLead) return;

    // Task 6: Only write to DB if status actually changed
    if (currentLead.status === targetStage) return;

    updateLeadStatus(leadId, targetStage);

    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: targetStage }));
    }

    showToast(`Lead "${currentLead.name}" moved to ${targetStage.toUpperCase()}`);
  };

  const getStatusColor = (status) => {
    const map = {
      'New': 'border-t-4 border-blue-500',
      'Contacted': 'border-t-4 border-amber-500',
      'Quoted': 'border-t-4 border-purple-500',
      'Negotiation': 'border-t-4 border-indigo-500',
      'Won': 'border-t-4 border-orange-500',
      'Lost': 'border-t-4 border-rose-500'
    };
    return map[status] || 'border-t-4 border-slate-400';
  };

  const getStageHighlightClass = (stage) => {
    if (dragOverStage !== stage) return 'bg-slate-100/70 border-slate-200/90 shadow-xs';
    const map = {
      'New': 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      'Contacted': 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      'Quoted': 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      'Negotiation': 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]',
      'Won': 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.2)]',
      'Lost': 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
    };
    return map[stage] || 'bg-slate-100 border-slate-300 ring-2 ring-slate-300';
  };

  const getSourceBadge = (source) => {
    if (source === 'Cold Call' || source === 'Cold Calling') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (source === 'Direct Lead' || source === 'Website') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (source === 'Referral') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-4">

      {/* Top Filter Bar — responsive flex-wrap, no "Drag cards" pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-orange-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {stages.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
          <select
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-orange-500"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="All">All Sources</option>
            {uniqueSources.map(src => <option key={src} value={src}>{src}</option>)}
          </select>
          <select
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-orange-500"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* View toggle + Add button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'board' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleAddLeadClick}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Mobile Stage Tabs */}
      <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setMobileActiveStage('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mobileActiveStage === 'All' ? 'bg-orange-500 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          All ({leads.length})
        </button>
        {stages.map(st => {
          const count = leads.filter(l => l.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setMobileActiveStage(st)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                mobileActiveStage === st ? 'bg-orange-500 text-white font-bold shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <span>{st}</span>
              <span className={`text-[10px] px-1.5 rounded-full ${mobileActiveStage === st ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
          {stages
            .filter(st => mobileActiveStage === 'All' || mobileActiveStage === st)
            .map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage);
            const isHoveredStage = dragOverStage === stage;
            const isDifferentStageFromDragged = draggedLead && draggedLead.status !== stage;

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragEnter={(e) => handleDragEnter(e, stage)}
                onDragLeave={(e) => handleDragLeave(e, stage)}
                onDrop={(e) => handleDrop(e, stage)}
                className={`flex flex-col border rounded-2xl p-3 min-h-[320px] xl:min-h-[520px] min-w-[300px] w-[300px] flex-shrink-0 xl:min-w-0 xl:w-auto xl:flex-shrink xl:flex-1 snap-start transition-all duration-200 ${getStageHighlightClass(stage)}`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{stage}</span>
                    {isHoveredStage && isDifferentStageFromDragged && (
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-300 animate-pulse">
                        Drop
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                    isHoveredStage && isDifferentStageFromDragged
                      ? 'text-orange-700 bg-orange-100 border border-orange-300'
                      : 'text-slate-600 bg-white border border-slate-200 shadow-xs'
                  }`}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[460px] xl:max-h-[70vh]">
                  {stageLeads.map(lead => {
                    const isBeingDragged = draggedLead?.id === lead.id;
                    const leadPendingFollowUp = followUps.find(f => f.leadId === lead.id && f.status === 'Pending');

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleOpenDrawer(lead)}
                        className={`group relative w-full overflow-hidden box-border p-3.5 bg-white hover:bg-slate-50 border rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-orange-400 ring-2 ring-orange-400/40'
                            : 'border-slate-200/80 hover:border-slate-300 shadow-xs hover-scale'
                        } ${getStatusColor(lead.status)}`}
                      >
                        {/* Row 1: Name + Lead ID */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 shrink-0 transition-colors" />
                            <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                              {lead.name}
                            </h4>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">{lead.id}</span>
                        </div>

                        {/* Row 2: Phone + Source badge */}
                        <div className="flex items-center justify-between gap-2 mt-1.5 pl-5">
                          <span className="text-[11px] text-slate-500 font-mono truncate">{lead.phone}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${getSourceBadge(lead.source)}`}>
                            {lead.source === 'Cold Calling' ? 'Cold Call' : lead.source}
                          </span>
                        </div>

                        {/* Row 3: Notes preview */}
                        {lead.notes && (
                          <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 pl-5 leading-relaxed">
                            {lead.notes}
                          </p>
                        )}

                        {/* Row 4: Footer — follow-up left, actions right */}
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 pl-5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {leadPendingFollowUp ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-semibold truncate">
                                <CalendarClock className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="truncate">
                                  {leadPendingFollowUp.dueDate <= today ? `Due ${leadPendingFollowUp.dueTime || 'Today'}` : leadPendingFollowUp.dueDate}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400">{lead.assignedTo || ''}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); setCallLogLead(lead); }}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Log Call"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setFollowUpLead(lead); }}
                              className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Schedule Follow-up"
                            >
                              <CalendarClock className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleOpenEdit(e, lead)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                            </button>
                            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                              <button
                                onClick={(e) => handleDelete(e, lead.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Drop zone hint when dragging over a column with cards */}
                  {stageLeads.length > 0 && isHoveredStage && isDifferentStageFromDragged && (
                    <div className="border-2 border-dashed border-orange-400 bg-orange-50/90 rounded-xl p-3 text-center text-xs text-orange-700 font-semibold flex items-center justify-center gap-2 animate-pulse">
                      <ArrowDown className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                      <span>Drop here to move to {stage}</span>
                    </div>
                  )}

                  {/* Task 2: Empty column — minimal dashed placeholder */}
                  {stageLeads.length === 0 && (
                    isHoveredStage && isDifferentStageFromDragged ? (
                      <div className="h-28 border-2 border-dashed border-orange-400 bg-orange-50 rounded-xl flex flex-col items-center justify-center gap-2 text-xs text-orange-700 font-semibold animate-pulse transition-all">
                        <ArrowDown className="w-4 h-4 text-orange-500 animate-bounce" />
                        <span>Drop here for {stage}</span>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center">
                        <p className="text-xs text-gray-400">No leads</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-hidden border border-slate-200 bg-white shadow-sm rounded-2xl">
          {/* Mobile Card List View (phones below md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredLeads.map(lead => {
              const leadPendingFollowUp = followUps.find(f => f.leadId === lead.id && f.status === 'Pending');

              return (
                <div 
                  key={lead.id}
                  onClick={() => handleOpenDrawer(lead)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {lead.id}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${getSourceBadge(lead.source)}`}>
                          {lead.source === 'Cold Calling' ? 'Cold Call' : lead.source}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{lead.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                    </div>

                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.value !== lead.status) {
                          updateLeadStatus(lead.id, e.target.value);
                          showToast(`Status updated to ${e.target.value}`);
                        }
                      }}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                        lead.status === 'Won' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        lead.status === 'Lost' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        lead.status === 'Quoted' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                        lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        lead.status === 'Negotiation' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                        'bg-blue-50 text-blue-600 border-blue-200'
                      }`}
                    >
                      {stages.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>

                  {/* Info Row: Assigned & Follow-up */}
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="truncate max-w-[150px]">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned To</span>
                      <span className="font-semibold text-slate-800 truncate">{lead.assignedTo || 'Unassigned'}</span>
                    </div>

                    <div>
                      {leadPendingFollowUp ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          <CalendarClock className="w-3 h-3 text-orange-500" />
                          <span>{leadPendingFollowUp.dueDate}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setFollowUpLead(lead); }}
                          className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Follow-up</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400">Tap card to view full timeline</span>

                    <div className="flex items-center gap-1">
                      <a 
                        href={`tel:${lead.phone}`} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors" 
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setCallLogLead(lead); }} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" 
                        title="Log Call"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFollowUpLead(lead); }} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors" 
                        title="Schedule"
                      >
                        <CalendarClock className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleOpenEdit(e, lead)} 
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" 
                        title="Edit"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                        <button 
                          onClick={(e) => handleDelete(e, lead.id)} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredLeads.length === 0 && (
              <div className="text-center py-10 px-4 text-slate-400 text-xs">
                No matching leads found.
              </div>
            )}
          </div>

          {/* Desktop Table View (screens md and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Lead ID</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Follow-up</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.map(lead => {
                  const leadPendingFollowUp = followUps.find(f => f.leadId === lead.id && f.status === 'Pending');

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => handleOpenDrawer(lead)}
                      className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-slate-500">{lead.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors text-sm">{lead.name}</div>
                          <div className="text-slate-500 mt-0.5">{lead.phone} • {lead.email || 'No Email'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSourceBadge(lead.source)}`}>
                          {lead.source === 'Cold Calling' ? 'Cold Call' : lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{lead.assignedTo}</td>
                      <td className="px-6 py-4">
                        {leadPendingFollowUp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                            <CalendarClock className="w-3 h-3 text-orange-500" />
                            <span>{leadPendingFollowUp.dueDate}</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setFollowUpLead(lead); }}
                            className="text-[11px] text-slate-400 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Set Follow-up</span>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.value !== lead.status) {
                              updateLeadStatus(lead.id, e.target.value);
                              showToast(`Status updated to ${e.target.value}`);
                            }
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                            lead.status === 'Won' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            lead.status === 'Lost' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            lead.status === 'Quoted' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                            lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            lead.status === 'Negotiation' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}
                        >
                          {stages.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); setCallLogLead(lead); }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Log Call"><PhoneCall className="w-4 h-4" /></button>
                          <button onClick={(e) => { e.stopPropagation(); setFollowUpLead(lead); }} className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Schedule"><CalendarClock className="w-4 h-4" /></button>
                          <a href={`tel:${lead.phone}`} className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Call"><Phone className="w-4 h-4" /></a>
                          <button onClick={(e) => handleOpenEdit(e, lead)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Edit"><SlidersHorizontal className="w-4 h-4" /></button>
                          {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                            <button onClick={(e) => handleDelete(e, lead.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 bg-slate-50/50">
                      No matching leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <LeadFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} leadToEdit={leadToEdit} />
      <LeadDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lead={selectedLead}
        onAddQuoteForLead={(id, type) => { setDrawerOpen(false); addQuoteTrigger(id, type); }}
        onAddPaymentForLead={(clientId, context) => { setDrawerOpen(false); addPaymentTrigger(clientId, context || { lead: selectedLead }); }}
      />
      {followUpLead && <FollowUpModal isOpen={!!followUpLead} onClose={() => setFollowUpLead(null)} lead={followUpLead} />}
      {callLogLead && (
        <CallLogModal
          isOpen={!!callLogLead}
          onClose={() => setCallLogLead(null)}
          lead={callLogLead}
          onSuccess={() => showToast(`Call outcome saved for ${callLogLead.name}!`)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white/95 border border-orange-200 shadow-xl shadow-orange-500/10 rounded-2xl text-slate-800 text-xs font-semibold backdrop-blur-md transition-all">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Leads;
