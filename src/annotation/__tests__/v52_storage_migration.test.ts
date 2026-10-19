// src/annotation/__tests__/v52_storage_migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { migrateLocalStorageRoleKeys } from '../storageMigration';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

describe('v5.2 Storage Migration (§1.1)', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  it('migrates old role key to type key when new key does not exist and keeps old key untouched', () => {
    storage.setItem('markdraw_show_role_chips', 'false');

    migrateLocalStorageRoleKeys(storage);

    expect(storage.getItem('markdraw_show_type_chips')).toBe('false');
    expect(storage.getItem('markdraw_show_role_chips')).toBe('false');
  });

  it('does not overwrite existing type key if already present', () => {
    storage.setItem('markdraw_show_role_chips', 'false');
    storage.setItem('markdraw_show_type_chips', 'true');

    migrateLocalStorageRoleKeys(storage);

    expect(storage.getItem('markdraw_show_type_chips')).toBe('true');
    expect(storage.getItem('markdraw_show_role_chips')).toBe('false');
  });
});
