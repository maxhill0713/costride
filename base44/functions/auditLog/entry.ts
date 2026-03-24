// AUDIT LOGGING UTILITY
// Centralized security event logging for all sensitive operations

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

export async function logAuditEvent(base44, event) {
  // event structure:
  // {
  //   action: string (e.g., 'gym_created', 'member_banned', 'reward_claimed'),
  //   user_id: string,
  //   user_email: string,
  //   resource_type: string (e.g., 'gym', 'member', 'reward'),
  //   resource_id: string,
  //   target_id?: string (e.g., banned member ID),
  //   details?: object (additional context),
  //   status: 'success' | 'failure',
  //   reason?: string (for failures)
  // }

  const auditLog = {
    action: event.action,
    user_id: event.user_id,
    user_email: event.user_email,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    target_id: event.target_id || null,
    details: event.details || {},
    status: event.status,
    reason: event.reason || null,
    timestamp: new Date().toISOString(),
    ip_hint: event.ip_hint || 'unknown'
  };

  try {
    // Store in AuditLog entity (you can create this entity separately)
    // await base44.asServiceRole.entities.AuditLog.create(auditLog);
    
    // For now, log to console for production monitoring
    console.log(JSON.stringify({
      event: 'AUDIT',
      ...auditLog
    }));
  } catch (err) {
    console.error('Failed to write audit log:', err);
    // Don't throw - audit failure shouldn't block operations
  }
}

export function validateStringInput(input, maxLength = 500, fieldName = 'input') {
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (input.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  return input.trim();
}

export function validateUrl(url, fieldName = 'url') {
  if (!url) return null;
  if (typeof url !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') {
      throw new Error(`${fieldName} must use HTTPS protocol`);
    }
    const validExt = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|pdf)$/i;
    if (!validExt.test(u.pathname)) {
      throw new Error(`${fieldName} has invalid file extension`);
    }
    return u.toString();
  } catch (err) {
    throw new Error(`${fieldName} is not a valid URL: ${err.message}`);
  }
}

export function validateNumberInput(input, min = 0, max = null, fieldName = 'number') {
  const num = Number(input);
  if (!isFinite(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (max !== null && num > max) {
    throw new Error(`${fieldName} cannot exceed ${max}`);
  }
  return num;
}

export function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
}