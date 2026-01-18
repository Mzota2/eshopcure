'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Truck, Package, Calendar, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import { COLLECTIONS } from '@/types/collections';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Order, FulfillmentMethod } from '@/types/order';
import { useDeliveryProviders } from '@/hooks/useDeliveryProviders';
import { MALAWI_DISTRICTS, MalawiRegion } from '@/types/delivery';
import { ReviewFormModal } from '@/components/reviews';
import { useApp } from '@/contexts/AppContext';
import { User } from 'firebase/auth';
import { PaymentConfirmation } from '@/components/confirmation';
import { useCart } from '@/contexts/CartContext';
import { ProductImage } from '@/components/ui/OptimizedImage';

export default function OrderConfirmedPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const txRef = searchParams.get('txRef');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [reviewItemId, setReviewItemId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showBusinessReviewPrompt, setShowBusinessReviewPrompt] = useState(false);
  const [hasDismissedBusinessReview, setHasDismissedBusinessReview] = useState(false);
  const [hasReviewedBusiness, setHasReviewedBusiness] = useState<boolean | null>(null);
  const { data: deliveryProviders } = useDeliveryProviders();
  const appContext = useApp();
  const currentBusiness = appContext.currentBusiness;
  const user = 'user' in appContext ? (appContext as any).user : null;
  const { clearCart } = useCart();

  const isPaymentSuccessful = paymentStatus === 'success' || (!txRef && order?.status === 'paid');

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
    
    // Check if user has reviewed the business
    const checkBusinessReview = async () => {
      if (!currentBusiness?.id || !user?.uid) return;
      
      try {
        const { hasUserReviewed } = await import('@/lib/reviews');
        const reviewed = await hasUserReviewed({
          userId: user.uid,
          businessId: currentBusiness.id,
          reviewType: 'business'
        });
        setHasReviewedBusiness(reviewed);
        
        // Only show the prompt if user hasn't reviewed and payment is successful
        if (isPaymentSuccessful && !reviewed) {
          const timer = setTimeout(() => {
            setShowBusinessReviewPrompt(true);
          }, 5000);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error checking business review:', error);
        // Default to false to show the prompt if there's an error
        setHasReviewedBusiness(false);
      }
    };
    
    if (isPaymentSuccessful && currentBusiness?.id) {
      checkBusinessReview();
    }
  }, [orderId, isPaymentSuccessful]);
  
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

  const loadOrder = async () => {
    try {
      if (!orderId) {
        setPaymentError('Order ID is missing');
        return;
      }
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  
  // Clear cart when payment is successful (for cases where order status is already paid)
  useEffect(() => {
    if (isPaymentSuccessful && !txRef && order?.status === 'paid') {
      clearCart();
    }
  }, [isPaymentSuccessful, order?.status, txRef, clearCart]);

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
      loadingMessage="Loading order details..."
      notFound={!order}
      notFoundTitle="Order Not Found"
      notFoundActionLabel="Return to Home"
      notFoundActionHref="/"
      successTitle="Order Confirmed!"
      successMessage="Thank you for your purchase. Your order has been successfully placed and payment confirmed."
      defaultStatus={order?.status === 'paid' ? 'paid' : undefined}
      primaryAction={{
        label: 'Continue Shopping',
        href: '/products',
      }}
      secondaryAction={{
        label: 'View Order Details',
        href: order ? `/orders/${order.id}` : '/',
      }}
    >
      {order && (
        <>
          {/* Order Details */}
          <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <span className="text-sm sm:text-base text-text-secondary">Order Number</span>
              <span className="text-base sm:text-lg font-semibold text-foreground break-all">{order.orderNumber}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 sm:pt-4 border-t border-border">
              <span className="text-sm sm:text-base text-text-secondary">Total Paid</span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                {formatCurrency(order.pricing.total, order.pricing.currency)}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4">Items Ordered</h2>
            <div className="space-y-3 sm:space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-background-secondary rounded-lg sm:rounded-xl">
                  {item.productImage && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-background rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
                      <ProductImage
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        context="card"
                        aspectRatio="square"
                        className="object-cover"
                        sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                      />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 line-clamp-2">{item.productName}</h3>
                    {item.sku && (
                      <p className="text-xs sm:text-sm text-text-secondary mb-2">SKU: {item.sku}</p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm text-text-secondary">Quantity: {item.quantity}</span>
                      <span className="font-semibold text-sm sm:text-base text-foreground">
                        {formatCurrency(item.subtotal, order.pricing.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Information */}
          {order.delivery && (
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              {order.delivery.method === FulfillmentMethod.DELIVERY ? (
                <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {order.delivery.method === FulfillmentMethod.DELIVERY ? 'Delivery' : 'Pickup'} Information
            </h2>
            <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              {order.delivery.method === FulfillmentMethod.DELIVERY && order.delivery.address && (
                <div>
                  <div className="flex items-start gap-2 sm:gap-3 mb-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-sm sm:text-base text-foreground mb-2">Delivery Address</p>
                      <div className="text-xs sm:text-sm text-text-secondary space-y-1">
                        <p>{order.delivery.address.areaOrVillage}</p>
                        {order.delivery.address.traditionalAuthority && (
                          <p>{order.delivery.address.traditionalAuthority}</p>
                        )}
                        {order.delivery?.address?.district && (
                          <p>
                            {Object.values(MALAWI_DISTRICTS).flat().find(d => d === order.delivery?.address?.district) || order.delivery?.address?.district}
                          </p>
                        )}
                        {order.delivery.address.nearestTownOrTradingCentre && (
                          <p>{order.delivery.address.nearestTownOrTradingCentre}</p>
                        )}
                        <p>{order.delivery.address.region}, {order.delivery.address.country}</p>
                        {order.delivery.address.directions && (
                          <p className="mt-2 italic text-xs sm:text-sm">Directions: {order.delivery.address.directions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {order.delivery?.providerId && deliveryProviders && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Delivery Provider</p>
                  <p className="text-sm sm:text-base text-foreground">
                    {deliveryProviders.find(p => p.id === order.delivery?.providerId)?.name || 'Unknown Provider'}
                  </p>
                </div>
              )}

              {order.delivery.trackingNumber && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Tracking Number</p>
                  <p className="text-sm sm:text-base font-mono text-foreground break-all">{order.delivery.trackingNumber}</p>
                </div>
              )}

              {order.delivery.carrier && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Carrier</p>
                  <p className="text-sm sm:text-base text-foreground">{order.delivery.carrier}</p>
                </div>
              )}

              {order.delivery.estimatedDeliveryDate && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Estimated Delivery</p>
                    <p className="text-sm sm:text-base text-foreground">
                      {formatDate(new Date(order.delivery.estimatedDeliveryDate))}
                    </p>
                  </div>
                </div>
              )}

              {/* Pickup Information */}
              {order.delivery.method === FulfillmentMethod.PICKUP && currentBusiness && (
                <>
                  <div>
                    <div className="flex items-start gap-2 sm:gap-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-sm sm:text-base text-foreground mb-2">Pickup Location</p>
                        <div className="text-xs sm:text-sm text-text-secondary space-y-1">
                          {currentBusiness.address?.areaOrVillage && (
                            <p>{currentBusiness.address.areaOrVillage}</p>
                          )}
                          {currentBusiness.address?.traditionalAuthority && (
                            <p>{currentBusiness.address.traditionalAuthority}</p>
                          )}
                          {currentBusiness.address?.district && (
                            <p>
                              {Object.values(MALAWI_DISTRICTS).flat().find(d => d === currentBusiness.address?.district) || currentBusiness.address.district}
                            </p>
                          )}
                          {currentBusiness.address?.nearestTownOrTradingCentre && (
                            <p>{currentBusiness.address.nearestTownOrTradingCentre}</p>
                          )}
                          {currentBusiness.address?.region && (
                            <p>{currentBusiness.address.region}, {currentBusiness.address.country || 'Malawi'}</p>
                          )}
                          {currentBusiness.address?.directions && (
                            <p className="mt-2 italic text-xs sm:text-sm">Directions: {currentBusiness.address.directions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentBusiness.openingHours && (
                    <div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="font-medium text-sm sm:text-base text-foreground mb-2">Pickup Hours</p>
                          <div className="text-xs sm:text-sm text-text-secondary space-y-1">
                            {(() => {
                              const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                              const formattedHours: string[] = [];
                              
                              days.forEach((day, index) => {
                                const dayKey = day.toLowerCase() as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
                                const dayHours = currentBusiness.openingHours?.days[dayKey];
                                
                                if (dayHours?.isOpen) {
                                  const openTime = dayHours.openTime || currentBusiness.openingHours?.defaultHours?.openTime || 'N/A';
                                  const closeTime = dayHours.closeTime || currentBusiness.openingHours?.defaultHours?.closeTime || 'N/A';
                                  formattedHours.push(`${day}: ${openTime} - ${closeTime}`);
                                } else if (dayHours?.isOpen === false) {
                                  formattedHours.push(`${day}: Closed`);
                                } else if (currentBusiness.openingHours?.defaultHours) {
                                  const openTime = currentBusiness.openingHours.defaultHours.openTime || 'N/A';
                                  const closeTime = currentBusiness.openingHours.defaultHours.closeTime || 'N/A';
                                  formattedHours.push(`${day}: ${openTime} - ${closeTime}`);
                                }
                              });
                              
                              return formattedHours.length > 0 ? formattedHours : ['Hours not specified'];
                            })().map((hours, index) => (
                              <p key={index}>{hours}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
                )}
            </div>
          </div>
          )}

          {/* Pricing Breakdown */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-3 sm:mb-4">Pricing Breakdown</h2>
            <div className="bg-background-secondary rounded-lg sm:rounded-xl p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-foreground font-medium">{formatCurrency(order.pricing.subtotal, order.pricing.currency)}</span>
                </div>
                {typeof order.pricing.discount === 'number' && order.pricing.discount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-success font-medium">-{formatCurrency(order.pricing.discount, order.pricing.currency)}</span>
                  </div>
                )}
                {order.delivery?.method === FulfillmentMethod.DELIVERY && 
                 typeof order.pricing.shipping === 'number' && 
                 order.pricing.shipping > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-text-secondary">Shipping</span>
                    <span className="text-foreground font-medium">{formatCurrency(order.pricing.shipping, order.pricing.currency)}</span>
                  </div>
                )}
                {order.pricing.tax && order.pricing.tax > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-foreground font-medium">{formatCurrency(order.pricing.tax, order.pricing.currency)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-base sm:text-lg lg:text-xl font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">{formatCurrency(order.pricing.total, order.pricing.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Review Prompt */}
          {isPaymentSuccessful && order.items.length > 0 && (
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
                    We&apos;d love to hear what you think about the products you purchased. Your review helps other customers make informed decisions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReviewItemId(item.productId);
                          setIsReviewModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs sm:text-sm"
                      >
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Review </span>
                        <span className="truncate max-w-[120px] sm:max-w-none">{item.productName}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </PaymentConfirmation>

    {/* Review Modals */}
    {currentBusiness?.id && order && (
      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewItemId(null);
        }}
        itemId={reviewItemId || undefined}
        businessId={currentBusiness.id}
        reviewType={reviewItemId ? "item" : "business"}
        orderId={order.id}
      />
    )}
    
    {/* Business Review Prompt */}
    {showBusinessReviewPrompt && !hasDismissedBusinessReview && currentBusiness?.id && order && hasReviewedBusiness === false && (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full sm:w-96 bg-card border border-border rounded-lg shadow-lg p-4 animate-fade-in-up">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-medium text-foreground">How was your experience with us?</h3>
          <button 
            onClick={() => setHasDismissedBusinessReview(true)}
            className="text-text-secondary hover:text-foreground"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <p className="text-xs text-text-secondary mb-3">
          We'd love to hear your feedback about your shopping experience.
        </p>
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHasDismissedBusinessReview(true)}
            className="text-xs"
          >
            Not Now
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setReviewItemId(null);
              setIsReviewModalOpen(true);
              setHasDismissedBusinessReview(true);
            }}
            className="text-xs"
          >
            Leave a Review
          </Button>
        </div>
      </div>
    )}
    </>
  );
}

