/**
 * Custom cursor management
 */

import { gameState } from '@/state/index.ts';
import { findSlotByCursor } from '@/config/index.ts';
import { setParticleEffect, spawnParticleAtCursor, clearParticles } from './particles.ts';

/** Custom cursor element */
let cursorElement: HTMLElement | null = null;
let cursorImg: HTMLImageElement | null = null;

/** Mouse move handler reference */
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;

/**
 * Initialize custom cursor
 */
export function initCursor(element: HTMLElement): void {
  cursorElement = element;
  cursorImg = element.querySelector('img');

  // Apply saved cursor
  const savedCursor = gameState.equippedCursor;
  if (savedCursor && savedCursor !== 'default') {
    applyCursor(savedCursor);
  }

  // Set up mouse tracking
  mouseMoveHandler = (e: MouseEvent) => {
    if (cursorElement && gameState.equippedCursor !== 'default') {
      cursorElement.style.left = e.clientX + 'px';
      cursorElement.style.top = e.clientY + 'px';

      // Spawn particles if cursor has effect
      spawnParticleAtCursor(e.clientX, e.clientY);
    }
  };

  document.addEventListener('mousemove', mouseMoveHandler);
}

/**
 * Apply a cursor by ID
 */
export function applyCursor(cursorId: string): void {
  // Find the slot with this cursor (used for particle effects)
  findSlotByCursor(cursorId);

  // Clear any existing particle effect
  clearParticles();
  setParticleEffect(null);

  if (cursorId && cursorId !== 'default') {
    // Use custom cursor element that follows mouse
    if (cursorImg) {
      cursorImg.src = `cursors/${cursorId}.png`;
    }
    if (cursorElement) {
      cursorElement.style.display = 'block';
    }
    document.body.classList.add('custom-cursor-active');

    // Set particle effect if this cursor has one
    setParticleEffect(cursorId);
  } else {
    // Reset to default cursor
    if (cursorElement) {
      cursorElement.style.display = 'none';
    }
    document.body.classList.remove('custom-cursor-active');
  }

  // Update state
  gameState.equipCursor(cursorId);
}

/**
 * Reset to default cursor
 */
export function resetCursor(): void {
  applyCursor('default');
}

/**
 * Get the name of the currently equipped cursor
 */
export function getEquippedCursorName(): string {
  const cursorId = gameState.equippedCursor;
  if (!cursorId || cursorId === 'default') {
    return 'Default';
  }

  const slot = findSlotByCursor(cursorId);
  return slot?.name ?? cursorId;
}

/**
 * Equip a cursor with toast notification
 * @param cursorId The cursor ID to equip
 * @param showToast Callback to show toast notification
 */
export function equipCursor(
  cursorId: string,
  showToast?: (title: string, desc: string) => void
): void {
  applyCursor(cursorId);

  if (showToast) {
    showToast('Cursor Equipped!', `Now using: ${getEquippedCursorName()}`);
  }
}

/**
 * Clean up cursor resources
 */
export function destroyCursor(): void {
  if (mouseMoveHandler) {
    document.removeEventListener('mousemove', mouseMoveHandler);
    mouseMoveHandler = null;
  }

  cursorElement = null;
  cursorImg = null;
}
