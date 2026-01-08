/**
 * Quick Contact floating button for customer support
 * Fixed position at bottom right of the screen
 * Allows users to contact via WhatsApp, Email, or Phone
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mail, Phone, X } from 'lucide-react';
import { useBusinesses } from '@/hooks';
// Store contact information - can be moved to env variable or settings
const CONTACT_INFO = {
  whatsapp: '', // Format: country code + number (no + or spaces)
  email: '',
  phone: '', // Format: +country code + number
};

interface QuickContactProps {
  whatsappNumber?: string;
  email?: string;
  phoneNumber?: string;
}

export const QuickContact: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: businesses = [], isLoading: businessLoading } = useBusinesses({ limit: 1 });

  const business = businesses.length > 0 ? businesses[0] : null;
  const phoneNumber = business?.contactInfo?.phone || '';
  const email = business?.contactInfo?.email || '';
  const whatsappNumber = business?.contactInfo?.phone || '';
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format phone number for WhatsApp (remove any spaces, dashes, or +)
  const formatWhatsAppNumber = (number: string) => {
    return number.replace(/[\s\-+]/g, '');
  };

  const handleWhatsApp = () => {
    const formattedNumber = formatWhatsAppNumber(whatsappNumber);
    const message = 'Hello, I need help with my order.';
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('Customer Inquiry');
    const body = encodeURIComponent('Hello, I need help with my order.');
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    setIsOpen(false);
  };

  const handlePhone = () => {
    // Format phone number for tel: link (remove spaces, keep +)
    const formattedPhone = phoneNumber.replace(/\s/g, '');
    window.location.href = `tel:${formattedPhone}`;
    setIsOpen(false);
  };

  const contactOptions = [
    {
      label: 'WhatsApp',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg {...props} className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
      onClick: handleWhatsApp,
      color: 'bg-background border-b border-border',
    },
    {
      label: 'Email',
      icon: Mail,
      onClick: handleEmail,
      color: 'bg-background border-b border-border',
    },
    {
      label: 'Phone',
      icon: Phone,
      onClick: handlePhone,
      color: 'bg-background',
    },
  ];

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Contact Options Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-48 bg-card rounded-lg shadow-xl border border-border overflow-hidden transition-all duration-200 ease-in-out opacity-100 translate-y-0">
          {contactOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                onClick={option.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 ${option.color} transition-colors first:rounded-t-lg last:rounded-b-lg hover:opacity-90`}
                aria-label={`Contact us via ${option.label}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Contact Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-destructive hover:bg-destructive/90'
            : 'bg-[#25D366] hover:bg-[#20BA5A]'
        } text-white`}
        aria-label={isOpen ? 'Close contact menu' : 'Contact us'}
        title="Contact us"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        <span className="sr-only">Contact us</span>
      </button>
    </div>
  );
};

