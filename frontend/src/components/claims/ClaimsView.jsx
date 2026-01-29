import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Filter, FileText, AlertTriangle, CheckCircle,
  Clock, XCircle, Loader2, ChevronDown, Package, Truck,
  DollarSign, MessageSquare, HelpCircle, User, Calendar,
  Eye, Edit2, Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { getClaims, getClaimsStats, createClaim, updateClaim, deleteClaim, getUsers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const claimTypeConfig = {
  damaged_package: { label: 'Damaged Package', icon: Package, color: 'bg-red-100 text-red-700' },
  lost_package: { label: 'Lost Package', icon: Package, color: 'bg-orange-100 text-orange-700' },
  delayed_delivery: { label: 'Delayed Delivery', icon: Truck, color: 'bg-yellow-100 text-yellow-700' },
  wrong_delivery: { label: 'Wrong Delivery', icon: Truck, color: 'bg-purple-100 text-purple-700' },
  billing_issue: { label: 'Billing Issue', icon: DollarSign, color: 'bg-blue-100 text-blue-700' },
  service_complaint: { label: 'Service Complaint', icon: MessageSquare, color: 'bg-pink-100 text-pink-700' },
  other: { label: 'Other', icon: HelpCircle, color: 'bg-gray-100 text-gray-700' }
};

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Clock },
  investigating: { label: 'Investigating', color: 'bg-yellow-100 text-yellow-700', icon: Search },
  pending_customer: { label: 'Pending Customer', color: 'bg-orange-100 text-orange-700', icon: User },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const priorityConfig = {
  urgent: { label: 'Urgent', color: 'bg-red-500 text-white' },
  high: { label: 'High', color: 'bg-orange-500 text-white' },
  medium: { label: 'Medium', color: 'bg-yellow-500 text-white' },
  low: { label: 'Low', color: 'bg-green-500 text-white' }
};

