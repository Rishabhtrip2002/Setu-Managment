import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Settings, 
  MessageSquare, 
  BellRing, 
  Save, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  XOctagon, 
  Clock, 
  IndianRupee,
  Building2,
  FileText
} from 'lucide-react';

const SettingsPage = () => {
  const { 
    templates, 
    updateTemplate, 
    reminders, 
    triggerManualReminder, 
    deleteReminder,
    clients,
    payments,
    getTodayDateString,
    currentUser
  } = useCRM();

  const [activeTab, setActiveTab] = useState('templates'); // templates, reminders, overdue
  const [editingTemplateId, setEditingTemplateId] = useState('');
  const [templateText, setTemplateText] = useState('');

  // 1. WhatsApp Template editor controls
  const handleEditTemplate = (tmpl) => {
    setEditingTemplateId(tmpl.id);
    setTemplateText(tmpl.template);
  };

  const handleSaveTemplate = (id) => {
    updateTemplate(id, templateText);
    setEditingTemplateId('');
    alert("WhatsApp Business template saved successfully! Trigger messages will now use the new layout.");
  };

  // 2. Overdue Payment calculation (Due date is before today and status is Pending)
  const today = getTodayDateString();
  const overdueClients = [];

  payments.forEach(p => {
    const client = clients.find(c => c.id === p.clientId);
    if (!client) return;

    const overdueInstalments = p.instalments.filter(inst => {
      return inst.status === 'Pending' && inst.dueDate < today;
    });

    if (overdueInstalments.length > 0) {
      const totalOverdue = overdueInstalments.reduce((sum, inst) => sum + inst.amount, 0);
      const oldestDueDate = overdueInstalments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate;

      overdueClients.push({
        clientId: client.id,
        name: client.name,
        companyName: client.companyName,
        phone: client.phone,
        totalOverdue,
        oldestDueDate,
        instalmentsCount: overdueInstalments.length
      });
    }
  });

  const getReminderBadge = (status) => {
    switch (status) {
      case 'Sent': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Failed': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  const getReminderIcon = (status) => {
    switch (status) {
      case 'Sent': return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Pending': return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'Failed': return <XOctagon className="w-3.5 h-3.5 text-rose-600" />;
      default: return null;
    }
  };

  const handleSendReminderImmediately = (id) => {
    triggerManualReminder(id);
    alert("Manual WhatsApp Reminder fired immediately! Log updated.");
  };

  const handleRemoveReminder = (id) => {
    if (confirm("Are you sure you want to remove this reminder?")) {
      const ok = deleteReminder(id);
      if (!ok) {
        alert("Action Denied: Staff roles do not have permission to delete records.");
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome / Title Banner */}
      <div className="p-6 bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200/90 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600 shrink-0">
            <Settings className="w-5 h-5 animate-spin-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">System Configuration</h2>
            <p className="text-xs text-slate-600 mt-0.5">Manage WhatsApp Business templates, reminder automation, and overdue ledgers.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Gateway Active</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'templates', label: 'WhatsApp Templates', icon: MessageSquare },
          { id: 'reminders', label: 'Reminders Scheduler Log', icon: BellRing },
          { id: 'overdue', label: 'Overdue Ledger Widget', icon: AlertTriangle }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                active 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
        
        {/* Tab 1: WhatsApp Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
              <p className="text-xs text-orange-900 leading-relaxed font-medium">
                <strong>WhatsApp Business API Connected</strong>. Below are the pre-configured system triggers. 
                Any event in the CRM (sending quotes, invoices, payment reminders, status updates) automatically 
                triggers messages styled from these templates in client conversation logs.
              </p>
            </div>

            <div className="space-y-4">
              {templates.map(tmpl => {
                const isEditing = editingTemplateId === tmpl.id;
                return (
                  <div key={tmpl.id} className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                          {tmpl.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{tmpl.name}</h4>
                      </div>
                      
                      {!isEditing ? (
                        <button
                          onClick={() => handleEditTemplate(tmpl)}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl hover-scale shadow-2xs"
                        >
                          Modify
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSaveTemplate(tmpl.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Template</span>
                        </button>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                        <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">{tmpl.template}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows="3"
                          className="w-full p-3 bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-xs font-mono text-slate-800 outline-none resize-none"
                          value={templateText}
                          onChange={e => setTemplateText(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 italic">
                          Placeholders: <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-bold">{`{{clientName}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-bold">{`{{quoteId}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-bold">{`{{totalAmount}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-bold">{`{{amount}}`}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600 font-bold">{`{{dueDate}}`}</code>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Reminders Log */}
        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Scheduled Automation Log</h3>
              <span className="text-[11px] text-slate-500 font-semibold">Auto-scheduled on Instalment Due Dates</span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-2xs">
              {/* Mobile Card View (phones below md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {reminders.map(rem => (
                  <div key={rem.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{rem.clientName}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{rem.phone}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getReminderBadge(rem.status)}`}>
                        {getReminderIcon(rem.status)}
                        <span>{rem.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Split Amount</span>
                        <span className="font-black text-orange-600 font-mono">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rem.amount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Due Date</span>
                        <span className="font-medium text-slate-700">{rem.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-500">
                        <span className="capitalize font-semibold text-slate-700">{rem.triggerType.replace('_', ' ')}</span>
                        {rem.sentDate && <span className="text-slate-400 ml-1">({rem.sentDate})</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {rem.status !== 'Sent' && (
                          <button
                            onClick={() => handleSendReminderImmediately(rem.id)}
                            className="px-3 py-1.5 text-xs font-bold uppercase bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex items-center gap-1 shadow-2xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Remind</span>
                          </button>
                        )}
                        {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                          <button
                            onClick={() => handleRemoveReminder(rem.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <XOctagon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {reminders.length === 0 && (
                  <div className="text-center py-10 px-4 text-slate-500 font-medium text-xs">
                    No auto-scheduled payment reminders in log.
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-5 py-3.5">Client</th>
                      <th className="px-5 py-3.5">Split Amount</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Trigger Schedule</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reminders.map(rem => (
                      <tr key={rem.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {rem.clientName}
                          <p className="text-[10px] text-slate-500 font-mono font-normal mt-0.5">{rem.phone}</p>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-orange-600">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rem.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">{rem.dueDate}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-800 capitalize">{rem.triggerType.replace('_', ' ')}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Exec: {rem.scheduledFor}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getReminderBadge(rem.status)}`}>
                            {getReminderIcon(rem.status)}
                            <span>{rem.status}</span>
                          </span>
                          {rem.sentDate && <p className="text-[9px] text-slate-500 mt-0.5">Sent: {rem.sentDate}</p>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {rem.status !== 'Sent' && (
                              <button
                                onClick={() => handleSendReminderImmediately(rem.id)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg hover-scale flex items-center gap-1 shadow-2xs"
                                title="Force run reminder immediately via WhatsApp"
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>Remind</span>
                              </button>
                            )}
                            {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                              <button
                                onClick={() => handleRemoveReminder(rem.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete schedule"
                              >
                                <XOctagon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {reminders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-500 font-medium">
                          No auto-scheduled payment reminders in log.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Overdue Accounts */}
        {activeTab === 'overdue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Overdue Ledger Accounts</h3>
              <span className="px-2.5 py-0.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
                {overdueClients.length} accounts critical
              </span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-2xs">
              {/* Mobile Card View (phones below md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {overdueClients.map(c => (
                  <div key={c.clientId} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{c.companyName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Overdue</span>
                        <span className="font-black text-rose-600 font-mono text-sm">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.totalOverdue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-rose-50/60 p-2.5 rounded-xl border border-rose-100">
                      <div>
                        <span className="text-[10px] text-rose-500 font-bold uppercase block">Oldest Due</span>
                        <span className="font-semibold text-slate-800">{c.oldestDueDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Parts</span>
                        <span className="font-medium text-slate-700">{c.instalmentsCount} unpaid splits</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => {
                          alert(`Urgent collection alert dispatched via WhatsApp to ${c.name} (${c.phone}). Log updated.`);
                        }}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase bg-rose-500 hover:bg-rose-600 text-white rounded-xl hover-scale transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Collect Now via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}

                {overdueClients.length === 0 && (
                  <div className="text-center py-10 px-4 text-emerald-700 bg-emerald-50/40 font-bold text-xs">
                    Excellent! All invoices are fully paid or ahead of schedule. Zero overdue balances.
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-5 py-3.5">Client Recipient</th>
                      <th className="px-5 py-3.5">Total Overdue Amount</th>
                      <th className="px-5 py-3.5">Oldest Unpaid Date</th>
                      <th className="px-5 py-3.5">Overdue Parts</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {overdueClients.map(c => (
                      <tr key={c.clientId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900">{c.name}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">{c.companyName}</p>
                        </td>
                        <td className="px-5 py-3.5 font-black text-rose-600">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.totalOverdue)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-700">{c.oldestDueDate}</span>
                          <p className="text-[9px] text-rose-600 font-bold mt-0.5 font-mono">CRITICAL OVERDUE</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {c.instalmentsCount} unpaid splits
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              alert(`Urgent collection alert dispatched via WhatsApp to ${c.name} (${c.phone}). Log updated.`);
                            }}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase bg-rose-500 hover:bg-rose-600 text-white rounded-xl hover-scale transition-colors shadow-2xs cursor-pointer"
                          >
                            Collect Now
                          </button>
                        </td>
                      </tr>
                    ))}

                    {overdueClients.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-12 text-emerald-700 bg-emerald-50/40 font-bold">
                          Excellent! All invoices are fully paid or ahead of schedule. Zero overdue balances.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default SettingsPage;
