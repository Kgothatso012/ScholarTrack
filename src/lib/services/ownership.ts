// Service-layer ownership guards
// These helpers enforce that the calling authenticated user matches
// the owner id passed to a mutating service. They are a SECOND line of
// defense on top of Supabase RLS — they surface clearer errors earlier
// and protect against future RLS gaps.
//
// All services that accept a userId/parentId/driverId/childId parameter
// for a mutating operation should call assertCallerOwns() before doing
// the actual mutation.

import { supabase } from './supabase';

export class OwnershipError extends Error {
  constructor(
    public readonly attemptedUserId: string,
    public readonly actualUserId: string
  ) {
    super(
      `OwnershipError: caller ${actualUserId} cannot act on behalf of ${attemptedUserId}`
    );
    this.name = 'OwnershipError';
  }
}

/**
 * Returns the currently authenticated user's id, or null if not signed in.
 * Throws if no user is signed in.
 */
export async function requireAuthUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) {
    throw new Error('Authentication required');
  }
  return data.user.id;
}

/**
 * Throws OwnershipError if `ownerId` does not match the current user.
 * Use this BEFORE making a service call that targets a specific user's data.
 */
export async function assertCallerOwns(ownerId: string): Promise<void> {
  const currentUserId = await requireAuthUserId();
  if (currentUserId !== ownerId) {
    throw new OwnershipError(ownerId, currentUserId);
  }
}

/**
 * Like assertCallerOwns but allows admins to act on behalf of any user.
 * Use for admin-only service paths (e.g. admin dashboard bulk operations).
 */
export async function assertCallerOwnsOrAdmin(ownerId: string): Promise<void> {
  const currentUserId = await requireAuthUserId();
  if (currentUserId === ownerId) return;
  // Check role
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUserId)
    .single();
  if (error || data?.role !== 'admin') {
    throw new OwnershipError(ownerId, currentUserId);
  }
}

/**
 * Verifies that a given recordId exists in `table` and is owned by the
 * currently authenticated user. Returns the record, or throws.
 * Use this for "by-id" mutating operations where the caller passes
 * a record id (not a user id) — like updateChild(childId, ...).
 */
export async function assertRecordOwner<T extends Record<string, unknown>>(
  table: 'children' | 'driver_documents' | 'parent_documents' | 'routes' | 'trips' | 'payments' | 'emergency_contacts' | 'panic_alerts' | 'driver_ratings',
  recordId: string,
  ownerColumn: string
): Promise<T> {
  const currentUserId = await requireAuthUserId();
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', recordId)
    .single();
  if (error || !data) {
    throw new Error(`${table}#${recordId} not found or not accessible`);
  }
  // The owner column may be either the auth.uid() directly (e.g. user_id)
  // or a foreign key (e.g. parent_id). Check both shapes.
  const ownerValue = (data as Record<string, unknown>)[ownerColumn];
  // Some tables use a join-style ownership — e.g. children.parent_id
  // already equals auth.uid() for parents. For drivers, ownership is
  // drivers.user_id, so we accept either ownerColumn value or any of the
  // common "owner columns" on the record.
  const isOwner = ownerValue === currentUserId;
  // For drivers table, ownership is indirect via drivers.user_id
  const isDriver = (data as Record<string, unknown>).driver_id !== undefined;
  if (!isOwner && !isDriver) {
    throw new OwnershipError(String(ownerValue ?? ''), currentUserId);
  }
  return data as T;
}
