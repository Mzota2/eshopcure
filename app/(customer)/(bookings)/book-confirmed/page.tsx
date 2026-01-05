/**
 * Booking confirmation page with success message and booking details
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/formatting';
import { getOptimizedImageUrl } from '@/lib/cloudinary/utils';
import { COLLECTIONS } from '@/types/collections';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Booking } from '@/types/booking';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, Star } from 'lucide-react';
import { ReviewFormModal } from '@/components/reviews';
import { useApp } from '@/contexts/AppContext';
import { PaymentConfirmation } from '@/components/confirmation';
import { useCart } from '@/contexts/CartContext';

export default function BookConfirmedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('bookingId');
  const txRef = searchParams.get('txRef');
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { currentBusiness } = useApp();
  const { clearCart } = useCart();

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);
  
  const verifyPayment = async (ref: string) => {
    try {
      const response = await fetch(`/api/payments/verify?txRef=${encodeURIComponent(ref)}`);
      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        const status = result.data.status === 'success' ? 'success' : result.data.status === 'failed' ? 'failed' : 'pending';
        setPaymentStatus(status);
        
        // Clear cart only when payment is verified as successful
        if (status === 'success') {
          clearCart();
        }
      } else {
        setPaymentStatus('pending');
        setPaymentError(result.message || 'Unable to verify payment status');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setPaymentStatus('pending');
      setPaymentError('Failed to verify payment status');
    }
  };

  const loadBooking = async () => {
    try {
      if (!bookingId) {
        setPaymentError('Booking ID is missing');
        return;
      }
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        const data = bookingSnap.data();
        // Convert Firestore timestamps to Date objects
        const timeSlot = {
          ...data.timeSlot,
          startTime: data.timeSlot.startTime?.toDate ? data.timeSlot.startTime.toDate() : new Date(data.timeSlot.startTime),
          endTime: data.timeSlot.endTime?.toDate ? data.timeSlot.endTime.toDate() : new Date(data.timeSlot.endTime),
        };
        setBooking({ 
          id: bookingSnap.id, 
          ...data,
          timeSlot,
        } as Booking);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const startTime = booking?.timeSlot.startTime instanceof Date 
    ? booking.timeSlot.startTime 
    : booking?.timeSlot.startTime ? new Date(booking.timeSlot.startTime) : null;
  const endTime = booking?.timeSlot.endTime instanceof Date 
    ? booking.timeSlot.endTime 
    : booking?.timeSlot.endTime ? new Date(booking.timeSlot.endTime) : null;
  const isPartialPayment = booking?.pricing.isPartialPayment || false;
  const remainingBalance = isPartialPayment && booking?.pricing.totalFee
    ? booking.pricing.totalFee - (booking.pricing.bookingFee || 0) + (booking.pricing.totalFee * 0.08)
    : 0;

  const isPaymentSuccessful = paymentStatus === 'success' || (!txRef && booking?.status === 'paid');

  // Clear cart when payment is successful (for cases where booking status is already paid)
  useEffect(() => {
    if (isPaymentSuccessful && !txRef && booking?.status === 'paid') {
      clearCart();
    }
  }, [isPaymentSuccessful, booking?.status, txRef, clearCart]);

  return (
    <>
    <PaymentConfirmation
      txRef={txRef}
      onVerifyPayment={verifyPayment}
      paymentStatus={paymentStatus}
      paymentError={paymentError}
      setPaymentStatus={setPaymentStatus}
      setPaymentError={setPaymentError}
      loading={loading}
      loadingMessage="Loading booking details..."
      notFound={!booking}
      notFoundTitle="Booking Not Found"
      notFoundActionLabel="Return to Services"
      notFoundActionHref="/services"
      successTitle="Booking Confirmed!"
      successMessage="Thank you for your booking. Your service has been successfully reserved and payment confirmed."
      defaultStatus={booking?.status === 'paid' ? 'paid' : undefined}
      primaryAction={{
        label: 'Book Another Service',
        href: '/services',
      }}
      secondaryAction={{
        label: 'View Booking Details',
        href: booking ? `/bookings/${booking.id}` : '/',
      }}
    >
      {booking && (
        <>
          {/* Booking Details */}
          <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <span className="text-sm sm:text-base text-text-secondary">Booking Number</span>
              <span className="text-base sm:text-lg font-semibold text-foreground break-all">{booking.bookingNumber}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 sm:pt-4 border-t border-border">
              <span className="text-sm sm:text-base text-text-secondary">Amount Paid</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                {formatCurrency(booking.pricing.total, booking.pricing.currency)}
              </span>
            </div>
            {isPartialPayment && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <span className="text-sm sm:text-base text-text-secondary">Remaining Balance</span>
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {formatCurrency(remainingBalance, booking.pricing.currency)}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  You can pay the remaining balance when the service is completed or contact us to pay in advance.
                </p>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4">Service Details</h2>
            <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                {booking.serviceImage && (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-background rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={getOptimizedImageUrl(booking.serviceImage, { width: 200, height: 200, format: 'webp' })}
                      alt={booking.serviceName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                    />
                  </div>
                )}
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg text-foreground mb-2 line-clamp-2">{booking.serviceName}</h3>
                  <div className="space-y-2 text-xs sm:text-sm text-text-secondary">
                    {startTime && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{formatDate(startTime)}</span>
                      </div>
                    )}
                    {startTime && endTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="break-words">
                          {formatDateTime(startTime)} - {formatDateTime(endTime)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span>Duration: {booking.timeSlot.duration} minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4">Your Information</h2>
            <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground break-all">{booking.customerName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-foreground break-all">{booking.customerEmail}</span>
                </div>
                {booking.customerPhone && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary flex-shrink-0" />
                    <span className="text-sm sm:text-base text-foreground break-all">{booking.customerPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4">Payment Breakdown</h2>
            <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {isPartialPayment && booking.pricing.bookingFee ? (
                  <>
                    <div className="flex justify-between text-xs sm:text-sm text-foreground">
                      <span>Booking Fee</span>
                      <span className="font-medium">{formatCurrency(booking.pricing.bookingFee, booking.pricing.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-foreground">
                      <span>Tax (8%)</span>
                      <span className="font-medium">{formatCurrency(booking.pricing.tax || 0, booking.pricing.currency)}</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-base sm:text-lg font-semibold text-foreground">
                        <span>Amount Paid</span>
                        <span>{formatCurrency(booking.pricing.total, booking.pricing.currency)}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between text-xs sm:text-sm text-foreground">
                        <span>Remaining Balance</span>
                        <span className="font-semibold">{formatCurrency(remainingBalance, booking.pricing.currency)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-xs sm:text-sm text-foreground">
                      <span>Service Fee</span>
                      <span className="font-medium">{formatCurrency(booking.pricing.basePrice, booking.pricing.currency)}</span>
                    </div>
                    {booking.pricing.tax && (
                      <div className="flex justify-between text-xs sm:text-sm text-foreground">
                        <span>Tax</span>
                        <span className="font-medium">{formatCurrency(booking.pricing.tax, booking.pricing.currency)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-base sm:text-lg lg:text-xl font-bold text-primary">
                        <span>Total Paid</span>
                        <span>{formatCurrency(booking.pricing.total, booking.pricing.currency)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Review Prompt */}
          {isPaymentSuccessful && booking.serviceId && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                    Share Your Experience
                  </h3>
                  <p className="text-sm sm:text-base text-text-secondary mb-3 sm:mb-4">
                    We&apos;d love to hear what you think about this service. Your review helps other customers make informed decisions.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex items-center gap-2 text-xs sm:text-sm"
                  >
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    Write a Review
                  </Button>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </PaymentConfirmation>

    {/* Review Modal */}
    {isPaymentSuccessful && booking?.serviceId && currentBusiness?.id && (
      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        itemId={booking.serviceId}
        businessId={currentBusiness.id}
        reviewType="item"
        bookingId={booking.id}
      />
    )}
    </>
  );
}


