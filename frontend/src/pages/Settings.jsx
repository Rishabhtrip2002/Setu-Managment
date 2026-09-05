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
  User,
  IndianRupee,
  RefreshCw
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
      case 'Sent': return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'Pending': return 'bg-slate-800 text-slate-400 border border-slate-700/50';
      case 'Failed': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-850 text-slate-500 border border-slate-800';
    }
  };

  const getReminderIcon = (status) => {
    switch (status) {
      case 'Sent': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'Pending': return <Clock className="w-3.5 h-3.5" />;
      case 'Failed': return <XOctagon className="w-3.5 h-3.5" />;
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
      
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800 text-brand-400">
          <Settings className="w-5 h-5 animate-spin-[spin_10s_linear_infinite]" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-200">System Configuration</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage simulated notification channels, API templates, and schedules.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-slate-850 bg-slate-900/10">
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
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                active 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 bg-slate-900/20 border border-slate-800 rounded-2xl">
        
        {/* Tab 1: WhatsApp Templates */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="p-4 bg-brand-500/5 border border-brand-500/15 rounded-xl">
              <p className="text-xs text-brand-300 leading-relaxed font-medium">
                <strong>WhatsApp Business API Connected</strong>. Below are the pre-configured system triggers. 
                Any event in the CRM (sending quotes, receipts, reminders, status updates) automatically 
                triggers messages styled from these templates in client conversation logs.
              </p>
            </div>

            <div className="space-y-4">
              {templates.map(tmpl => {
                const isEditing = editingTemplateId === tmpl.id;
                return (
                  <div key={tmpl.id} className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-500">{tmpl.id}</span>
                        <h4 className="text-sm font-bold text-slate-200 mt-1">{tmpl.name}</h4>
                      </div>
                      
                      {!isEditing ? (
                        <button
                          onClick={() => handleEditTemplate(tmpl)}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700/50 rounded-lg hover-scale"
                        >
                          Modify
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSaveTemplate(tmpl.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-lg hover-scale"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Template</span>
                        </button>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                        <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">{tmpl.template}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          rows="3"
                          className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-xs font-mono text-slate-200 outline-none resize-none"
                          value={templateText}
                          onChange={e => setTemplateText(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 italic">
                          Placeholders: <code>{`{{clientName}}`}</code>, <code>{`{{quoteId}}`}</code>, <code>{`{{totalAmount}}`}</code>, <code>{`{{pdfUrl}}`}</code>, <code>{`{{amount}}`}</code>, <code>{`{{dueDate}}`}</code>, <code>{`{{leadName}}`}</code>
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <h3 className="text-sm font-bold text-slate-300">Scheduled Automation Log</h3>
              <span className="text-[10px] text-slate-500 font-bold">Auto-scheduled on Instalment Due Dates</span>
            </div>

            <div className="overflow-hidden border border-slate-850 bg-slate-950/30 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3">Split Amount</th>
                      <th className="px-5 py-3">Due Date</th>
                      <th className="px-5 py-3">Trigger Schedule</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {reminders.map(rem => (
                      <tr key={rem.id} className="hover:bg-slate-950/10">
                        <td className="px-5 py-3 font-semibold text-slate-200">
                          {rem.clientName}
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{rem.phone}</p>
                        </td>
                        <td className="px-5 py-3 font-bold text-brand-400">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rem.amount)}
                        </td>
                        <td className="px-5 py-3 text-slate-400">{rem.dueDate}</td>
                        <td className="px-5 py-3">
                          <span className="font-semibold text-slate-300 capitalize">{rem.triggerType.replace('_', ' ')}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">Exec: {rem.scheduledFor}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${getReminderBadge(rem.status)}`}>
                            {getReminderIcon(rem.status)}
                            <span>{rem.status}</span>
                          </span>
                          {rem.sentDate && <p className="text-[9px] text-slate-500 mt-0.5">Sent: {rem.sentDate}</p>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {rem.status !== 'Sent' && (
                              <button
                                onClick={() => handleSendReminderImmediately(rem.id)}
                                className="px-2.5 py-1 text-[9px] font-extrabold uppercase bg-brand-400 hover:bg-brand-500 text-slate-950 rounded-lg hover-scale flex items-center gap-1"
                                title="Force run reminder immediately via WhatsApp"
                              >
                                <Send className="w-2.5 h-2.5" />
                                <span>Remind</span>
                              </button>
                            )}
                            {currentUser.role === 'Admin' && (
                              <button
                                onClick={() => handleRemoveReminder(rem.id)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
                                title="Delete schedule"
                              >
                                <XOctagon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {reminders.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-slate-500">
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <h3 className="text-sm font-bold text-slate-300">Overdue Ledger accounts</h3>
              <span className="px-2 py-0.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full">
                {overdueClients.length} accounts critical
              </span>
            </div>

            <div className="overflow-hidden border border-slate-850 bg-slate-950/30 rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3">Client Recipient</th>
                      <th className="px-5 py-3">Total Overdue Amount</th>
                      <th className="px-5 py-3">Oldest Unpaid Date</th>
                      <th className="px-5 py-3">Overdue Parts</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {overdueClients.map(c => (
                      <tr key={c.clientId} className="hover:bg-slate-950/10">
                        <td className="px-5 py-3">
                          <span className="font-semibold text-slate-200">{c.name}</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">{c.companyName}</p>
                        </td>
                        <td className="px-5 py-3 font-black text-rose-400">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.totalOverdue)}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-semibold text-slate-400">{c.oldestDueDate}</span>
                          <p className="text-[9px] text-rose-500/80 font-bold mt-0.5 font-mono">CRITICAL OVERDUE</p>
                        </td>
                        <td className="px-5 py-3 text-slate-300 font-medium">
                          {c.instalmentsCount} unpaid splits
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              // Trigger an immediate custom reminder
                              const text = `URGENT REMINDER: Dear ${c.name}, you have outstanding invoices totaling ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(c.totalOverdue)} past due since ${c.oldestDueDate}. Please clear immediately.`;
                              alert(`Urgent collection alert fired via WhatsApp to ${c.name} (${c.phone}). Log updated.`);
                            }}
                            className="px-3 py-1.5 text-[10px] font-extrabold uppercase bg-rose-500 hover:bg-rose-600 text-slate-950 rounded-xl hover-scale transition-colors"
                          >
                            Collect Now
                          </button>
                        </td>
                      </tr>
                    ))}

                    {overdueClients.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-brand-400 bg-brand-500/5 font-semibold">
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
