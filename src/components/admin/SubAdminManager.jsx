import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, UserPlus, Shield, Trash2, Edit, Eye, EyeOff, 
  X, CheckCircle, AlertCircle, Loader2, Lock, User, Mail, ShieldCheck
} from 'lucide-react';

// ✅ 1. Import necessary Firebase modules
import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  Timestamp,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

// ✅ 2. Import YOUR project's firebase config
import { db, auth } from '../../services/firebase'; // Adjust path if needed

const SubAdminManager = ({ onBack }) => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modal & Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);

  // Permissions Data
  const initialPermissions = {
    manageStudents: true,
    manageNotes: true,
    manageAnnouncements: true,
    markAttendance: true,
    createQuizzes: true,
    viewTickets: true,
    respondTickets: true
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    permissions: { ...initialPermissions }
  });

  // --- Notification Helper ---
  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- 3. Fixed: Fetch Sub-Admins from the correct 'admins' collection ---
  useEffect(() => {
    setLoading(true);
    
    // Query the 'admins' collection for role == 'subadmin'
    const q = query(collection(db, 'admins'), where('role', '==', 'subadmin'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubAdmins(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 4. Fixed: Create Sub-Admin Logic using Environment Variables ---
  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      notify("Password must be at least 6 characters", "error");
      return;
    }

    setProcessing(true);
    let secondaryApp = null;

    try {
      // ✅ Use Environment Variables (Same as adminService.js)
      const secondaryConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };

      if (!secondaryConfig.apiKey) throw new Error("API Key missing in .env");

      // Initialize Secondary App
      secondaryApp = initializeApp(secondaryConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // Create User in Auth
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );

      const subAdminUid = cred.user.uid;

      // Sign out secondary immediately
      await signOut(secondaryAuth);

      // ✅ Save to the correct 'admins' collection in MAIN Firestore
      await setDoc(doc(db, 'admins', subAdminUid), {
        uid: subAdminUid,
        name: formData.name,
        email: formData.email,
        role: 'subadmin',
        permissions: formData.permissions,
        createdBy: auth.currentUser ? auth.currentUser.uid : 'system',
        createdAt: Timestamp.now()
      });

      notify('Sub-admin created successfully');
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error("Creation Error:", error);
      const msg = error.code === 'auth/email-already-in-use' 
        ? 'Email already in use' 
        : error.message;
      notify(msg, 'error');
    } finally {
      if (secondaryApp) {
        await deleteApp(secondaryApp).catch(console.error);
      }
      setProcessing(false);
    }
  };

  // --- Logic: Update Permissions ---
  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    try {
      setProcessing(true);
      // ✅ Fixed collection path
      const adminDocRef = doc(db, 'admins', selectedAdmin.id);
      
      await updateDoc(adminDocRef, {
        name: formData.name,
        permissions: formData.permissions,
        updatedAt: Timestamp.now()
      });

      notify('Permissions updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      resetForm();
    } catch (e) {
      console.error(e);
      notify('Failed to update permissions', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // --- Logic: Delete Sub-Admin ---
  const handleDeleteSubAdmin = async (adminId, name) => {
    if (!confirm(`Are you sure you want to remove ${name} as a sub-admin?\n\nNote: This removes their database access, but the login account remains in Authentication.`)) return;

    try {
      // ✅ Fixed collection path
      await deleteDoc(doc(db, 'admins', adminId));
      notify('Sub-admin removed from database');
    } catch (e) {
      console.error(e);
      notify('Failed to remove sub-admin', 'error');
    }
  };

  // --- Helper Functions ---
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      permissions: { ...initialPermissions }
    });
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '', 
      permissions: { ...admin.permissions }
    });
    setShowEditModal(true);
  };

  // --- RENDER (UI Code remains the same, simplified for brevity) ---
  if (loading && !subAdmins.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading administrative data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 bg-white min-h-screen">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Sub-Admin Management
          </h1>
          <p className="text-gray-500">Create and manage access for staff members</p>
        </div>
        
        <button
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add New Admin
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-bottom border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrator</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subAdmins.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">
                    No sub-admins found. Click "Add New Admin" to create one.
                  </td>
                </tr>
              ) : (
                subAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">{admin.name}</div>
                          <div className="text-xs text-gray-500">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(admin.permissions || {})
                          .filter(([_, val]) => val)
                          .slice(0, 3)
                          .map(([key]) => (
                            <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                        {Object.values(admin.permissions || {}).filter(Boolean).length > 3 && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full">
                            +{Object.values(admin.permissions || {}).filter(Boolean).length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(admin)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Permissions"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubAdmin(admin.id, admin.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals (Create & Edit) */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {showCreateModal ? 'Add New Sub-Admin' : 'Edit Permissions'}
              </h2>
              <button 
                onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateSubAdmin : handleUpdatePermissions} className="p-6">
              <div className="space-y-4 mb-8">
                {/* Inputs for Name, Email, Password - Simplified for brevity but kept functional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Permissions Checkboxes */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-blue-500" />
                  Define Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.keys(formData.permissions).map((key) => (
                    <label 
                      key={key} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        formData.permissions[key] 
                        ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={formData.permissions[key]}
                          onChange={() => togglePermission(key)}
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${formData.permissions[key] ? 'bg-blue-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.permissions[key] ? 'translate-x-5' : ''}`} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95 flex items-center justify-center"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    showCreateModal ? 'Create Admin Account' : 'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminManager;