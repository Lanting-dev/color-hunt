import { inject, track as vercelTrack } from '@vercel/analytics';

try {
  inject();
} catch (err) {
  console.warn('Analytics disabled.', err);
}

function cleanProps(props = {}) {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) =>
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    )
  );
}

export function track(event, props) {
  try {
    vercelTrack(event, cleanProps(props));
  } catch (err) {
    console.warn(`Analytics event skipped: ${event}`, err);
  }
}

export function scoreBucket(score) {
  if (!Number.isFinite(score)) return null;
  if (score < 60) return '0-59';
  if (score < 80) return '60-79';
  return '80-100';
}
