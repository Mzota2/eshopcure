/**
 * Reusable CancellationDialog component for canceling orders and bookings
 */

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Button, Textarea } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  title?: string;
  description?: string;
  itemType?: 'order' | 'booking' | 'item';
  requireReason?: boolean;
  isLoading?: boolean;
}

export const CancellationDialog: React.FC<CancellationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemType = 'item',
  requireReason = false,
  isLoading = false,
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (requireReason && !cancelReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(cancelReason.trim() || undefined);
      // Reset form on success
      setCancelReason('');
      onClose();
    } catch (error) {
      // Error handling is done by parent component
      console.error('Cancellation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setCancelReason('');
      onClose();
    }
  };

  const defaultTitle = `Cancel ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const defaultDescription = `Are you sure you want to cancel this ${itemType}? This action cannot be undone.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title || defaultTitle}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">
            {description || defaultDescription}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Reason for cancellation {requireReason && <span className="text-error">*</span>}
            <span className="text-text-secondary font-normal ml-1">(optional)</span>
          </label>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Please provide a reason for cancellation..."
            rows={4}
            disabled={isSubmitting || isLoading}
            className="resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || isLoading}
          >
            Keep {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isSubmitting || isLoading || (requireReason && !cancelReason.trim())}
            isLoading={isSubmitting || isLoading}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
};

