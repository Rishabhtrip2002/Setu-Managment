import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import LeadFormModal from '../components/lead/LeadFormModal';
import LeadDetailsDrawer from '../components/lead/LeadDetailsDrawer';
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
  UserPlus
} from 'lucide-react';

const Leads = ({ addQuoteTrigger, addPaymentTrigger }) => {
  const { leads, updateLeadStatus, deleteLead, currentUser } = useCRM();
  
  // States
  const [viewMode, setViewMode] = useState('board'); // board, list
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  
  // Modals / Drawers
  const [formOpen, setFormOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadToEdit, setLeadToEdit] = useState(null);

  const stages = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];

  // 1. Filtering & Sorting Logic
  const filteredLeads = leads
    .filter(lead => {
      const matchSearch = lead.name.toLowerCase().includes(search.toLowerCase()) || 
                          lead.phone.includes(search) || 
                          (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
                          (lead.notes && lead.notes.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchSource = sourceFilter === 'All' || lead.source === sourceFilter;
      return matchSearch && matchStatus && matchSource;
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
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const handleAddLeadClick = () => {
    setLeadToEdit(null);
    setFormOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'border-t-4 border-blue-500';
      case 'Contacted': return 'border-t-4 border-amber-500';
      case 'Quoted': return 'border-t-4 border-purple-500';
      case 'Negotiation': return 'border-t-4 border-indigo-500';
      case 'Won': return 'border-t-4 border-brand-500';
      case 'Lost': return 'border-t-4 border-rose-500';
      default: return 'border-t-4 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl outline-none text-slate-100 placeholder-slate-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            <select
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl outline-none focus:border-brand-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {stages.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl outline-none focus:border-brand-500"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="All">All Sources</option>
              {['Website', 'Referral', 'Social Media', 'Cold Email', 'Other'].map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl outline-none focus:border-brand-500"
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
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-850 rounded-xl">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-slate-800 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddLeadClick}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-brand-400 to-emerald-500 hover:from-brand-500 hover:to-emerald-600 rounded-xl hover-scale shadow-md shadow-brand-500/10"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage);
            return (
              <div 
                key={stage}
                className="flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 h-full min-h-[300px] xl:min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{stage}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-950 border border-slate-850 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[400px] xl:max-h-[70vh]">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => handleOpenDrawer(lead)}
                      className={`group relative p-3 bg-slate-950/40 hover:bg-slate-900 border border-slate-850/80 hover:border-slate-700/60 rounded-xl cursor-pointer hover:shadow-lg transition-all hover-scale ${getStatusColor(lead.status)}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-brand-400 transition-colors">
                          {lead.name}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-500">{lead.id}</span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-1.5 truncate">{lead.phone}</p>
                      
                      {lead.notes && (
                        <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 bg-slate-950/20 p-1.5 rounded border border-slate-900">
                          {lead.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-900">
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                          {lead.source}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenEdit(e, lead)}
                            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                            title="Edit Lead"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                          </button>
                          {currentUser.role === 'Admin' && (
                            <button
                              onClick={(e) => handleDelete(e, lead.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="h-24 border border-dashed border-slate-850/80 rounded-xl flex items-center justify-center text-[10px] text-slate-600 font-semibold uppercase tracking-wider bg-slate-950/5">
                      Empty Column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-hidden border border-slate-800 bg-slate-900/20 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Lead ID</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredLeads.map(lead => (
                  <tr 
                    key={lead.id}
                    onClick={() => handleOpenDrawer(lead)}
                    className="hover:bg-slate-900/40 cursor-pointer group transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-slate-400">
                      {lead.id}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-brand-400 transition-colors text-sm">{lead.name}</div>
                        <div className="text-slate-400 mt-0.5">{lead.phone} • {lead.email || 'No Email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 font-medium text-slate-300">
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {lead.assignedTo}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {lead.createdDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lead.status === 'New' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        lead.status === 'Contacted' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        lead.status === 'Quoted' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                        lead.status === 'Negotiation' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                        lead.status === 'Won' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenDrawer(lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleOpenEdit(e, lead)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Edit Details"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        {currentUser.role === 'Admin' && (
                          <button
                            onClick={(e) => handleDelete(e, lead.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-500 bg-slate-950/10">
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
    </div>
  );
};

export default Leads;
