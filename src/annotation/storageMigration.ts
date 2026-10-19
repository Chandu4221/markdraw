// src/annotation/storageMigration.ts
/**
 * One-time migration for localStorage keys containing 'role' to 'type' (§1.1).
 * If old key exists and new doesn't, copy value and keep old key untouched.
 */
export function migrateLocalStorageRoleKeys(storage?: Storage | null): void {
  const targetStorage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!targetStorage) return;

  try {
    const keysToMigrate: string[] = [];
    for (let i = 0; i < targetStorage.length; i++) {
      const key = targetStorage.key(i);
      if (key && key.startsWith('markdraw_') && key.includes('role')) {
        keysToMigrate.push(key);
      }
    }

    for (const oldKey of keysToMigrate) {
      const newKey = oldKey.replace('role', 'type');
      if (targetStorage.getItem(newKey) === null) {
        const value = targetStorage.getItem(oldKey);
        if (value !== null) {
          targetStorage.setItem(newKey, value);
        }
      }
    }
  } catch {
    // Fail-safe in restrictive environments
  }
}
