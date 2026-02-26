
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, Salon, Booking, AppNotification, Service, OwnerPayment, Review } from '../types';

const SUPABASE_URL = 'https://ouqfwjlfyourudkoagod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cWZ3amxmeW91cnVka29hZ29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzYxMjUsImV4cCI6MjA4NjgxMjEyNX0.kUldTAV6RF3cDbeulz0zWFSI-K6vl3OmpT8AKcBAD78';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUPER_ADMIN_PHONE = '01940308516';

interface DB {
  users: User[];
  salons: Salon[];
  bookings: Booking[];
  notifications: AppNotification[];
  ownerPayments: OwnerPayment[];
  reviews: Review[];
  currentUser: User | null;
}

let dbCache: DB = {
  users: [],
  salons: [],
  bookings: [],
  notifications: [],
  ownerPayments: [],
  reviews: [],
  currentUser: null,
};

// --- FCM V1 Configuration ---
const triggerPushNotification = async (targetUserId: string, title: string, message: string) => {
  try {
    // Find the target user's FCM token
    const { data: user } = await supabase.from('users').select('fcm_token').eq('id', targetUserId).maybeSingle();
    
    if (!user?.fcm_token) {
      console.warn(`No FCM token found for user ${targetUserId}`);
      return;
    }

    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: user.fcm_token,
        title: title,
        body: message,
        icon: "data:image/png;base64,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"
      }),
    });
    const result = await response.json();
    console.log("FCM Push Result:", result);
  } catch (error) {
    console.error("FCM Push Error:", error);
  }
};

// Listen for FCM token from index.html
if (typeof window !== 'undefined') {
  window.addEventListener('fcm_token_received', async (e: any) => {
    const token = e.detail;
    const user = dbCache.currentUser;
    if (user && token) {
      console.log('Saving FCM token for user:', user.id);
      await supabase.from('users').update({ fcm_token: token }).eq('id', user.id);
      dbCache.currentUser.fcm_token = token;
    }
  });
}

const triggerLocalPush = (payload: any) => {
  const currentUser = dbCache.currentUser;
  if (currentUser && payload.new && payload.new.user_id === currentUser.id) {
    window.dispatchEvent(new CustomEvent('app_push_notification', {
      detail: {
        title: payload.new.title,
        message: payload.new.message,
        userId: payload.new.user_id
      }
    }));
  }
};

export const fetchAll = async () => {
  try {
    const [
      { data: users },
      { data: salonsRaw },
      { data: services },
      { data: bookings },
      { data: notifications },
      { data: payments },
      { data: reviews }
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('salons').select('*'),
      supabase.from('services').select('*'),
      supabase.from('bookings').select('*'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('owner_payments').select('*'),
      supabase.from('reviews').select('*')
    ]);

    const salons: Salon[] = (salonsRaw || []).map(s => ({
      ...s,
      ownerId: s.owner_id,
      ownerName: s.owner_name,
      ownerPhoto: s.owner_photo,
      ownerPhone: s.owner_phone,
      businessHours: s.business_hours,
      mapLink: s.map_link,
      isActive: s.is_active,
      socialLinks: s.social_links,
      services: (services || []).filter(sv => sv.salon_id === s.id)
    }));

    dbCache = {
      users: users || [],
      salons,
      bookings: (bookings || []).map(b => ({ ...b, userId: b.user_id, salonId: b.salon_id, serviceIds: b.service_ids, totalPrice: b.total_price })),
      notifications: (notifications || []).map(n => ({ ...n, userId: n.user_id, isRead: n.is_read })),
      ownerPayments: (payments || []).map(p => ({ ...p, ownerId: p.owner_id })),
      reviews: (reviews || []).map(r => ({ ...r, salonId: r.salon_id, userId: r.user_id, userName: r.user_name, userAvatar: r.user_avatar })),
      currentUser: dbCache.currentUser
    };

    window.dispatchEvent(new CustomEvent('smart_salon_db_updated'));
  } catch (e) {
    console.error('Sync Error:', e);
  }
};

export const initSupabase = async () => {
  await fetchAll();
  supabase.channel('public_db_changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
      triggerLocalPush(payload);
      fetchAll();
    })
    .on('postgres_changes', { event: '*', schema: 'public' }, () => {
      fetchAll();
    })
    .subscribe();
};

initSupabase();

export const getDB = (): DB => dbCache;

