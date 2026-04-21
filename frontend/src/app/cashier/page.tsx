"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, CreditCard, Banknote, QrCode, Trash2, Loader2, Store, Printer, X, Plus, Minus, CheckCircle2, Phone, LogOut, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function CashierPOS() {
  const router = useRouter();
  const [cashierName, setCashierName] = useState("Loading...");
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number; stock: number }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [isUPIScanning, setIsUPIScanning] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardData, setCardData] = useState({ number: '', exp: '', cvv: '' });

  // Search & Customer State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const [storeDetails, setStoreDetails] = useState({
    name: "VENDORA POS",
    address: "Near Jio Petrol Pump, Khanapur Road, Tilakwadi, Belagavi Karnataka - 590006",
    phone: "+91 7204908770",
    email: "billing@vendorapos.in",
    gstin: "29ABCDE1234F1Z5"
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("pos_user") || "{}");
    const token = localStorage.getItem("pos_token");
    if (!user.name || !token) { router.push("/"); return; }
    setCashierName(user.name);
    fetchProducts(token);

    const savedStore = localStorage.getItem("store_settings");
    if (savedStore) {
      setStoreDetails(JSON.parse(savedStore));
    }

    // Close search dropdown if clicked outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  const fetchProducts = async (token: string) => {
    try {
      const response = await axios.get("http://localhost:3000/products", { headers: { Authorization: `Bearer ${token}` } });
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: any) => {
    const currentInCart = cart.find(item => item.id === product.id)?.qty || 0;
    if (currentInCart >= product.stock_quantity) {
      alert(`Cannot add more. Only ${product.stock_quantity} left in stock!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1, stock: product.stock_quantity }];
    });
    setSearchQuery(""); 
    setIsSearchFocused(false);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty > item.stock) { alert(`Stock limit reached!`); return item; }
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;
  const grandTotal = subtotal + cgst + sgst;

  const triggerCheckoutFlow = () => {
    if (paymentMethod === "UPI") setIsUPIScanning(true);
    else if (paymentMethod === "CARD") setIsCardModalOpen(true);
    else executeDatabaseCheckout(); // Cash goes straight through
  };

  const executeDatabaseCheckout = async () => {
    setIsUPIScanning(false);
    setIsCheckingOut(true);
    const token = localStorage.getItem("pos_token");
    try {
      const payload = {
        payment_method: paymentMethod,
        customer_phone: customerPhone || undefined, 
        items: cart.map(item => ({ productId: item.id, quantity: item.qty }))
      };
      const response = await axios.post("http://localhost:3000/invoices/checkout", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const populatedItems = cart.map(cartItem => ({ ...cartItem, price_at_sale: cartItem.price }));
      
      setLastInvoice({ 
        ...response.data, 
        populatedItems, 
        calcSubtotal: subtotal, calcCGST: cgst, calcSGST: sgst, calcGrandTotal: grandTotal,
        customer_phone: customerPhone 
      });
      setCart([]); 
      setCustomerPhone("");
      fetchProducts(token as string); 
    } catch (error: any) {
      alert(error.response?.data?.message || "Checkout failed.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    router.push("/");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@media print { @page { margin: 0; size: auto; } body { margin: 1.5cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}} />

      {/* Main Container with subtle animated mesh background */}
      <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-200 print:hidden relative overflow-hidden">
        
        {/* Background Visual Enhancements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex-1 p-8 flex flex-col h-screen relative z-10">
          
          {/* HEADER */}
          <header className="relative z-50 flex justify-between items-center mb-8 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Store size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Point of Sale</h1>
                <p className="text-slate-500 font-medium text-sm flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Cashier: <span className="text-blue-600">{cashierName}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* SEARCH BAR */}
              <div className="relative w-96" ref={searchRef}>
                <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search products (SKU or Name)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl pl-12 pr-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 font-medium" 
                />
                
                {/* SEARCH DROPDOWN */}
                <AnimatePresence>
                  {isSearchFocused && searchQuery.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-6 text-slate-500 text-center flex flex-col items-center gap-2"><Package size={24} className="opacity-50"/> No products found</div>
                      ) : (
                        filteredProducts.map((p) => (
                          <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{p.name.charAt(0)}</div>
                              <div>
                                <p className="font-bold text-slate-800">{p.name}</p>
                                <p className="text-xs text-slate-500">Stock: {p.stock_quantity}</p>
                              </div>
                            </div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">₹{p.price.toFixed(2)}</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* LOGOUT BUTTON */}
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all text-sm font-bold text-slate-600 shadow-sm hover:shadow-md">
                <LogOut size={18} /> Exit
              </button>
            </div>
          </header>

          {/* PRODUCT GRID - BULLETPROOF LAYOUT */}
          <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pb-8 pr-4 content-start">
            {filteredProducts.map((item, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: index * 0.05 }} 
                whileHover={{ scale: 1.02, y: -4 }} 
                whileTap={{ scale: 0.98 }} 
                key={item.id} 
                onClick={() => addToCart(item)} 
                // THE FIX: min-h-[220px] prevents squishing, flex-1 allows proper scrolling
                className={`bg-white border ${item.stock_quantity === 0 ? 'border-red-200 opacity-60' : 'border-slate-200 hover:border-blue-300'} rounded-3xl p-6 cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all relative overflow-hidden flex flex-col justify-between group min-h-[220px]`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 text-slate-500 group-hover:text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-colors">
                      {item.name.charAt(0)}
                    </div>
                    {/* ENHANCED STOCK BADGE */}
                    <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${item.stock_quantity === 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {item.stock_quantity === 0 ? 'Out of Stock' : `${item.stock_quantity} Left`}
                    </span>
                  </div>
                  {/* TWO-LINE CLAMP FOR LONG NAMES */}
                  <h3 className="font-bold text-lg text-slate-800 leading-snug mb-2 line-clamp-2">{item.name}</h3>
                </div>
                
                {/* BIGGER BOLDER PRICE */}
                <div className="text-3xl font-black text-slate-900 tracking-tight mt-auto pt-4 group-hover:text-blue-600 transition-colors">
                  ₹{item.price.toFixed(2)}
                </div>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center h-64 text-slate-400">
                <Package size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No products match your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* CART SIDEBAR - ENHANCED VISUALS */}
        <div className="w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-screen relative z-20">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingCart size={20} /></div>
              Current Order
            </h2>
            <button onClick={() => setCart([])} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors" title="Clear Cart"><Trash2 size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={item.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 group">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 line-clamp-2 pr-4">{item.name}</h4>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={18}/></button>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-slate-900 font-black text-lg">₹{(item.price * item.qty).toFixed(2)}</p>
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shadow-inner">
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Minus size={16}/></button>
                      <span className="font-bold text-slate-800 w-8 text-center">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 rounded-lg shadow-sm hover:text-blue-600 transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">Cart is empty</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* CHECKOUT PANEL */}
          <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-20px_40px_rgba(0,0,0,0.03)] z-30 relative rounded-t-3xl">
            
            {/* STRICT PHONE VALIDATION */}
            <div className="mb-4 relative group">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                customerPhone && customerPhone.length !== 10 ? 'text-red-400' : 'text-slate-400'
              }`}><Phone size={16} /></div>
              <input 
                type="text" 
                placeholder="Customer Phone (10 Digits)" 
                value={customerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, ''); // Removes all spaces and letters
                  if (val.length <= 10) setCustomerPhone(val);   // Limits to 10
                }}
                className={`w-full bg-slate-50 border font-medium rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 transition-all text-sm ${
                  customerPhone && customerPhone.length !== 10 
                    ? 'border-red-300 text-red-700 focus:ring-red-500/50' 
                    : 'border-slate-200 text-slate-800 focus:ring-blue-500/50'
                }`}
              />
              {customerPhone && customerPhone.length !== 10 && (
                <p className="text-xs text-red-500 mt-1 font-medium">Phone must be exactly 10 digits ({customerPhone.length}/10)</p>
              )}
            </div>

            {/* TOTALS AREA (Slightly compressed padding) */}
            <div className="space-y-1.5 mb-4 text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-700">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>CGST (9%)</span><span className="text-slate-700">₹{cgst.toFixed(2)}</span></div>
              <div className="flex justify-between border-b border-slate-200 pb-2"><span>SGST (9%)</span><span className="text-slate-700">₹{sgst.toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-slate-800 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-black text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* COMPACT PAYMENT BUTTONS */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button onClick={() => setPaymentMethod("CASH")} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl font-bold transition-all text-xs ${paymentMethod === 'CASH' ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Banknote size={16} /> Cash</button>
              <button onClick={() => setPaymentMethod("UPI")} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl font-bold transition-all text-xs ${paymentMethod === 'UPI' ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}><QrCode size={16} /> UPI</button>
              <button onClick={() => setPaymentMethod("CARD")} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl font-bold transition-all text-xs ${paymentMethod === 'CARD' ? 'border-2 border-blue-500 bg-blue-50 text-blue-700' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}><CreditCard size={16} /> Card</button>
            </div>
            
            <button onClick={triggerCheckoutFlow} disabled={cart.length === 0 || isCheckingOut || (customerPhone && customerPhone.length !== 10)} className="w-full bg-slate-900 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-all duration-300 flex justify-center items-center h-12">
              {isCheckingOut ? <Loader2 className="animate-spin" /> : `Charge ₹${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>

        {/* UPI MODAL (Now checks for Admin's custom QR) */}
        <AnimatePresence>
          {isUPIScanning && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative">
                <button onClick={() => setIsUPIScanning(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X /></button>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan to Pay</h2>
                <p className="text-slate-500 mb-6 font-medium">Amount: <span className="text-blue-600 font-bold">₹{grandTotal.toFixed(2)}</span></p>
                
                <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-6 overflow-hidden">
                  {/* If Admin uploaded a QR, show it. Otherwise show default icon */}
                  {(storeDetails as any).qrCodeImage ? (
                    <img src={(storeDetails as any).qrCodeImage} alt="Store UPI QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode size={100} className="text-slate-400" />
                  )}
                </div>
                
                <p className="text-sm text-slate-400 mb-6 animate-pulse">Waiting for customer payment...</p>
                <button onClick={executeDatabaseCheckout} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-500/30"><CheckCircle2 /> Proceed (Payment Received)</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SECURE CARD PAYMENT MODAL */}
        <AnimatePresence>
          {isCardModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full relative text-left">
                <button onClick={() => { setIsCardModalOpen(false); setCardData({ number: '', exp: '', cvv: '' }); }} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"><X /></button>
                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2"><CreditCard /> Card Terminal</h2>
                <p className="text-slate-500 mb-6 font-medium text-sm">Processing charge for: <span className="text-blue-600 font-bold">₹{grandTotal.toFixed(2)}</span></p>
                
                <div className="space-y-4 mb-2">
                  {/* CARD NUMBER */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Card Number</label>
                    <input 
                      type="text" 
                      maxLength={19} /* 16 digits + 3 spaces */
                      placeholder="0000 0000 0000 0000" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none tracking-widest font-mono text-sm transition-all" 
                      value={cardData.number}
                      onChange={(e) => {
                        // Strip all non-digits, then add a space every 4 digits
                        const rawDigits = e.target.value.replace(/\D/g, '');
                        const formatted = rawDigits.replace(/(.{4})/g, '$1 ').trim();
                        setCardData({...cardData, number: formatted});
                      }} 
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    {/* EXPIRY DATE */}
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Expiry</label>
                      <input 
                        type="text" 
                        maxLength={5} 
                        placeholder="MM/YY" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-center transition-all" 
                        value={cardData.exp}
                        onChange={(e) => {
                          // Strip non-digits, auto-insert slash after month
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 2) {
                            val = val.substring(0, 2) + '/' + val.substring(2, 4);
                          }
                          setCardData({...cardData, exp: val});
                        }} 
                      />
                    </div>

                    {/* CVV (NOW VISIBLE) */}
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">CVV</label>
                      <input 
                        type="text" // Changed from password to text for rapid cashier verification
                        maxLength={3} // 3 standard, 4 for Amex
                        placeholder="123" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-center tracking-widest transition-all" 
                        value={cardData.cvv}
                        onChange={(e) => {
                          // Strip all non-digits entirely
                          const val = e.target.value.replace(/\D/g, '');
                          setCardData({...cardData, cvv: val});
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* DYNAMIC ERROR MESSAGING */}
                <div className="h-6 mb-4 flex items-center">
                  {(cardData.number.length > 0 && cardData.number.length < 19) || (cardData.exp.length > 0 && cardData.exp.length < 5) || (cardData.cvv.length > 0 && cardData.cvv.length < 3) ? (
                    <p className="text-xs text-red-500 font-bold animate-pulse">⚠️ Please complete all card details.</p>
                  ) : null}
                </div>
                
                <button 
                  onClick={() => { 
                    setIsCardModalOpen(false); 
                    setCardData({ number: '', exp: '', cvv: '' }); // Clear state on success
                    executeDatabaseCheckout(); 
                  }} 
                  disabled={cardData.number.length < 19 || cardData.exp.length < 5 || cardData.cvv.length < 3}
                  className="w-full bg-slate-900 hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg"
                >
                  <CreditCard size={18} /> Process Payment
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lastInvoice && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 print:hidden">
              <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="bg-white w-full max-w-sm rounded-t-lg rounded-b-3xl shadow-2xl overflow-hidden font-mono text-sm relative">
                <div className="h-4 w-full bg-[radial-gradient(circle,transparent_50%,white_50%)] bg-[length:16px_16px] bg-top -mt-2"></div>
                <div className="p-8 pt-4">
                  <div className="text-center mb-6">
                    <Store className="w-10 h-10 mx-auto mb-2 text-slate-800" />
                    <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">{storeDetails.name}</h2>
                    <p className="text-slate-500 text-xs mt-1">{new Date(lastInvoice.created_at).toLocaleString()}</p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 py-4 mb-4 text-slate-600">
                    <p className="flex justify-between"><span>Receipt:</span> <span>#{lastInvoice.id.substring(0,8).toUpperCase()}</span></p>
                    <p className="flex justify-between"><span>Method:</span> <span>{lastInvoice.payment_method}</span></p>
                    {lastInvoice.customer_phone && <p className="flex justify-between"><span>Customer:</span> <span>{lastInvoice.customer_phone}</span></p>}
                  </div>
                  <div className="space-y-2 mb-4 pb-4 border-b border-dashed border-slate-300">
                    <div className="flex justify-between font-bold text-slate-800 pb-2"><span>Item</span><span>Total</span></div>
                    {lastInvoice.populatedItems.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-600"><span className="truncate w-32">{item.qty}x {item.name}</span><span>₹{(item.price_at_sale * item.qty).toFixed(2)}</span></div>
                    ))}
                  </div>
                  <div className="space-y-1 text-slate-500 mb-4">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{lastInvoice.calcSubtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>CGST @9%</span><span>₹{lastInvoice.calcCGST.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>SGST @9%</span><span>₹{lastInvoice.calcSGST.toFixed(2)}</span></div>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-300 pt-4 mb-8">
                    <span className="text-slate-600 font-bold uppercase">Total Due</span><span className="text-2xl font-black text-slate-900">₹{lastInvoice.calcGrandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setLastInvoice(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 font-sans"><X size={18} /> Close</button>
                    <button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 font-sans shadow-lg shadow-blue-500/30"><Printer size={18} /> Print</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* PDF PRINT UI (Remains unchanged to preserve paper layout) */}
      {lastInvoice && (
        <div className="hidden print:block w-[210mm] min-h-[297mm] mx-auto bg-white text-black font-sans box-border pt-8">
          <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">{storeDetails.name}</h1>
              <p className="text-slate-600 text-sm mt-2 max-w-xs">{storeDetails.address}, {storeDetails.city}</p>
              <p className="text-slate-600 text-sm">{storeDetails.phone} | {storeDetails.email}</p>
              <p className="text-slate-800 font-bold text-sm mt-2">GSTIN: {storeDetails.gstin}</p>
            </div>
            <div className="text-right">
              <h2 className="text-5xl font-light text-slate-300 uppercase tracking-widest mb-4">Tax Invoice</h2>
              <p className="font-bold text-lg text-slate-900">#{lastInvoice.id.substring(0,8).toUpperCase()}</p>
              <p className="text-slate-600 mt-1">Date: {new Date(lastInvoice.created_at).toLocaleDateString()}</p>
              <p className="text-slate-600">Time: {new Date(lastInvoice.created_at).toLocaleTimeString()}</p>
              {lastInvoice.customer_phone && <p className="text-slate-800 font-bold mt-2">Customer: {lastInvoice.customer_phone}</p>}
              <div className="mt-4 inline-block bg-slate-100 rounded px-3 py-1">
                <p className="text-slate-800 text-sm">Payment: <span className="font-bold">{lastInvoice.payment_method}</span></p>
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
              {lastInvoice.populatedItems.map((item: any, i: number) => (
                <tr key={i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="py-4 px-4 font-medium text-slate-800">{item.name}</td>
                  <td className="py-4 px-4 text-center text-slate-700">{item.qty}</td>
                  <td className="py-4 px-4 text-right text-slate-600">₹{item.price_at_sale.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">₹{(item.price_at_sale * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mb-16">
            <div className="w-80 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{lastInvoice.calcSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>CGST (9%)</span><span>₹{lastInvoice.calcCGST.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>SGST (9%)</span><span>₹{lastInvoice.calcSGST.toFixed(2)}</span></div>
              <div className="flex justify-between text-2xl font-black text-slate-900 border-t-2 border-slate-300 pt-4 mt-4">
                <span>Total Due</span><span>₹{lastInvoice.calcGrandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}