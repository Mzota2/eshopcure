'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePromotions, useProducts, useServices } from '@/hooks';
import { PromotionStatus } from '@/types/promotion';
import { ItemStatus } from '@/types/item';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/lib/utils/formatting';
import { Timestamp } from 'firebase/firestore';
import { Calendar, ArrowRight } from 'lucide-react';
import { Button, Loading, Badge } from '@/components/ui';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { isProduct, isService } from '@/types';

export default function PromotionsPageClient() {
  const { currentBusiness } = useApp();

  // Fetch promotions
  const { data: promotions = [], isLoading: promotionsLoading } = usePromotions({
    businessId: currentBusiness?.id,
    status: PromotionStatus.ACTIVE,
    enabled: !!currentBusiness?.id,
  });

  // Fetch all products and services to count items in each promotion
  const { data: products = [] } = useProducts({
    businessId: currentBusiness?.id,
    status: ItemStatus.ACTIVE,
    enabled: !!currentBusiness?.id,
  });

  const { data: services = [] } = useServices({
    businessId: currentBusiness?.id,
    status: ItemStatus.ACTIVE,
    enabled: !!currentBusiness?.id,
  });

  // Helper to convert date to Date object
  const toDate = (date: Date | Timestamp | string | undefined): Date => {
    if (!date) return new Date(0);
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    return new Date(date);
  };

  // Filter active promotions that haven't expired
  const activePromotions = useMemo(() => {
    if (!promotions || promotions.length === 0) return [];
    
    const now = new Date();
    return promotions.filter((promo) => {
      if (promo.status !== PromotionStatus.ACTIVE) return false;
      const endDate = toDate(promo.endDate);
      return endDate >= now;
    });
  }, [promotions]);

  // Get item count for each promotion
  const promotionsWithItemCounts = useMemo(() => {
    const allItems = [...products, ...services];
    return activePromotions.map((promo) => {
      const itemIds = [...(promo.productsIds || []), ...(promo.servicesIds || [])];
      const itemCount = allItems.filter(item => item.id && itemIds.includes(item.id)).length;
      return { ...promo, itemCount };
    });
  }, [activePromotions, products, services]);

  const loading = promotionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-text-secondary">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-foreground">Promotions</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Active Promotions</h1>
          <p className="text-lg text-text-secondary">
            Discover amazing deals and special offers on our products and services.
          </p>
        </div>

        {/* Promotions Grid */}
        {promotionsWithItemCounts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg">
            <p className="text-text-secondary">No active promotions at the moment. Check back soon for exciting deals!</p>
            <Link href="/" className="mt-4 inline-block">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotionsWithItemCounts.map((promotion) => {
              const startDate = toDate(promotion.startDate);
              const endDate = toDate(promotion.endDate);
              const promotionSlug = promotion.slug || promotion.id;

              return (
                <Link
                  key={promotion.id}
                  href={`/promotions/${promotionSlug}`}
                  className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Promotion Image */}
                  {promotion.image && (
                    <div className="relative w-full bg-background-secondary aspect-[8/3]">
                      <OptimizedImage
                        src={promotion.image}
                        alt={promotion.name}
                        fill
                        context="banner"
                        aspectRatio="landscape"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* Badge */}
                    <div className="mb-3">
                      <Badge variant="danger" className="text-lg px-3 py-1">
                        {promotion.discountType === 'percentage'
                          ? `${promotion.discount}% OFF`
                          : `${promotion.discount} OFF`}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {promotion.name}
                    </h2>

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-text-secondary mb-3">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDate(startDate)} - {formatDate(endDate)}
                      </span>
                    </div>

                    {/* Description */}
                    {promotion.description && (
                      <p className="text-text-secondary mb-4 line-clamp-2">
                        {promotion.description}
                      </p>
                    )}

                    {/* Item Count */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">
                        {promotion.itemCount} {promotion.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                        <span className="text-sm font-medium">View Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