export const loginUser = async (name: string, phone: string, role: UserRole, pin: string): Promise<User> => {
  if (phone === SUPER_ADMIN_PHONE && role !== 'ADMIN') throw new Error('ADMIN_PHONE_RESERVED');
  const { data: existingUser } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle();
  if (existingUser) {
    if (existingUser.pin !== pin) throw new Error('INVALID_PIN');
    if (existingUser.role !== role && role !== 'ADMIN') {
        await supabase.from('users').update({ role }).eq('id', existingUser.id);
        existingUser.role = role;
    }
    dbCache.currentUser = existingUser;

    // Check for stored FCM token and update
    const storedToken = localStorage.getItem('fcm_token');
    if (storedToken) {
      await supabase.from('users').update({ fcm_token: storedToken }).eq('id', existingUser.id);
      dbCache.currentUser.fcm_token = storedToken;
    }
    await ensureSalonExists(existingUser);
    await fetchAll();
    return existingUser;
  } else {
    const { data: newUser, error: insertError } = await supabase.from('users').insert([{ name, phone, role, pin }]).select().single();
    if (insertError) throw insertError;
    dbCache.currentUser = newUser;
    
    // Check for stored FCM token and update
    const storedToken = localStorage.getItem('fcm_token');
    if (storedToken) {
      await supabase.from('users').update({ fcm_token: storedToken }).eq('id', newUser.id);
      dbCache.currentUser.fcm_token = storedToken;
    }
    if (role === 'OWNER') {
      try {
        await ensureSalonExists(newUser);
      } catch (e) {
        console.error('Salon Creation Error:', e);
      }
    }
    await fetchAll();
    return newUser;
  }
};

export const ensureSalonExists = async (user: User) => {
  if (user.role !== 'OWNER') return;
  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).maybeSingle();
  if (!salon) {
    const { error } = await supabase.from('salons').insert([{
      owner_id: user.id,
      owner_name: user.name,
      owner_photo: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
      owner_phone: user.phone,
      name: `${user.name}'s Salon`,
      location: 'ঠিকানা দিন',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
      status: 'approved',
      is_active: true,
      rating: 5
    }]);
    if (error) throw error;
  }
};

export const checkUserExists = async (phone: string): Promise<boolean> => {
    const { data } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
    return !!data;
};

export const logout = () => { dbCache.currentUser = null; window.dispatchEvent(new CustomEvent('smart_salon_db_updated')); };
export const getCurrentUser = () => dbCache.currentUser;

export const addNotification = async (userId: string, title: string, message: string) => {
  await supabase.from('notifications').insert([{ user_id: userId, title, message }]);
};

export const updateUser = async (info: Partial<User>) => {
  if (!dbCache.currentUser) return null;
  const { data } = await supabase.from('users').update(info).eq('id', dbCache.currentUser.id).select().single();
  if (data) dbCache.currentUser = data;
  return data;
};

export const deleteUser = async (id: string) => {
  await supabase.from('users').delete().eq('id', id);
  if (dbCache.currentUser?.id === id) logout();
};

export const createBooking = async (data: any): Promise<Booking> => {
  const { data: newBooking, error } = await supabase.from('bookings').insert([{
    user_id: data.userId,
    salon_id: data.salonId,
    service_ids: data.serviceIds,
    date: data.date,
    time: data.time,
    total_price: data.totalPrice,
    status: 'PENDING'
  }]).select().single();
  
  if (error) {
     if (error.code === '23505') throw new Error('DUPLICATE_BOOKING');
     throw error;
  }
  
  const salon = dbCache.salons.find(s => s.id === data.salonId);
  if (salon) {
    const title = 'নতুন বুকিং রিকোয়েস্ট!';
    const msg = `${dbCache.currentUser?.name} আপনার সেলুনে বুকিং করেছেন।`;
    await addNotification(salon.ownerId, title, msg);
    // ওনারকে অটোমেটিক পুশ নোটিফিকেশন পাঠানো
    await triggerPushNotification(salon.ownerId, title, msg);
  }
  
  return { ...newBooking, userId: newBooking.user_id, salonId: newBooking.salon_id, serviceIds: newBooking.service_ids, totalPrice: newBooking.total_price };
};

export const updateBookingStatus = async (id: string, status: string) => {
  const { data: b } = await supabase.from('bookings').update({ status }).eq('id', id).select().single();
  if (b) {
     const title = status === 'CONFIRMED' ? 'বুকিং গৃহীত হয়েছে!' : status === 'REJECTED' ? 'বুকিং বাতিল হয়েছে' : 'বুকিং আপডেট';
     const msg = status === 'CONFIRMED' ? 'আপনার বুকিংটি সেলুন ওনার কনফার্ম করেছেন।' : 'দুঃখিত, আপনার বুকিংটি গ্রহণ করা সম্ভব হয়নি।';
     await addNotification(b.user_id, title, msg);
     // কাস্টমারকে অটোমেটিক পুশ নোটিফিকেশন পাঠানো
     await triggerPushNotification(b.user_id, title, msg);
  }
  await fetchAll();
};

