/**
 * Common validation functions
 */

import { ValidationError } from './errors';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate email and throw if invalid
 */
export const validateEmail = (email: string, fieldName: string = 'email'): void => {
  if (!email) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
  if (!isValidEmail(email)) {
    throw new ValidationError(`${fieldName} is invalid`, fieldName);
  }
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: number, fieldName: string): void => {
  if (typeof value !== 'number' || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
  }
};

/**
 * Validate non-negative number
 */
export const validateNonNegativeNumber = (value: number, fieldName: string): void => {
  if (typeof value !== 'number' || value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`, fieldName);
  }
};

/**
 * Validate phone number format (basic)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate phone number and throw if invalid
 */
export const validatePhoneNumber = (phone: string, fieldName: string = 'phone'): void => {
  if (phone && !isValidPhoneNumber(phone)) {
    throw new ValidationError(`${fieldName} is invalid`, fieldName);
  }
};

/**
 * Validate order status transition
 */
export const isValidOrderStatusTransition = (
  currentStatus: string,
  newStatus: string
): boolean => {
  const validTransitions: Record<string, string[]> = {
    pending: ['paid', 'canceled'],
    paid: ['processing', 'canceled', 'refunded'],
    processing: ['shipped', 'canceled'],
    shipped: ['completed', 'canceled'],
    completed: [], // Terminal state
    canceled: [], // Terminal state
    refunded: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Validate booking status transition
 */
export const isValidBookingStatusTransition = (
  currentStatus: string,
  newStatus: string
): boolean => {
  const validTransitions: Record<string, string[]> = {
    pending: ['paid', 'canceled'],
    paid: ['confirmed', 'canceled', 'refunded'],
    confirmed: ['completed', 'canceled', 'no_show'],
    completed: [], // Terminal state
    canceled: [], // Terminal state
    no_show: [], // Terminal state
    refunded: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

