// Simple test file for logger functionality
// This file tests basic logger functionality without complex mocking

import {
    SentryLogLevel,
    configureSentry,
    configureComponent,
    isLoggingEnabled,
    getConfig,
    cleanup
} from '../../../src/shared/utils/logger';

describe('SentryLogger Simple Tests', () => {
    beforeEach(() => {
        cleanup();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Configuration', () => {
        it('should initialize with default configuration', () => {
            // Arrange & Act
            configureSentry();

            // Assert
            const config = getConfig();
            expect(config.enabled).toBe(true);
            expect(config.defaultLogLevel).toBe(SentryLogLevel.INFO);
            expect(config.enableWorkflowTracking).toBe(true);
            expect(config.enablePerformanceTracking).toBe(true);
            expect(config.enableConsoleOverride).toBe(true);
        });

        it('should configure component with custom settings', () => {
            // Arrange
            configureSentry();

            // Act
            configureComponent('TestComponent', {
                logLevel: SentryLogLevel.DEBUG,
                enableWorkflowTracking: true,
                enablePerformanceTracking: false
            });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
        });

        it('should respect log level hierarchy', () => {
            // Arrange
            configureSentry();

            // Act
            configureComponent('TestComponent', { logLevel: SentryLogLevel.WARN });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should handle legacy log levels', () => {
            // Arrange
            configureSentry();

            // Act
            configureComponent('TestComponent', { logLevel: SentryLogLevel.ERROR_ONLY });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should disable logging for DISABLED level', () => {
            // Arrange
            configureSentry();

            // Act
            configureComponent('TestComponent', { logLevel: SentryLogLevel.DISABLED });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(false);
        });
    });

    describe('Log Levels', () => {
        it('should have all six standard log levels', () => {
            // Assert
            expect(SentryLogLevel.TRACE).toBe('trace');
            expect(SentryLogLevel.DEBUG).toBe('debug');
            expect(SentryLogLevel.INFO).toBe('info');
            expect(SentryLogLevel.WARN).toBe('warn');
            expect(SentryLogLevel.ERROR).toBe('error');
            expect(SentryLogLevel.FATAL).toBe('fatal');
        });

        it('should have legacy log levels for backward compatibility', () => {
            // Assert
            expect(SentryLogLevel.DISABLED).toBe('disabled');
            expect(SentryLogLevel.ERROR_ONLY).toBe('error_only');
            expect(SentryLogLevel.WARNING_AND_ERROR).toBe('warning_and_error');
            expect(SentryLogLevel.ALL).toBe('all');
        });
    });

    describe('Component Configuration', () => {
        it('should use default configuration when component not configured', () => {
            // Arrange
            configureSentry({ defaultLogLevel: SentryLogLevel.WARN });

            // Act & Assert
            expect(isLoggingEnabled('NonExistentComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('NonExistentComponent', 'info')).toBe(false);
        });

        it('should allow multiple components with different configurations', () => {
            // Arrange
            configureSentry();

            // Act
            configureComponent('ComponentA', { logLevel: SentryLogLevel.DEBUG });
            configureComponent('ComponentB', { logLevel: SentryLogLevel.ERROR });

            // Assert
            expect(isLoggingEnabled('ComponentA', 'debug')).toBe(true);
            expect(isLoggingEnabled('ComponentA', 'info')).toBe(true);
            expect(isLoggingEnabled('ComponentB', 'debug')).toBe(false);
            expect(isLoggingEnabled('ComponentB', 'error')).toBe(true);
        });
    });

    describe('Global Configuration', () => {
        it('should disable logging when globally disabled', () => {
            // Arrange
            configureSentry({ enabled: false });
            configureComponent('TestComponent', { logLevel: SentryLogLevel.TRACE });

            // Act & Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(false);
        });

        it('should enable all logging when globally set to TRACE', () => {
            // Arrange
            configureSentry({ defaultLogLevel: SentryLogLevel.TRACE });

            // Act & Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });
    });
}); 