export const updateSalonInfo = async (id: string, info: any) => {
  const { error } = await supabase.from('salons').update({
    name: info.name,
    location: info.location,
    description: info.description,
    map_link: info.mapLink,
    business_hours: info.businessHours,
    owner_phone: info.ownerPhone,
    is_active: info.isActive,
    image: info.image,
    priority: info.priority,
    portfolio: info.portfolio,
    social_links: info.socialLinks
  }).eq('id', id);
  if (error) throw error;
  await fetchAll();
};

export const adminToggleSalonActive = async (id: string, active: boolean) => {
  await supabase.from('salons').update({ is_active: active }).eq('id', id);
  await fetchAll();
};

export const adminDeleteSalon = async (id: string) => {
  await supabase.from('salons').delete().eq('id', id);
  await fetchAll();
};

export const adminConfirmPayment = async (id: string) => {
  const { data: p } = await supabase.from('owner_payments').update({ status: 'CONFIRMED' }).eq('id', id).select().single();
  if (p) {
    const title = 'পেমেন্ট সফল!';
    const msg = `আপনার ৳${p.amount} পেমেন্টটি অ্যাডমিন কনফার্ম করেছেন।`;
    await addNotification(p.owner_id, title, msg);
    // ওনারকে পেমেন্ট কনফার্মেশন পুশ নোটিফিকেশন পাঠানো
    await triggerPushNotification(p.owner_id, title, msg);
  }
  await fetchAll();
};

export const markNotificationsAsRead = async (userId: string) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  await fetchAll();
};

export const addService = async (salonId: string, s: any) => {
  const { error } = await supabase.from('services').insert([{ salon_id: salonId, ...s }]);
  if (error) throw error;
  await fetchAll();
};

export const updateService = async (salonId: string, svId: string, s: any) => {
  const { error } = await supabase.from('services').update(s).eq('id', svId);
  if (error) throw error;
  await fetchAll();
};

export const deleteService = async (salonId: string, svId: string) => {
  await supabase.from('services').delete().eq('id', svId);
  await fetchAll();
};

export const addOwnerPayment = async (p: any) => {
  await supabase.from('owner_payments').insert([{ owner_id: p.ownerId, amount: p.amount, date: p.date, trx_id: p.trxID }]);
  const title = 'নতুন পেমেন্ট রিপোর্ট';
  const msg = `ওনার আইডি ${p.ownerId} থেকে একটি পেমেন্ট রিপোর্ট এসেছে।`;
  await addNotification('admin1', title, msg);
  // অ্যাডমিনকে নোটিফিকেশন পাঠানো
  await triggerPushNotification('admin1', title, msg);
  await fetchAll();
};

export const addReview = async (r: any) => {
  await supabase.from('reviews').insert([{
    salon_id: r.salonId,
    user_id: r.userId,
    user_name: r.userName,
    user_avatar: r.userAvatar,
    rating: r.rating,
    comment: r.comment
  }]);
  await fetchAll();
};

export const updateSalonPriority = async (id: string, p: number) => {
  await supabase.from('salons').update({ priority: p }).eq('id', id);
  await fetchAll();
};

export const getSalonByOwner = (id: string) => dbCache.salons.find(s => s.ownerId === id);

export const checkMonthlyPaymentStatus = (ownerId: string) => {
  const salon = dbCache.salons.find(s => s.ownerId === ownerId);
  if (!salon) return { isDue: false, isSuspended: false, debt: 0 };
  const totalEarnings = dbCache.bookings.filter(b => b.salonId === salon.id && b.status === 'COMPLETED').reduce((sum, b) => sum + b.totalPrice, 0);
  const commissionTarget = Math.floor(totalEarnings * 0.1);
  const totalPaid = dbCache.ownerPayments.filter(p => p.ownerId === ownerId && p.status === 'CONFIRMED').reduce((sum, p) => sum + p.amount, 0);
  const currentDebt = Math.max(0, commissionTarget - totalPaid);
  const now = new Date(), day = now.getDate();
  return { isDue: day >= 10 && day <= 15 && currentDebt >= 10, isSuspended: day > 15 && currentDebt >= 10, debt: currentDebt };
};

export const checkUpcomingBookingsAndNotify = () => {};
export const compressImage = async (base64Str: string, mw = 400, mh = 400): Promise<string> => {
  return new Promise((res) => {
    const img = new Image(); img.src = base64Str;
    img.onload = () => {
      const cv = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { if (w > mw) { h *= mw / w; w = mw; } }
      else { if (h > mh) { w *= mh / h; h = mh; } }
      cv.width = w; cv.height = h;
      cv.getContext('2d')?.drawImage(img, 0, 0, w, h);
      res(cv.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => res(base64Str);
  });
};
