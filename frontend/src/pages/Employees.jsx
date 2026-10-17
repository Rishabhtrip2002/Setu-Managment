import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import EmployeeFormModal from '../components/employee/EmployeeFormModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Ban, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  KeyRound, 
  Briefcase, 
  Building2,
  Sparkles
} from 'lucide-react';

const Employees = () => {
  const { employees, toggleEmployeeStatus, deleteEmployee, currentUser } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Active, Pending Password Setup, Inactive
  const [deptFilter, setDeptFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Status Counts
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const pendingCount = employees.filter(e => e.status === 'Pending Password Setup').length;
  const inactiveCount = employees.filter(e => e.status === 'Inactive').length;

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchesSearch = 
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      (emp.phone && emp.phone.includes(q));

    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const departmentsList = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const handleOpenAdd = () => {
    setEmployeeToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEmployeeToEdit(emp);
    setModalOpen(true);
  };

  const handleCopySetupInvite = (emp) => {
    const inviteText = `Hello ${emp.name},\nYour SETU SOLUTION CRM employee account has been created.\n\nPlease visit the portal: ${window.location.origin}\nClick on "First-Time Account Setup" and enter your registered email address:\n${emp.email}\nto create your initial password.`;
    navigator.clipboard.writeText(inviteText);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (emp) => {
    if (confirm(`Are you sure you want to delete employee record for ${emp.name} (${emp.id})? This cannot be undone.`)) {
      await deleteEmployee(emp.id);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
          </span>
        );
      case 'Pending Password Setup':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Needs Setup</span>
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <Ban className="w-3 h-3 text-slate-400" />
            <span>Inactive</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Employee Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register team members, assign module permissions, and manage first-time account setup.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Registered team records</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Accounts</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Password setup completed</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Setup</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting first-time password</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deactivated</p>
          <p className="text-2xl font-black text-slate-600 mt-1">{inactiveCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Login access disabled</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, employee ID, position..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All Statuses ({totalCount})</option>
            <option value="Active">Active ({activeCount})</option>
            <option value="Pending Password Setup">Pending Setup ({pendingCount})</option>
            <option value="Inactive">Inactive ({inactiveCount})</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No employees found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL' 
                ? 'Try adjusting your search criteria or filter tags.' 
                : 'Get started by registering your first employee record.'}
            </p>
            {(!search && statusFilter === 'ALL') && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                + Register First Employee
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee Info</th>
                  <th className="px-4 py-3.5">Position & Dept</th>
                  <th className="px-4 py-3.5">Role & Access</th>
                  <th className="px-4 py-3.5">Account Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredEmployees.map((emp) => {
                  const isPending = emp.status === 'Pending Password Setup';
                  const isInactive = emp.status === 'Inactive';
                  return (
                    <tr 
                      key={emp.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isInactive ? 'opacity-70 bg-slate-50/40' : ''}`}
                    >
                      {/* Employee Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {emp.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1 truncate max-w-[200px]" title={emp.email}>
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{emp.email}</span>
                              </span>
                              {emp.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <span>{emp.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{emp.position}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{emp.department}</span>
                        </p>
                      </td>

                      {/* Role & Access Permissions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            emp.role === 'Admin' 
                              ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                              : emp.role === 'Manager'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {emp.role}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(emp.permissions || []).slice(0, 3).map((perm) => (
                            <span key={perm} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                              {perm}
                            </span>
                          ))}
                          {(emp.permissions || []).length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                              +{(emp.permissions || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-4">
                        {getStatusBadge(emp.status)}
                        {isPending && (
                          <p className="text-[10px] text-amber-600 mt-1">
                            Awaiting password setup
                          </p>
                        )}
                        {emp.activatedAt && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Active since {emp.activatedAt.split('T')[0]}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Setup Link / Instructions */}
                          {isPending && (
                            <button
                              onClick={() => handleCopySetupInvite(emp)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                copiedId === emp.id 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-300' 
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              }`}
                              title="Copy first-time password setup instructions for this employee"
                            >
                              {copiedId === emp.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Toggle Active / Deactivate */}
                          <button
                            onClick={() => toggleEmployeeStatus(emp.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              emp.status === 'Active'
                                ? 'bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={emp.status === 'Active' ? 'Deactivate employee account' : 'Reactivate employee account'}
                          >
                            {emp.status === 'Active' ? (
                              <Ban className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit employee details & permissions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Record */}
                          <button
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete employee record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <EmployeeFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeToEdit={employeeToEdit}
      />
    </div>
  );
};

export default Employees;
