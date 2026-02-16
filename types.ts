
export type UserRole = 'USER' | 'OWNER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  pin: string; // ৪ ডিজিটের পিন
  avatar?: string;
  address?: string;
}

export interface Salon {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string;
  ownerPhone: string;
  name: string;
  location: string;
  description?: string;
  businessHours?: {
    open: string;
    close: string;
  };
  mapLink?: string;
  rating: number;
  image: string;
  services: Service[];
  status: 'approved' | 'pending' | 'rejected';
  isActive: boolean;
  priority?: number; // Lower number = Higher rank (1 = top)
  portfolio?: string[]; // Hair style work photos
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  image: string;
}

export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  serviceIds: string[];
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED';
  totalPrice: number;
  createdAt: string;
}

export interface OwnerPayment {
  id: string;
  ownerId: string;
  amount: number;
  date: string;
  status: 'PENDING' | 'CONFIRMED';
  trxID: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  salonId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}
