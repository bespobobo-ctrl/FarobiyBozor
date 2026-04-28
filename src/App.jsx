import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
    TrendingUp, Package, ShoppingCart, Users, History, Home, Search,
    Plus, Minus, X, Check, MapPin, ShoppingBag, Star, Flame, Clock,
    Heart, ArrowRight, DollarSign, AlertTriangle, ChevronRight, BarChart3,
    PieChart, Inbox, LogIn, LogOut, ArrowUpRight, ArrowDownRight, Phone, Edit, Save,
    Settings, Trash2, Layers, User, Calendar, Activity, Zap, CreditCard, Lock,
    Target, Globe, ShieldCheck, ChevronDown, LayoutGrid, Command, Bell, Cpu, MoreVertical,
    ArrowLeft, Palette, Sun, Moon, RefreshCw, Hash, Scissors, Printer, QrCode, Tag
} from 'lucide-react';
import { supabase } from './lib/supabase';

// --- PREMIUM UTILS ---
const numericSizes = ['38', '39', '40', '41', '42', '43', '44', '45', '46'];
const letterSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        const controls = animate(displayValue, value, { duration: 1.5, ease: [0.33, 1, 0.68, 1], onUpdate: v => setDisplayValue(Math.floor(v)) });
        return () => controls.stop();
    }, [value]);
    return <span>{displayValue.toLocaleString()}</span>;
};

