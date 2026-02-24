
import { User, UserRole, Salon, Booking, AppNotification, Service, OwnerPayment, Review } from '../types';

const STORAGE_KEY = 'smart_salon_db';
const SENT_REMINDERS_KEY = 'smart_salon_sent_reminders';
const ONESIGNAL_APP_ID = '152c0a9a-f428-4f83-b749-c394205ae4af';
const ONESIGNAL_REST_API_KEY: string = 'os_v2_app_cuwavgxufbhyhn2jyokcawxev7uj53vj2kkuh4e4gictxvueo6tq7ie7ezrbtcl2evfm55upua7zjzqkkl2qheimyizrtsu4xhc23xa';

// কনস্ট্যান্ট অ্যাডমিন তথ্য
const SUPER_ADMIN_PHONE = '01940308516';
const SUPER_ADMIN_PIN = '1234';

interface DB {
  users: User[];
  salons: Salon[];
  bookings: Booking[];
  notifications: AppNotification[];
  ownerPayments: OwnerPayment[];
  reviews: Review[];
  currentUser: User | null;
}

const initialData: DB = {
  users: [{ 
    id: 'admin1', 
    name: 'সুপার অ্যাডমিন', 
    phone: SUPER_ADMIN_PHONE, 
    role: 'ADMIN', 
    pin: SUPER_ADMIN_PIN, 
    avatar: 'https://i.pravatar.cc/150?u=admin' 
  }],
  salons: [],
  bookings: [],
  notifications: [],
  ownerPayments: [],
  reviews: [],
  currentUser: null,
};

/**
 * নোট: এটি localStorage ব্যবহার করে ডাটা সেভ রাখে। 
 * ল্যাপটপ এবং মোবাইলের ডাটা সিঙ্ক করতে হলে এখানে Firebase বা Supabase এর মতো ডাটাবেস কানেক্ট করতে হবে।
 */
export const getDB = (): DB => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return initialData;
    const db = JSON.parse(data);
    
    // নিশ্চিত করা যে অ্যাডমিন সবসময় ইউজার লিস্টে আছে
    if (!db.users.some((u: User) => u.phone === SUPER_ADMIN_PHONE)) {
      db.users.push(initialData.users[0]);
    }
    return db;
  } catch (e) {
    return initialData;
  }
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('smart_salon_db_updated'));
};

export const loginUser = (name: string, phone: string, role: UserRole, pin: string): User => {
  const db = getDB();
  
  // অ্যাডমিন ফোন নাম্বার দিয়ে অন্য কেউ অ্যাকাউন্ট খুলতে পারবে না
  if (phone === SUPER_ADMIN_PHONE && role !== 'ADMIN') {
    throw new Error('ADMIN_PHONE_RESERVED');
  }

  let user = db.users.find(u => u.phone === phone);
  
  if (user) {
    if (user.pin !== pin) throw new Error('INVALID_PIN');
    user.role = role; 
    user.name = name;
  } else {
    user = { id: Date.now().toString(), name, phone, role, pin };
    db.users.push(user);
  }

  if (role === 'OWNER' && !db.salons.some(s => s.ownerId === user!.id)) {
    db.salons.push({ 
      id: 's-' + Date.now(), 
      ownerId: user!.id, 
      ownerName: name, 
      ownerPhoto: user.avatar || `https://i.pravatar.cc/150?u=${user!.id}`, 
      ownerPhone: phone, 
      name: `${name}'s Salon`, 
      location: 'ঠিকানা দিন', 
      rating: 5.0, 
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop', 
      services: [], 
      status: 'approved',
      isActive: true 
    });
  }
  
  db.currentUser = user;
  saveDB(db);
  return user;
};

export const logout = () => { 
  const db = getDB(); 
  db.currentUser = null; 
  saveDB(db); 
};

export const getCurrentUser = () => getDB().currentUser;

// --- পেমেন্ট এবং নোটিফিকেশন লজিক অপরিবর্তিত রাখা হয়েছে ---

export const addNotification = (userId: string, title: string, message: string, dbInstance?: DB) => {
  const db = dbInstance || getDB();
  const newNotification: AppNotification = {
    id: 'nt-' + Date.now(),
    userId,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  db.notifications.unshift(newNotification);
  if (!dbInstance) saveDB(db);

  if ("Notification" in window && window.Notification.permission === "granted") {
    new window.Notification(title, { body: message });
  }

  window.dispatchEvent(new CustomEvent('app_push_notification', { 
    detail: { title, message, userId } 
  }));
};

export const sendOneSignalPush = async (targetUserId: string, title: string, message: string) => {
  if (ONESIGNAL_REST_API_KEY.includes('YOUR_REST')) return;
  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [targetUserId],
        headings: { en: title },
        contents: { en: message },
        android_accent_color: "fbbf24",
        priority: 10
      })
    });
  } catch (error) {
    console.error('Push Error:', error);
  }
};

