import React, { useState, useRef } from 'react';
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
  Eye, 
  ArrowRightLeft, 
  ChevronRight, 
  TrendingUp, 
  UserPlus, 
  GripVertical, 
  ArrowDown, 
  CheckCircle2, 
  CalendarClock, 
  Phone, 
  PhoneCall, 
  MessageSquare 
} from 'lucide-react';

const Leads = ({ addQuoteTrigger, addPaymentTrigger }) => {
  const { leads, updateLeadStatus, deleteLead, currentUser, followUps, getTodayDateString } = useCRM();
  
  // States
  const [viewMode, setViewMode] = useState('board'); // board, list
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  const [mobileActiveStage, setMobileActiveStage] = useState('All'); // For mobile stage filtering
  
  // Modals / Drawers
  const [formOpen, setFormOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [callLogLead, setCallLogLead] = useState(null);

  // Drag & Drop States
  const [draggedLead, setDraggedLead] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const isDraggingRef = useRef(false);
  const [toast, setToast] = useState(null);

  const stages = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
  const today = getTodayDateString();

  const showToast = (message) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3500);
  };

  // 1. Filtering & Sorting Logic
  const filteredLeads = leads
    .filter(lead => {
      const matchSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || 
                          lead.phone.includes(search) || 
                          (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
                          (lead.notes && lead.notes.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchSource = sourceFilter === 'All' || lead.source === sourceFilter;
      const matchMobileStage = mobileActiveStage === 'All' || lead.status === mobileActiveStage;
      return matchSearch && matchStatus && matchSource && matchMobileStage;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdDate) - new Date(a.createdDate);
      if (sortBy === 'oldest') return new Date(a.createdDate) - new Date(b.createdDate);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

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

  // Drag & Drop Handlers
  const handleDragStart = (e, lead) => {
    isDraggingRef.current = true;
    setDraggedLead(lead);
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverStage(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragEnter = (e, stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = (e, stage) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverStage === stage) {
        setDragOverStage(null);
      }
    }
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLead?.id;
    setDragOverStage(null);
    setDraggedLead(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);

    if (!leadId) return;
    const currentLead = leads.find(l => l.id === leadId);
    if (!currentLead) return;

    if (currentLead.status === targetStage) return;

    // Update status in CRM context
    updateLeadStatus(leadId, targetStage);

    // Sync drawer if open for this lead
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: targetStage }));
    }

    showToast(`Lead "${currentLead.name}" moved to ${targetStage.toUpperCase()}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'border-t-4 border-blue-500';
      case 'Contacted': return 'border-t-4 border-amber-500';
      case 'Quoted': return 'border-t-4 border-purple-500';
      case 'Negotiation': return 'border-t-4 border-indigo-500';
      case 'Won': return 'border-t-4 border-orange-500';
      case 'Lost': return 'border-t-4 border-rose-500';
      default: return 'border-t-4 border-slate-400';
    }
  };

  const getStageHighlightClass = (stage) => {
    if (dragOverStage !== stage) return 'bg-slate-100/70 border-slate-200/90 shadow-xs';
    switch (stage) {
      case 'New':
        return 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]';
      case 'Contacted':
        return 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
      case 'Quoted':
        return 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]';
      case 'Negotiation':
        return 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]';
      case 'Won':
        return 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-400/40 shadow-[0_0_25px_rgba(249,115,22,0.2)]';
      case 'Lost':
        return 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
      default:
        return 'bg-slate-100 border-slate-300 ring-2 ring-slate-300';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between p-3.5 sm:p-4 bg-white border border-slate-200 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row flex-1 gap-2.5 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl outline-none text-slate-800 placeholder-slate-400 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              className="px-2.5 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:bg-white focus:border-orange-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {stages.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <select
              className="px-2.5 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:bg-white focus:border-orange-500"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="All">All Sources</option>
              {['Website', 'Referral', 'Social Media', 'Cold Email', 'Other'].map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
            <select
              className="px-2.5 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:bg-white focus:border-orange-500"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* View Switches & Action button */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-1 lg:pt-0">
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200/80 rounded-xl text-[11px] text-orange-700 font-medium">
            <GripVertical className="w-3.5 h-3.5 text-orange-500" />
            <span>Drag cards to update stage</span>
          </div>

          <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddLeadClick}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-orange-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Mobile Stage Selector Filter Tabs (Visible on screens < sm) */}
      <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setMobileActiveStage('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            mobileActiveStage === 'All' 
              ? 'bg-orange-500 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          All Stages ({leads.length})
        </button>
        {stages.map(st => {
          const count = leads.filter(l => l.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setMobileActiveStage(st)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                mobileActiveStage === st 
                  ? 'bg-orange-500 text-white font-bold shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <span>{st}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                mobileActiveStage === st ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 xl:grid xl:grid-cols-6 pb-4">
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
                className={`flex flex-col border rounded-2xl p-3 h-full min-h-[320px] xl:min-h-[520px] min-w-[270px] sm:min-w-[300px] xl:min-w-0 snap-start transition-all duration-200 ${getStageHighlightClass(stage)}`}
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
                        className={`group relative p-3 bg-white hover:bg-slate-50 border rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${
                          isBeingDragged 
                            ? 'opacity-40 scale-95 border-dashed border-orange-400 ring-2 ring-orange-400/40' 
                            : 'border-slate-200/80 hover:border-slate-300 shadow-xs hover-scale'
                        } ${getStatusColor(lead.status)}`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <GripVertical 
                              className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 shrink-0 transition-colors" 
                              title="Drag card to move stage"
                            />
                            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">
                              {lead.name}
                            </h4>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 shrink-0">{lead.id}</span>
                        </div>
                        
                        <p className="text-[10px] text-slate-500 mt-1 pl-5 truncate">{lead.phone}</p>
                        
                        {lead.notes && (
                          <p className="text-[10px] text-slate-600 mt-1.5 line-clamp-2 bg-slate-50 p-1.5 rounded border border-slate-100 ml-5">
                            {lead.notes}
                          </p>
                        )}

                        {/* Scheduled Follow-up Badge if exists */}
                        {leadPendingFollowUp && (
                          <div className="mt-2 ml-5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-semibold">
                            <CalendarClock className="w-3 h-3 text-orange-500 shrink-0" />
                            <span className="truncate">
                              {leadPendingFollowUp.dueDate <= today ? `⏰ Due ${leadPendingFollowUp.dueTime || 'Today'}` : `📅 ${leadPendingFollowUp.dueDate}`}
                            </span>
                          </div>
                        )}

                        {/* Last Call Outcome Badge if available */}
                        {lead.lastCallOutcome && (
                          <div className="mt-1.5 ml-5 flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <PhoneCall className="w-2.5 h-2.5 text-orange-500" />
                            <span className="truncate">Call: {lead.lastCallOutcome}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 ml-5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                              {lead.source}
                            </span>
                            {lead.assignedTo && (
                              <span className="text-[8px] font-semibold text-slate-400 truncate max-w-[70px]" title={`Assigned to ${lead.assignedTo}`}>
                                • {lead.assignedTo}
                              </span>
                            )}
                            
                            {/* Mobile quick stage mover dropdown */}
                            <select
                              value={lead.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateLeadStatus(lead.id, e.target.value);
                                showToast(`Moved ${lead.name} to ${e.target.value}`);
                              }}
                              className="xl:hidden text-[9px] font-bold py-0.5 px-1 bg-slate-100 border border-slate-200 rounded text-slate-700 focus:outline-none"
                              title="Quick Move Stage"
                            >
                              {stages.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {/* Log Call Outcome button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCallLogLead(lead);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Log Call Outcome & Follow-up"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>

                            {/* Schedule Follow-up button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFollowUpLead(lead);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Schedule Follow-up reminder"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Call button */}
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                              title="Call Lead directly"
                            >
                              <Phone className="w-3 h-3" />
                            </a>

                            <button
                              onClick={(e) => handleOpenEdit(e, lead)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit Lead"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                            </button>
                            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                              <button
                                onClick={(e) => handleDelete(e, lead.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Drop zone placeholder when column has cards and card is hovered over it */}
                  {stageLeads.length > 0 && isHoveredStage && isDifferentStageFromDragged && (
                    <div className="border-2 border-dashed border-orange-400 bg-orange-50/90 rounded-xl p-3 text-center text-xs text-orange-700 font-semibold flex items-center justify-center gap-2 animate-pulse">
                      <ArrowDown className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                      <span>Drop here to move to {stage}</span>
                    </div>
                  )}

                  {/* Empty Column States */}
                  {stageLeads.length === 0 && (
                    isHoveredStage && isDifferentStageFromDragged ? (
                      <div className="h-28 border-2 border-dashed border-orange-400 bg-orange-50 rounded-xl flex flex-col items-center justify-center gap-2 text-xs text-orange-700 font-semibold animate-pulse transition-all">
                        <ArrowDown className="w-4 h-4 text-orange-500 animate-bounce" />
                        <span>Drop here for {stage}</span>
                      </div>
                    ) : (
                      <div className="h-24 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-white/60">
                        <span>Empty Column</span>
                        {draggedLead && isDifferentStageFromDragged && (
                          <span className="text-[9px] text-orange-500 lowercase">drop to move here</span>
                        )}
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
          <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 font-mono font-bold text-slate-500">
                        {lead.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors text-sm">{lead.name}</div>
                          <div className="text-slate-500 mt-0.5">{lead.phone} • {lead.email || 'No Email'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-medium text-slate-700">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {lead.assignedTo}
                      </td>
                      <td className="px-6 py-4">
                        {leadPendingFollowUp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                            <CalendarClock className="w-3 h-3 text-orange-500" />
                            <span>{leadPendingFollowUp.dueDate}</span>
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFollowUpLead(lead);
                            }}
                            className="text-[11px] text-slate-400 hover:text-orange-600 flex items-center gap-1"
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
                            updateLeadStatus(lead.id, e.target.value);
                            showToast(`Status updated to ${e.target.value}`);
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
                          {stages.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCallLogLead(lead);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Log Call Outcome & Follow-up"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFollowUpLead(lead);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            title="Schedule Follow-up"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            title="Call Lead"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <button
                            onClick={(e) => handleOpenEdit(e, lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit Details"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                          {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                            <button
                              onClick={(e) => handleDelete(e, lead.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 bg-slate-50/50">
                      No matching leads found matching current search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Form Modal */}
      <LeadFormModal 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        leadToEdit={leadToEdit} 
      />

      {/* Details Side Drawer */}
      <LeadDetailsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lead={selectedLead}
        onAddQuoteForLead={(id, type) => {
          setDrawerOpen(false);
          addQuoteTrigger(id, type);
        }}
        onAddPaymentForLead={(clientId) => {
          setDrawerOpen(false);
          addPaymentTrigger(clientId);
        }}
      />

      {/* Schedule Follow-up Modal */}
      {followUpLead && (
        <FollowUpModal
          isOpen={!!followUpLead}
          onClose={() => setFollowUpLead(null)}
          lead={followUpLead}
        />
      )}

      {/* Telecaller Call Log Modal */}
      {callLogLead && (
        <CallLogModal
          isOpen={!!callLogLead}
          onClose={() => setCallLogLead(null)}
          lead={callLogLead}
          onSuccess={() => showToast(`Call outcome saved for ${callLogLead.name}!`)}
        />
      )}

      {/* Floating Status Notification Toast */}
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
