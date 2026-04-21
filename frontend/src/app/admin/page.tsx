"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Package, FileText, Plus, LogOut, DollarSign, Loader2, Server, Settings, LayoutDashboard, Eye, Download, X, Store, Printer, BarChart3, QrCode, Banknote, CreditCard, Users, UserPlus, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Loading...");
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, cash: 0, upi: 0, card: 0 });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tabs: 'dashboard' | 'settings' | 'staff'
  const [activeTab, setActiveTab] = useState("dashboard"); 

  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);

  const [storeDetails, setStoreDetails] = useState({
    name: "NEXUS TECH STORE",
    address: "KLE Technological University Campus",
    city: "Belagavi, Karnataka 590008",
    phone: "+91 98765 43210",
    email: "billing@nexustech.in",
    gstin: "29ABCDE1234F1Z5",
    qrCodeImage: "",
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", price: "", stock_quantity: "", category: "Electronics" });

  // NEW: Staff Management State
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("pos_user") || "{}");
    const token = localStorage.getItem("pos_token");
    if (!token || user.role !== "ADMIN") { alert("Access Denied."); router.push("/"); return; }
    
    setAdminName(user.name);
    const savedStore = localStorage.getItem("store_settings");
    if (savedStore) setStoreDetails(JSON.parse(savedStore));

    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:3000/invoices", { headers: { Authorization: `Bearer ${token}` } });
      const fetchedInvoices = response.data;
      setInvoices(fetchedInvoices);
      
      let rev = 0, cash = 0, upi = 0, card = 0;
      fetchedInvoices.forEach((inv: any) => {
        rev += inv.total_amount;
        if (inv.payment_method === 'CASH') cash += inv.total_amount;
        if (inv.payment_method === 'UPI') upi += inv.total_amount;
        if (inv.payment_method === 'CARD') card += inv.total_amount;
      });

      setMetrics({ revenue: rev, orders: fetchedInvoices.length, cash, upi, card });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    const token = localStorage.getItem("pos_token");
    try {
      await axios.post("http://localhost:3000/products", {
        name: newProduct.name, sku: newProduct.sku, price: parseFloat(newProduct.price), stock_quantity: parseInt(newProduct.stock_quantity), category: newProduct.category
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Product added to database!");
      setNewProduct({ name: "", sku: "", price: "", stock_quantity: "", category: "Electronics" });
    } catch (error: any) { alert(error.response?.data?.message || "Failed to add product"); } finally { setIsAdding(false); }
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("store_settings", JSON.stringify(storeDetails));
    alert("Store details updated! These will now appear on all new receipts.");
  };

  // NEW: Handle Staff Creation
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStaff(true);
    try {
      // Sends creation request to backend. Assigns role "CASHIER" securely.
      await axios.post("http://localhost:3000/auth/register", {
        name: newStaff.name,
        email: newStaff.email,
        password: newStaff.password,
        role: "CASHIER"
      });
      alert(`✅ Account for ${newStaff.name} created successfully! They can now log in.`);
      setNewStaff({ name: "", email: "", password: "" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create account. Check backend console.");
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreDetails({ ...storeDetails, qrCodeImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    router.push("/");
  };

  const printSpecificInvoice = (inv: any) => {
    setViewInvoice(inv);
    setTimeout(() => window.print(), 100);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@media print { @page { margin: 0; } body { -webkit-print-color-adjust: exact; } }`}} />

      <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-sans selection:bg-blue-500/30 print:hidden flex flex-col">
        
        {/* Top Navigation */}
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"><Server size={24} /></div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">System Terminal</h1>
                <p className="text-slate-500 text-sm font-medium">Welcome back, {adminName}</p>
              </div>
            </div>
            
            {/* ENHANCED TABS */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 ml-4">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><LayoutDashboard size={16}/> Dashboard</button>
              <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'staff' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Users size={16}/> Staff</button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}><Settings size={16}/> Settings</button>
            </div>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-all text-sm font-medium"><LogOut size={16} /> Disconnect</button>
        </header>

        {/* TAB 1: MAIN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1">
            <div className="grid grid-cols-3 gap-6 mb-10">
              <motion.div whileHover={{ scale: 1.02 }} onClick={() => setShowRevenueModal(true)} className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-blue-500/50 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-green-500"><DollarSign size={80} /></div>
                <p className="text-slate-400 font-medium mb-1">Gross Revenue</p>
                <h2 className="text-4xl font-black text-white">₹{metrics.revenue.toFixed(2)}</h2>
                <p className="text-blue-400 text-sm mt-4 flex items-center gap-1"><BarChart3 size={14} /> Click for detailed breakdown</p>
              </motion.div>

              <motion.div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-500"><FileText size={80} /></div>
                <p className="text-slate-400 font-medium mb-1">Total Transactions</p>
                <h2 className="text-4xl font-black text-white">{metrics.orders}</h2>
                <p className="text-blue-400 text-sm mt-4">Completed orders</p>
              </motion.div>

              <motion.div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-purple-500"><Package size={80} /></div>
                <p className="text-slate-400 font-medium mb-1">Database Status</p>
                <h2 className="text-4xl font-black text-white">Online</h2>
                <p className="text-purple-400 text-sm mt-4">PostgreSQL Connected</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="col-span-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl h-fit">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Plus className="text-blue-500" /> Append Inventory</h3>
                <form onSubmit={handleAddProduct} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Product Name</label>
                  <input 
                    required 
                    type="text" 
                    value={newProduct.name} 
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    minLength={3}
                    maxLength={100}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      newProduct.name && newProduct.name.length < 3
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500/50'
                    }`}
                    placeholder="e.g. RTX 4090" 
                  />
                  {newProduct.name && newProduct.name.length < 3 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Product name must be at least 3 characters</p>
                  )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">SKU</label>
                      <input required type="text" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="GPU-001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
                      <input required type="text" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Electronics" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Price (₹)</label>
                      <input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={newProduct.price} 
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow empty string so user can clear the field
                          if (inputValue === '') {
                            setNewProduct({...newProduct, price: inputValue});
                          } else {
                            const val = parseFloat(inputValue);
                            // Only update if it's a valid positive number
                            if (!isNaN(val) && val >= 0) {
                              setNewProduct({...newProduct, price: inputValue});
                            }
                          }
                        }}
                        min="0"
                        className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                          newProduct.price && parseFloat(newProduct.price) < 0
                            ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                            : 'border-slate-800 text-white focus:ring-blue-500/50'
                        }`}
                        placeholder="0.00" 
                      />
                      {newProduct.price && parseFloat(newProduct.price) < 0 && (
                        <p className="text-xs text-red-400 mt-1 font-medium">Price must be a positive number</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Stock Qty</label>
                      <input 
                        required 
                        type="number" 
                        value={newProduct.stock_quantity} 
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Allow empty string so user can clear the field
                          if (inputValue === '') {
                            setNewProduct({...newProduct, stock_quantity: inputValue});
                          } else {
                            const val = parseInt(inputValue);
                            // Only update if it's a valid non-negative number
                            if (!isNaN(val) && val >= 0) {
                              setNewProduct({...newProduct, stock_quantity: inputValue});
                            }
                          }
                        }}
                        min="0"
                        className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                          newProduct.stock_quantity && parseInt(newProduct.stock_quantity) < 0
                            ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                            : 'border-slate-800 text-white focus:ring-blue-500/50'
                        }`}
                        placeholder="0" 
                      />
                      {newProduct.stock_quantity && parseInt(newProduct.stock_quantity) < 0 && (
                        <p className="text-xs text-red-400 mt-1 font-medium">Stock must be a non-negative number</p>
                      )}
                    </div>
                  </div>
                  <button 
                    disabled={isAdding || newProduct.name.length < 3 || parseFloat(newProduct.price) < 0 || parseInt(newProduct.stock_quantity) < 0} 
                    type="submit" 
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex justify-center items-center"
                  >
                    {isAdding ? <Loader2 className="animate-spin" /> : "Execute Database Write"}
                  </button>
                </form>
              </div>

              <div className="col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 overflow-hidden flex flex-col h-[550px]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="text-purple-500" /> Transaction Ledger</h3>
                <div className="overflow-y-auto flex-1 pr-4 space-y-3">
                  {invoices.length === 0 ? <div className="text-slate-500 text-center py-10">No transactions recorded yet.</div> : 
                    invoices.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold ${inv.payment_method === 'UPI' ? 'bg-blue-500/10 text-blue-400' : inv.payment_method === 'CASH' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {inv.payment_method}
                          </div>
                          <div>
                            <p className="text-white font-medium font-mono">INV-{inv.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-slate-500 text-sm mt-0.5">{new Date(inv.created_at).toLocaleString()} • <span className="text-blue-400">{inv.cashier?.name || "System"}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">₹{inv.total_amount.toFixed(2)}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{inv.items?.length || 0} items</p>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewInvoice(inv)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors" title="View Details"><Eye size={18} /></button>
                            <button onClick={() => printSpecificInvoice(inv)} className="p-2 bg-blue-600/20 hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition-colors" title="Download PDF"><Download size={18} /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: STAFF MANAGEMENT */}
        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><UserPlus className="text-blue-500"/> Register New Cashier</h2>
              <p className="text-slate-500 mb-8 pb-6 border-b border-slate-800">Create a secure login for your staff. Cashiers cannot access this Admin panel.</p>
              
              <form onSubmit={handleCreateStaff} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Full Name (Min 3 chars)</label>
                  <input 
                    required 
                    type="text" 
                    value={newStaff.name} 
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    minLength={3}
                    maxLength={100}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      newStaff.name && newStaff.name.length < 3
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                    placeholder="e.g. John Doe" 
                  />
                  {newStaff.name && newStaff.name.length < 3 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Name must be at least 3 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Login Email</label>
                  <input 
                    required 
                    type="email" 
                    value={newStaff.email} 
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      newStaff.email && !newStaff.email.includes('@')
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                    placeholder="john@nexustech.in" 
                  />
                  {newStaff.email && !newStaff.email.includes('@') && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Please enter a valid email address</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Secure Password (Min 8 chars)</label>
                  <input 
                    required 
                    type="password" 
                    value={newStaff.password} 
                    onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                    minLength={8}
                    maxLength={50}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      newStaff.password && newStaff.password.length < 8
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                    placeholder="••••••••" 
                  />
                  {newStaff.password && newStaff.password.length < 8 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Password must be at least 8 characters</p>
                  )}
                </div>
                <div className="pt-4">
                  <button 
                    disabled={isCreatingStaff || newStaff.name.length < 3 || !newStaff.email.includes('@') || newStaff.password.length < 8} 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] flex justify-center items-center"
                  >
                    {isCreatingStaff ? <Loader2 className="animate-spin" /> : "Authorize & Create Account"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
              <ShieldCheck className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white text-center mb-4">Security & Access Control</h3>
              <div className="space-y-4 text-slate-400 text-sm">
                <div className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span><strong>Role Isolation:</strong> Accounts created here are strictly assigned the `CASHIER` role. They will automatically be routed to the POS terminal upon login.</span></div>
<div className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span><strong>Audit Trail:</strong> Every transaction processed will permanently record the ID of the cashier who executed it, visible in your Transaction Ledger.</span></div>
<div className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div><span><strong>Password Security:</strong> Passwords are automatically hashed and salted by the NestJS backend before reaching the PostgreSQL database.</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Store className="text-blue-500"/> Brand & Store Configuration</h2>
            <p className="text-slate-500 mb-8 pb-8 border-b border-slate-800">Update your store details. This information will appear on all generated PDF receipts.</p>
            
            <form onSubmit={handleSaveStoreSettings} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Registered Store Name (Min 3 chars)</label>
                  <input 
                    type="text" 
                    value={storeDetails.name} 
                    onChange={(e) => setStoreDetails({...storeDetails, name: e.target.value})}
                    minLength={3}
                    maxLength={100}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      storeDetails.name && storeDetails.name.length < 3
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                  />
                  {storeDetails.name && storeDetails.name.length < 3 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Store name must be at least 3 characters</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-2">Street Address (Min 5 chars)</label>
                  <input 
                    type="text" 
                    value={storeDetails.address} 
                    onChange={(e) => setStoreDetails({...storeDetails, address: e.target.value})}
                    minLength={5}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      storeDetails.address && storeDetails.address.length < 5
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                  />
                  {storeDetails.address && storeDetails.address.length < 5 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Address must be at least 5 characters</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">City & Pincode</label>
                  <input type="text" value={storeDetails.city} onChange={(e) => setStoreDetails({...storeDetails, city: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">GSTIN (Tax ID) - 15 Characters</label>
                  <input 
                    type="text" 
                    value={storeDetails.gstin} 
                    onChange={(e) => setStoreDetails({...storeDetails, gstin: e.target.value.toUpperCase()})} 
                    maxLength={15}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      storeDetails.gstin && storeDetails.gstin.length !== 15
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`} 
                  />
                  {storeDetails.gstin && storeDetails.gstin.length !== 15 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">GSTIN must be exactly 15 characters ({storeDetails.gstin.length}/15)</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Support Email</label>
                  <input 
                    type="email" 
                    value={storeDetails.email} 
                    onChange={(e) => setStoreDetails({...storeDetails, email: e.target.value})}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      storeDetails.email && !storeDetails.email.includes('@')
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                  />
                  {storeDetails.email && !storeDetails.email.includes('@') && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Please enter a valid email address</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Support Phone - 10 Digits</label>
                  <input 
                    type="text" 
                    value={storeDetails.phone} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setStoreDetails({...storeDetails, phone: val});
                    }}
                    placeholder="e.g. 9876543210"
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      storeDetails.phone && storeDetails.phone.length !== 10
                        ? 'border-red-500 text-red-400 focus:ring-red-500/50'
                        : 'border-slate-800 text-white focus:ring-blue-500'
                    }`}
                  />
                  {storeDetails.phone && storeDetails.phone.length !== 10 && (
                    <p className="text-xs text-red-400 mt-1 font-medium">Phone must be exactly 10 digits ({storeDetails.phone.length}/10)</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-400 mb-2">Upload UPI QR Code (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleQRUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 transition-all"
                />
                {storeDetails.qrCodeImage && <img src={storeDetails.qrCodeImage} alt="QR Preview" className="mt-3 h-24 w-24 rounded-lg border border-slate-700 object-cover" />}
              </div>
              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button 
                  type="submit" 
                  disabled={storeDetails.phone && storeDetails.phone.length !== 10 || storeDetails.gstin && storeDetails.gstin.length !== 15}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* MODALS (Revenue & Invoice Preview) remain unchanged below */}
        <AnimatePresence>
          {showRevenueModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full relative">
                <button onClick={() => setShowRevenueModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><BarChart3 className="text-blue-500"/> Revenue Analysis</h2>
                <div className="space-y-6">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-400 text-sm font-medium mb-1">Total System Revenue</p>
                    <p className="text-4xl font-black text-white">₹{metrics.revenue.toFixed(2)}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-slate-400 font-medium text-sm uppercase tracking-wider">By Payment Method</h4>
                    <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/50"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><QrCode size={16}/></div><span className="text-slate-300 font-medium">UPI / Digital</span></div><span className="font-bold text-white">₹{metrics.upi.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/50"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center"><Banknote size={16}/></div><span className="text-slate-300 font-medium">Cash Register</span></div><span className="font-bold text-white">₹{metrics.cash.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/50"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center"><CreditCard size={16}/></div><span className="text-slate-300 font-medium">Card Swipe</span></div><span className="font-bold text-white">₹{metrics.card.toFixed(2)}</span></div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewInvoice && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 print:hidden">
              <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="bg-white w-full max-w-sm rounded-t-lg rounded-b-3xl shadow-2xl overflow-hidden font-mono text-sm relative">
                <div className="h-4 w-full bg-[radial-gradient(circle,transparent_50%,white_50%)] bg-[length:16px_16px] bg-top -mt-2"></div>
                <div className="p-8 pt-4 text-slate-800">
                  <div className="text-center mb-6">
                    <Store className="w-10 h-10 mx-auto mb-2 text-slate-800" />
                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">{storeDetails.name}</h2>
                    <p className="text-slate-500 text-xs mt-1">{new Date(viewInvoice.created_at).toLocaleString()}</p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 py-4 mb-4">
                    <p className="flex justify-between text-slate-600"><span>Receipt:</span> <span>#{viewInvoice.id.substring(0,8).toUpperCase()}</span></p>
                    <p className="flex justify-between text-slate-600"><span>Cashier:</span> <span className="text-blue-600">{viewInvoice.cashier?.name || "System"}</span></p>
                  </div>
                  <div className="space-y-2 mb-4 pb-4 border-b border-dashed border-slate-300">
                    <div className="flex justify-between font-bold text-slate-800 pb-2"><span>Item</span><span>Total</span></div>
                    {viewInvoice.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-600"><span className="truncate w-32">{item.quantity}x {item.product?.name || "Product"}</span><span>₹{(item.price_at_sale * item.quantity).toFixed(2)}</span></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-300 pt-4 mb-8">
                    <span className="text-slate-600 font-bold uppercase">Total</span><span className="text-2xl font-black text-slate-900">₹{viewInvoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setViewInvoice(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 font-sans"><X size={18} /> Close</button>
                    <button onClick={() => setTimeout(() => window.print(), 100)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 font-sans shadow-lg shadow-blue-500/30"><Printer size={18} /> Print</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* PDF PRINT UI */}
      {viewInvoice && (
        <div className="hidden print:block w-[210mm] min-h-[297mm] mx-auto bg-white text-black font-sans box-border pt-8 pl-10 pr-10">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">{storeDetails.name}</h1>
              <p className="text-slate-600 text-sm mt-2 max-w-xs">{storeDetails.address}, {storeDetails.city}</p>
              <p className="text-slate-600 text-sm">{storeDetails.phone} | {storeDetails.email}</p>
              <p className="text-slate-800 font-bold text-sm mt-2">GSTIN: {storeDetails.gstin}</p>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-light text-slate-300 uppercase tracking-widest mb-4">Tax Invoice</h2>
              <p className="font-bold text-lg text-slate-900">#{viewInvoice.id.substring(0,8).toUpperCase()}</p>
              <p className="text-slate-600 mt-1">Date: {new Date(viewInvoice.created_at).toLocaleDateString()}</p>
              <p className="text-slate-600">Time: {new Date(viewInvoice.created_at).toLocaleTimeString()}</p>
              <p className="text-slate-800 mt-2 text-sm">Cashier: <span className="font-bold">{viewInvoice.cashier?.name || "System"}</span></p>
              <div className="mt-2 inline-block bg-slate-100 rounded px-3 py-1">
                <p className="text-slate-800 text-sm">Payment: <span className="font-bold">{viewInvoice.payment_method}</span></p>
              </div>
            </div>
          </div>

          <table className="w-full text-left mb-10 border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-sm uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold rounded-tl-lg">Description</th>
                <th className="py-3 px-4 font-semibold text-center">Qty</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Price</th>
                <th className="py-3 px-4 font-semibold text-right rounded-tr-lg">Total</th>
              </tr>
            </thead>
            <tbody>
              {viewInvoice.items?.map((item: any, i: number) => (
                <tr key={i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="py-4 px-4 font-medium text-slate-800">{item.product?.name || `Product ID: ${item.product_id}`}</td>
                  <td className="py-4 px-4 text-center text-slate-700">{item.quantity}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₹{item.price_at_sale.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">₹{(item.price_at_sale * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-16">
            <div className="w-80 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between text-2xl font-black text-slate-900 border-t-2 border-slate-300 pt-4 mt-4">
                <span>Total Paid</span><span>₹{viewInvoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-dashed border-slate-300 pt-8 mt-16 text-center text-slate-500 text-sm">
            <h4 className="font-bold text-slate-800 text-lg mb-2">Thank you for shopping with us!</h4>
            <p>Goods once sold cannot be returned without original receipt. Returns valid for 14 days.</p>
            <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest">
              Generated by Nexus POS System • Authorized Signatory
            </p>
          </div>
        </div>
      )}
    </>
  );
}