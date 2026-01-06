/**
 * Review Form Modal Component
 * Non-intrusive modal for submitting reviews
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { Star, AlertCircle } from 'lucide-react';
import { useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Review } from '@/types/reviews';
import { hasUserReviewed } from '@/lib/reviews';
import { useSettings } from '@/hooks/useSettings';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  businessId?: string;
  reviewType: 'item' | 'business';
  orderId?: string;
  bookingId?: string;
  onSuccess?: () => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({
  isOpen,
  onClose,
  itemId,
  businessId,
  reviewType,
  orderId,
  bookingId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { currentBusiness } = useApp();
  const createReview = useCreateReview();
  
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [errors, setErrors] = useState<{ comment?: string; userName?: string; userEmail?: string }>({});
  const [isCheckingReview, setIsCheckingReview] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const finalBusinessId = businessId || currentBusiness?.id || '';

  // Check if user has already reviewed when modal opens or user/item changes
  useEffect(() => {
    if (isOpen && finalBusinessId) {
      checkExistingReview();
    } else {
      setHasExistingReview(false);
    }
  }, [isOpen, user?.uid, itemId, businessId, reviewType, finalBusinessId]);

  const checkExistingReview = async () => {
    if (!finalBusinessId) return;
    
    // Only check for authenticated users or when we have email
    if (!user && !userEmail) {
      setHasExistingReview(false);
      return;
    }

    setIsCheckingReview(true);
    try {
      // Normalize email to lowercase for consistent duplicate checking
      const emailToCheck = (user?.email || userEmail)?.toLowerCase().trim();
      const alreadyReviewed = await hasUserReviewed({
        userId: user?.uid,
        userEmail: emailToCheck,
        itemId,
        businessId: finalBusinessId,
        reviewType,
      });
      setHasExistingReview(alreadyReviewed);
    } catch (error) {
      console.error('Error checking existing review:', error);
      setHasExistingReview(false);
    } finally {
      setIsCheckingReview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Prevent submission if user has already reviewed
    if (hasExistingReview) {
      alert('You have already submitted a review for this item. Each customer can only submit one review.');
      return;
    }

    // Validation
    const newErrors: { comment?: string; userName?: string; userEmail?: string } = {};
    if (!comment.trim()) {
      newErrors.comment = 'Please write a review comment';
    }
    if (!user && !userName.trim()) {
      newErrors.userName = 'Name is required for guest reviews';
    }
    if (!user && !userEmail.trim()) {
      newErrors.userEmail = 'Email is required for guest reviews';
    } else if (!user && userEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      newErrors.userEmail = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'> = {
        reviewType,
        rating,
        comment: comment.trim(),
        businessId: finalBusinessId,
        ...(itemId && { itemId }),
        ...(user?.uid && { userId: user.uid }),
        // Normalize email to lowercase for consistent duplicate checking
        ...(!user && { 
          userName: userName.trim(), 
          userEmail: userEmail.trim().toLowerCase() 
        }),
        ...(orderId && { orderId }),
        ...(bookingId && { bookingId }),
      };

      await createReview.mutateAsync({ reviewData, businessId: finalBusinessId });
      
      // Reset form
      setRating(5);
      setComment('');
      if (!user) {
        setUserName('');
        setUserEmail('');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit review. Please try again.';
      console.error('Error submitting review:', errorMessage);
      alert(errorMessage);
    }
  };

  const renderStars = (displayRating: number, interactive = true) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            }`}
            disabled={!interactive}
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? 'text-warning fill-warning'
                  : 'text-border'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const reviewTarget = reviewType === 'business' ? 'this business' : 'this item';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reviewType === 'business' ? 'Write a Business Review' : 'Write a Review'}
      size="lg"
    >
      {hasExistingReview && (
        <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-foreground mb-1">Already Reviewed</p>
            <p className="text-sm text-text-secondary">
              You have already submitted a review for {reviewTarget}. Each customer can only submit one review per {reviewType === 'business' ? 'business' : 'product/service'}.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Your Rating *
          </label>
          {renderStars(rating)}
          <p className="text-sm text-text-secondary mt-2">
            Click stars to rate ({rating} out of 5)
          </p>
        </div>

        {/* Comment */}
        <div>
          <Textarea
            label="Your Review *"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }));
            }}
            error={errors.comment}
            placeholder={
              reviewType === 'business'
                ? 'Share your experience with our business...'
                : 'Tell others about your experience with this product/service...'
            }
            rows={5}
            required
          />
        </div>

        {/* Guest User Info */}
        {!user && (
          <>
            <div>
              <Input
                label="Your Name *"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errors.userName) setErrors((prev) => ({ ...prev, userName: undefined }));
                }}
                error={errors.userName}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Input
                label="Your Email *"
                type="email"
                value={userEmail}
                onChange={(e) => {
                  setUserEmail(e.target.value);
                  if (errors.userEmail) setErrors((prev) => ({ ...prev, userEmail: undefined }));
                }}
                error={errors.userEmail}
                placeholder="john@example.com"
                required
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={createReview.isPending || isCheckingReview}
            disabled={hasExistingReview}
          >
            {hasExistingReview ? 'Already Reviewed' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

