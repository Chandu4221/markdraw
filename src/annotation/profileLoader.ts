// src/annotation/profileLoader.ts
import { PlatformProfile } from './profiles/types';
import webProfile from './profiles/web.json';
import androidMaterialProfile from './profiles/android-material.json';

export * from './profiles/types';

const PROFILES: Record<string, PlatformProfile> = {
  web: webProfile as PlatformProfile,
  'android-material': androidMaterialProfile as PlatformProfile
};

/**
 * Returns the platform profile for the given platform ID.
 * Throws an Error if the platform ID is unknown.
 */
export function getProfile(platformId: string): PlatformProfile {
  const profile = PROFILES[platformId];
  if (!profile) {
    throw new Error(
      `Unknown platform profile "${platformId}". Known profiles: ${Object.keys(PROFILES).join(', ')}`
    );
  }
  return profile;
}

/**
 * Asynchronously loads the platform profile for the given platform ID.
 */
export async function loadPlatformProfile(platformId: string): Promise<PlatformProfile> {
  return getProfile(platformId);
}
