// Logger mock setup for unit tests
// This file provides a simple way to mock the enhanced logger in tests

// Mock Sentry global object
(globalThis as any).Sentry = {
    init: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    captureMessage: jest.fn(),
    captureException: jest.fn()
};

// Mock document for browser environment
(globalThis as any).document = {
    createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        onload: jest.fn()
    })),
    head: {
        appendChild: jest.fn()
    }
};

// Mock console methods
const originalConsole = { ...console };
(globalThis as any).console = {
    ...originalConsole,
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    log: jest.fn()
};

// Export mock functions for use in tests
export const mockSentry = (globalThis as any).Sentry;
export const mockDocument = (globalThis as any).document;
export const mockConsole = (globalThis as any).console;

// Helper function to reset all mocks
export const resetLoggerMocks = () => {
    jest.clearAllMocks();
    (globalThis as any).console = {
        ...originalConsole,
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        trace: jest.fn(),
        log: jest.fn()
    };
};

// Helper function to restore original console
export const restoreConsole = () => {
    (globalThis as any).console = originalConsole;
}; 