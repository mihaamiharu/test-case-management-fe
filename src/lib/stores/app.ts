import { writable } from 'svelte/store';
import type { User, Project, TestSuite, TestCase, Tag } from '../types/api';

// Auth store
export const user = writable<User | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Project store
export const projects = writable<Project[]>([]);
export const selectedProject = writable<Project | null>(null);

// Test Suite store
export const testSuites = writable<TestSuite[]>([]);
export const selectedTestSuite = writable<TestSuite | null>(null);

// Test Case store
export const testCases = writable<TestCase[]>([]);
export const selectedTestCase = writable<TestCase | null>(null);

// Tag store
export const tags = writable<Tag[]>([]);

// UI state store
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// Helper functions
export const clearError = () => {
  error.set(null);
};

export const setError = (message: string) => {
  error.set(message);
};

export const startLoading = () => {
  isLoading.set(true);
};

export const stopLoading = () => {
  isLoading.set(false);
};

// Reset all stores
export const resetStores = () => {
  user.set(null);
  isAuthenticated.set(false);
  projects.set([]);
  selectedProject.set(null);
  testSuites.set([]);
  selectedTestSuite.set(null);
  testCases.set([]);
  selectedTestCase.set(null);
  tags.set([]);
  error.set(null);
}; 