const ClaimsView = () => {
  const { isAdmin } = useAuth();
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    claim_type: '',
    priority: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [claimsData, statsData, usersData] = await Promise.all([
        getClaims(filters),
        getClaimsStats(),
        getUsers()
      ]);
      setClaims(claimsData);
      setStats(statsData);
      setAgents(usersData.filter(u => u.role === 'agent' || u.role === 'admin'));
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateClaim = async (data) => {
    try {
      await createClaim(data);
      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to create claim:', error);
      alert('Failed to create claim');
    }
  };

  const handleUpdateClaim = async (claimId, data) => {
    try {
      await updateClaim(claimId, data);
      loadData();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Failed to update claim:', error);
      alert('Failed to update claim');
    }
  };

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm('Are you sure you want to delete this claim?')) return;
    try {
      await deleteClaim(claimId);
      loadData();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Failed to delete claim:', error);
      alert('Failed to delete claim');
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      claim.customer_name?.toLowerCase().includes(query) ||
      claim.customer_email?.toLowerCase().includes(query) ||
      claim.tracking_number?.toLowerCase().includes(query) ||
      claim.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#393d8a]" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
            <p className="text-gray-500 mt-1">Document and track customer claims</p>
          </div>
          <Button 
            className="bg-[#393d8a] hover:bg-[#393d8a]/90 gap-2"
            onClick={() => setShowCreateDialog(true)}
            data-testid="create-claim-btn"
          >
            <Plus className="w-4 h-4" />
            Register New Claim
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total Claims</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.by_status?.open || 0}</p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.by_status?.investigating || 0}</p>
                  <p className="text-xs text-gray-500">Investigating</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.by_status?.resolved || 0}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#393d8a]/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#393d8a]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolution_rate}%</p>
                  <p className="text-xs text-gray-500">Resolution Rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by customer, email, tracking number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="pending_customer">Pending Customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.claim_type}
              onValueChange={(value) => setFilters({ ...filters, claim_type: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Claim Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(claimTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Claims Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tracking #</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClaims.map((claim) => {
                const typeConfig = claimTypeConfig[claim.claim_type] || claimTypeConfig.other;
                const TypeIcon = typeConfig.icon;
                const statusConf = statusConfig[claim.status] || statusConfig.open;
                const StatusIcon = statusConf.icon;
                const priorityConf = priorityConfig[claim.priority] || priorityConfig.medium;
                
                return (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{claim.customer_name}</p>
                        <p className="text-xs text-gray-500">{claim.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", typeConfig.color)}>
                        <TypeIcon className="w-3 h-3" />
                        {typeConfig.label}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 font-mono">{claim.tracking_number || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusConf.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", priorityConf.color)}>
                        {priorityConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{claim.assigned_to_name || 'Unassigned'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => { setSelectedClaim(claim); setShowDetailDialog(true); }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredClaims.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No claims found</p>
              <p className="text-sm mt-1">Create a new claim to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Claim Dialog */}
      <CreateClaimDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleCreateClaim}
      />

      {/* Claim Detail Dialog */}
      <ClaimDetailDialog
        open={showDetailDialog}
        claim={selectedClaim}
        agents={agents}
        isAdmin={isAdmin()}
        onClose={() => { setShowDetailDialog(false); setSelectedClaim(null); }}
        onUpdate={handleUpdateClaim}
        onDelete={handleDeleteClaim}
      />
    </div>
  );
};

// Create Claim Dialog Component
const CreateClaimDialog = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    claim_type: 'other',
    tracking_number: '',
    description: '',
    priority: 'medium'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.description) {
      alert('Please fill in customer name and description');
      return;
    }
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    setFormData({
      customer_name: '',
      customer_email: '',
      customer_phone: '',
      claim_type: 'other',
      tracking_number: '',
      description: '',
      priority: 'medium'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register New Claim</DialogTitle>
          <DialogDescription>Document a customer claim for tracking and resolution</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="+297 555-0100"
              />
            </div>
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                placeholder="PA123456789"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Claim Type</Label>
              <Select
                value={formData.claim_type}
                onValueChange={(value) => setFormData({ ...formData, claim_type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(claimTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the customer's claim in detail..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#393d8a] hover:bg-[#393d8a]/90">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Register Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Claim Detail Dialog Component
const ClaimDetailDialog = ({ open, claim, agents, isAdmin, onClose, onUpdate, onDelete }) => {
  const [status, setStatus] = useState('');
  const [resolution, setResolution] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (claim) {
      setStatus(claim.status);
      setResolution(claim.resolution_notes || '');
      setAssignedTo(claim.assigned_to || '');
      setPriority(claim.priority);
    }
  }, [claim]);

  if (!claim) return null;

  const typeConfig = claimTypeConfig[claim.claim_type] || claimTypeConfig.other;
  const TypeIcon = typeConfig.icon;

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(claim.id, {
      status,
      resolution_notes: resolution,
      assigned_to: assignedTo,
      priority
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5" />
            Claim Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{claim.customer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{claim.customer_email || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{claim.customer_phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Claim Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500">Type</p>
                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-1", typeConfig.color)}>
                  <TypeIcon className="w-3 h-3" />
                  {typeConfig.label}
                </div>
              </div>
              <div>
                <p className="text-gray-500">Tracking Number</p>
                <p className="font-medium font-mono">{claim.tracking_number || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Created</p>
                <p className="font-medium">{new Date(claim.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Created By</p>
                <p className="font-medium">{claim.created_by_name || '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">Description</p>
              <p className="text-sm bg-white p-3 rounded border">{claim.description}</p>
            </div>
          </div>

          {/* Status & Assignment */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="pending_customer">Pending Customer</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedTo || "unassigned"} onValueChange={(val) => setAssignedTo(val === "unassigned" ? "" : val)}>
                <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label>Resolution Notes</Label>
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Document how this claim was resolved or why it was rejected..."
              rows={3}
            />
          </div>

          {claim.resolved_at && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              Resolved on {new Date(claim.resolved_at).toLocaleString()}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isAdmin && (
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(claim.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#393d8a] hover:bg-[#393d8a]/90">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimsView;
