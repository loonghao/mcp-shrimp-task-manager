import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const testRootDir = path.resolve();

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = path.join(testRootDir, 'tests', 'temp');

// Create temp directory for tests
const tempDir = path.join(testRootDir, 'tests', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Clean up temp directory before each test
beforeEach(() => {
  const tempDir = path.join(testRootDir, 'tests', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
});

// Clean up after all tests
afterAll(() => {
  const tempDir = path.join(testRootDir, 'tests', 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
