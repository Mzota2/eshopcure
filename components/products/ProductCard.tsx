/**
 * Product card component for product listings
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShareButton } from '@/components/ui/ShareButton';
import { Item, isProduct, ItemStatus } from '@/types';
import { formatCurrency } from '@/lib/utils/formatting';
import { ProductImage } from '../ui';
import { useItemPromotion } from '@/hooks/useItemPromotion';
import { calculatePromotionPrice } from '@/lib/promotions/utils';
import { getEffectivePrice, getFinalPrice } from '@/lib/utils/pricing';

export interface ProductCardProps {
  product: Item;
  onAddToCart?: (product: Item) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  // Type guard to ensure it's a product
  if (!isProduct(product)) {
    return null;
  }

  const [isHovered, setIsHovered] = useState(false);
  const mainImage = product.images[0]?.url || '/placeholder-product.jpg';
  const secondImage = product.images[1]?.url;

  // Check if product is on promotion from promotions collection
  const { promotion, isOnPromotion, discountPercentage } = useItemPromotion(product);

  // Step 1: Calculate promotion price from base price (promotion applied first)
  const promotionPrice = promotion 
    ? calculatePromotionPrice(product.pricing.basePrice, promotion)
    : null;

  // Step 2: Get final price (promotion price + transaction fee if enabled)
  const finalPrice = getFinalPrice(
    product.pricing.basePrice,
    promotionPrice,
    product.pricing.includeTransactionFee,
    product.pricing.transactionFeeRate
  );

  // For display: use final price (includes promotion + transaction fee)
  const displayPrice = finalPrice;
  
  // For comparison/strikethrough: show price before promotion (with transaction fee if enabled)
  const effectivePrice = getEffectivePrice(
    product.pricing.basePrice,
    product.pricing.includeTransactionFee,
    product.pricing.transactionFeeRate
  );

  // Check for compareAtPrice discount (backward compatibility)
  const hasCompareAtPriceDiscount = product.pricing.compareAtPrice && product.pricing.compareAtPrice > product.pricing.basePrice;
  const compareAtPriceDiscount = hasCompareAtPriceDiscount
    ? Math.round(((product.pricing.compareAtPrice! - product.pricing.basePrice) / product.pricing.compareAtPrice!) * 100)
    : 0;

  // Use promotion discount percentage if available, otherwise use compareAtPrice discount
  const discount = discountPercentage > 0 ? discountPercentage : compareAtPriceDiscount;
  
  // Show promotion if item is in promotions collection OR has compareAtPrice discount
  const showPromotion = isOnPromotion || hasCompareAtPriceDiscount;

  const inventory = product.inventory;
  const available = inventory?.available || 0;

  // Generate share URL
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/products/${product.slug}`
    : `/products/${product.slug}`;

  return (
    <div 
      className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square w-full bg-background-secondary overflow-hidden group">
          <div 
            className={`absolute inset-0 transition-opacity duration-500 ${
              isHovered && secondImage ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <ProductImage
              src={mainImage}
              alt={product.name}
              fill
              context="card"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {secondImage && (
            <div 
              className={`absolute inset-0 transition-opacity duration-500 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <ProductImage
                src={secondImage}
                alt={`${product.name} - View 2`}
                fill
                context="card"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          {/* Dark overlay gradient for badge visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
          
          {product.status === ItemStatus.OUT_OF_STOCK && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-base shadow-xl backdrop-blur-sm border-2 border-white/20">
                Out of Stock
              </div>
            </div>
          )}
          
          {/* Promotion badge */}
          {showPromotion && discount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg backdrop-blur-sm border-2 border-white/20">
                {discount}% OFF
              </div>
            </div>
          )}
          
          {showPromotion && discount === 0 && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg backdrop-blur-sm border-2 border-white/20">
                On Sale
              </div>
            </div>
          )}
          
          {product.status === ItemStatus.ACTIVE && available > 0 && !showPromotion && (
            <div className="absolute top-2 left-2 z-10">
              <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg backdrop-blur-sm border-2 border-white/20">
                New
              </div>
            </div>
          )}

          {/* Share button overlay - positioned in top-right when no promotion badge */}
          {!showPromotion && (
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <ShareButton
                url={shareUrl}
                title={product.name}
                description={product.description}
                variant="ghost"
                size="sm"
                className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm"
              />
            </div>
          )}
          {showPromotion && (
            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <ShareButton
                url={shareUrl}
                title={product.name}
                description={product.description}
                variant="ghost"
                size="sm"
                className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm"
              />
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/products/${product.slug}`} className="flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1.5 sm:mb-2 line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>
        
        {/* Pricing with promotion display */}
        <div className="flex items-baseline gap-2 mb-2 flex-wrap">
          <span className="text-lg sm:text-xl font-bold text-primary">
            {formatCurrency(displayPrice, product.pricing.currency)}
          </span>
          {promotionPrice !== null && (
            <span className="text-xs sm:text-sm text-text-tertiary line-through">
              {formatCurrency(effectivePrice, product.pricing.currency)}
            </span>
          )}
          {promotionPrice === null && hasCompareAtPriceDiscount && product.pricing.compareAtPrice && (
            <span className="text-xs sm:text-sm text-text-tertiary line-through">
              {formatCurrency(product.pricing.compareAtPrice, product.pricing.currency)}
            </span>
          )}
        </div>
        
        {product.description && (
          <p className="text-xs sm:text-sm text-text-secondary mb-2 sm:mb-3 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-text-muted">
            {available > 0 
              ? `In Stock`
              : 'Out of Stock'
            }
          </span>
          {onAddToCart && product.status === ItemStatus.ACTIVE && available > 0 && (
            <Button
              size="sm"
              className="text-xs sm:text-sm"
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
