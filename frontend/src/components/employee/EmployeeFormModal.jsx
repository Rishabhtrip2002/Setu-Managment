import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, ShieldCheck, Mail, Phone, Briefcase, Building, KeyRound, CheckSquare, Square, AlertCircle, Loader2 } from 'lucide-react';

const MODULE_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Overview metrics & statistics' },
  { id: 'coldcalling', label: 'Cold Calling', desc: 'Shared pool, bulk CSV import & auto-claim' },
  { id: 'telecaller', label: 'Telecaller & Calls', desc: 'Dialer queue, call logs & outcomes' },
  { id: 'leads', label: 'Leads', desc: 'Lead pipeline, follow-ups & conversion' },
  { id: 'clients', label: 'Clients', desc: 'Customer accounts & history' },
  { id: 'quotations', label: 'Quotations', desc: 'Quotation builder & invoices' },
  { id: 'payments', label: 'Payments', desc: 'Payment schedules & tracking' },
  { id: 'expenses', label: 'Expenses', desc: 'Expense tracking & approvals' },
  { id: 'reports', label: 'Reports', desc: 'Revenue analysis & reports' },
  { id: 'settings', label: 'WhatsApp & Settings', desc: 'Templates & notifications' },
];

const DEPARTMENT_OPTIONS = [
  'Sales',
  'Marketing',
  'Operations',
  'Finance & Accounts',
  'Engineering / IT',
  'Customer Support',
  'Management'
];

const EmployeeFormModal = ({ isOpen, onClose, employeeToEdit = null }) => {
  const { addEmployee, updateEmployee, employees } = useCRM();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: 'Sales',
    role: 'Staff',
    permissions: ['dashboard', 'coldcalling', 'telecaller', 'leads', 'clients', 'quotations', 'payments', 'expenses'],
    status: 'Pending Password Setup'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill when editing or generate next ID for new employee
  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        id: employeeToEdit.id || '',
        name: employeeToEdit.name || '',
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
        position: employeeToEdit.position || '',
        department: employeeToEdit.department || 'Sales',
        role: employeeToEdit.role || 'Staff',
        permissions: employeeToEdit.permissions || ['dashboard', 'telecaller', 'leads', 'clients', 'quotations', 'payments', 'expenses'],
        status: employeeToEdit.status || 'Active'
      });
    } else {
      // Suggest next auto EMP-ID
      const highestNum = employees.reduce((max, e) => {
        const num = parseInt(String(e.id).replace(/[^0-9]/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 100);

      setFormData({
        id: `EMP-${highestNum + 1}`,
        name: '',
        email: '',
        phone: '',
        position: '',
        department: 'Sales',
        role: 'Staff',
        permissions: ['dashboard', 'leads', 'clients', 'quotations', 'payments', 'expenses'],
        status: 'Pending Password Setup'
      });
    }
    setErrorMsg('');
  }, [employeeToEdit, isOpen, employees]);

  if (!isOpen) return null;

  const togglePermission = (permId) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      const updated = exists 
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: updated };
    });
  };

  const handleSelectAllPermissions = () => {
    const all = MODULE_OPTIONS.map(m => m.id);
    setFormData(prev => ({ ...prev, permissions: all }));
  };

  const handleClearPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: ['dashboard'] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('A valid Registered Email Address is required.');
      return;
    }
    if (!formData.position.trim()) {
      setErrorMsg('Position / Designation is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Contact Number is required.');
      return;
    }
    if (formData.permissions.length === 0) {
      setErrorMsg('Please grant at least 1 module permission.');
      return;
    }

    setLoading(true);
    try {
      if (employeeToEdit) {
        const res = await updateEmployee(employeeToEdit.id, formData);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to update employee.');
          return;
        }
      } else {
        const res = await addEmployee(formData);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create employee record.');
          return;
        }
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving employee record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8 animate-[scaleUp_0.25s_ease-out]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-900 to-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                {employeeToEdit ? 'Edit Employee Details' : 'Register New Employee'}
              </h3>
              <p className="text-xs text-slate-400">
                {employeeToEdit 
                  ? 'Update roles, position, and access permissions' 
                  : 'Add employee profile and configure their initial activation'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Row: Employee ID & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Employee ID <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                placeholder="e.g. EMP-101"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Account Status
              </label>
              {employeeToEdit ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Password Setup">Pending Password Setup</option>
                  <option value="Inactive">Inactive (Deactivated)</option>
                </select>
              ) : (
                <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending Password Setup (Initial)</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Full Name & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Full Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Position / Designation <span className="text-orange-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Software Engineer / Sales Manager"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Row 3: Registered Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Registered Email Address</span> <span className="text-orange-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@setusolution.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Employee will use this email for their First-Time Password Setup.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Number</span> <span className="text-orange-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Row 4: Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Department</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              >
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Role</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              >
                <option value="Staff">Staff (Standard Access)</option>
                <option value="Manager">Manager (Team Lead)</option>
                <option value="Admin">Admin (Full CRM Access)</option>
              </select>
            </div>
          </div>

          {/* Module Permissions Checkboxes */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-500" />
                  <span>Module Access Permissions</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Select which management sections this employee can access.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllPermissions}
                  className="text-[10px] text-orange-600 font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearPermissions}
                  className="text-[10px] text-slate-500 font-medium hover:underline"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MODULE_OPTIONS.map((mod) => {
                const isChecked = formData.permissions.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => togglePermission(mod.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked 
                        ? 'bg-orange-50/70 border-orange-200 text-slate-900 shadow-xs' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="mt-0.5 text-orange-600">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 fill-orange-500 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{mod.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{employeeToEdit ? 'Save Changes' : 'Register Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeFormModal;
