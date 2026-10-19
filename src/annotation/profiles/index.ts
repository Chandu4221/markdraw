// src/annotation/profiles/index.ts
import { PlatformProfile } from './types';
import webProfile from './web.json';
import androidMaterialProfile from './android-material.json';

export * from './types';

export const PLATFORM_PROFILES: Record<string, PlatformProfile> = {
  web: webProfile as PlatformProfile,
  'android-material': androidMaterialProfile as PlatformProfile,
  android: androidMaterialProfile as PlatformProfile
};

export function getPlatformProfile(id?: string): PlatformProfile {
  if (id && PLATFORM_PROFILES[id]) {
    return PLATFORM_PROFILES[id];
  }
  return PLATFORM_PROFILES.web;
}
