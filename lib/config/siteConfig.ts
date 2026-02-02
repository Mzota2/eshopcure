export interface SiteConfig {
  appTitle: string;
  appDescription: string;
  brandImageUrl?: string;
  defaultBusinessName?: string;
  defaultContactEmail?: string;
  defaultContactPhone?: string;
  appUrl?: string;
}

export const SITE_CONFIG: SiteConfig = {
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || 'eShopCure',
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Your trusted online shopping destination for quality products and services',
  brandImageUrl:
    process.env.NEXT_PUBLIC_BRAND_IMAGE_URL || 'https://eshopcure.vercel.app/logo.png',
  defaultBusinessName: process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_NAME || 'Our Business',
  defaultContactEmail: process.env.NEXT_PUBLIC_DEFAULT_CONTACT_EMAIL || 'info@eshopcure.com',
  defaultContactPhone: process.env.NEXT_PUBLIC_DEFAULT_CONTACT_PHONE || '+265 981 819 389',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://eshopcure.vercel.app',
};