export const checkMonthlyPaymentStatus = (ownerId: string) => {
  const db = getDB();
  const now = new Date(), day = now.getDate();
  const salon = db.salons.find(s => s.ownerId === ownerId);
  if (!salon) return { isDue: false, isSuspended: false, debt: 0 };
  const totalEarnings = db.bookings.filter(b => b.salonId === salon.id && b.status === 'COMPLETED').reduce((sum, b) => sum + b.totalPrice, 0);
  const commissionTarget = Math.floor(totalEarnings * 0.1);
  const totalPaid = db.ownerPayments.filter(p => p.ownerId === ownerId && p.status === 'CONFIRMED').reduce((sum, p) => sum + p.amount, 0);
  const currentDebt = Math.max(0, commissionTarget - totalPaid);
  const isSuspended = day > 15 && currentDebt >= 10;
  const isDue = day >= 10 && day <= 15 && currentDebt >= 10;
  return { isDue, isSuspended, debt: currentDebt };
};

export const checkUpcomingBookingsAndNotify = () => {
  const db = getDB(), user = db.currentUser;
  if (!user || user.role !== 'OWNER') return;
  const salon = db.salons.find(s => s.ownerId === user.id);
  if (!salon) return;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const bookings = db.bookings.filter(b => b.salonId === salon.id && b.date === todayStr && (b.status === 'CONFIRMED' || b.status === 'PENDING'));
  const sentRaw = localStorage.getItem(SENT_REMINDERS_KEY);
  let sent: string[] = sentRaw ? JSON.parse(sentRaw) : [];
  bookings.forEach(b => {
    if (sent.includes(b.id)) return;
    const [time, period] = b.time.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    const bTime = new Date(); bTime.setHours(h, m, 0, 0);
    if ((bTime.getTime() - now.getTime()) / 60000 <= 60) {
      const msg = `কাস্টমার ${db.users.find(u => u.id === b.userId)?.name || ''} এর অ্যাপয়েন্টমেন্ট ১ ঘণ্টার মধ্যে।`;
      addNotification(user.id, 'বুকিং রিমাইন্ডার!', msg);
      sendOneSignalPush(user.id, 'বুকিং রিমাইন্ডার!', msg);
      sent.push(b.id);
    }
  });
  localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sent));
};

export const updateUser = (info: Partial<User>) => {
  const db = getDB(); if (!db.currentUser) return null;
  const idx = db.users.findIndex(u => u.id === db.currentUser?.id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...info };
  db.currentUser = db.users[idx];
  saveDB(db); return db.currentUser;
};

export const deleteUser = (id: string) => {
  const db = getDB();
  db.users = db.users.filter(u => u.id !== id);
  db.salons = db.salons.filter(s => s.ownerId !== id);
  db.bookings = db.bookings.filter(b => b.userId !== id);
  if (db.currentUser?.id === id) db.currentUser = null;
  saveDB(db);
};

export const updateSalonInfo = (id: string, info: Partial<Salon>) => {
  const db = getDB(); const idx = db.salons.findIndex(s => s.id === id);
  if (idx !== -1) { db.salons[idx] = { ...db.salons[idx], ...info }; saveDB(db); }
};

export const adminDeleteSalon = (id: string) => {
  const db = getDB();
  db.salons = db.salons.filter(s => s.id !== id);
  db.bookings = db.bookings.filter(b => b.salonId !== id);
  saveDB(db);
};

export const adminToggleSalonActive = (id: string, active: boolean) => {
  const db = getDB(); const idx = db.salons.findIndex(s => s.id === id);
  if (idx !== -1) { db.salons[idx].isActive = active; saveDB(db); }
};

export const adminUpdateSalonStatus = (id: string, status: Salon['status']) => {
  const db = getDB(); const idx = db.salons.findIndex(s => s.id === id);
  if (idx !== -1) {
    db.salons[idx].status = status;
    const msg = `আপনার লিস্টিংটি ${status === 'approved' ? '✅ অনুমোদিত' : '❌ প্রত্যাখ্যাত'} হয়েছে।`;
    addNotification(db.salons[idx].ownerId, 'সেলুন স্ট্যাটাস', msg, db);
    sendOneSignalPush(db.salons[idx].ownerId, 'সেলুন স্ট্যাটাস', msg);
    saveDB(db);
  }
};

