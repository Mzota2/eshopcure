import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/types/collections';
import { LedgerEntry, LedgerEntryType, LedgerEntryStatus } from '@/types/ledger';
import { NotFoundError } from '@/lib/utils/errors';
import { createLedgerEntry, reverseLedgerEntry } from './create';
import { Order, OrderStatus } from '@/types/order';
import { Booking, BookingStatus } from '@/types/booking';
import { getOrders } from '@/lib/orders';
import { getBookings } from '@/lib/bookings';

export { createLedgerEntry, reverseLedgerEntry };

/**
 * Get ledger entry by ID
 */
export const getLedgerEntryById = async (entryId: string): Promise<LedgerEntry> => {
  const entryRef = doc(db, COLLECTIONS.LEDGER, entryId);
  const entrySnap = await getDoc(entryRef);
  
  if (!entrySnap.exists()) {
    throw new NotFoundError('Ledger entry');
  }
  
  return { id: entrySnap.id, ...entrySnap.data() } as LedgerEntry;
};

/**
 * Get ledger entries with filters
 */
export const getLedgerEntries = async (options?: {
  entryType?: LedgerEntryType;
  status?: LedgerEntryStatus;
  orderId?: string;
  bookingId?: string;
  paymentId?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<LedgerEntry[]> => {
  const ledgerRef = collection(db, COLLECTIONS.LEDGER);
  let q = query(ledgerRef);
  
  if (options?.entryType) {
    q = query(q, where('entryType', '==', options.entryType));
  }
  
  if (options?.status) {
    q = query(q, where('status', '==', options.status));
  }
  
  if (options?.orderId) {
    q = query(q, where('orderId', '==', options.orderId));
  }
  
  if (options?.bookingId) {
    q = query(q, where('bookingId', '==', options.bookingId));
  }
  
  if (options?.paymentId) {
    q = query(q, where('paymentId', '==', options.paymentId));
  }
  
  if (options?.startDate) {
    q = query(q, where('createdAt', '>=', options.startDate));
  }
  
  if (options?.endDate) {
    q = query(q, where('createdAt', '<=', options.endDate));
  }
  
  q = query(q, orderBy('createdAt', 'desc'));
  
  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as LedgerEntry[];
};

/**
 * Transaction data derived from orders and bookings (used when ledgers are disabled)
 */
export interface DerivedTransaction {
  id: string;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  amount: number;
  currency: string;
  orderId?: string;
  bookingId?: string;
  paymentId?: string;
  description: string;
  createdAt: Date | string;
  metadata?: Record<string, any>;
  source: 'order' | 'booking'; // Indicates the source of this transaction
}

/**
 * Get transaction data from successful orders and bookings
 * This is used as a fallback when ledger creation is disabled
 */
export const getDerivedTransactions = async (options?: {
  entryType?: LedgerEntryType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<DerivedTransaction[]> => {
  const transactions: DerivedTransaction[] = [];

  // Fetch successful orders (with payment confirmed)
  if (!options?.entryType || options.entryType === LedgerEntryType.ORDER_SALE) {
    const successfulOrderStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.COMPLETED,
    ];

    for (const status of successfulOrderStatuses) {
      const { orders } = await getOrders({
        status,
        limit: options?.limit ? Math.ceil(options.limit / 2) : 500,
      });

      for (const order of orders) {
        // Only include orders with confirmed payment
        if (!order.payment) continue;

        // Skip refunded orders
        if (order.refundedAt) continue;

        // Use payment date (paidAt) for filtering, fallback to createdAt
        const transactionDate = order.payment.paidAt 
          ? (order.payment.paidAt instanceof Date 
              ? order.payment.paidAt 
              : (order.payment.paidAt as any)?.toDate?.() || new Date(order.payment.paidAt as string))
          : (order.createdAt instanceof Date 
              ? order.createdAt 
              : (order.createdAt as any)?.toDate?.() || new Date(order.createdAt as string));
        
        // Apply date filters if provided
        if (options?.startDate && transactionDate < options.startDate) continue;
        if (options?.endDate && transactionDate > options.endDate) continue;

        transactions.push({
          id: `order_${order.id}`,
          entryType: LedgerEntryType.ORDER_SALE,
          status: LedgerEntryStatus.CONFIRMED,
          amount: order.payment.amount,
          currency: order.payment.currency || order.pricing.currency,
          orderId: order.id,
          paymentId: order.payment.paymentId,
          description: `Order ${order.orderNumber} - ${order.items.length} item(s)`,
          createdAt: order.payment.paidAt || order.createdAt,
          source: 'order',
          metadata: {
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            itemCount: order.items.length,
          },
        });
      }
    }
  }

  // Fetch successful bookings (with payment confirmed)
  if (!options?.entryType || options.entryType === LedgerEntryType.BOOKING_PAYMENT) {
    const successfulBookingStatuses = [
      BookingStatus.PAID,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
    ];

    for (const status of successfulBookingStatuses) {
      const { bookings } = await getBookings({
        status,
        limit: options?.limit ? Math.ceil(options.limit / 2) : 500,
      });

      for (const booking of bookings) {
        // Only include bookings with confirmed payment
        if (!booking.payment) continue;

        // Skip refunded bookings
        if (booking.refundedAt) continue;

        // Use payment date (paidAt) for filtering, fallback to createdAt
        const transactionDate = booking.payment.paidAt 
          ? (booking.payment.paidAt instanceof Date 
              ? booking.payment.paidAt 
              : (booking.payment.paidAt as any)?.toDate?.() || new Date(booking.payment.paidAt as string))
          : (booking.createdAt instanceof Date 
              ? booking.createdAt 
              : (booking.createdAt as any)?.toDate?.() || new Date(booking.createdAt as string));
        
        // Apply date filters if provided
        if (options?.startDate && transactionDate < options.startDate) continue;
        if (options?.endDate && transactionDate > options.endDate) continue;

        transactions.push({
          id: `booking_${booking.id}`,
          entryType: LedgerEntryType.BOOKING_PAYMENT,
          status: LedgerEntryStatus.CONFIRMED,
          amount: booking.payment.amount,
          currency: booking.payment.currency || booking.pricing.currency,
          bookingId: booking.id,
          paymentId: booking.payment.paymentId,
          description: `Booking ${booking.bookingNumber} - ${booking.serviceName}`,
          createdAt: booking.payment.paidAt || booking.createdAt,
          source: 'booking',
          metadata: {
            bookingNumber: booking.bookingNumber,
            serviceName: booking.serviceName,
            customerEmail: booking.customerEmail,
            customerName: booking.customerName,
            timeSlot: booking.timeSlot,
          },
        });
      }
    }
  }

  // Sort by date (newest first)
  transactions.sort((a, b) => {
    const aDate = a.createdAt instanceof Date 
      ? a.createdAt 
      : (a.createdAt as any)?.toDate?.() || new Date(a.createdAt as string);
    const bDate = b.createdAt instanceof Date 
      ? b.createdAt 
      : (b.createdAt as any)?.toDate?.() || new Date(b.createdAt as string);
    return bDate.getTime() - aDate.getTime();
  });

  // Apply limit if provided
  if (options?.limit) {
    return transactions.slice(0, options.limit);
  }

  return transactions;
};
