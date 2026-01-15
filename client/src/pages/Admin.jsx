import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom'
import { useSearchParams, Link } from "react-router-dom";
import api from "../apis/workshopClient";
import vendorClient from "../apis/vendorClient";
import axios from "axios";
import { sendWorkshopCertificates } from "../apis/certificateClient.js";
import { useAuth } from "../components/AuthContext.jsx";

export default function WorkshopsList() {
  const navigate = useNavigate()
  const [workshops, setWorkshops] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loyaltyVendors, setLoyaltyVendors] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creatorInput, setCreatorInput] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('workshops');
  const [searchInput, setSearchInput] = useState('');
  const [sendingCertificates, setSendingCertificates] = useState(false);
  // Universal Filters
const [filterStatus, setFilterStatus] = useState("");
const [filterFaculty, setFilterFaculty] = useState("");
const [filterRole, setFilterRole] = useState("");
const [filterVerification, setFilterVerification] = useState("");
const [filterApproval, setFilterApproval] = useState("");
const [filterBlocked, setFilterBlocked] = useState("");
const [filterBusinessType, setFilterBusinessType] = useState("");
const [filterEventType, setFilterEventType] = useState("");
const [filterSort, setFilterSort] = useState("");
const [filterStartDate, setFilterStartDate] = useState("");
const [filterEndDate, setFilterEndDate] = useState("");


  // Drawer State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editType, setEditType] = useState(null);
  const [saving, setSaving] = useState(false);

  // Application confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmAction, setConfirmAction] = useState('');

  // Workshop status confirmation state
  const [showWorkshopConfirmModal, setShowWorkshopConfirmModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopAction, setWorkshopAction] = useState('');

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Admin',
    studentId: '',
    isApproved: true,
    isAccountVerified: true
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Block User Modal State
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockData, setBlockData] = useState({
    blockDuration: '',
    reason: ''
  });
  const [blockingUser, setBlockingUser] = useState(false);

  // Blocked Users List State
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  // Comment deletion state (admin)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
    const applySort = (data) => {
  let arr = [...data];

  if (filterSort === "newest") {
    arr.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  }

  if (filterSort === "oldest") {
    arr.sort((a, b) => new Date(a.createdAt || a.startDate) - new Date(b.createdAt || b.startDate));
  }

  if (filterSort === "az") {
    arr.sort((a, b) => (a.workshopName || a.title || "").localeCompare(b.workshopName || b.title || ""));
  }

  if (filterSort === "za") {
    arr.sort((a, b) => (b.workshopName || b.title || "").localeCompare(a.workshopName || a.title || ""));
  }

  return arr;
};

  const applyFilters = (item) => {
  
  // status
  if (filterStatus && item.status !== filterStatus) return false;

  // faculty
  if (filterFaculty && item.faculty !== filterFaculty) return false;

  // role
  if (filterRole && item.role !== filterRole) return false;

  // verified
  if (filterVerification) {
    const isVerified = String(item.isAccountVerified);
    if (isVerified !== filterVerification) return false;
  }

  // approved
  if (filterApproval) {
    const isApproved = String(item.isApproved);
    if (isApproved !== filterApproval) return false;
  }

  // blocked
  if (filterBlocked) {
    const isBlocked = String(item.isBlocked);
    if (isBlocked !== filterBlocked) return false;
  }

  // business type
  if (filterBusinessType && item.businessType !== filterBusinessType) return false;

  // date range
  const dateField =
    item.startDateTime ||
    item.startDate ||
    item.createdAt ||
    item.eventDate;

  if (filterStartDate && new Date(dateField) < new Date(filterStartDate)) {
    return false;
  }

  if (filterEndDate && new Date(dateField) > new Date(filterEndDate)) {
    return false;
  }

  return true;
};

  const creatorFromQuery = searchParams.get('creator') || '';

  useEffect(() => {
    const creator = creatorFromQuery;
    setCreatorInput(creator);
    fetchWorkshops(creator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWorkshops(creator) {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (creator) {
        res = await api.get(`/workshops/creator/${encodeURIComponent(creator)}`);
        setWorkshops(res.data.data || []);
      } else {
        res = await api.get('/workshops');
        setWorkshops(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch workshops');
    } finally {
      setLoading(false);
    }
  }

  // ✅ Fetch blocked users
  async function fetchBlockedUsers() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/users/blocked/list');
      setBlockedUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      setError(err.response?.data?.message || 'Failed to fetch blocked users');
    } finally {
      setLoading(false);
    }
  }

  // ✅ Block user
  async function handleBlockUser() {
    if (!selectedUser) return;

    try {
      setBlockingUser(true);
      setError(null);

      const blockPayload = {
        reason: blockData.reason || 'Violation of terms'
      };

      // Add block duration if provided
      if (blockData.blockDuration && blockData.blockDuration > 0) {
        blockPayload.blockDuration = parseInt(blockData.blockDuration);
      }

      await api.put(`/users/${selectedUser._id}/block`, blockPayload);
      
      // Refresh users list
      fetchUsers();
      
      // Close modal and reset
      setShowBlockModal(false);
      setSelectedUser(null);
      setBlockData({ blockDuration: '', reason: '' });
      
      alert(`User ${blockData.blockDuration ? 'temporarily blocked' : 'permanently blocked'} successfully!`);

    } catch (err) {
      console.error('Failed to block user:', err);
      setError(err.response?.data?.message || 'Failed to block user');
    } finally {
      setBlockingUser(false);
    }
  }

  // ✅ Unblock user
  async function handleUnblockUser(userId) {
    if (!window.confirm('Are you sure you want to unblock this user?')) return;

    try {
      setLoading(true);
      setError(null);

      await api.put(`/users/${userId}/unblock`);
      
      // Refresh users list and blocked users list
      fetchUsers();
      if (showBlockedUsers) {
        fetchBlockedUsers();
      }
      
      alert('User unblocked successfully!');

    } catch (err) {
      console.error('Failed to unblock user:', err);
      setError(err.response?.data?.message || 'Failed to unblock user');
    } finally {
      setLoading(false);
    }
  }

  // ✅ Create new user (Admin/EventOffice)
  async function handleCreateUser() {
    try {
      setCreatingUser(true);
      setError(null);

      // Validate required fields
      if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.password) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password length
      if (newUserData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      console.log('Creating new user:', newUserData);

      const response = await api.post('/auth/register', {
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        email: newUserData.email,
        password: newUserData.password,
        role: newUserData.role,
        studentId: newUserData.studentId || '',
        isApproved: newUserData.isApproved,
        isAccountVerified: newUserData.isAccountVerified
      });

      console.log('User created successfully:', response.data);

      // Refresh users list
      fetchUsers();
      
      // Reset form and close modal
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'Admin',
        studentId: '',
        isApproved: true,
        isAccountVerified: true
      });
      setShowCreateUserModal(false);
      
      alert(`Successfully created ${newUserData.role} account!`);

    } catch (err) {
      console.error('Failed to create user:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to create user account';
      setError(errorMessage);
    } finally {
      setCreatingUser(false);
    }
  }

  // ✅ Approve / Reject / Request-Edits for Workshops
  async function handleWorkshopStatusChange(id, action) {
    try {
      setLoading(true);
      setError(null);

      const validActions = ["approve", "reject", "request-edits"];
      if (!validActions.includes(action)) throw new Error(`Invalid action: ${action}`);

      const res = await api.patch(`/workshops/${id}/${action}`);
      const updated = res.data.data;

      // Update local state instantly
      setWorkshops((prev) =>
        prev.map((w) => (w._id === id ? { ...w, status: updated.status } : w))
      );

      alert(`Workshop ${action}d successfully!`);
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle workshop status change confirmation
  function handleWorkshopAction(workshop, action) {
    setSelectedWorkshop(workshop);
    setWorkshopAction(action);
    setShowWorkshopConfirmModal(true);
  }

  // Confirm and execute workshop status change
  function confirmWorkshopAction() {
    if (selectedWorkshop && workshopAction) {
      handleWorkshopStatusChange(selectedWorkshop._id, workshopAction);
      setShowWorkshopConfirmModal(false);
      setSelectedWorkshop(null);
      setWorkshopAction('');
    }
  }

  // Fetch applications for admin
  async function fetchApplications() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/application/all");
      setApplications(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError(err.response?.data?.message || "Failed to fetch applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch all comments (admin/staff only)
  async function fetchAllComments() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/comments/all');
      setAllComments(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError(err.response?.data?.message || 'Failed to fetch comments');
      setAllComments([]);
    } finally {
      setLoading(false);
    }
  }

  // Update application status
  async function updateApplicationStatus(applicationId, status) {
    try {
      setLoading(true);
      
      let endpoint;
      if (status === 'approved') {
        endpoint = `/application/${applicationId}/accept`;
      } else if (status === 'rejected') {
        endpoint = `/application/${applicationId}/reject`;
      } else {
        endpoint = `/application/${applicationId}/reset`;
      }
      
      const res = await api.put(endpoint, 
        status === 'rejected' ? { rejectionReason: 'Application rejected by admin' } : {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      fetchApplications();
      alert(`Application ${status} successfully!`);
    } catch (err) {
      console.error(`Failed to ${status} application:`, err);
      alert(err.response?.data?.message || `Failed to ${status} application`);
    } finally {
      setLoading(false);
    }
  }

  // Send verification email after approval
  async function handleSendVerification(item, type) {
    try {
      setLoading(true);
      const accountType = type === 'vendor' ? 'vendor' : 'user';
      
      const response = await api.post('/auth/send-verification', {
        userId: item._id || item.id,
        accountType
      });

      alert('Verification email sent successfully!');
      
      // Refresh the list
      if (type === 'user') {
        fetchUsers();
      } else if (type === 'vendor') {
        fetchVendors();
      } else if (tab === 'comments') {
        // load comments when admin navigates to comments tab
        if (allComments.length === 0) fetchAllComments();
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
      alert(err.response?.data?.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  }

    // Open delete confirmation modal for a comment
    function handleOpenDeleteModal(comment) {
      setCommentToDelete(comment);
      setDeleteReason('');
      setShowDeleteModal(true);
    }

    function closeDeleteModal() {
      setShowDeleteModal(false);
      setCommentToDelete(null);
      setDeleteReason('');
    }

    // Confirm deletion (admin) - calls DELETE /comments/:id with optional reason
    async function confirmDeleteComment() {
      if (!commentToDelete) return;
      try {
        setDeleting(true);
        setError(null);
        const id = commentToDelete._id || commentToDelete.id;
        await api.delete(`/comments/${id}`, { data: { reason: deleteReason } });
        // remove from local state
        setAllComments(prev => prev.filter(c => (c._id || c.id) !== id));
        closeDeleteModal();
        alert('Comment deleted successfully');
      } catch (err) {
        console.error('Failed to delete comment:', err);
        setError(err.response?.data?.message || 'Failed to delete comment');
      } finally {
        setDeleting(false);
      }
    }

  // Handle application action confirmation
  function handleApplicationAction(app, action) {
    setSelectedApplication(app);
    setConfirmAction(action);
    setShowConfirmModal(true);
  }

  // Confirm and execute application action
  function confirmApplicationAction() {
    if (selectedApplication && confirmAction) {
      updateApplicationStatus(selectedApplication._id, confirmAction);
      setShowConfirmModal(false);
      setSelectedApplication(null);
      setConfirmAction('');
    }
  }

  async function fetchVendors(searchTerm = '') {
    try {
      setLoading(true);
      setError(null);
      
      const url = searchTerm 
        ? `/vendor/search?q=${encodeURIComponent(searchTerm)}` 
        : '/vendor';
      
      console.log('Fetching vendors from:', url);
      
      const res = await api.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Vendors response:', res.data);
      setVendors(res.data.data || res.data || []);
      
    } catch (err) {
      console.error('Vendor fetch error:', err);
      if (err.response?.status === 401) {
        setError('Please log in to access vendors');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch vendors');
      }
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLoyaltyVendors() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.get('http://localhost:4000/api/vendor/loyalty/vendors', {
        withCredentials: true
      });
      
      console.log('Loyalty vendors response:', res.data);
      setLoyaltyVendors(res.data.data || []);
      
    } catch (err) {
      console.error('Loyalty vendors fetch error:', err);
      if (err.response?.status === 401) {
        setError('Please log in to access loyalty vendors');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch loyalty vendors');
      }
      setLoyaltyVendors([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers(searchTerm = '') {
    try {
      setLoading(true);
      setError(null);
      const url = searchTerm ? `/users/search?q=${encodeURIComponent(searchTerm)}` : '/users';
      const res = await api.get(url);
      setUsers(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchEvents(searchTerm = '') {
    try {
      setLoading(true);
      setError(null);
      const url = searchTerm ? `/events/search?q=${encodeURIComponent(searchTerm)}` : '/events';
      const res = await api.get(url);
      setEvents(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }

  function onSearchByCreator(e) {
    e.preventDefault();
    const creator = creatorInput.trim();
    if (creator) {
      setSearchParams({ creator });
      fetchWorkshops(creator);
    } else {
      setSearchParams({});
      fetchWorkshops('');
    }
  }

  function onSearch(e) {
    e.preventDefault();
    const searchTerm = searchInput.trim();
    
    if (activeTab === 'workshops') {
      setCreatorInput(searchTerm);
      if (searchTerm) {
        setSearchParams({ creator: searchTerm });
        fetchWorkshops(searchTerm);
      } else {
        setSearchParams({});
        fetchWorkshops('');
      }
    } else if (activeTab === 'users') {
      fetchUsers(searchTerm);
    } else if (activeTab === 'vendors') {
      fetchVendors(searchTerm);
    } else if (activeTab === 'loyalty') {
      // Loyalty vendors are fetched, filtering happens client-side
    } else if (activeTab === 'events') {
      fetchEvents(searchTerm);
    } else if (activeTab === 'applications') {
      // For applications, we'll filter client-side
    }
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setSearchInput('');
    setError(null);

    if (tab === 'users') {
      if (users.length === 0) fetchUsers();
    } else if (tab === 'vendors') {
      if (vendors.length === 0) fetchVendors();
    } else if (tab === 'loyalty') {
      if (loyaltyVendors.length === 0) fetchLoyaltyVendors();
    } else if (tab === 'comments') {
      if (allComments.length === 0) fetchAllComments();
    } else if (tab === 'events') {
      if (events.length === 0) fetchEvents();
    } else if (tab === 'workshops') {
      if (workshops.length === 0) fetchWorkshops('');
    } else if (tab === 'applications') {
      if (applications.length === 0) fetchApplications();
    }
  }

  function handleEdit(item, type) {
    setEditData({...item});
    setEditType(type);
    setIsEditOpen(true);
  }

  async function handleSave() {
    if (!editData || !editType) return;

    try {
      setSaving(true);
      setError(null);

      let response;
      const id = editData._id || editData.id;

      console.log(`Saving ${editType} with ID:`, id);
      console.log('Data being sent:', editData);

      switch (editType) {
        case 'workshop':
          response = await api.put(`/workshops/${id}`, editData);
          setWorkshops(prev => prev.map(w => (w._id === id || w.id === id) ? (response.data.data || response.data) : w));
          break;
        
        case 'user':
          response = await api.put(`/users/${id}`, editData);
          const updateUser = response.data.data || response.data;
          setUsers(prev => prev.map(u => (u._id === id || u.id === id) ? updateUser : u));
          break;
        
        case 'vendor':
          console.log('Vendor update payload:', editData);
          response = await api.put(`/vendor/${id}`, editData);
          console.log('Vendor update response:', response.data);
          const updateVendors = response.data.data || response.data;
          setVendors(prev => prev.map(v => (v._id === id || v.id === id) ? updateVendors : v));
          break;
        
        case 'event':
          response = await api.put(`/events/${id}`, editData);
          setEvents(prev => prev.map(e => (e._id === id || e.id === id) ? (response.data.data || response.data) : e));
          break;
        
        default:
          throw new Error(`Unknown edit type: ${editType}`);
      }

      setIsEditOpen(false);
      setEditData(null);
      setEditType(null);
      console.log(`${editType} updated successfully:`, response.data);

    } catch (err) {
      console.error(`Failed to update ${editType}:`, err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.response?.statusText || 
                          err.message || 
                          `Failed to update ${editType}`;
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item, type) {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      setLoading(true);
      const id = item._id || item.id;
      
      console.log(`Deleting ${type} with ID:`, id);

      switch (type) {
        case 'workshop':
          await api.delete(`/workshops/${id}`);
          setWorkshops(prev => prev.filter(w => w._id !== id));
          break;
        case 'user':
          await axios.delete(`http://localhost:4000/api/users/${id}`, { withCredentials: true });
          setUsers(prev => prev.filter(u => (u._id !== id && u.id !== id)));
          break;
        case 'vendor':
          await axios.delete(`http://localhost:4000/api/vendor/${id}`, { withCredentials: true });
          setVendors(prev => prev.filter(v => (v._id !== id && v.id !== id)));
          break;
        case 'event':
          await axios.delete(`http://localhost:4000/api/events/${id}`, { withCredentials: true });
          setEvents(prev => prev.filter(e => (e._id !== id && e.id !== id)));
          break;
      }
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      console.error('Full error details:', {
        url: err.config?.url,
        method: err.config?.method,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(err.response?.data?.message || err.message || `Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'needs-edit': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getApprovalStatus = (item) => {
    if (!item.isApproved) return { text: 'Pending Approval', color: 'bg-yellow-500' };
    if (!item.isAccountVerified) return { text: 'Approved - Email Not Verified', color: 'bg-orange-500' };
    return { text: 'Approved & Verified', color: 'bg-green-500' };
  };

  // Filter data based on search input
  const filteredData = {
    workshops: workshops.filter(w => 
      w.workshopName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      w.createdBy?.toLowerCase().includes(searchInput.toLowerCase()) ||
      w.faculty?.toLowerCase().includes(searchInput.toLowerCase())
    ),
    users: users.filter(u =>
      u && (
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(searchInput.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchInput.toLowerCase()) ||
        u.studentId?.toLowerCase().includes(searchInput.toLowerCase())
      )
    ),
    vendors: vendors.filter(v =>
      v && (
        `${v.companyName || ''}`.toLowerCase().includes(searchInput.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchInput.toLowerCase()) ||
        v.shopName?.toLowerCase().includes(searchInput.toLowerCase()) ||
        v.businessType?.toLowerCase().includes(searchInput.toLowerCase())
      )
    ),
    events: events.filter(e =>
      e.title?.toLowerCase().includes(searchInput.toLowerCase()) ||
      e.eventName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchInput.toLowerCase())
    ),
    applications: applications.filter(app =>
      app.vendorId?.companyName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      app.bazaarId?.bazaarName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      app.status?.toLowerCase().includes(searchInput.toLowerCase()) ||
      app.boothSize?.toLowerCase().includes(searchInput.toLowerCase())
    )
    ,
    loyalty: loyaltyVendors.filter(lv =>
      lv.vendorId?.companyName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      lv.promoCode?.toLowerCase().includes(searchInput.toLowerCase()) ||
      lv.status?.toLowerCase().includes(searchInput.toLowerCase())
    ),
    comments: allComments.filter(c =>
      (c?.content || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      (c?.author?.name || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      (c?.eventType || '').toLowerCase().includes(searchInput.toLowerCase())
    )
  };

 const currentData = applySort(
  filteredData[activeTab].filter(applyFilters)
);


  const hasSearchQuery = searchInput.trim().length > 0;
  
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err?.message || err);
    }
    navigate('/login')
  }

  // Open block modal for a user
  const openBlockModal = (user) => {
    setSelectedUser(user);
    setBlockData({
      blockDuration: '',
      reason: ''
    });
    setShowBlockModal(true);
  };



return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 py-8">
      {/* Navigation Links */}
      <div className="absolute top-6 left-6 right-6 flex items-center gap-4">
        <Link
          to="/trips"
          className="text-white font-medium bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow transition"
        >
          Manage Trips
        </Link>
        <Link
          to="/bazaars"
          className="text-white font-medium bg-red-600 hover:bg-orange-700 px-4 py-2 rounded-lg shadow transition"
        >
          Go to Bazaar
        </Link>
        <Link
          to="/sales-report"
          className="text-white font-medium bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow transition"
        >
          📊 Sales Report
        </Link>
        <Link
          to="/clubs"
          className="text-white font-medium bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg shadow transition"
        >
          Clubs
        </Link>
        <div className="ml-auto" />
        <button
          onClick={handleLogout}
          className="text-white font-medium bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg shadow transition"
        >
          Log-Out
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-orange rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
              ADMIN Dashboard
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Discover and manage workshops, users, vendors, events, and applications
            </p>

            {/* Tabs */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-lg p-1">
                {['workshops', 'users', 'vendors', 'loyalty', 'applications', 'comments'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-6 py-2 font-medium rounded-md transition-all ${
                      activeTab === tab
                        ? tab === 'workshops'
                          ? 'bg-pink-600 text-white shadow'
                          : tab === 'users'
                          ? 'bg-blue-600 text-white shadow'
                          : tab === 'vendors'
                          ? 'bg-orange-600 text-white shadow'
                          : tab === 'loyalty'
                          ? 'bg-indigo-600 text-white shadow'
                          : tab === 'events'
                          ? 'bg-green-600 text-white shadow'
                          : 'bg-purple-600 text-white shadow'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {tab === 'workshops'
                      ? '🎓 Workshops'
                      : tab === 'users'
                      ? '👥 Users'
                      : tab === 'vendors'
                      ? '🏪 Vendors'
                      : tab === 'loyalty'
                      ? '💳 Loyalty'
                      : tab === 'comments'
                      ? '💬 Comments'
                      : tab === 'events'
                      ? '📅 Events'
                      : '📋 Applications'}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete Comment Modal */}
            {showDeleteModal && commentToDelete && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-orange border border-gray-300 rounded-xl p-6 w-full max-w-lg shadow-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Comment</h3>
                  <p className="text-gray-600 mb-4">Are you sure you want to delete this comment?</p>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm mb-1">Reason (optional)</label>
                    <input
                      type="text"
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="e.g. Inappropriate language"
                      className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={closeDeleteModal} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancel</button>
                    <button onClick={confirmDeleteComment} disabled={deleting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                      {deleting ? 'Deleting...' : 'Delete Comment'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create buttons */}
            <div className="flex justify-center gap-4 mb-6">
              {activeTab === 'workshops' && (
                <Link
                  to="/workshops/new"
                  className="px-6 py-3 font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition shadow"
                >
                  Create New Workshop
                </Link>
              )}
              
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow"
              >
                👤 Create User
              </button>

              <button
                onClick={() => {
                  setShowBlockedUsers(true);
                  fetchBlockedUsers();
                }}
                className="px-6 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow"
              >
                🚫 Blocked Users
              </button>
            </div>

            {/* Universal Search */}
            <form onSubmit={onSearch} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <label className="text-gray-700 font-medium">
                  Search {activeTab}:
                </label>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={
                    activeTab === 'workshops' 
                      ? "Search by name, creator, or faculty..." 
                      : activeTab === 'users'
                      ? "Search by name, email, or student ID..."
                      : activeTab === 'vendors'
                      ? "Search by name, email, shop name, or business type..."
                      : activeTab === 'loyalty'
                      ? "Search by vendor name, or promo code"
                      : activeTab === 'events'
                      ? "Search by title, name, or location..."
                      : "Search by vendor name, bazaar name, or status..."
                  }
                  className="flex-1 px-4 py-2 text-gray-800 placeholder-gray-500 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                />
                <button
                  type="submit"
                  className="px-6 py-2 font-medium text-white bg-white-600 rounded-lg hover:bg-orange-700 transition"
                >
                  Search
                </button>
                <button
                  type="button"
                    onClick={() => {
                    setSearchInput('');
                    setCreatorInput('');
                    setSearchParams({});
                    if (activeTab === 'workshops') fetchWorkshops('');
                    else if (activeTab === 'users') fetchUsers();
                    else if (activeTab === 'vendors') fetchVendors();
                    else if (activeTab === 'loyalty') fetchLoyaltyVendors();
                    else if (activeTab === 'comments') fetchAllComments();
                    else if (activeTab === 'events') fetchEvents();
                    else if (activeTab === 'applications') fetchApplications();
                  }}
                  className="px-6 py-2 font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* UNIVERSAL FILTERS */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* STATUS */}
                {(activeTab === "workshops" || activeTab === "applications") && (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="needs-edit">Needs Edit</option>
                  </select>
                )}

                {/* FACULTY */}
                {activeTab === "workshops" && (
                  <select
                    value={filterFaculty}
                    onChange={(e) => setFilterFaculty(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Faculty</option>
                    <option value="MET">MET</option>
                    <option value="EMS">EMS</option>
                    <option value="IET">IET</option>
                  </select>
                )}

                {/* ROLE */}
                {activeTab === "users" && (
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Role</option>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="ta">TA</option>
                    <option value="Admin">Admin</option>
                    <option value="EventOffice">EventOffice</option>
                  </select>
                )}

                {/* VERIFIED STATUS */}
                {(activeTab === "users" || activeTab === "vendors") && (
                  <select
                    value={filterVerification}
                    onChange={(e) => setFilterVerification(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Verification</option>
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                  </select>
                )}

                {/* APPROVAL STATUS */}
                {(activeTab === "users" || activeTab === "vendors") && (
                  <select
                    value={filterApproval}
                    onChange={(e) => setFilterApproval(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Approval</option>
                    <option value="true">Approved</option>
                    <option value="false">Not Approved</option>
                  </select>
                )}

                {/* BLOCKED USERS */}
                {activeTab === "users" && (
                  <select
                    value={filterBlocked}
                    onChange={(e) => setFilterBlocked(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Blocked?</option>
                    <option value="true">Blocked</option>
                    <option value="false">Not Blocked</option>
                  </select>
                )}

                {/* BUSINESS TYPE */}
                {activeTab === "vendors" && (
                  <select
                    value={filterBusinessType}
                    onChange={(e) => setFilterBusinessType(e.target.value)}
                    className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Business Type</option>
                    <option value="Food">Food</option>
                    <option value="Clothes">Clothes</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                )}

                {/* DATE RANGE */}
                {(activeTab === "workshops" || activeTab === "events") && (
                  <>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </>
                )}

                {/* SORTING */}
                <select
                  value={filterSort}
                  onChange={(e) => setFilterSort(e.target.value)}
                  className="px-3 py-2 bg-orange text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sort</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="az">A → Z</option>
                  <option value="za">Z → A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading & Error */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading {activeTab}...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4 mb-6">
              <p className="text-center">{error}</p>
            </div>
          )}

          {/* Data Lists */}
          {!loading && currentData.length > 0 && (
            <div className="space-y-4">
              {currentData.filter(item => item).map((item) => {
                const approvalStatus = getApprovalStatus(item);
                
                return (
                  <div
                    key={item._id || item.id}
                    className="bg-orange rounded-xl p-6 border border-gray-300 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        {/* Loyalty */}
                        {activeTab === 'loyalty' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">
                                {item.vendorId?.companyName || "Unknown Vendor"}
                              </h3>
                              <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold">
                                {item.discountRate}% OFF
                              </span>
                            </div>
                            <div className="text-gray-600 text-sm mb-2">
                                <div>🏷️ Code: <strong className="text-gray-800">{item.promoCode}</strong></div>
                            </div>
                            <div className="text-gray-700 mb-3">
                                <button 
                                    onClick={() => alert(`📜 Terms & Conditions:\n\n${item.termsAndConditions}`)}
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    📜 View Terms & Conditions
                                </button>
                            </div>
                          </>
                        )}
                        
                        {/* Workshop */}
                        {activeTab === 'workshops' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">
                                {item.workshopName}
                              </h3>
                              <span className={`${getStatusColor(item.status)} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                                {item.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </div>
                            <div className="text-gray-600 text-sm mb-2">
                              📍 {item.location} • 🗓️ {formatDate(item.startDateTime)} -{" "}
                              {formatDate(item.endDateTime)}
                            </div>
                            <p className="text-gray-700 mb-3">{item.shortDescription}</p>
                            <div className="text-gray-500 text-xs">
                              <span className="bg-white-100 text-orange-800 px-2 py-1 rounded mr-2">
                                🎓 {item.faculty}
                              </span>
                              <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded">
                                👤 {item.createdBy}
                              </span>
                            </div>
                          </>
                        )}
                        
                        {/* Users */}
                        {activeTab === 'users' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">
                                {(item?.firstName || item?.lastName)
                                  ? `${item?.firstName || ''} ${item?.lastName || ''}`.trim()
                                  : "Unnamed User"}
                              </h3>
                              <span className={`${approvalStatus.color} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                                {approvalStatus.text}
                              </span>
                              {item.isBlocked && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                                  🚫 BLOCKED
                                  {item.blockedUntil && (
                                    <span className="ml-1 text-xs">
                                      until {formatDate(item.blockedUntil)}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600 text-sm space-y-1">
                              <div>📧 {item?.email || "No email"}</div>
                              {item?.studentId && <div>🎓 ID: {item.studentId}</div>}
                              {item?.role && <div>👑 {item.role}</div>}
                              {item?.createdAt && (
                                <div>📅 Joined: {formatDate(item.createdAt)}</div>
                              )}
                              {item.warnings && item.warnings.length > 0 && (
                                <div>⚠️ Warnings: {item.warnings.length}</div>
                              )}
                            </div>
                          </>
                        )}
                        
                        {/* Vendors */}
                        {activeTab === 'vendors' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">
                                {(item?.companyName || item?.lastName || item?.shopName)
                                  ? `${item?.companyName || ''}`.trim() || item.shopName
                                  : "Unnamed Vendor"}
                              </h3>
                              <span className={`${approvalStatus.color} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                                {approvalStatus.text}
                              </span>
                            </div>
                            <div className="text-gray-600 text-sm space-y-1">
                              <div>📧 {item?.email || "No email"}</div>
                              {item?.shopName && <div>🏪 Shop: {item.shopName}</div>}
                              {item?.businessType && <div>📊 Business: {item.businessType}</div>}
                              {item?.phone && <div>📞 {item.phone}</div>}
                              {item?.createdAt && (
                                <div>📅 Joined: {formatDate(item.createdAt)}</div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Comments */}
                        {activeTab === 'comments' && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-gray-800">
                                {item?.author?.name || 'Unknown'}
                              </h3>
                              <span className="text-white text-xs px-2 py-1 rounded-full font-semibold bg-indigo-600">
                                {item?.eventType || 'General'}
                              </span>
                              <span className="text-gray-500 text-sm ml-2">
                                {item?._id && `ID: ${String(item._id).slice(-6)}`}
                              </span>
                            </div>
                            <div className="text-gray-600 text-sm mb-2">
                              <div>🕒 {item?.createdAt ? formatDate(item.createdAt) : 'Unknown date'}</div>
                              <div>🔗 {item?.displayEvent || 'N/A'}</div>
                            </div>
                            <p className="text-gray-700 mb-3">{item?.content}</p>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenDeleteModal(item)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                        
                        {/* Events */}
                        {activeTab === 'events' && (
                          <>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {item.title || item.eventName || "Untitled Event"}
                            </h3>
                            <div className="text-gray-600 text-sm mb-2">
                              📍 {item.location || "Unknown"} • 🗓️{" "}
                              {formatDate(item.startDate || item.startDateTime)}
                              {item.endDate && ` - ${formatDate(item.endDate)}`}
                            </div>
                            {item.description && (
                              <p className="text-gray-700 mb-3">{item.description}</p>
                            )}
                          </>
                        )}

                        {/* Applications */}
                        {activeTab === 'applications' && (
                          <>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {item.bazaarId?.bazaarName || 'Campus Booth Application'}
                              <span className={`ml-3 inline-block ${getStatusColor(item.status)} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                                {item.status?.toUpperCase()}
                              </span>
                            </h3>
                            <div className="text-gray-600 text-sm space-y-1">
                              <div>🏪 Vendor: {item.vendorId?.companyName || 'Unknown Vendor'}</div>
                              <div>📏 Booth Size: {item.boothSize}</div>
                              {item.location && <div>📍 Location: {item.location}</div>}
                              {item.duration && <div>⏱️ Duration: {item.duration} week(s)</div>}
                              <div>👥 Attendees: {item.attendees?.length || 0}</div>
                              <div>📅 Applied: {formatDate(item.createdAt)}</div>
                              {item.bazaarId && (
                                <div>🎪 Bazaar: {item.bazaarId.bazaarName} ({formatDate(item.bazaarId.startDate)} - {formatDate(item.bazaarId.endDate)})</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {activeTab === 'applications' ? (
                          <>
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApplicationAction(item, 'approved')}
                                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApplicationAction(item, 'rejected')}
                                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {(item.status === 'approved' || item.status === 'rejected') && (
                              <button
                                onClick={() => handleApplicationAction(item, 'pending')}
                                className="px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition"
                              >
                                Reset to Pending
                              </button>
                            )}
                          </>
                        ) : activeTab === 'workshops' ? (
                          <>
                            {item.status !== 'approved' && (
                              <button
                                onClick={() => handleWorkshopAction(item, 'approve')}
                                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                              >
                                ✅ Approve
                              </button>
                            )}
                            {item.status !== 'rejected' && (
                              <button
                                onClick={() => handleWorkshopAction(item, 'reject')}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                              >
                                ❌ Reject
                              </button>
                            )}
                            {item.status !== 'needs-edit' && (
                              <button
                                onClick={() => handleWorkshopAction(item, 'request-edits')}
                                className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition"
                              >
                                ✏️ Request Edits
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(item, activeTab.slice(0, -1))}
                              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item, activeTab.slice(0, -1))}
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </>
                        ) : activeTab === 'comments' ? (
                          <></>
                        ) : activeTab === 'users' ? (
                          <>
                            <button
                              onClick={() => handleEdit(item, activeTab.slice(0, -1))}
                              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                              Edit
                            </button>
                            
                            {!item.isBlocked ? (
                              <button
                                onClick={() => openBlockModal(item)}
                                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                              >
                                🚫 Block
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnblockUser(item._id)}
                                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                              >
                                ✅ Unblock
                              </button>
                            )}

                            {(activeTab === 'users') && !item.isAccountVerified && (
                              <button
                                onClick={() => handleSendVerification(item, activeTab.slice(0, -1))}
                                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                              >
                                Send Verification
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item, activeTab.slice(0, -1))}
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                          {activeTab !== 'loyalty' && (
                            <button
                              onClick={() => handleEdit(item, activeTab.slice(0, -1))}
                              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                              Edit
                            </button>
                          )}
                            {(activeTab === 'vendors') && !item.isAccountVerified && (
                              <button
                                onClick={() => handleSendVerification(item, activeTab.slice(0, -1))}
                                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                              >
                                Send Verification
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item, activeTab.slice(0, -1))}
                              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && currentData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No {activeTab} found{hasSearchQuery ? " matching your search" : ""}.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-orange border border-gray-300 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Create New User
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Create Admin or EventOffice accounts
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-1">First Name *</label>
                <input
                  type="text"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter first name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Last Name *</label>
                <input
                  type="text"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Email *</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Password *</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Role *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="EventOffice">EventOffice</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Student ID (Optional)</label>
                <input
                  type="text"
                  value={newUserData.studentId}
                  onChange={(e) => setNewUserData({...newUserData, studentId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter student ID (optional)"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center text-gray-700 gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newUserData.isApproved}
                    onChange={(e) => setNewUserData({...newUserData, isApproved: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Auto Approve
                </label>
                
                <label className="flex items-center text-gray-700 gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newUserData.isAccountVerified}
                    onChange={(e) => setNewUserData({...newUserData, isAccountVerified: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Auto Verify
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-orange border border-gray-300 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Block User
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Blocking: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-1">Block Duration (hours)</label>
                <input
                  type="number"
                  value={blockData.blockDuration}
                  onChange={(e) => setBlockData({...blockData, blockDuration: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Leave empty for permanent block"
                  min="1"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Leave empty for permanent block, or enter hours for temporary block
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-1">Reason for Blocking *</label>
                <textarea
                  value={blockData.reason}
                  onChange={(e) => setBlockData({...blockData, reason: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter reason for blocking this user"
                  rows="3"
                  required
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-red-700 text-sm">
                  ⚠️ <strong>Warning:</strong> Blocked users will not be able to access most features.
                  {blockData.blockDuration ? ` This block will last for ${blockData.blockDuration} hours.` : ' This is a permanent block.'}
                </p>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                  disabled={blockingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockUser}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={blockingUser || !blockData.reason.trim()}
                >
                  {blockingUser ? 'Blocking...' : 'Block User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Users Modal */}
      {showBlockedUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-orange border border-gray-300 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                🚫 Blocked Users ({blockedUsers.length})
              </h3>
              <button
                onClick={() => setShowBlockedUsers(false)}
                className="text-gray-500 text-2xl hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>

            {blockedUsers.length > 0 ? (
              <div className="space-y-4">
                {blockedUsers.map((user) => (
                  <div key={user._id} className="bg-gray-50 rounded-xl p-6 border border-red-300">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-xl font-bold text-gray-800">
                            {user.firstName} {user.lastName}
                          </h4>
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                            🚫 BLOCKED
                          </span>
                          {user.blockedUntil && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
                              Until: {formatDate(user.blockedUntil)}
                            </span>
                          )}
                          {!user.blockedUntil && (
                            <span className="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                              PERMANENT
                            </span>
                          )}
                        </div>
                        <div className="text-gray-600 text-sm space-y-1">
                          <div>📧 {user.email}</div>
                          {user.studentId && <div>🎓 ID: {user.studentId}</div>}
                          <div>👑 Role: {user.role}</div>
                          {user.warnings && user.warnings.length > 0 && (
                            <div>⚠️ Warnings: {user.warnings.length}</div>
                          )}
                          <div>📅 Blocked Since: {formatDate(user.updatedAt)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUnblockUser(user._id)}
                          className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                        >
                          ✅ Unblock
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No blocked users found.</p>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowBlockedUsers(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Edit Drawer */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
          <div className="w-full sm:w-1/2 lg:w-1/3 bg-orange border-l border-gray-300 p-6 overflow-y-auto animate-slide-in-right shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 capitalize">
                Edit {editType}
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                disabled={saving}
                className="text-gray-500 text-2xl hover:text-gray-700 transition disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* Workshop Edit */}
            {editType === "workshop" && editData && (
              <div className="space-y-4">
                <label className="block text-gray-700">Workshop Name</label>
                <input
                  value={editData.workshopName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, workshopName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <label className="block text-gray-700">Location</label>
                <input
                  value={editData.location || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <label className="block text-gray-700">Description</label>
                <textarea
                  value={editData.shortDescription || ""}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      shortDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows="3"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-4 py-2 font-semibold bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* User Edit */}
            {editType === "user" && editData && (
              <div className="space-y-4">
                <label className="block text-gray-700">First Name</label>
                <input
                  value={editData.firstName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, firstName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <label className="block text-gray-700">Last Name</label>
                <input
                  value={editData.lastName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <label className="block text-gray-700">Email</label>
                <input
                  value={editData.email || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <label className="block text-gray-700">Student ID</label>
                <input
                  value={editData.studentId || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, studentId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <label className="block text-gray-700">Role</label>
                <select
                  value={editData.role || "student"}
                  onChange={(e) =>
                    setEditData({ ...editData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                  <option value="ta">TA</option>
                  <option value="professor">Professor</option>
                  <option value="vendor">Vendor</option>
                  <option value="Admin">Admin</option>
                  <option value="EventOffice">EventOffice</option>
                </select>
                
                <label className="flex items-center text-gray-700 gap-2">
                  <input
                    type="checkbox"
                    checked={editData.isAccountVerified || false}
                    onChange={(e) =>
                      setEditData({ ...editData, isAccountVerified: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Account Verified
                </label>
                
                <label className="flex items-center text-gray-700 gap-2">
                  <input
                    type="checkbox"
                    checked={editData.isApproved || false}
                    onChange={(e) =>
                      setEditData({ ...editData, isApproved: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  User Approved
                </label>

                {editData.isBlocked && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">
                      🚫 This user is currently blocked
                      {editData.blockedUntil && (
                        <span> until {formatDate(editData.blockedUntil)}</span>
                      )}
                    </p>
                  </div>
                )}

                {editData.isApproved && !editData.isAccountVerified && (
                  <button
                    onClick={async () => {
                      await handleSave();
                      handleSendVerification(editData, 'user');
                    }}
                    className="w-full py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Approve & Send Verification Email
                  </button>
                )}
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-4 py-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Vendor Edit */}
            {editType === "vendor" && editData && (
              <div className="space-y-4">
                <label className="block text-gray-700">Company Name</label>
                <input
                  value={editData.companyName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, companyName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <label className="block text-gray-700">Email</label>
                <input
                  value={editData.email || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                <label className="flex items-center text-gray-700 gap-2">
                  <input
                    type="checkbox"
                    checked={editData.isAccountVerified || false}
                    onChange={(e) =>
                      setEditData({ ...editData, isAccountVerified: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Account Verified
                </label>
                
                <label className="flex items-center text-gray-700 gap-2">
                  <input
                    type="checkbox"
                    checked={editData.isApproved || false}
                    onChange={(e) =>
                      setEditData({ ...editData, isApproved: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Vendor Approved
                </label>

                {editData.isApproved && !editData.isAccountVerified && (
                  <button
                    onClick={async () => {
                      await handleSave();
                      handleSendVerification(editData, 'vendor');
                    }}
                    className="w-full py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                  >
                    Approve & Send Verification Email
                  </button>
                )}
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-4 py-2 font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Event Edit */}
            {editType === "event" && editData && (
              <div className="space-y-4">
                <label className="block text-gray-700">Event Title</label>
                <input
                  value={editData.title || editData.eventName || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value, eventName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <label className="block text-gray-700">Description</label>
                <textarea
                  value={editData.description || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                />
                <label className="block text-gray-700">Location</label>
                <input
                  value={editData.location || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-50 text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-4 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-orange border border-gray-300 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {confirmAction} this application from{" "}
              <strong>{selectedApplication?.vendorId?.companyName || 'Unknown Vendor'}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmApplicationAction}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  confirmAction === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : confirmAction === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                Confirm {confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workshop Status Confirmation Modal */}
      {showWorkshopConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-orange border border-gray-300 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Workshop Action
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to <strong>{workshopAction}</strong> the workshop{" "}
              <strong>"{selectedWorkshop?.workshopName}"</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWorkshopConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmWorkshopAction}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  workshopAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : workshopAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                Confirm {workshopAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation for Drawer */}
      <style>
        {`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
        `}
      </style>
    </div>
  );
}