
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
    await ensureSalonExists(existingUser);
    await fetchAll();
    return existingUser;
  } else {
    const { data: newUser, error: insertError } = await supabase.from('users').insert([{ name, phone, role, pin }]).select().single();
    if (insertError) throw insertError;
    dbCache.currentUser = newUser;
    if (role === 'OWNER') {
      await ensureSalonExists(newUser);
    }
    await fetchAll();
    return newUser;
  }
};

export const ensureSalonExists = async (user: User) => {
  if (user.role !== 'OWNER') return;
  const { data: salon } = await supabase.from('salons').select('id').eq('owner_id', user.id).maybeSingle();
  if (!salon) {
    await supabase.from('salons').insert([{
      owner_id: user.id,
      owner_name: user.name,
      owner_photo: user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
      owner_phone: user.phone,
      name: `${user.name}'s Salon`,
      location: 'ঠিকানা দিন',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
      status: 'approved',
      is_active: true,
      rating: 5.0
    }]);
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
    await addNotification(salon.ownerId, 'নতুন বুকিং রিকোয়েস্ট!', `আপনার সেলুনে একটি নতুন বুকিং এসেছে।`);
  }
  return { ...newBooking, userId: newBooking.user_id, salonId: newBooking.salon_id, serviceIds: newBooking.service_ids, totalPrice: newBooking.total_price };
};

export const updateBookingStatus = async (id: string, status: string) => {
  const { data: b } = await supabase.from('bookings').update({ status }).eq('id', id).select().single();
  if (b) {
     const title = status === 'CONFIRMED' ? 'বুকিং গৃহীত হয়েছে!' : status === 'REJECTED' ? 'বুকিং বাতিল হয়েছে' : 'বুকিং আপডেট';
     const msg = status === 'CONFIRMED' ? 'আপনার বুকিংটি সেলুন ওনার কনফার্ম করেছেন।' : 'দুঃখিত, আপনার বুকিংটি গ্রহণ করা সম্ভব হয়নি।';
     await addNotification(b.user_id, title, msg);
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
    await addNotification(p.owner_id, 'পেমেন্ট সফল!', `আপনার ৳${p.amount} পেমেন্টটি অ্যাডমিন কনফার্ম করেছেন।`);
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
  await addNotification('admin1', 'নতুন পেমেন্ট রিপোর্ট', `ওনার আইডি ${p.ownerId} থেকে একটি পেমেন্ট রিপোর্ট এসেছে।`);
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
