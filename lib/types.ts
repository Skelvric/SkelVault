import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId | string;
  email: string;
  name: string;
  password: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  company?: string;
  location?: string;
  theme?: 'Light' | 'Dark' | 'System';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Password {
  _id?: string;
  userId: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PasswordFormData {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
}

export interface UserProfileUpdate {
  name?: string;
  bio?: string;
  phone?: string;
  company?: string;
  location?: string;
  theme?: 'Light' | 'Dark' | 'System';
}

export type PasswordCategory =
  | 'Email'
  | 'Social'
  | 'Banking'
  | 'Streaming'
  | 'Work'
  | 'Shopping'
  | 'Other';

export const PASSWORD_CATEGORIES: PasswordCategory[] = [
  'Email',
  'Social',
  'Banking',
  'Streaming',
  'Work',
  'Shopping',
  'Other',
];

export interface ExportedPasswordEntry {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
}

export interface VaultExport {
  format: 'SkelVault-Export';
  version: 1;
  exportedAt: string;
  count: number;
  entries: ExportedPasswordEntry[];
}

export type ImportMode = 'Merge' | 'Replace';