export default function App() {
    const [tab, setTab] = useState('dashboard');
    const [msg, setMsg] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('fb_auth') === 'true');
    const [loginData, setLoginData] = useState({ user: '', pass: '' });
    const [isDark, setIsDark] = useState(() => JSON.parse(localStorage.getItem('fb_theme') || 'false'));
    const [categories, setCategories] = useState(['Premium', 'Sifatli', 'Oyoq kiyim']);
    const [selectedCat, setSelectedCat] = useState('Hammasi');
    const [newCat, setNewCat] = useState('');
    const [cart, setCart] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [showKirim, setShowKirim] = useState(false);
    const [showSavdo, setShowSavdo] = useState(false);
    const [showPrint, setShowPrint] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [viewingQR, setViewingQR] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [buhTab, setBuhTab] = useState('analytics');
    const [period, setPeriod] = useState('day');
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [showRecent, setShowRecent] = useState(true);
    const [selectedDay, setSelectedDay] = useState(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [historyType, setHistoryType] = useState('ALL');
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyPeriod, setHistoryPeriod] = useState('day');

    // Kirim Form (Pachka System)
    const [sizeMode, setSizeMode] = useState('num');
    const [kirimForm, setKirimForm] = useState({
        name: '', color: '', category: categories[0] || '',
        pachkaCount: '', itemsPerPachka: '',
        pachkaCost: '', pachkaPrice: '', unitPrice: '',
        selectedSizes: [],
        type: 'pachka'
    });

    const toggleSize = (s) => {
        setKirimForm(prev => ({
            ...prev,
            selectedSizes: prev.selectedSizes.includes(s)
                ? prev.selectedSizes.filter(x => x !== s)
                : [...prev.selectedSizes, s]
        }));
    };

    const [products, setProducts] = useState([
        { id: 1, name: 'Premium Shoyi Ko\'ylak', color: 'Qora', category: 'Premium', qty: 42, sizeRange: 'M, L, XL', price: 850000, buy_price: 550000 },
    ]);
    const [sales, setSales] = useState([]);
    const [logs, setLogs] = useState([]);

    useEffect(() => { localStorage.setItem('fb_theme', JSON.stringify(isDark)); }, [isDark]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!isAuthenticated) return;

                const { data: p, error: pErr } = await supabase.from('fb_products').select('*').order('id', { ascending: false });
                if (pErr) throw pErr;
                if (p) setProducts(p);

                const { data: l, error: lErr } = await supabase.from('fb_logs').select('*').order('id', { ascending: false });
                if (lErr) throw lErr;
                if (l) setLogs(l);

                const { data: c } = await supabase.from('fb_categories').select('name');
                if (c && c.length > 0) setCategories(c.map(x => x.name));
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };
        fetchData();
    }, [isAuthenticated]);

    const groupedProducts = useMemo(() => {
        let filtered = products;
        if (selectedCat !== 'Hammasi') {
            filtered = products.filter(p => p.category === selectedCat);
        }

        const groups = {};
        filtered.forEach(p => {
            const key = `${p.name}-${p.color}-${p.category}`;
            if (!groups[key]) {
                groups[key] = {
                    ...p,
                    sizes: [p.size],
                    totalPachka: p.qty,
                    items: [p]
                };
            } else {
                if (!groups[key].sizes.includes(p.size)) groups[key].sizes.push(p.size);
                groups[key].totalPachka += p.qty;
                groups[key].items.push(p);
            }
        });
        return Object.values(groups);
    }, [products, selectedCat]);

    const inventoryStats = useMemo(() => {
        const totalCategories = categories.length;
        const totalItems = products.length;
        const catStats = categories.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            return { name: cat, count, percent: totalItems > 0 ? (count / totalItems) * 100 : 0 };
        });
        return { totalCategories, totalItems, catStats };
    }, [products, categories]);

    const inventoryFinance = useMemo(() => {
        const totalCost = products.reduce((sum, p) => sum + (Number(p.buy_price) || 0), 0);
        const totalValue = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
        return { totalCost, totalValue, profit: totalValue - totalCost };
    }, [products]);

    const stats = useMemo(() => {
        const calculateForPeriod = (days, isCalendarDay = false) => {
            const now = new Date();
            const cutoff = isCalendarDay
                ? new Date(new Date().setHours(0, 0, 0, 0))
                : new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

            const periodLogs = logs.filter(l => new Date(l.date || l.created_at) >= cutoff);
            const prevCutoff = new Date(cutoff.getTime() - (days * 24 * 60 * 60 * 1000));
            const prevLogs = logs.filter(l => {
                const d = new Date(l.date || l.created_at);
                return d >= prevCutoff && d < cutoff;
            });

            const getMetrics = (items) => {
                const revenue = items.filter(l => l.type === 'SAVDO').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
                const expense = items.filter(l => l.type === 'EXPENSE').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
                const kirimCount = items.filter(l => l.type === 'KIRIM').length;
                const cogs = items.filter(l => l.type === 'SAVDO').reduce((sum, l) => {
                    const prod = products.find(p => p.name === l.name);
                    return sum + (prod ? (Number(prod.buy_price) || 0) * (Number(l.qty) || 1) : 0);
                }, 0);
                const profit = revenue - cogs - expense;
                return { revenue, expense, cogs, profit, kirimCount };
            };

            const curr = getMetrics(periodLogs);
            const prev = getMetrics(prevLogs);
            const growth = prev.profit !== 0 ? ((curr.profit - prev.profit) / Math.abs(prev.profit)) * 100 : 0;

            return { ...curr, growth };
        };

        const daily = calculateForPeriod(1, true);
        const weekly = calculateForPeriod(7);
        const monthly = calculateForPeriod(30);
        const yearly = calculateForPeriod(365);
        const totalDebt = logs.filter(l => l.type === 'SAVDO' && l.status === 'debt').reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

        return { daily, weekly, monthly, yearly, totalDebt };
    }, [logs, products]);


    const T = {
        bg: isDark ? '#08080C' : '#FAF8F5',
        card: isDark ? '#111218' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#2D2D2D',
        accent: isDark ? '#E5B95F' : '#CB7D5B',
        muted: isDark ? '#4B4C56' : '#BBBBBB',
        input: isDark ? '#181921' : '#F9F6F2',
        border: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        shadow: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(150, 140, 130, 0.1)',
        navBg: isDark ? 'rgba(17, 18, 24, 0.9)' : 'rgba(255, 255, 255, 0.9)'
    };

    const showToast = (t) => { setMsg(t); setTimeout(() => setMsg(null), 3000); };

    const handleKirimSubmit = async () => {
        const { name, color, category, pachkaCount, unitPrice, selectedSizes, pachkaCost } = kirimForm;
        if (!name || !pachkaCount || !unitPrice || selectedSizes.length === 0) return showToast("Barcha maydonlarni to'ldiring!");

        try {
            const numPachka = Number(pachkaCount);
            const newProductsRows = [];

            if (kirimForm.type === 'pachka') {
                selectedSizes.forEach(size => {
                    newProductsRows.push({
                        name, color, category, size,
                        qty: Number(numPachka),
                        price: Number(unitPrice),
                        buy_price: (Number(pachkaCost) / selectedSizes.length)
                    });
                });
            } else {
                newProductsRows.push({
                    name, color, category,
                    size: selectedSizes[0] || 'N/A',
                    qty: Number(numPachka),
                    price: Number(unitPrice),
                    buy_price: Number(pachkaCost)
                });
            }

            const { error: pErr } = await supabase.from('fb_products').insert(newProductsRows);
            const { error: lErr } = await supabase.from('fb_logs').insert([{
                type: 'KIRIM',
                name: name,
                qty: newProductsRows.length,
                amount: kirimForm.type === 'pachka' ? Number(pachkaCost) * numPachka : Number(pachkaCost) * numPachka
            }]);

            if (pErr) throw new Error("Mahsulot: " + pErr.message);
            if (lErr) throw new Error("Log: " + lErr.message);

            setProducts([...newProductsRows, ...products]);
            setLogs([{
                id: Date.now(),
                type: 'KIRIM',
                name: name,
                qty: newProductsRows.length,
                amount: kirimForm.type === 'pachka' ? Number(pachkaCost) * numPachka : Number(pachkaCost) * numPachka,
                date: new Date()
            }, ...logs]);

            setShowKirim(false);
            showToast("Muvaffaqiyatli saqlandi! ✅");
        } catch (err) {
            showToast("Xatolik: " + err.message);
        }
    };
    const deleteLog = async (id) => {
        if (!confirm("O'chirilsinmi?")) return;
        const { error } = await supabase.from('fb_logs').delete().eq('id', id);
        if (error) return showToast("Xatolik!");
        setLogs(logs.filter(l => l.id !== id));
        showToast("O'chirildi!");
    };

    const updateExpense = async (id, name, amount) => {
        const { error } = await supabase.from('fb_logs').update({ name, amount: Number(amount) }).eq('id', id);
        if (error) return showToast("Xatolik!");
        setLogs(logs.map(l => l.id === id ? { ...l, name, amount: Number(amount) } : l));
        setEditingItem(null);
        showToast("Yangilandi!");
    };


    const handleSavdoSubmit = async () => {
        if (!cart) return;
        if (cart.qty < 1) return showToast("Zaxira yetarli emas!");
        if (!cart.salePrice || Number(cart.salePrice) <= 0) return showToast("Sotuv narxini kiriting!");

        try {
            const finalStatus = cart.paymentStatus || 'paid';
            if (finalStatus === 'debt' && (!cart.customerName || !cart.customerPhone)) {
                return showToast("Qarz uchun mijoz ismi va tel raqami shart!");
            }
            const customerInfo = finalStatus === 'debt'
                ? `${cart.customerName} (${cart.customerPhone})`
                : (cart.customerName || 'Nomaʼlum');

            const { error: pErr } = await supabase.from('fb_products').update({ qty: cart.qty - 1 }).eq('id', cart.id);
            const { error: lErr } = await supabase.from('fb_logs').insert([{
                type: 'SAVDO',
                name: cart.name,
                qty: 1,
                amount: Number(cart.salePrice),
                status: finalStatus,
                customer: customerInfo
            }]);

            if (pErr || lErr) throw new Error("Saqlashda xatolik: " + (pErr?.message || lErr?.message));

            setProducts(products.map(p => p.id === cart.id ? { ...p, qty: p.qty - 1 } : p));
            setLogs([{
                id: Date.now(),
                type: 'SAVDO',
                name: cart.name,
                qty: 1,
                amount: Number(cart.salePrice),
                status: finalStatus,
                customer: customerInfo,
                date: new Date()
            }, ...logs]);

            setCart(null);
            setShowSavdo(false);
            showToast("Sotuv muvaffaqiyatli amalga oshirildi! 💸");
        } catch (err) {
            showToast("Xatolik: " + err.message);
        }
    };

    const startScanner = () => {
        if (!window.Telegram?.WebApp) return showToast("Telegram mühitida emas!");
        window.Telegram.WebApp.showScanQrPopup({ text: "Mahsulot QR kodini skanerlang" }, (text) => {
            const rawText = text.trim();
            const parts = rawText.split('|').map(s => s.trim());

            if (parts[0] === 'FB' && parts.length >= 4) {
                const [_, name, color, size] = parts;

                // Find product by UID or by attributes (case-insensitive)
                const found = products.find(p =>
                    (p.uid && p.uid.trim() === rawText) ||
                    (p.name?.toLowerCase() === name?.toLowerCase() &&
                        p.color?.toLowerCase() === color?.toLowerCase() &&
                        p.size?.toString() === size?.toString())
                );

                if (found) {
                    if (found.qty <= 0) {
                        showToast("Mahsulot qolmagan! (0 dona) 🚫");
                    } else {
                        setCart({ ...found, salePrice: found.price });
                        showToast(`Topildi: ${found.name} 🎯`);
                        window.Telegram.WebApp.closeScanQrPopup();
                    }
                    return true;
                }
                showToast("Mahsulot bazada topilmadi! ❌");
            } else {
                showToast("Noma'lum QR format! ⚠️");
            }
            return true;
        });
    };

    const handleDeleteProduct = async (id) => {
        const item = products.find(p => p.id === id);
        if (!confirm("Haqiqatdan ham o'chirmoqchimisiz?")) return;
        try {
            const { error } = await supabase.from('fb_products').delete().eq('id', id);
            if (error) throw error;

            // Log deletion
            await supabase.from('fb_logs').insert([{
                name: `${item?.name} (${item?.size})`,
                type: 'DELETE',
                amount: 0,
                date: new Date()
            }]);

            setProducts(products.filter(p => p.id !== id));
            showToast("O'chirildi! 🗑️");
        } catch (err) {
            showToast("Xatolik: " + err.message);
        }
    };

    const handleDeleteGroup = async (group) => {
        if (!confirm(`"${group.name} (${group.color})" - barcha razmerlarini o'chirmoqchimisiz? (${group.items.length} dona)`)) return;
        try {
            const ids = group.items.map(i => i.id);
            const { error } = await supabase.from('fb_products').delete().in('id', ids);
            if (error) throw error;

            // Log deletion
            await supabase.from('fb_logs').insert([{
                name: `${group.name} (Barcha razmerlar)`,
                type: 'DELETE',
                amount: 0,
                date: new Date()
            }]);

            setProducts(products.filter(p => !ids.includes(p.id)));
            setExpanded(null);
            showToast(`${group.name} butunlay o'chirildi! 🗑️`);
        } catch (err) {
            showToast("Xatolik: " + err.message);
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingItem) return;
        try {
            const { error } = await supabase.from('fb_products').update({
                name: editingItem.name,
                color: editingItem.color,
                size: editingItem.size,
                qty: Number(editingItem.qty),
                price: Number(editingItem.price),
                buy_price: Number(editingItem.buy_price || 0),
                category: editingItem.category
            }).eq('id', editingItem.id);

            if (error) throw error;

            // Log update
            await supabase.from('fb_logs').insert([{
                name: editingItem.name,
                type: 'EDIT',
                amount: 0,
                date: new Date()
            }]);

            setProducts(products.map(p => p.id === editingItem.id ? { ...editingItem, qty: Number(editingItem.qty), price: Number(editingItem.price), buy_price: Number(editingItem.buy_price || 0) } : p));
            setEditingItem(null);
            showToast("O'zgarishlar saqlandi! ✅");
        } catch (err) {
            showToast("Xatolik: " + err.message);
        }
    };

    if (!isAuthenticated) return (
        <div style={{ minHeight: '100vh', background: '#020205', color: '#fff', display: 'flex', flexDirection: 'column', padding: '0 20px', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' }}>

            <motion.div
                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                style={{ position: 'absolute', top: 50, right: 30, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 15px', borderRadius: 12, backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: 'center', gap: 8 }}
            >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent, boxShadow: `0 0 10px ${T.accent}` }} />
                <span style={{ fontSize: 9, fontWeight: '1000', letterSpacing: 2, opacity: 0.8 }}>v4.51 PRO</span>
            </motion.div>

            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <motion.div animate={{ x: [-100, 100, -100], y: [-50, 150, -50] }} transition={{ duration: 25, repeat: Infinity }} style={{ position: 'absolute', top: '10%', left: '0%', width: '100%', height: '80%', background: `radial-gradient(circle at center, ${T.accent}15 0%, transparent 70%)`, filter: 'blur(100px)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 10, position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto', boxSizing: 'border-box' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                    <div style={{ marginBottom: 50, textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 4, repeat: Infinity }} style={{ position: 'absolute', inset: -20, background: `radial-gradient(circle, ${T.accent}20 0%, transparent 70%)`, filter: 'blur(15px)' }} />
                            <div style={{ width: 85, height: 85, borderRadius: 28, background: `linear-gradient(135deg, ${T.accent}, #FFBE0B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 20px 50px ${T.accent}40` }}>
                                <ShieldCheck size={40} color="#000" strokeWidth={2.5} />
                            </div>
                        </div>
                        <h1 style={{ fontSize: 42, fontWeight: '1000', margin: '30px 0 5px', letterSpacing: -2, background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Farobiy Market</h1>
                        <div style={{ fontSize: 9, fontWeight: '1000', letterSpacing: 8, color: T.accent, opacity: 0.8 }}>TIZIMGA KIRISH</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '35px 20px', borderRadius: 40, backdropFilter: 'blur(20px)', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div style={{ position: 'relative' }}>
                                <input value={loginData.user} onChange={e => setLoginData({ ...loginData, user: e.target.value })} placeholder="LOGIN ID" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px 25px 22px 60px', borderRadius: 24, color: '#fff', fontSize: 16, fontWeight: '700', outline: 'none', transition: '0.4s', boxSizing: 'border-box' }} />
                                <User size={18} style={{ position: 'absolute', left: 25, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input type="password" value={loginData.pass} onChange={e => setLoginData({ ...loginData, pass: e.target.value })} placeholder="MAXFIY KALIT" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '22px 25px 22px 60px', borderRadius: 24, color: '#fff', fontSize: 16, fontWeight: '700', outline: 'none', transition: '0.4s', boxSizing: 'border-box' }} />
                                <Lock size={18} style={{ position: 'absolute', left: 25, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (loginData.user === '111' && loginData.pass === '111') {
                                        setIsAuthenticated(true); localStorage.setItem('fb_auth', 'true');
                                        showToast("Xavfsiz sessiya boshlandi ⚡");
                                    } else { showToast("Kalit xatosi! ❌"); }
                                }}
                                style={{ width: '100%', height: 75, background: `linear-gradient(135deg, ${T.accent}, #FFBE0B)`, border: 'none', borderRadius: 24, color: '#000', fontSize: 16, fontWeight: '1000', letterSpacing: 1, boxShadow: `0 20px 40px ${T.accent}30`, cursor: 'pointer', marginTop: 10, boxSizing: 'border-box' }}
                            >
                                TIZIMGA KIRISH
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
            <div style={{ textAlign: 'center', padding: '35px 0', zIndex: 10, opacity: 0.2 }}>
                <div style={{ fontSize: 8, fontWeight: '1000', letterSpacing: 4 }}>FAROBIY MARKET • v4.51 • 2026</div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: 120, fontFamily: "'Outfit', sans-serif", transition: '0.4s' }}>

            {/* HEADER */}
            <header style={{ padding: '65px 25px 25px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 18, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: `0 10px 25px ${T.accent}30` }}>
                        <Command size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: 8, fontWeight: '1000', color: T.accent, letterSpacing: 4, opacity: 0.6 }}>FAROBIY MARKET</div>
                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 }}>Boshqaruv <small style={{ fontSize: 10, opacity: 0.8, color: T.accent, fontWeight: '1000' }}>v4.54 BOUTIQUE PRO</small></h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <motion.div whileTap={{ scale: 0.9 }} onClick={() => setIsDark(!isDark)} style={{ width: 48, height: 48, borderRadius: 16, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}` }}>
                        {isDark ? <Sun size={20} color={T.accent} /> : <Moon size={20} color="#141E26" />}
                    </motion.div>
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            if (confirm("Tizimdan chiqmoqchimisiz?")) {
                                localStorage.removeItem('fb_auth');
                                setIsAuthenticated(false);
                            }
                        }}
                        style={{ width: 48, height: 48, borderRadius: 16, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${T.border}`, color: '#FF6464' }}
                    >
                        <LogOut size={20} />
                    </motion.div>
                </div>
            </header>

            <div style={{ padding: '0 25px' }}>
                {tab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ background: T.card, padding: 35, borderRadius: 36, marginBottom: 25, boxShadow: `0 30px 60px ${T.shadow}`, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, padding: '15px 20px', background: `${T.accent}10`, borderRadius: '0 0 0 24px', fontSize: 10, fontWeight: '1000', color: T.accent }}>{stats.daily.kirimCount} KIRIM BUGUN</div>
                            <div style={{ fontSize: 10, fontWeight: '900', opacity: 0.4, letterSpacing: 2, marginBottom: 10 }}>BUGUNGI SAVDO</div>
                            <div style={{ fontSize: 42, fontWeight: '1000' }}><AnimatedNumber value={stats.daily.revenue} /> <small style={{ fontSize: 14, opacity: 0.2 }}>SOM</small></div>
                        </div>

                        <div style={{ display: 'flex', gap: 15, marginBottom: 40 }}>
                            <motion.button onClick={() => setShowKirim(true)} whileTap={{ scale: 0.95 }} style={{ flex: 1, height: 80, borderRadius: 24, border: 'none', background: T.card, color: T.text, fontSize: 16, fontWeight: '1000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: `1px solid ${T.border}` }}>
                                <Inbox size={22} color={T.accent} /> Kirim
                            </motion.button>
                            <motion.button onClick={() => setShowSavdo(true)} whileTap={{ scale: 0.95 }} style={{ flex: 1, height: 80, borderRadius: 24, border: 'none', background: T.accent, color: '#000', fontSize: 16, fontWeight: '1000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <ShoppingCart size={22} /> Sotuv
                            </motion.button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: '900', margin: 0 }}>So'nggi harakatlar</h3>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowRecent(!showRecent)} style={{ background: 'transparent', border: 'none', color: T.accent, fontSize: 11, fontWeight: '1000', cursor: 'pointer' }}>
                                {showRecent ? 'YASHIRISH' : "KO'RSATISH"}
                            </motion.button>
                        </div>

                        <AnimatePresence>
                            {showRecent && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {logs.slice(0, 3).map(l => (
                                            <div key={l.id} style={{ display: 'flex', gap: 18, padding: '18px', borderRadius: 24, background: T.card, border: `1px solid ${T.border}`, boxShadow: `0 10px 20px ${T.shadow}` }}>
                                                <div style={{ width: 45, height: 45, borderRadius: 14, background: l.type === 'SAVDO' ? '#10B98115' : l.type === 'EXPENSE' ? '#FF646415' : `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {l.type === 'SAVDO' ? <TrendingUp size={20} color="#10B981" /> : l.type === 'EXPENSE' ? <ArrowDownLeft size={20} color="#FF6464" /> : <Package size={20} color={T.accent} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <div style={{ fontWeight: '900', fontSize: 14 }}>{l.name}</div>
                                                        <div style={{ fontWeight: '1000', fontSize: 14, color: l.type === 'SAVDO' ? '#10B981' : l.type === 'EXPENSE' ? '#FF6464' : T.accent }}>{l.type === 'EXPENSE' ? '-' : '+'}{(Number(l.amount) || 0).toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ fontSize: 10, opacity: 0.4, fontWeight: '800' }}>{l.type} • {new Date(l.date || l.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {logs.length === 0 && <div style={{ textAlign: 'center', padding: 30, opacity: 0.4, background: T.card, borderRadius: 24, border: `1px solid ${T.border}` }}>Hozircha harakatlar yo'q 🍃</div>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {tab === 'settings' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 35 }}>
                            <div style={{ width: 60, height: 60, borderRadius: 22, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: `0 15px 35px ${T.accent}30` }}>
                                <Settings size={28} />
                            </div>
                            <h2 style={{ fontSize: 32, fontWeight: '900', margin: 0 }}>Sozlamalar</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                            {/* CATEGORY MANAGEMENT */}

                            {/* CATEGORY MANAGEMENT */}
                            <div style={{ background: T.card, padding: 25, borderRadius: 36, border: `1px solid ${T.border}`, boxShadow: `0 20px 40px ${T.shadow}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: '900' }}>Kategoriyalar</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                                    <input
                                        value={newCat}
                                        onChange={e => setNewCat(e.target.value)}
                                        placeholder="Yangi turkum..."
                                        style={{ flex: 1, background: isDark ? '#16161F' : '#F5F5F5', border: `1px solid ${T.border}`, padding: '15px 20px', borderRadius: 18, color: T.text, outline: 'none', fontWeight: '800' }}
                                    />
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={async () => {
                                            if (!newCat.trim()) return;
                                            const { error } = await supabase.from('fb_categories').insert([{ name: newCat.trim() }]);
                                            if (error) return showToast("Xatolik");
                                            setCategories([...categories, newCat.trim()]);
                                            setNewCat('');
                                            showToast("Qo'shildi! ✅");
                                        }}
                                        style={{ width: 55, height: 55, borderRadius: 18, background: T.accent, color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Plus size={24} />
                                    </motion.button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {categories.map(c => (
                                        <div key={c} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: '10px 18px', borderRadius: 15, border: `1px dashed ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: '800' }}>
                                            {c}
                                            <Trash2 size={14} color="#FF6464" style={{ cursor: 'pointer' }} onClick={async () => {
                                                if (!confirm("O'chirilsinmi?")) return;
                                                await supabase.from('fb_categories').delete().eq('name', c);
                                                setCategories(categories.filter(x => x !== c));
                                            }} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* DATA MANAGEMENT - DANGER ZONE */}
                            <div style={{ background: T.card, padding: 25, borderRadius: 36, border: `1px solid rgba(255,100,100,0.2)`, boxShadow: `0 20px 40px ${T.shadow}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                    <div style={{ width: 35, height: 35, borderRadius: 10, background: 'rgba(255,100,100,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <AlertTriangle size={18} color="#FF6464" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: '900', color: '#FF6464' }}>Ma'lumotlarni boshqarish</h3>
                                </div>
                                <p style={{ fontSize: 11, opacity: 0.5, marginBottom: 25, lineHeight: 1.5 }}>
                                    Eslatma: Ombor tozalanganidan keyin statistika (foyda/harajat) natijalari saqlanib qolishi uchun loglarni (tarix) ham qo'lda tozalash kerak bo'lishi mumkin.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            const code = prompt("O'chirish uchun maxsus kodni kiriting:");
                                            if (code !== '111') return showToast("Kod noto'g'ri! ❌");
                                            if (!confirm("Barcha TARIXNI o'chirib, hisobotlarni nolga tushirasizmi? Bu amalni orqaga qaytarib bo'lmaydi!")) return;
                                            const { error } = await supabase.from('fb_logs').delete().neq('id', 0);
                                            if (error) return showToast("Xatolik!");
                                            setLogs([]);
                                            showToast("Tarix nolga tushirildi! 🧼");
                                        }}
                                        style={{ width: '100%', padding: '20px', borderRadius: 22, border: '1.5px solid rgba(255,100,100,0.3)', background: 'transparent', color: '#FF6464', fontWeight: '1000', fontSize: 14 }}
                                    >
                                        TARIXNI (LOGS) TOZALASH
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={async () => {
                                            const code = prompt("O'chirish uchun maxsus kodni kiriting:");
                                            if (code !== '111') return showToast("Kod noto'g'ri! ❌");
                                            if (!confirm("Barcha MAHSULOTLARNI o'chirib yuborasizmi? Ombordagi barcha ma'lumotlar yo'qoladi!")) return;
                                            const { error } = await supabase.from('fb_products').delete().neq('id', 0);
                                            if (error) return showToast("Xatolik!");
                                            setProducts([]);
                                            showToast("Ombor butunlay tozalandi! 📦");
                                        }}
                                        style={{ width: '100%', padding: '20px', borderRadius: 22, border: 'none', background: '#FF6464', color: '#000', fontWeight: '1000', fontSize: 14, boxShadow: '0 10px 20px rgba(255,100,100,0.2)' }}
                                    >
                                        OMBORNI (PRODUCTS) TOZALASH
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            localStorage.clear();
                                            setIsAuthenticated(false);
                                            setIsSuperAdmin(false);
                                            setCurrentShop(null);
                                            showToast("Tizimdan chiqildi! 👋");
                                            setShowLoginForm(false);
                                        }}
                                        style={{ width: '100%', padding: '18px', borderRadius: 22, border: 'none', background: 'rgba(255,100,100,0.1)', color: '#FF6464', fontWeight: '1000', fontSize: 13, marginTop: 10 }}
                                    >
                                        TIZIMGA QAYTISH (LOGOUT)
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: 40, textAlign: 'center', opacity: 0.2, fontSize: 10, fontWeight: '1000', letterSpacing: 3 }}>
                            FAROBIY MARKET • v4.41
                        </div>
                    </motion.div>
                )}

                {tab === 'sklad' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 }}>
                            <h2 style={{ fontSize: 32, fontWeight: '900', margin: 0 }}>Ombor</h2>
                            <div style={{ fontSize: 10, fontWeight: '1000', color: T.accent, letterSpacing: 2 }}>{products.length} TA MAHSULOT</div>
                        </div>

                        {/* PREMIUM INVENTORY DASHBOARD */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 }}>
                            <motion.div whileHover={{ y: -5 }} style={{ background: T.card, padding: 22, borderRadius: 32, border: `1px solid ${T.border}`, boxShadow: `0 15px 30px ${T.shadow}` }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <LayoutGrid size={16} color={T.accent} />
                                </div>
                                <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, letterSpacing: 1, marginBottom: 2 }}>JAMI TURKUMLAR</div>
                                <div style={{ fontSize: 22, fontWeight: '1000' }}>{inventoryStats.totalCategories}</div>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} style={{ background: T.card, padding: 22, borderRadius: 32, border: `1px solid ${T.border}`, boxShadow: `0 15px 30px ${T.shadow}` }}>
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#10B98115', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                    <Package size={16} color="#10B981" />
                                </div>
                                <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, letterSpacing: 1, marginBottom: 2 }}>JAMI DONA</div>
                                <div style={{ fontSize: 22, fontWeight: '1000' }}>{inventoryStats.totalItems}</div>
                            </motion.div>
                        </div>

                        {/* FINANCE SUMMARY CARD */}
                        <motion.div whileHover={{ scale: 1.01 }} style={{ background: `linear-gradient(135deg, ${T.card}, ${isDark ? '#16161F' : '#F9F9F9'})`, padding: 25, borderRadius: 36, border: `1px solid ${T.accent}20`, marginBottom: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `0 20px 40px ${T.shadow}` }}>
                            <div>
                                <div style={{ fontSize: 9, fontWeight: '1000', color: T.accent, letterSpacing: 2, marginBottom: 8 }}>OMBORNING UMUMIY QIYMATI</div>
                                <div style={{ fontSize: 28, fontWeight: '1000' }}>{inventoryFinance.totalValue.toLocaleString()} <small style={{ fontSize: 12, opacity: 0.4 }}>SOM</small></div>
                                <div style={{ fontSize: 10, marginTop: 5, opacity: 0.5 }}>Tan narxi: {inventoryFinance.totalCost.toLocaleString()} SOM</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 16, background: `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
                                    <TrendingUp size={24} color={T.accent} />
                                </div>
                                <div style={{ marginTop: 10, fontSize: 13, fontWeight: '1000', color: '#10B981' }}>+{((inventoryFinance.profit / inventoryFinance.totalCost) * 100 || 0).toFixed(1)}%</div>
                            </div>
                        </motion.div>

                        {/* CATEGORY BREAKDOWN PROGRESS */}
                        <div style={{ background: T.card, padding: 25, borderRadius: 36, border: `1px solid ${T.border}`, marginBottom: 30, boxShadow: `0 20px 40px ${T.shadow}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <PieChart size={18} color={T.accent} />
                                <h3 style={{ margin: 0, fontSize: 13, fontWeight: '1000', letterSpacing: 1 }}>TURKUMLAR TAHLILI</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                {inventoryStats.catStats.map(cs => (
                                    <div key={cs.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: '900', marginBottom: 6 }}>
                                            <span style={{ opacity: 0.8 }}>{cs.name}</span>
                                            <span style={{ color: T.accent }}>{cs.count} ta</span>
                                        </div>
                                        <div style={{ height: 5, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${cs.percent}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: T.accent, borderRadius: 10 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SEARCH & FILTERS */}
                        <div style={{ background: T.card, padding: '12px 20px', borderRadius: 24, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <Search size={18} opacity={0.3} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Mahsulotlarni qidirish..."
                                style={{ background: 'transparent', border: 'none', color: T.text, width: '100%', outline: 'none', fontWeight: '800', fontSize: 14 }}
                            />
                        </div>

                        {/* CATEGORY FILTER CHIPS */}
                        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, marginBottom: 20, scrollbarWidth: 'none' }}>
                            {['Hammasi', ...categories].map(c => (
                                <motion.div
                                    key={c}
                                    onClick={() => setSelectedCat(c)}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: '12px 22px',
                                        borderRadius: 20,
                                        background: selectedCat === c ? T.accent : T.card,
                                        color: selectedCat === c ? '#000' : T.text,
                                        fontWeight: '800', fontSize: 13, whiteSpace: 'nowrap',
                                        border: `1px solid ${selectedCat === c ? T.accent : T.border}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {c}
                                </motion.div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {groupedProducts.filter(gp => !searchQuery || gp.name.toLowerCase().includes(searchQuery.toLowerCase()) || gp.color.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                <div style={{ textAlign: 'center', padding: 50, opacity: 0.4 }}>Mahsulotlar topilmadi 📦</div>
                            )}

                            {groupedProducts
                                .filter(gp => !searchQuery || gp.name.toLowerCase().includes(searchQuery.toLowerCase()) || gp.color.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((p, gIdx) => (
                                    <motion.div key={`${p.name}-${p.color}`} layout style={{ background: T.card, borderRadius: 32, overflow: 'hidden', border: `1px solid ${T.border}`, boxShadow: `0 10px 30px ${T.shadow}` }}>
                                        <div
                                            onClick={() => setExpanded(expanded === gIdx ? null : gIdx)}
                                            style={{ padding: 20, borderBottom: expanded === gIdx ? `1px solid ${T.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                                        >
                                            <div>
                                                <div style={{ fontSize: 9, fontWeight: '1000', color: T.accent, letterSpacing: 2, marginBottom: 5 }}>{(p.category || '').toUpperCase()}</div>
                                                <div style={{ fontSize: 20, fontWeight: '900' }}>{p.name} <small style={{ opacity: 0.4 }}>{p.color}</small></div>
                                                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>Razmerlar: {p.sizes.join(', ')}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                                <div style={{ fontSize: 22, fontWeight: '1000', color: T.accent }}>{p.items.length} <small style={{ fontSize: 10 }}>DONA</small></div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); setEditingItem(p.items[0]); }} style={{ width: 30, height: 30, borderRadius: 10, border: 'none', background: `${T.accent}15`, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={13} /></motion.button>
                                                    <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); handleDeleteGroup(p); }} style={{ width: 30, height: 30, borderRadius: 10, border: 'none', background: 'rgba(255,100,100,0.1)', color: '#FF6464', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></motion.button>
                                                </div>
                                                <div style={{ fontSize: 9, opacity: 0.4, fontWeight: '900' }}>{expanded === gIdx ? 'YOPISH ▲' : 'Ko\'rish ▼'}</div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expanded === gIdx && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                                                    <div style={{ padding: 15, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                                                        {p.items.map(item => (
                                                            <div key={item.id} style={{ background: T.card, padding: 12, borderRadius: 18, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                                                                <div style={{ fontSize: 10, fontWeight: '1000', color: T.accent, marginBottom: 5 }}>R: {item.size}</div>
                                                                <div
                                                                    onClick={(e) => { e.stopPropagation(); setViewingQR(item); }}
                                                                    style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, cursor: 'zoom-in' }}
                                                                >
                                                                    <QRCodeSVG value={item.uid || `FB|${item.name}|${item.color}|${item.size}|${item.id}`} size={70} />
                                                                </div>
                                                                <div style={{ display: 'flex', gap: 5 }}>
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={(e) => { e.stopPropagation(); setShowPrint([item]); }}
                                                                        style={{ flex: 1, height: 32, borderRadius: 8, border: 'none', background: `${T.accent}20`, color: T.accent }}
                                                                    ><Printer size={14} /></motion.button>
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={(e) => { e.stopPropagation(); setEditingItem(item); }}
                                                                        style={{ flex: 1, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: T.text }}
                                                                    ><Edit size={14} /></motion.button>
                                                                    <motion.button
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item.id); }}
                                                                        style={{ flex: 1, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,100,100,0.1)', color: '#FF6464' }}
                                                                    ><Trash2 size={14} /></motion.button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                        </div>
                    </motion.div>
                )}
                {tab === 'buhgalter' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <h2 style={{ fontSize: 32, fontWeight: '900', margin: 0 }}>Buhgalteriya</h2>
                            <div style={{ display: 'flex', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: 4, borderRadius: 15 }}>
                                <div onClick={() => setBuhTab('analytics')} style={{ padding: '8px 15px', borderRadius: 12, background: buhTab === 'analytics' ? T.accent : 'transparent', color: buhTab === 'analytics' ? '#000' : T.text, fontSize: 10, fontWeight: '1000', cursor: 'pointer' }}>TAHLIL</div>
                                <div onClick={() => setBuhTab('expenses')} style={{ padding: '8px 15px', borderRadius: 12, background: buhTab === 'expenses' ? T.accent : 'transparent', color: buhTab === 'expenses' ? '#000' : T.text, fontSize: 10, fontWeight: '1000', cursor: 'pointer' }}>HARAJAT</div>
                            </div>
                        </div>

                        {/* KALENDAR (BUHGALTERIYADA) */}
                        <motion.div whileTap={{ scale: 0.98 }} onClick={() => setShowCalendar(!showCalendar)} style={{ background: `linear-gradient(135deg, ${T.accent}15, ${T.accent}05)`, padding: '18px 22px', borderRadius: 28, border: `1px solid ${T.accent}30`, marginBottom: 25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 14, background: `${T.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={20} color={T.accent} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 9, fontWeight: '1000', color: T.accent, letterSpacing: 2 }}>KUNLIK HISOBOT</div>
                                    <div style={{ fontSize: 14, fontWeight: '800', marginTop: 2 }}>{selectedDay ? new Date(calendarDate.getFullYear(), calendarDate.getMonth(), selectedDay).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Kalendarni ochish'}</div>
                                </div>
                            </div>
                            <ChevronDown size={18} color={T.muted} style={{ transform: showCalendar ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s' }} />
                        </motion.div>

                        <AnimatePresence>
                            {showCalendar && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 25, overflow: 'hidden' }}>
                                    <div style={{ background: T.card, borderRadius: 36, padding: 20, border: `1px solid ${T.border}`, boxShadow: `0 20px 40px ${T.shadow}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: `${T.accent}15`, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={16} /></motion.button>
                                            <div style={{ fontSize: 16, fontWeight: '900' }}>{calendarDate.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}</div>
                                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: `${T.accent}15`, color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={16} /></motion.button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                                            {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => (
                                                <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: '1000', opacity: 0.3, padding: 5 }}>{d}</div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                                            {(() => {
                                                const year = calendarDate.getFullYear();
                                                const month = calendarDate.getMonth();
                                                const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
                                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                                const cells = [];
                                                for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`}></div>);
                                                for (let d = 1; d <= daysInMonth; d++) {
                                                    const dayDate = new Date(year, month, d);
                                                    const isToday = new Date().toDateString() === dayDate.toDateString();
                                                    const isSelected = selectedDay === d;
                                                    const dayLogs = logs.filter(l => { const ld = new Date(l.date || l.created_at); return ld.getFullYear() === year && ld.getMonth() === month && ld.getDate() === d; });
                                                    const hasSales = dayLogs.some(l => l.type === 'SAVDO');
                                                    const hasExpense = dayLogs.some(l => l.type === 'EXPENSE');
                                                    cells.push(
                                                        <motion.div key={d} whileTap={{ scale: 0.9 }} onClick={() => setSelectedDay(isSelected ? null : d)} style={{
                                                            height: 42, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                            background: isSelected ? T.accent : isToday ? `${T.accent}15` : 'transparent',
                                                            color: isSelected ? '#000' : T.text,
                                                            border: isToday && !isSelected ? `1.5px solid ${T.accent}` : `1px solid transparent`,
                                                            fontWeight: '900', fontSize: 13, position: 'relative'
                                                        }}>
                                                            {d}
                                                            {(hasSales || hasExpense) && <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                                                {hasSales && <div style={{ width: 4, height: 4, borderRadius: 2, background: isSelected ? '#000' : '#10B981' }}></div>}
                                                                {hasExpense && <div style={{ width: 4, height: 4, borderRadius: 2, background: isSelected ? '#000' : '#FF6464' }}></div>}
                                                            </div>}
                                                        </motion.div>
                                                    );
                                                }
                                                return cells;
                                            })()}
                                        </div>
                                        {selectedDay && (() => {
                                            const year = calendarDate.getFullYear();
                                            const month = calendarDate.getMonth();
                                            const dayLogs = logs.filter(l => { const ld = new Date(l.date || l.created_at); return ld.getFullYear() === year && ld.getMonth() === month && ld.getDate() === selectedDay; });
                                            const daySales = dayLogs.filter(l => l.type === 'SAVDO');
                                            const dayExpenses = dayLogs.filter(l => l.type === 'EXPENSE');
                                            const totalSales = daySales.reduce((s, l) => s + (Number(l.amount) || 0), 0);
                                            const totalExpense = dayExpenses.reduce((s, l) => s + (Number(l.amount) || 0), 0);
                                            return (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                                                        <div style={{ background: '#10B98110', padding: 12, borderRadius: 18, textAlign: 'center' }}>
                                                            <div style={{ fontSize: 7, fontWeight: '1000', color: '#10B981' }}>SAVDO</div>
                                                            <div style={{ fontSize: 14, fontWeight: '1000', color: '#10B981' }}>{totalSales.toLocaleString()}</div>
                                                        </div>
                                                        <div style={{ background: 'rgba(255,100,100,0.08)', padding: 12, borderRadius: 18, textAlign: 'center' }}>
                                                            <div style={{ fontSize: 7, fontWeight: '1000', color: '#FF6464' }}>HARAJAT</div>
                                                            <div style={{ fontSize: 14, fontWeight: '1000', color: '#FF6464' }}>{totalExpense.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                                                        {dayLogs.map(l => (
                                                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${T.border}` }}>
                                                                <div style={{ fontSize: 11, fontWeight: '800' }}>{l.name}</div>
                                                                <div style={{ fontWeight: '1000', fontSize: 11, color: l.type === 'SAVDO' ? '#10B981' : '#FF6464' }}>{(Number(l.amount) || 0).toLocaleString()}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            );
                                        })()}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {buhTab === 'analytics' ? (
                            <>
                                {/* PERIOD SELECTOR */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 25, overflowX: 'auto', paddingBottom: 5, scrollbarWidth: 'none' }}>
                                    {[
                                        { id: 'day', label: 'BUGUN' },
                                        { id: 'week', label: 'HAFTA' },
                                        { id: 'month', label: 'OY' },
                                        { id: 'year', label: 'YIL' }
                                    ].map(p => (
                                        <div key={p.id} onClick={() => setPeriod(p.id)} style={{ padding: '10px 20px', borderRadius: 20, background: period === p.id ? T.accent : T.card, color: period === p.id ? '#000' : T.text, fontSize: 11, fontWeight: '1000', border: `1px solid ${period === p.id ? T.accent : T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{p.label}</div>
                                    ))}
                                </div>

                                {(() => {
                                    const d = period === 'day' ? stats.daily : period === 'week' ? stats.weekly : period === 'month' ? stats.monthly : stats.yearly;
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                            {/* MAIN PROFIT CARD */}
                                            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ background: `linear-gradient(135deg, ${T.accent}, #FFD700)`, padding: 30, borderRadius: 40, color: '#000', boxShadow: `0 20px 40px ${T.accent}30` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontSize: 10, fontWeight: '1000', opacity: 0.7, letterSpacing: 2, marginBottom: 5 }}>SOF FOYDA ✨</div>
                                                        <div style={{ fontSize: 36, fontWeight: '1000' }}>{d.profit.toLocaleString()} <small style={{ fontSize: 14 }}>SOM</small></div>
                                                    </div>
                                                    <div style={{ background: 'rgba(0,0,0,0.1)', padding: '10px 15px', borderRadius: 15, textAlign: 'center' }}>
                                                        <div style={{ fontSize: 14, fontWeight: '1000' }}>{d.growth >= 0 ? '+' : ''}{d.growth.toFixed(1)}%</div>
                                                        <div style={{ fontSize: 7, fontWeight: '1000', opacity: 0.5 }}>O'SISH</div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* METRICS GRID */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                                <div style={{ background: T.card, padding: 22, borderRadius: 32, border: `1px solid ${T.border}` }}>
                                                    <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 8 }}>JAMI KIRIM (VAYUCHA)</div>
                                                    <div style={{ fontSize: 18, fontWeight: '1000', color: '#10B981' }}>{d.revenue.toLocaleString()}</div>
                                                </div>
                                                <div style={{ background: T.card, padding: 22, borderRadius: 32, border: `1px solid ${T.border}` }}>
                                                    <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 8 }}>TOVAR TAN NARXI</div>
                                                    <div style={{ fontSize: 18, fontWeight: '1000', color: '#6366F1' }}>{d.cogs.toLocaleString()}</div>
                                                </div>
                                                <div style={{ background: T.card, padding: 22, borderRadius: 32, border: `1px solid ${T.border}` }}>
                                                    <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 8 }}>UMUMIY HARAJATLAR</div>
                                                    <div style={{ fontSize: 18, fontWeight: '1000', color: '#FF6464' }}>{d.expense.toLocaleString()}</div>
                                                </div>
                                                <div style={{ background: T.card, padding: 22, borderRadius: 32, border: `1px solid ${T.border}` }}>
                                                    <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 8 }}>QARZDORLIK</div>
                                                    <div style={{ fontSize: 18, fontWeight: '1000', color: T.accent }}>{stats.totalDebt.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                                {/* EXPENSE SUMMARY CARDS */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {[
                                        { label: 'KUNLIK', val: stats.daily.expense },
                                        { label: 'HAFTALIK', val: stats.weekly.expense },
                                        { label: 'OYLIK', val: stats.monthly.expense },
                                        { label: 'YILLIK', val: stats.yearly.expense }
                                    ].map(item => (
                                        <div key={item.label} style={{ background: T.card, padding: '15px 20px', borderRadius: 24, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.4, marginBottom: 5 }}>{item.label} HARAJAT</div>
                                            <div style={{ fontSize: 16, fontWeight: '1000', color: '#FF6464' }}>{item.val.toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* ADD EXPENSE FORM */}
                                <div style={{ background: T.card, padding: 25, borderRadius: 36, border: `1px solid ${T.accent}30`, boxShadow: `0 20px 40px ${T.shadow}` }}>
                                    <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: '900' }}>Yangi Harajat</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                        <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7', padding: '15px 20px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.4, marginBottom: 5 }}>HARAJAT NOMI</div>
                                            <input id="expName" type="text" placeholder="Masalan: Obed..." style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                        </div>
                                        <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7', padding: '15px 20px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.4, marginBottom: 5 }}>SUMMA</div>
                                            <input id="expAmount" type="number" placeholder="0" style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 22, fontWeight: '1000', outline: 'none' }} />
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={async () => {
                                                const n = document.getElementById('expName').value;
                                                const a = document.getElementById('expAmount').value;
                                                if (!n || !a) return showToast("To'ldiring!");
                                                const { data, error } = await supabase.from('fb_logs').insert([{ type: 'EXPENSE', name: n, amount: Number(a), date: new Date().toISOString() }]).select();
                                                if (error) return showToast("Xatolik!");
                                                setLogs([data[0], ...logs]);
                                                document.getElementById('expName').value = '';
                                                document.getElementById('expAmount').value = '';
                                                showToast("Saqlandi! 💸");
                                            }}
                                            style={{ height: 60, borderRadius: 20, border: 'none', background: T.accent, color: '#000', fontWeight: '1000' }}
                                        >SAQLASH</motion.button>
                                    </div>
                                </div>

                                <h3 style={{ margin: '10px 0 0 0', fontSize: 18, fontWeight: '900' }}>Harajatlar Tarixi</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {logs.filter(l => l.type === 'EXPENSE').length === 0 && <div style={{ textAlign: 'center', padding: 40, opacity: 0.4 }}>Yo'q</div>}
                                    {logs.filter(l => l.type === 'EXPENSE').slice(0, 50).map(l => (
                                        <div key={l.id} style={{ background: T.card, padding: 20, borderRadius: 28, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                {editingItem?.id === l.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                        <input defaultValue={l.name} id={`editN-${l.id}`} style={{ width: '100%', background: 'rgba(0,0,0,0.1)', border: 'none', color: T.text, borderRadius: 8, padding: 5 }} />
                                                        <input defaultValue={l.amount} id={`editA-${l.id}`} type="number" style={{ width: '100%', background: 'rgba(0,0,0,0.1)', border: 'none', color: T.text, borderRadius: 8, padding: 5 }} />
                                                        <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                                                            <button onClick={() => updateExpense(l.id, document.getElementById(`editN-${l.id}`).value, document.getElementById(`editA-${l.id}`).value)} style={{ padding: '5px 15px', borderRadius: 8, background: T.accent, border: 'none', fontSize: 10, fontWeight: '1000' }}>OK</button>
                                                            <button onClick={() => setEditingItem(null)} style={{ padding: '5px 15px', borderRadius: 8, background: '#333', color: '#fff', border: 'none', fontSize: 10 }}>X</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ fontWeight: '800', fontSize: 15 }}>{l.name}</div>
                                                        <div style={{ fontSize: 10, opacity: 0.4, marginTop: 4 }}>{new Date(l.date).toLocaleString()}</div>
                                                    </>
                                                )}
                                            </div>
                                            {!editingItem && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                                    <div style={{ fontWeight: '1000', color: '#FF6464', fontSize: 16 }}>-{Number(l.amount).toLocaleString()}</div>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => setEditingItem(l)} style={{ padding: 8, borderRadius: 12, border: 'none', background: T.border, color: T.muted }}><Edit size={14} /></button>
                                                        <button onClick={() => deleteLog(l.id)} style={{ padding: 8, borderRadius: 12, border: 'none', background: T.border, color: '#FF6464' }}><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'history' && (() => {
                    const filteredLogs = logs.filter(l => {
                        const matchesType = historyType === 'ALL' || l.type === historyType;
                        const logDate = new Date(l.date || l.created_at);
                        const today = new Date();

                        let matchesPeriod = false;
                        if (historyPeriod === 'day') {
                            matchesPeriod = logDate.toDateString() === today.toDateString();
                        } else if (historyPeriod === 'week') {
                            const weekAgo = new Date();
                            weekAgo.setDate(today.getDate() - 7);
                            matchesPeriod = logDate >= weekAgo;
                        } else if (historyPeriod === 'month') {
                            matchesPeriod = logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
                        } else if (historyPeriod === 'year') {
                            matchesPeriod = logDate.getFullYear() === today.getFullYear();
                        } else if (historyPeriod === 'custom') {
                            const dateStr = logDate.toISOString().split('T')[0];
                            matchesPeriod = dateStr === historyDate;
                        }
                        return matchesType && matchesPeriod;
                    });

                    // History Stats
                    const hStats = {
                        day: logs.filter(l => new Date(l.date || l.created_at).toDateString() === new Date().toDateString() && l.type === 'SAVDO').reduce((s, x) => s + (Number(x.amount) || 0), 0),
                        week: logs.filter(l => {
                            const d = new Date(l.date || l.created_at);
                            const now = new Date();
                            now.setDate(now.getDate() - 7);
                            return d >= now && l.type === 'SAVDO';
                        }).reduce((s, x) => s + (Number(x.amount) || 0), 0),
                        month: logs.filter(l => new Date(l.date || l.created_at).getMonth() === new Date().getMonth() && l.type === 'SAVDO').reduce((s, x) => s + (Number(x.amount) || 0), 0),
                        year: logs.filter(l => new Date(l.date || l.created_at).getFullYear() === new Date().getFullYear() && l.type === 'SAVDO').reduce((s, x) => s + (Number(x.amount) || 0), 0),
                    };

                    return (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* PREMIUM HISTORY HEADER */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                                <h2 style={{ fontSize: 32, fontWeight: '900', margin: 0 }}>Tarix <small style={{ fontSize: 12, opacity: 0.3, letterSpacing: 2 }}>{historyPeriod.toUpperCase()}</small></h2>
                                <input
                                    type="date"
                                    value={historyDate}
                                    onChange={(e) => {
                                        setHistoryDate(e.target.value);
                                        setHistoryPeriod('custom');
                                    }}
                                    style={{ background: T.card, color: T.text, border: `1px solid ${T.border}`, padding: '8px 12px', borderRadius: 12, fontSize: 12, fontWeight: '800', outline: 'none' }}
                                />
                            </div>

                            {/* MINI STATS CARDS / FILTERS */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 25 }}>
                                {[
                                    { id: 'day', label: 'BUGUN', value: hStats.day },
                                    { id: 'week', label: 'HAFTA', value: hStats.week },
                                    { id: 'month', label: 'OY', value: hStats.month },
                                    { id: 'year', label: 'YIL', value: hStats.year }
                                ].map(p => (
                                    <motion.div
                                        key={p.id}
                                        onClick={() => setHistoryPeriod(p.id)}
                                        whileTap={{ scale: 0.9 }}
                                        style={{
                                            background: historyPeriod === p.id ? T.accent : T.card,
                                            color: historyPeriod === p.id ? '#000' : T.text,
                                            padding: '12px 5px', borderRadius: 20, border: `1px solid ${historyPeriod === p.id ? T.accent : T.border}`, textAlign: 'center', cursor: 'pointer', transition: '0.3s'
                                        }}
                                    >
                                        <div style={{ fontSize: 7, fontWeight: '1000', opacity: historyPeriod === p.id ? 0.6 : 0.4, marginBottom: 4 }}>{p.label}</div>
                                        <div style={{ fontSize: 11, fontWeight: '1000' }}>{p.value > 1000000 ? (p.value / 1000000).toFixed(1) + 'M' : (p.value / 1000).toFixed(0) + 'K'}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* TYPE FILTER CHIPS */}
                            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 15, marginBottom: 15, scrollbarWidth: 'none' }}>
                                {[
                                    { id: 'ALL', label: 'HAMMASI' },
                                    { id: 'SAVDO', label: 'SOTUV' },
                                    { id: 'KIRIM', label: 'KIRIM' },
                                    { id: 'EXPENSE', label: 'HARAJAT' },
                                    { id: 'EDIT', label: 'O\'ZGARISH' },
                                    { id: 'DELETE', label: 'O\'CHIRISH' }
                                ].map(f => (
                                    <motion.div
                                        key={f.id}
                                        onClick={() => setHistoryType(f.id)}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: '10px 20px', borderRadius: 15, fontSize: 11, fontWeight: '900', whiteSpace: 'nowrap', cursor: 'pointer',
                                            background: historyType === f.id ? T.accent : T.card,
                                            color: historyType === f.id ? '#000' : T.text,
                                            border: `1px solid ${historyType === f.id ? T.accent : T.border}`
                                        }}
                                    >
                                        {f.label}
                                    </motion.div>
                                ))}
                            </div>

                            {/* LOG LIST */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {filteredLogs.length === 0 && <div style={{ textAlign: 'center', padding: 50, opacity: 0.3, background: T.card, borderRadius: 30, border: `1px dashed ${T.border}` }}>Ma'lumot topilmadi 🍃</div>}
                                {filteredLogs.slice(0, 50).map(l => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        key={l.id}
                                        style={{ background: T.card, padding: '18px 22px', borderRadius: 28, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `0 10px 20px ${T.shadow}` }}
                                    >
                                        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 14, background: l.type === 'SAVDO' ? '#10B98115' : l.type === 'EXPENSE' ? '#FF646415' : l.type === 'DELETE' ? '#FF444415' : `${T.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {l.type === 'SAVDO' ? <TrendingUp size={18} color="#10B981" /> : l.type === 'EXPENSE' ? <ArrowDownLeft size={18} color="#FF6464" /> : l.type === 'DELETE' ? <Trash2 size={18} color="#FF4444" /> : l.type === 'EDIT' ? <Edit size={18} color={T.accent} /> : <Package size={18} color={T.accent} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '800', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</div>
                                                <div style={{ fontSize: 9, opacity: 0.3, fontWeight: '800', marginTop: 4 }}>{new Date(l.date || l.created_at).toLocaleTimeString('uz-UZ')} • {l.type}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {l.amount > 0 ? (
                                                <div style={{ fontWeight: '1000', fontSize: 14, color: l.type === 'SAVDO' ? '#10B981' : l.type === 'EXPENSE' ? '#FF6464' : T.accent }}>
                                                    {l.type === 'EXPENSE' ? '-' : '+'}{Number(l.amount).toLocaleString()}
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 10, opacity: 0.4, fontWeight: '1000' }}>BAJARILDI</div>
                                            )}
                                            <div style={{ fontSize: 8, opacity: 0.2, fontWeight: '1000' }}>{new Date(l.date || l.created_at).toLocaleDateString('uz-UZ')}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div style={{ height: 20 }} />
                        </motion.div>
                    )
                })()}
                <div style={{ height: 100 }} />
            </div>

            {/* DOCK NAV */}
            <nav style={{ position: 'fixed', bottom: 20, left: 15, right: 15, height: 80, background: T.navBg, backdropFilter: 'blur(30px)', borderRadius: 28, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                {[
                    { id: 'dashboard', icon: <Home />, label: 'ASOSIY' },
                    { id: 'sklad', icon: <Package />, label: 'OMBOR' },
                    { id: 'buhgalter', icon: <BarChart3 />, label: 'BUXGALTER' },
                    { id: 'history', icon: <History />, label: 'TARIX' },
                    { id: 'settings', icon: <Settings />, label: 'TIZIM' }
                ].map(m => (
                    <div key={m.id} onClick={() => setTab(m.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, cursor: 'pointer' }}>
                        <motion.div animate={{ y: tab === m.id ? -4 : 0, scale: tab === m.id ? 1.1 : 1 }} style={{ color: tab === m.id ? T.accent : T.muted }}>
                            {React.cloneElement(m.icon, { size: 22, strokeWidth: tab === m.id ? 2.5 : 1.8 })}
                        </motion.div>
                        <span style={{ fontSize: 8, fontWeight: '1000', color: tab === m.id ? T.accent : T.muted, opacity: tab === m.id ? 1 : 0.6 }}>{m.label}</span>
                    </div>
                ))}
            </nav>

            {/* KIRIM MODAL (v3.1 BOUTIQUE PRO - SMART WORKFLOW) */}
            <AnimatePresence>
                {showKirim && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 10000, padding: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            style={{ background: isDark ? '#0A0A0F' : '#FFFFFF', width: '100%', borderRadius: 40, padding: '30px 20px', maxHeight: '92vh', overflowY: 'auto', border: `1px solid ${T.accent}30`, boxShadow: '0 50px 100px rgba(0,0,0,0.9)', position: 'relative' }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 25 }}>
                                <div style={{ fontSize: 9, fontWeight: '1000', color: T.accent, letterSpacing: 3, marginBottom: 5 }}>PROFESSIONAL KIRIM</div>
                                <h2 style={{ margin: 0, fontSize: 20, fontWeight: '900', color: isDark ? '#fff' : '#000' }}>Yangi Pachka Kiritish</h2>
                                <motion.div onClick={() => setShowKirim(false)} whileTap={{ scale: 0.9 }} style={{ position: 'absolute', top: 15, right: 15, padding: 8, background: isDark ? '#1C1C26' : '#F5F5F5', borderRadius: 12, cursor: 'pointer' }}><X size={18} /></motion.div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                                {/* KIRIM TYPE TOGGLE */}
                                <div style={{ display: 'flex', background: isDark ? '#1A1A24' : '#EAEAEA', padding: 4, borderRadius: 18, marginBottom: 10 }}>
                                    <button onClick={() => setKirimForm({ ...kirimForm, type: 'pachka' })} style={{ flex: 1, padding: '12px', borderRadius: 14, border: 'none', background: kirimForm.type === 'pachka' ? T.accent : 'transparent', color: kirimForm.type === 'pachka' ? '#000' : T.muted, fontSize: 12, fontWeight: '1000' }}>PACHKA TIZIMI</button>
                                    <button onClick={() => setKirimForm({ ...kirimForm, type: 'dona' })} style={{ flex: 1, padding: '12px', borderRadius: 14, border: 'none', background: kirimForm.type === 'dona' ? T.accent : 'transparent', color: kirimForm.type === 'dona' ? '#000' : T.muted, fontSize: 12, fontWeight: '1000' }}>DONA (SINGLE)</button>
                                </div>

                                {/* 1. NOMI / RANGI / TURKUM */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3, marginBottom: 5 }}><Tag size={10} /> <span style={{ fontSize: 8, fontWeight: '1000' }}>MAHSULOT NOMI</span></div>
                                        <input value={kirimForm.name} onChange={e => setKirimForm({ ...kirimForm, name: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 15, fontWeight: '800', outline: 'none' }} placeholder="Guchi..." />
                                    </div>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3, marginBottom: 5 }}><Palette size={10} /> <span style={{ fontSize: 8, fontWeight: '1000' }}>RANGI</span></div>
                                        <input value={kirimForm.color} onChange={e => setKirimForm({ ...kirimForm, color: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 15, fontWeight: '800', outline: 'none' }} placeholder="Oq..." />
                                    </div>
                                </div>

                                <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3, marginBottom: 5 }}><LayoutGrid size={10} /> <span style={{ fontSize: 8, fontWeight: '1000' }}>TURKUM (KATEGORIYA)</span></div>
                                    <select
                                        value={kirimForm.category}
                                        onChange={e => setKirimForm({ ...kirimForm, category: e.target.value })}
                                        style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 15, fontWeight: '800', outline: 'none', appearance: 'none' }}
                                    >
                                        {categories.map(c => <option key={c} value={c} style={{ background: '#000' }}>{c}</option>)}
                                    </select>
                                </div>

                                {/* 2. COST SECTION */}
                                <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3, marginBottom: 5 }}><DollarSign size={10} /> <span style={{ fontSize: 8, fontWeight: '1000' }}>{kirimForm.type === 'pachka' ? 'PACHKA TAN NARXI' : 'DONA TAN NARXI'}</span></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <input type="number" value={kirimForm.pachkaCost} onChange={e => setKirimForm({ ...kirimForm, pachkaCost: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 18, fontWeight: '1000', outline: 'none' }} placeholder="0" />
                                        <span style={{ fontSize: 10, opacity: 0.3, fontWeight: '900' }}>SOM</span>
                                    </div>
                                </div>

                                {/* 3. RAZMERLAR TALLASH */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}><Layers size={12} /> <span style={{ fontSize: 9, fontWeight: '1000' }}>RAZMERLARNI TANLANG</span></div>
                                        <div style={{ display: 'flex', background: isDark ? '#1A1A24' : '#EAEAEA', padding: 3, borderRadius: 10 }}>
                                            <button onClick={() => setSizeMode('num')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: sizeMode === 'num' ? T.accent : 'transparent', color: sizeMode === 'num' ? '#000' : T.muted, fontSize: 9, fontWeight: '1000' }}>38-46</button>
                                            <button onClick={() => setSizeMode('lit')} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: sizeMode === 'lit' ? T.accent : 'transparent', color: sizeMode === 'lit' ? '#000' : T.muted, fontSize: 9, fontWeight: '1000' }}>S-XXXL</button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                                        {(sizeMode === 'num' ? numericSizes : letterSizes).map(s => (
                                            <motion.div key={s} whileTap={{ scale: 0.95 }} onClick={() => toggleSize(s)} style={{ height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: kirimForm.selectedSizes.includes(s) ? T.accent : (isDark ? '#16161F' : '#F5F5F5'), color: kirimForm.selectedSizes.includes(s) ? '#000' : T.muted, fontWeight: '1000', fontSize: 12, border: `1px solid ${kirimForm.selectedSizes.includes(s) ? T.accent : T.border}`, transition: '0.2s' }}>{s}</motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. AUTO-SPECS DISPLAY */}
                                <div style={{ display: 'grid', gridTemplateColumns: kirimForm.type === 'pachka' ? '1fr 1fr' : '1fr', gap: 10 }}>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px', borderRadius: 20, textAlign: 'center', border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 4 }}>{kirimForm.type === 'pachka' ? 'PACHKA SONI' : 'UMUMIY DONA SONI'}</div>
                                        <input type="number" value={kirimForm.pachkaCount} onChange={e => setKirimForm({ ...kirimForm, pachkaCount: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'center', color: T.text, fontSize: 20, fontWeight: '1000', outline: 'none' }} placeholder="0" />
                                    </div>
                                    {kirimForm.type === 'pachka' && (
                                        <div style={{ background: `${T.accent}08`, padding: '15px', borderRadius: 20, textAlign: 'center', border: `1px solid ${T.accent}30` }}>
                                            <div style={{ fontSize: 8, fontWeight: '1000', color: T.accent, opacity: 0.6, marginBottom: 4 }}>PACHKADA DONA (AUTO)</div>
                                            <div style={{ fontSize: 20, fontWeight: '1000', color: T.accent }}>{kirimForm.selectedSizes.length}</div>
                                        </div>
                                    )}
                                </div>

                                {/* 5. SOTUV NARXLARI SIDE-BY-SIDE */}
                                <div style={{ background: isDark ? '#0D0D14' : '#FAFAFA', padding: 20, borderRadius: 28, border: `1px solid ${T.accent}20` }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: kirimForm.type === 'pachka' ? '1fr 1fr' : '1fr', gap: 15 }}>
                                        {kirimForm.type === 'pachka' && (
                                            <div>
                                                <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.4, marginBottom: 8 }}>PACHKA SOTUV</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: isDark ? '#16161F' : '#fff', padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.border}` }}>
                                                    <input type="number" value={kirimForm.pachkaPrice} onChange={e => setKirimForm({ ...kirimForm, pachkaPrice: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontWeight: '1000', fontSize: 13, outline: 'none' }} placeholder="Pachka..." />
                                                    <span style={{ fontSize: 7, opacity: 0.3 }}>SOM</span>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: 8, fontWeight: '1000', color: T.accent, marginBottom: 8 }}>{kirimForm.type === 'pachka' ? 'DONA SOTUV (FOYDA)' : 'SOTUV NARXI'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${T.accent}10`, padding: '10px 12px', borderRadius: 12, border: `1px solid ${T.accent}40` }}>
                                                <input type="number" value={kirimForm.unitPrice} onChange={e => setKirimForm({ ...kirimForm, unitPrice: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.accent, fontWeight: '1000', fontSize: 13, outline: 'none' }} placeholder="Dona..." />
                                                <span style={{ fontSize: 7, color: T.accent }}>SOM</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleKirimSubmit} style={{ width: '100%', height: 65, borderRadius: 18, border: 'none', background: `linear-gradient(135deg, ${T.accent}, #B8860B)`, color: '#000', fontWeight: '1000', fontSize: 16, boxShadow: `0 15px 30px ${T.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                    SAQLASH VA QR GENERATSIYA
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PRINT / QR MODAL */}
            <AnimatePresence>
                {showPrint && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(30px)', zIndex: 10000, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                        <div style={{ width: '100%', maxWidth: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '0 10px' }}>
                            <div style={{ fontWeight: '1000', fontSize: 18, color: T.accent }}>PECHAT RO'YXATI ({showPrint.length})</div>
                            <motion.div whileTap={{ scale: 0.9 }} onClick={() => setShowPrint(null)} style={{ background: '#fff', color: '#000', padding: 8, borderRadius: 12, cursor: 'pointer' }}><X size={20} /></motion.div>
                        </div>

                        <div style={{ flex: 1, width: '100%', maxWidth: 500, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 20 }} className="print-area">
                            {showPrint.map((item, idx) => (
                                <motion.div
                                    key={item.uniqueId || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ background: '#fff', color: '#000', borderRadius: 25, padding: 20, textAlign: 'center', border: '1px solid #ddd', pageBreakAfter: 'always' }}
                                >
                                    <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.4, marginBottom: 10, letterSpacing: 2 }}>FAROBIY MARKET • PASPORT</div>

                                    <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                                        <QRCodeSVG
                                            value={item.uid || `FB|${item.name}|${item.color}|${item.size}|${Date.now()}`}
                                            size={150}
                                            level="M"
                                            includeMargin={true}
                                        />
                                    </div>

                                    <div style={{ fontSize: 22, fontWeight: '1000', marginBottom: 4 }}>{item.name}</div>
                                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 15 }}>Rangi: {item.color} | <span style={{ color: '#000', fontWeight: '900' }}>Razmer: {item.size}</span></div>

                                    <div style={{ background: '#000', color: '#fff', padding: '10px', borderRadius: 12, fontSize: 24, fontWeight: '1000' }}>
                                        {item.price.toLocaleString()} <small style={{ fontSize: 12, opacity: 0.7 }}>SOM</small>
                                    </div>

                                    <div style={{ marginTop: 10, fontSize: 8, opacity: 0.3 }}>ID: {item.id}</div>
                                </motion.div>
                            ))}
                        </div>

                        <div style={{ width: '100%', maxWidth: 500, padding: 20, display: 'flex', gap: 15 }}>
                            <button onClick={() => window.print()} style={{ flex: 1, height: 65, borderRadius: 20, border: 'none', background: T.accent, color: '#000', fontWeight: '1000', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 15px 30px ${T.accent}40` }}>
                                <Printer size={22} /> JAMINI PECHAT QILISH
                            </button>
                            <button onClick={() => setShowPrint(null)} style={{ height: 65, padding: '0 25px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 20, border: 'none', fontWeight: '900' }}>YOPISH</button>
                        </div>

                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                .print-area, .print-area * { visibility: visible; }
                                .print-area { position: absolute; left: 0; top: 0; width: 100%; }
                                nav, header, button { display: none !important; }
                            }
                        `}</style>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SAVDO MODAL (v3.5 - RADAR & MANUAL) */}
            <AnimatePresence>
                {showSavdo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 10000, padding: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} style={{ background: isDark ? '#0A0A0F' : '#FFF', width: '100%', borderRadius: 40, padding: 25, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${T.accent}40`, position: 'relative' }}>
                            <div style={{ textAlign: 'center', marginBottom: 25 }}>
                                <div style={{ fontSize: 9, fontWeight: '1000', color: T.accent, letterSpacing: 3, marginBottom: 5 }}>ELITE SALES</div>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: '900' }}>Sotuv Bo'limi</h2>
                                <motion.div whileTap={{ scale: 0.9 }} onClick={() => { setShowSavdo(false); setCart(null); }} style={{ position: 'absolute', top: 20, right: 20, padding: 8, background: isDark ? '#1C1C26' : '#F5F5F5', borderRadius: 12, cursor: 'pointer' }}><X size={18} /></motion.div>
                            </div>

                            {!cart ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <motion.button onClick={startScanner} whileTap={{ scale: 0.95 }} style={{ height: 120, borderRadius: 25, border: 'none', background: `linear-gradient(135deg, ${T.accent}, #B8860B)`, color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: `0 15px 30px ${T.accent}40` }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QrCode size={24} /></div>
                                        <span style={{ fontWeight: '1000', fontSize: 16 }}>QR RADARNI YOQISH</span>
                                    </motion.button>

                                    <div style={{ textAlign: 'center', opacity: 0.3, fontSize: 10, fontWeight: '900' }}>YOKI QO'LDA QIDIRING</div>

                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 20px', borderRadius: 20, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Search size={18} opacity={0.3} />
                                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Model yoki rang..." style={{ background: 'transparent', border: 'none', color: T.text, width: '100%', outline: 'none', fontWeight: '800' }} />
                                    </div>

                                    <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {products.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.color.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10).map(p => (
                                            <div key={p.id} onClick={() => setCart(p)} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: 15, borderRadius: 18, border: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                                <div>
                                                    <div style={{ fontSize: 14, fontWeight: '800' }}>{p.name} <small style={{ opacity: 0.5 }}>{p.color}</small></div>
                                                    <div style={{ fontSize: 10, opacity: 0.5 }}>Razmer: {p.size} | Qolgan: {p.qty} dona</div>
                                                </div>
                                                <div style={{ fontWeight: '900', color: T.accent }}>{p.price.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '10px 0' }}>
                                    <div style={{ background: `${T.accent}10`, padding: 20, borderRadius: 30, border: `1.5px dashed ${T.accent}`, marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 22, margin: 0, fontWeight: '900' }}>{cart.name}</h3>
                                        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{cart.color} | {cart.size} | Qoldiq: {cart.qty} dona</div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginBottom: 25, textAlign: 'left' }}>
                                        {/* DYNAMIC PRICE */}
                                        <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7', padding: '15px 20px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                            <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 5, letterSpacing: 1 }}>SOTUV NARXI (KELISHILGAN)</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <input
                                                    type="number"
                                                    value={cart.salePrice !== undefined ? cart.salePrice : cart.price}
                                                    onChange={e => setCart({ ...cart, salePrice: e.target.value })}
                                                    style={{ width: '100%', background: 'transparent', border: 'none', color: T.accent, fontSize: 24, fontWeight: '1000', outline: 'none' }}
                                                />
                                                <span style={{ fontSize: 12, fontWeight: '900', opacity: 0.3 }}>SOM</span>
                                            </div>
                                        </div>

                                        {/* PAYMENT STATUS */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <motion.div
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setCart({ ...cart, paymentStatus: 'paid' })}
                                                style={{
                                                    padding: '15px', borderRadius: 15, textAlign: 'center', cursor: 'pointer',
                                                    background: (cart.paymentStatus === 'paid' || !cart.paymentStatus) ? `${T.accent}20` : 'transparent',
                                                    border: `1px solid ${(cart.paymentStatus === 'paid' || !cart.paymentStatus) ? T.accent : T.border}`
                                                }}
                                            >
                                                <div style={{ fontSize: 11, fontWeight: '1000', color: (cart.paymentStatus === 'paid' || !cart.paymentStatus) ? T.accent : T.text }}>NAQD / TO'LIQ</div>
                                            </motion.div>
                                            <motion.div
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setCart({ ...cart, paymentStatus: 'debt' })}
                                                style={{
                                                    padding: '15px', borderRadius: 15, textAlign: 'center', cursor: 'pointer',
                                                    background: cart.paymentStatus === 'debt' ? 'rgba(255,100,100,0.1)' : 'transparent',
                                                    border: `1px solid ${cart.paymentStatus === 'debt' ? '#FF6464' : T.border}`
                                                }}
                                            >
                                                <div style={{ fontSize: 11, fontWeight: '1000', color: cart.paymentStatus === 'debt' ? '#FF6464' : T.text }}>QARZGA</div>
                                            </motion.div>
                                        </div>

                                        {/* CONDITIONAL CUSTOMER INFO */}
                                        {cart.paymentStatus === 'debt' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {/* CUSTOMER NAME */}
                                                <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7', padding: '15px 20px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                                    <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 5, letterSpacing: 1 }}>MIJOZ ISMI</div>
                                                    <input
                                                        type="text"
                                                        placeholder="Masalan: G'olib aka..."
                                                        value={cart.customerName || ''}
                                                        onChange={e => setCart({ ...cart, customerName: e.target.value })}
                                                        style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '700', outline: 'none' }}
                                                    />
                                                </div>
                                                {/* CUSTOMER PHONE */}
                                                <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F7', padding: '15px 20px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                                    <div style={{ fontSize: 9, fontWeight: '1000', opacity: 0.4, marginBottom: 5, letterSpacing: 1 }}>TEL RAQAMI</div>
                                                    <input
                                                        type="tel"
                                                        placeholder="+998 (__) ___-__-__"
                                                        value={cart.customerPhone || ''}
                                                        onChange={e => setCart({ ...cart, customerPhone: e.target.value })}
                                                        style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '700', outline: 'none' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button onClick={() => setCart(null)} style={{ height: 65, padding: '0 20px', borderRadius: 20, border: 'none', background: isDark ? '#1C1C26' : '#EEE', color: T.text, fontWeight: '900' }}>ORQAGA</button>
                                        <button onClick={handleSavdoSubmit} style={{ flex: 1, height: 65, borderRadius: 20, border: 'none', background: T.accent, color: '#000', fontWeight: '1000', fontSize: 16 }}>SOTUVNI TASDIQLASH</button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence> {msg && <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ position: 'fixed', bottom: 130, left: 25, right: 25, padding: '18px 25px', borderRadius: 24, background: `linear-gradient(135deg, ${T.accent}, #FFD700)`, color: '#000', textAlign: 'center', fontWeight: '1000', zIndex: 100000, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1.5px solid rgba(0,0,0,0.1)' }}><Zap size={18} /> {msg}</motion.div>} </AnimatePresence>

            {/* EDIT ITEM MODAL */}
            <AnimatePresence>
                {editingItem && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)', zIndex: 10000, padding: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} style={{ background: T.card, width: '100%', borderRadius: 40, padding: 25, border: `1px solid ${T.accent}40` }}>
                            <div style={{ textAlign: 'center', marginBottom: 25 }}>
                                <h2 style={{ margin: 0, fontSize: 22, fontWeight: '900' }}>Tahrirlash</h2>
                                <div onClick={() => setEditingItem(null)} style={{ position: 'absolute', top: 20, right: 20, padding: 8, background: isDark ? '#1C1C26' : '#F5F5F5', borderRadius: 12, cursor: 'pointer' }}><X size={18} /></div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                                <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                    <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>MAHSULOT NOMI</div>
                                    <input value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>RANGI</div>
                                        <input value={editingItem.color} onChange={e => setEditingItem({ ...editingItem, color: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                    </div>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>RAZMER</div>
                                        <input value={editingItem.size} onChange={e => setEditingItem({ ...editingItem, size: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>MIQDOR (DONA)</div>
                                        <input type="number" value={editingItem.qty} onChange={e => setEditingItem({ ...editingItem, qty: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                    </div>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>KATEGORIYA</div>
                                        <select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 14, fontWeight: '800', outline: 'none', appearance: 'none' }}>
                                            {categories.map(c => <option key={c} value={c} style={{ background: '#000' }}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>SOTUV NARXI</div>
                                        <input type="number" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: T.accent, fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                    </div>
                                    <div style={{ background: isDark ? '#16161F' : '#F5F5F5', padding: '15px 18px', borderRadius: 20, border: `1px solid ${T.border}` }}>
                                        <div style={{ fontSize: 8, fontWeight: '1000', opacity: 0.3, marginBottom: 5 }}>TAN NARXI</div>
                                        <input type="number" value={editingItem.buy_price || ''} onChange={e => setEditingItem({ ...editingItem, buy_price: e.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', color: '#10B981', fontSize: 16, fontWeight: '800', outline: 'none' }} />
                                    </div>
                                </div>
                                <button onClick={handleUpdateProduct} style={{ height: 60, borderRadius: 20, border: 'none', background: `linear-gradient(135deg, ${T.accent}, #B8860B)`, color: '#000', fontWeight: '1000', fontSize: 16, marginTop: 10, boxShadow: `0 10px 20px ${T.accent}30` }}>SAQLASH ✅</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VIEW QR MODAL */}
            <AnimatePresence>
                {viewingQR && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 10001, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#fff', padding: 30, borderRadius: 40, textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                            <QRCodeSVG value={viewingQR.uid || `FB|${viewingQR.name}|${viewingQR.color}|${viewingQR.size}|${viewingQR.id}`} size={250} includeMargin />
                            <div style={{ color: '#000', marginTop: 20 }}>
                                <div style={{ fontSize: 22, fontWeight: '900' }}>{viewingQR.name}</div>
                                <div style={{ fontSize: 14, opacity: 0.6 }}>{viewingQR.color} | Razmer: {viewingQR.size}</div>
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setViewingQR(null)} style={{ marginTop: 40, height: 60, width: 60, borderRadius: 30, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={30} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
}
