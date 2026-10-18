// src/annotation/profiles/types.ts
export interface PlatformProfile {
  id: string;                                   // 'web' | 'android-material' | future ids
  displayName: string;
  directiveLines: string[];                     // 1–3 sentences appended to the directive (§8.2)
  roleAliases: Record<string, string>;          // canonical role → platform component name, ONLY for legend/notation display
  extraRoles: Record<string, {
    name: string;
    description: string;
    flags?: string[];
  }>;                                           // offered in role panel ONLY when profile active
  conventions: string[];                        // emitted as bullet lines under "Platform Conventions"
}