export const addReview = (data: Omit<Review, 'id' | 'createdAt'>) => {
  const db = getDB();
  const rev: Review = { ...data, id: 'rev-' + Date.now(), createdAt: new Date().toISOString() };
  db.reviews.unshift(rev);
  const salonRev = db.reviews.filter(r => r.salonId === data.salonId);
  const avg = salonRev.reduce((a, c) => a + c.rating, 0) / salonRev.length;
  const sIdx = db.salons.findIndex(s => s.id === data.salonId);
  if (sIdx !== -1) {
    db.salons[sIdx].rating = parseFloat(avg.toFixed(1));
    const msg = `${data.userName} আপনার সেলুনে ${data.rating} স্টার দিয়েছেন।`;
    addNotification(db.salons[sIdx].ownerId, 'নতুন রিভিউ', msg, db);
    sendOneSignalPush(db.salons[sIdx].ownerId, 'নতুন রিভিউ', msg);
  }
  saveDB(db);
};

export const createBooking = (data: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
  const db = getDB();
  if (db.bookings.some(b => b.salonId === data.salonId && b.date === data.date && b.time === data.time && b.status !== 'REJECTED')) {
    throw new Error('DUPLICATE_BOOKING');
  }
  const b: Booking = { ...data, id: 'bk-' + Date.now(), status: 'PENDING', createdAt: new Date().toISOString() };
  db.bookings.push(b);
  const salon = db.salons.find(s => s.id === b.salonId);
  if (salon) {
    const customer = db.users.find(u => u.id === b.userId);
    const msg = `${customer?.name || 'কাস্টমার'} একটি বুকিং পাঠিয়েছেন।`;
    addNotification(salon.ownerId, 'নতুন বুকিং!', msg, db);
    sendOneSignalPush(salon.ownerId, 'নতুন বুকিং রিকোয়েস্ট! ✂️', msg);
  }
  saveDB(db); return b;
};

export const updateBookingStatus = (id: string, status: Booking['status']) => {
  const db = getDB(); const idx = db.bookings.findIndex(b => b.id === id);
  if (idx !== -1) {
    db.bookings[idx].status = status;
    const b = db.bookings[idx];
    const salon = db.salons.find(s => s.id === b.salonId);
    const msg = `${salon?.name || 'সেলুন'} আপনার বুকিংটি ${status === 'CONFIRMED' ? '✅ গ্রহণ' : status === 'REJECTED' ? '❌ বাতিল' : '🎉 সম্পন্ন'} করেছে।`;
    addNotification(b.userId, 'বুকিং আপডেট', msg, db);
    sendOneSignalPush(b.userId, 'বুকিং আপডেট', msg);
    saveDB(db);
  }
};

export const addService = (sId: string, s: Omit<Service, 'id'>) => {
  const db = getDB(); const idx = db.salons.findIndex(sl => sl.id === sId);
  if (idx !== -1) { db.salons[idx].services.push({ ...s, id: 'sv-' + Date.now() }); saveDB(db); }
};

export const updateService = (sId: string, svId: string, s: Partial<Service>) => {
  const db = getDB();
  const idx = db.salons.findIndex(sl => sl.id === sId);
  if (idx !== -1) {
    const svIdx = db.salons[idx].services.findIndex(sv => sv.id === svId);
    if (svIdx !== -1) {
      db.salons[idx].services[svIdx] = { ...db.salons[idx].services[svIdx], ...s };
      saveDB(db);
    }
  }
};

export const deleteService = (sId: string, svId: string) => {
  const db = getDB(); const idx = db.salons.findIndex(sl => sl.id === sId);
  if (idx !== -1) { db.salons[idx].services = db.salons[idx].services.filter(sv => sv.id !== svId); saveDB(db); }
};

export const addOwnerPayment = (p: Omit<OwnerPayment, 'id' | 'status'>) => {
  const db = getDB(); db.ownerPayments.push({ ...p, id: 'pay-' + Date.now(), status: 'PENDING' }); saveDB(db);
};

export const adminConfirmPayment = (id: string) => {
  const db = getDB(); const idx = db.ownerPayments.findIndex(p => p.id === id);
  if (idx !== -1) { 
    db.ownerPayments[idx].status = 'CONFIRMED'; 
    const msg = 'আপনার কমিশন পেমেন্ট গ্রহণ করা হয়েছে।';
    addNotification(db.ownerPayments[idx].ownerId, 'পেমেন্ট কনফার্ম', msg, db); 
    sendOneSignalPush(db.ownerPayments[idx].ownerId, 'পেমেন্ট কনফার্ম', msg);
    saveDB(db); 
  }
};

export const markNotificationsAsRead = (id: string) => {
  const db = getDB(); db.notifications = db.notifications.map(n => n.userId === id ? { ...n, isRead: true } : n); saveDB(db);
};

export const getSalonByOwner = (id: string) => getDB().salons.find(s => s.ownerId === id);
export const updateSalonPriority = (id: string, p: number) => { const db = getDB(); const idx = db.salons.findIndex(s => s.id === id); if (idx !== -1) { db.salons[idx].priority = p; saveDB(db); } };
export const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width, height = img.height;
      if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
      else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};
