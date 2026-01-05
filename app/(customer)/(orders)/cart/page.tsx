/**
 * Shopping cart page with item management and order summary
 */

'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils/formatting';
import { usePromotions } from '@/hooks/usePromotions';
import { PromotionStatus } from '@/types/promotion';
import { findItemPromotion, getItemEffectivePrice } from '@/lib/promotions/cartUtils';
import { useSettings } from '@/hooks/useSettings';
import { ProductImage } from '@/components/ui/OptimizedImage';

export default function CartPage() {
  const { items, itemCount, totalAmount, updateQuantity, removeItem, clearCart } = useCart();
  
  // Fetch active promotions
  const { data: promotions = [] } = usePromotions({
    status: PromotionStatus.ACTIVE,
  });
  
  // Fetch settings for tax rate
  const { data: settings } = useSettings();

  // Calculate pricing breakdown with promotions (discount already applied to subtotal)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const promotion = findItemPromotion(item.product, promotions);
      const effectivePrice = getItemEffectivePrice(item.product, promotion);
      return sum + effectivePrice * item.quantity;
    }, 0);
  }, [items, promotions]);
  
  // Delivery cost is calculated at checkout based on:
  // - Selected fulfillment method (delivery vs pickup)
  // - Selected delivery provider
  // - Delivery address (district and region)
  // For now, show 0 in cart - will be calculated at checkout
  const delivery = 0;
  const taxRate = settings?.payment?.taxRate || 0; // Percentage value (0-100), default to 0 if not set
  const tax = subtotal * (taxRate / 100); // Convert percentage to decimal
  // Note: Total shown here is approximate - final total will include delivery cost calculated at checkout
  const estimatedTotal = subtotal + tax; // Delivery will be added at checkout

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background-secondary py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">Your Shopping Cart</h1>
            <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">Your cart is empty.</p>
            <Link href="/products">
              <Button size="lg" className="w-full sm:w-auto">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Your Shopping Cart</h1>
        <p className="text-sm sm:text-base text-text-secondary mb-2 sm:mb-4">Your Cart ({itemCount} {itemCount === 1 ? 'Item' : 'Items'})</p>
        <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-6 lg:mb-8">Review and edit your selected products.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item) => {
              const product = item.product;
              const imageUrl = product.images[0]?.url || '/placeholder-product.jpg';
              const promotion = findItemPromotion(product, promotions);
              const effectivePrice = getItemEffectivePrice(product, promotion);
              const hasDiscount = effectivePrice < product.pricing.basePrice;

              return (
                <div
                  key={product.id}
                  className="bg-card rounded-lg shadow-sm p-3 sm:p-4 lg:p-6"
                >
                  {/* Top Section: Image and Product Info */}
                  <div className="flex gap-3 sm:gap-4 lg:gap-6 mb-3 sm:mb-4">
                    {/* Product Image */}
                    <Link href={`/products/${product.slug}`} className="flex-shrink-0">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-background-secondary rounded-lg overflow-hidden">
                        <ProductImage
                          src={imageUrl}
                          alt={product.name}
                          fill
                          context="card"
                          aspectRatio="square"
                          className="object-cover"
                          sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 128px"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-grow min-w-0">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2 hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2 flex-wrap mb-1 sm:mb-2">
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-primary">
                          {formatCurrency(effectivePrice, product.pricing.currency)}
                        </p>
                        {hasDiscount && (
                          <p className="text-text-tertiary text-xs sm:text-sm line-through">
                            {formatCurrency(product.pricing.basePrice, product.pricing.currency)}
                          </p>
                        )}
                      </div>
                      {hasDiscount && (
                        <p className="text-xs sm:text-sm text-success font-medium">
                          Subtotal: {formatCurrency(effectivePrice * item.quantity, product.pricing.currency)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Section: Quantity Controls and Remove Button */}
                  <div className="flex items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        onClick={() => handleQuantityChange(product.id, item.quantity - 1)}
                        className="px-2 sm:px-3 py-2 hover:bg-background-secondary transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="px-3 sm:px-4 py-2 min-w-[50px] sm:min-w-[60px] text-center text-sm sm:text-base text-foreground font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(product.id, item.quantity + 1)}
                        disabled={item.quantity >= product.inventory.available}
                        className="px-2 sm:px-3 py-2 hover:bg-background-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(product.id)}
                      className="text-destructive hover:text-destructive-hover transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Continue Shopping Link */}
            <div className="pt-3 sm:pt-4">
              <Link href="/products" className="text-sm sm:text-base text-primary hover:text-primary-hover font-medium transition-colors inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-20">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Order Summary</h2>
              <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-6">Review your items and total costs.</p>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base text-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, 'MWK')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm sm:text-base text-foreground">
                    <span>Delivery</span>
                    <span className="text-text-secondary text-xs sm:text-sm">Calculated at checkout</span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Delivery cost varies by location and provider. Select delivery method at checkout.
                  </p>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-foreground">
                    <span>Tax ({taxRate.toFixed(1)}%)</span>
                    <span className="font-medium">{formatCurrency(tax, 'MWK')}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 sm:pt-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-base sm:text-lg lg:text-xl font-semibold text-foreground">
                      <span>Estimated Total</span>
                      <span className="text-primary">{formatCurrency(estimatedTotal, 'MWK')}</span>
                    </div>
                    <p className="text-xs text-text-secondary">
                      Final total includes delivery cost (calculated at checkout)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure Payment</span>
                </div>
              </div>

              <Link href="/checkout" className="block">
                <Button size="lg" className="w-full text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

