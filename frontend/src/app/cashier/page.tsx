"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, CreditCard, Banknote, QrCode, Trash2, Loader2, Store, Printer, X, Plus, Minus, CheckCircle2, Phone, LogOut } from "lucide-react";
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

  // NEW: Search & Customer State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const storeDetails = {
    name: "NEXUS TECH STORE",
    address: "KLE Technological University Campus",
    city: "Belagavi, Karnataka 590008",
    phone: "+91 98765 43210",
    email: "billing@nexustech.in",
    gstin: "29ABCDE1234F1Z5"
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("pos_user") || "{}");
    const token = localStorage.getItem("pos_token");
    if (!user.name || !token) { router.push("/"); return; }
    setCashierName(user.name);
    fetchProducts(token);

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

  // FILTER LOGIC
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
    setSearchQuery(""); // Clear search after adding
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
    else executeDatabaseCheckout();
  };

  const executeDatabaseCheckout = async () => {
    setIsUPIScanning(false);
    setIsCheckingOut(true);
    const token = localStorage.getItem("pos_token");
    try {
      const payload = {
        payment_method: paymentMethod,
        customer_phone: customerPhone || undefined, // Send phone if it exists
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

      <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-200 print:hidden relative">
        <div className="flex-1 p-8 flex flex-col h-screen">
<header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Point of Sale</h1>
              <p className="text-slate-500 font-medium mt-1">Cashier: {cashierName}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* ENHANCED SEARCH BAR */}
              <div className="relative w-96" ref={searchRef}>
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search products (Press Enter to filter)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700 font-medium" 
                />
                {/* DROPDOWN */}
                <AnimatePresence>
                  {isSearchFocused && searchQuery.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-slate-500 text-center">No products found for "{searchQuery}"</div>
                      ) : (
                        filteredProducts.map((p) => (
                          <div key={p.id} onClick={() => addToCart(p)} className="flex justify-between items-center p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                            <div>
                              <p className="font-bold text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-500">Stock: {p.stock_quantity}</p>
                            </div>
                            <p className="font-bold text-blue-600">₹{p.price.toFixed(2)}</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* NEW LOGOUT BUTTON */}
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-2xl transition-all text-sm font-bold text-slate-600 shadow-sm"
              >
                <LogOut size={18} /> Exit
              </button>
            </div>
          </header>

          <div className="grid grid-cols-3 gap-6 overflow-y-auto pb-8 pr-4">
            {filteredProducts.map((item, index) => (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.97 }} key={item.id} onClick={() => addToCart(item)} className={`bg-white border ${item.stock_quantity === 0 ? 'border-red-200 opacity-50' : 'border-slate-200'} rounded-3xl p-6 cursor-pointer shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden`}>
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl mb-4 flex items-center justify-center font-bold text-lg">{item.name.charAt(0)}</div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1 truncate">{item.name}</h3>
                <p className={`text-sm font-medium mb-4 ${item.stock_quantity === 0 ? 'text-red-500' : 'text-slate-500'}`}>{item.stock_quantity === 0 ? 'Out of Stock' : `${item.stock_quantity} in stock`}</p>
                <div className="text-xl font-extrabold text-blue-600">₹{item.price.toFixed(2)}</div>
              </motion.div>
            ))}
            {filteredProducts.length === 0 && <p className="col-span-3 text-center text-slate-400 mt-10">No products match your search.</p>}
          </div>
        </div>

        <div className="w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-screen relative z-10">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800"><ShoppingCart className="text-blue-500" /> Current Order</h2>
            <button onClick={() => setCart([])} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full"><Trash2 size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={item.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 truncate pr-2">{item.name}</h4>
                    <button onClick={(e) => { e.stopPropagation(); removeItem(item.id); }} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-blue-600 font-bold">₹{(item.price * item.qty).toFixed(2)}</p>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1">
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 rounded-lg shadow-sm hover:text-blue-600 hover:bg-blue-50 transition-colors"><Minus size={16}/></button>
                      <span className="font-bold text-slate-700 w-4 text-center">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 rounded-lg shadow-sm hover:text-blue-600 hover:bg-blue-50 transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {cart.length === 0 && <div className="text-center text-slate-400 mt-10">Cart is empty</div>}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20 relative">
            
            {/* NEW: Customer Phone Input */}
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Phone size={16} /></div>
              <input 
                type="tel" 
                placeholder="Customer Phone (Optional)" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>

            <div className="space-y-2 mb-4 text-sm font-medium text-slate-500">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>CGST (9%)</span><span>₹{cgst.toFixed(2)}</span></div>
              <div className="flex justify-between border-b border-slate-100 pb-2"><span>SGST (9%)</span><span>₹{sgst.toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-lg text-slate-800">Total Due</span>
                <span className="text-3xl font-black text-slate-900">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <button onClick={() => setPaymentMethod("CASH")} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-bold transition-all ${paymentMethod === 'CASH' ? 'border-2 border-blue-500 bg-blue-50 text-blue-600' : 'border border-slate-200 text-slate-600'}`}><Banknote size={20} /> Cash</button>
              <button onClick={() => setPaymentMethod("UPI")} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-bold transition-all ${paymentMethod === 'UPI' ? 'border-2 border-blue-500 bg-blue-50 text-blue-600' : 'border border-slate-200 text-slate-600'}`}><QrCode size={20} /> UPI</button>
              <button onClick={() => setPaymentMethod("CARD")} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-bold transition-all ${paymentMethod === 'CARD' ? 'border-2 border-blue-500 bg-blue-50 text-blue-600' : 'border border-slate-200 text-slate-600'}`}><CreditCard size={20} /> Card</button>
            </div>
            
            <button onClick={triggerCheckoutFlow} disabled={cart.length === 0 || isCheckingOut} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all flex justify-center items-center h-16">
              {isCheckingOut ? <Loader2 className="animate-spin" /> : `Charge ₹${grandTotal.toFixed(2)}`}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isUPIScanning && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative">
                <button onClick={() => setIsUPIScanning(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X /></button>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Scan to Pay</h2>
                <p className="text-slate-500 mb-6 font-medium">Amount: <span className="text-blue-600 font-bold">₹{grandTotal.toFixed(2)}</span></p>
                <div className="w-48 h-48 mx-auto bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-6"><QrCode size={100} className="text-slate-400" /></div>
                <p className="text-sm text-slate-400 mb-6 animate-pulse">Waiting for customer payment...</p>
                <button onClick={executeDatabaseCheckout} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-green-500/30"><CheckCircle2 /> Proceed (Payment Received)</button>
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
          {/* ... PDF table stays exactly the same ... */}
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