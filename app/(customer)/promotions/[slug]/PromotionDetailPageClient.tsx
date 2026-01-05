'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProductCard } from '@/components/products';
import { ServiceCard } from '@/components/services';
import { Button, Loading, Badge } from '@/components/ui';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { usePromotions, useProducts, useServices } from '@/hooks';
import { PromotionStatus } from '@/types/promotion';
import { ItemStatus } from '@/types/item';
import { useApp } from '@/contexts/AppContext';
import { formatDate } from '@/lib/utils/formatting';
import { Timestamp } from 'firebase/firestore';
import { Calendar } from 'lucide-react';
import { isProduct, isService } from '@/types';

export default function PromotionDetailPageClient({ slug }: { slug: string }) {
  const { currentBusiness } = useApp();

  // Fetch promotions
  const { data: promotions = [], isLoading: promotionsLoading } = usePromotions({
    businessId: currentBusiness?.id,
    status: PromotionStatus.ACTIVE,
    enabled: !!currentBusiness?.id,
  });

  // Fetch all products and services
  const { data: products = [], isLoading: productsLoading } = useProducts({
    businessId: currentBusiness?.id,
    status: ItemStatus.ACTIVE,
    enabled: !!currentBusiness?.id,
  });

  const { data: services = [], isLoading: servicesLoading } = useServices({
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

  // Find the promotion by slug or id
  const promotion = useMemo(() => {
    if (!promotions || promotions.length === 0) return undefined;
    // Try to find by slug first, then by id
    return promotions.find(p => {
      if (p.slug && p.slug === slug) return true;
      if (p.id === slug) return true;
      return false;
    });
  }, [promotions, slug]);

  // Get items in this promotion
  const promotionItems = useMemo(() => {
    if (!promotion) return [];
    const allItems = [...products, ...services];
    const itemIds = [...(promotion.productsIds || []), ...(promotion.servicesIds || [])];
    return allItems.filter(item => item.id && itemIds.includes(item.id));
  }, [promotion, products, services]);

  const loading = promotionsLoading || productsLoading || servicesLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Promotion Not Found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = toDate(promotion.startDate);
  const endDate = toDate(promotion.endDate);
  const productItems = promotionItems.filter(isProduct);
  const serviceItems = promotionItems.filter(isService);

  return (
    <div className="min-h-screen bg-background-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-text-secondary">
            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-foreground">Promotion: {promotion.name}</li>
          </ol>
        </nav>

        {/* Promotion Header */}
        <div className="bg-card rounded-lg shadow-md overflow-hidden mb-8">
          {/* Promotion Image */}
          {promotion.image && (
            <div className="relative w-full bg-background-secondary aspect-[8/3]">
              <OptimizedImage
                src={promotion.image}
                alt={promotion.name}
                fill
                context="banner"
                aspectRatio="landscape"
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-3">{promotion.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="danger" className="text-xl px-4 py-2">
                    {promotion.discountType === 'percentage'
                      ? `${promotion.discount}% OFF`
                      : `${promotion.discount} OFF`}
                  </Badge>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {formatDate(startDate)} - {formatDate(endDate)}
                    </span>
                  </div>
                </div>
                {promotion.description && (
                  <p className="text-lg text-text-secondary">{promotion.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="mb-8">
          {promotionItems.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg">
              <p className="text-text-secondary">No items found in this promotion.</p>
            </div>
          ) : (
            <>
              {productItems.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Products ({productItems.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productItems.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {serviceItems.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Services ({serviceItems.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {serviceItems.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/promotions">
            <Button variant="outline" size="lg">
              View All Promotions
            </Button>
          </Link>
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

