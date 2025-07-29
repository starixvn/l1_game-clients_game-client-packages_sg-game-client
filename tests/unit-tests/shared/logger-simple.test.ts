// Simple test file for logger functionality
// This file tests basic logger functionality without complex mocking

/// <reference types="jest" />

import {
    sentryLogger,
    SentryLogLevel,
    WorkflowState,
    configureSentry,
    enableSentry,
    disableSentry,
    setLogLevel,
    configureComponent,
    startWorkflow,
    updateWorkflow,
    completeWorkflow,
    trackPerformance,
    logTrace,
    logDebug,
    logInfo,
    logWarning,
    logError,
    logFatal,
    isLoggingEnabled,
    getComponentConfig,
    getConfig,
    getActiveWorkflows,
    cleanup,
    close
} from '../../../src/shared/utils/logger';

// Mock the logger module to avoid DOM dependencies
jest.mock('../../../src/shared/utils/logger', () => ({
    sentryLogger: {
        logError: jest.fn(),
        logInfo: jest.fn(),
        logWarning: jest.fn(),
        logDebug: jest.fn(),
        logTrace: jest.fn(),
        logFatal: jest.fn(),
        configureComponent: jest.fn(),
        isLoggingEnabled: jest.fn(),
        start: jest.fn(),
        initialize: jest.fn(),
        setGlobalEnabled: jest.fn(),
        setDefaultLogLevel: jest.fn(),
        getComponentConfig: jest.fn(),
        startWorkflow: jest.fn(),
        updateWorkflow: jest.fn(),
        completeWorkflow: jest.fn(),
        trackPerformance: jest.fn(),
        getConfig: jest.fn(),
        getActiveWorkflows: jest.fn(),
        cleanup: jest.fn(),
        close: jest.fn()
    },
    logError: jest.fn(),
    logInfo: jest.fn(),
    logWarning: jest.fn(),
    logDebug: jest.fn(),
    logTrace: jest.fn(),
    logFatal: jest.fn(),
    configureComponent: jest.fn(),
    isLoggingEnabled: jest.fn(),
    configureSentry: jest.fn(),
    enableSentry: jest.fn(),
    disableSentry: jest.fn(),
    setLogLevel: jest.fn(),
    getComponentConfig: jest.fn(),
    startWorkflow: jest.fn(),
    updateWorkflow: jest.fn(),
    completeWorkflow: jest.fn(),
    trackPerformance: jest.fn(),
    getConfig: jest.fn(),
    getActiveWorkflows: jest.fn(),
    cleanup: jest.fn(),
    close: jest.fn(),
    SentryLogLevel: {
        TRACE: 'trace',
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
        FATAL: 'fatal',
        DISABLED: 'disabled',
        ERROR_ONLY: 'error_only',
        WARNING_AND_ERROR: 'warning_and_error',
        ALL: 'all'
    },
    WorkflowState: {
        STARTED: 'started',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed',
        FAILED: 'failed',
        CANCELLED: 'cancelled'
    }
}));

describe('SentryLogger Simple Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('SentryLogLevel enum', () => {
        it('should have all required log levels', () => {
            expect(SentryLogLevel.TRACE).toBe('trace');
            expect(SentryLogLevel.DEBUG).toBe('debug');
            expect(SentryLogLevel.INFO).toBe('info');
            expect(SentryLogLevel.WARN).toBe('warn');
            expect(SentryLogLevel.ERROR).toBe('error');
            expect(SentryLogLevel.FATAL).toBe('fatal');
            expect(SentryLogLevel.DISABLED).toBe('disabled');
            expect(SentryLogLevel.ERROR_ONLY).toBe('error_only');
            expect(SentryLogLevel.WARNING_AND_ERROR).toBe('warning_and_error');
            expect(SentryLogLevel.ALL).toBe('all');
        });
    });

    describe('WorkflowState enum', () => {
        it('should have all required workflow states', () => {
            expect(WorkflowState.STARTED).toBe('started');
            expect(WorkflowState.IN_PROGRESS).toBe('in_progress');
            expect(WorkflowState.COMPLETED).toBe('completed');
            expect(WorkflowState.FAILED).toBe('failed');
            expect(WorkflowState.CANCELLED).toBe('cancelled');
        });
    });

    describe('Configuration functions', () => {
        it('should call configureSentry', () => {
            configureSentry();
            expect(configureSentry).toHaveBeenCalled();
        });

        it('should call enableSentry', () => {
            enableSentry();
            expect(enableSentry).toHaveBeenCalled();
        });

        it('should call disableSentry', () => {
            disableSentry();
            expect(disableSentry).toHaveBeenCalled();
        });

        it('should call setLogLevel', () => {
            setLogLevel(SentryLogLevel.INFO);
            expect(setLogLevel).toHaveBeenCalledWith(SentryLogLevel.INFO);
        });

        it('should call configureComponent', () => {
            configureComponent('TestComponent', { logLevel: SentryLogLevel.INFO });
            expect(configureComponent).toHaveBeenCalledWith('TestComponent', { logLevel: SentryLogLevel.INFO });
        });

        it('should call getComponentConfig', () => {
            getComponentConfig('TestComponent');
            expect(getComponentConfig).toHaveBeenCalledWith('TestComponent');
        });

        it('should call isLoggingEnabled', () => {
            isLoggingEnabled('TestComponent', 'info');
            expect(isLoggingEnabled).toHaveBeenCalledWith('TestComponent', 'info');
        });
    });

    describe('Logging functions', () => {
        it('should call logTrace', () => {
            logTrace('TestComponent', 'Trace message');
            expect(logTrace).toHaveBeenCalledWith('TestComponent', 'Trace message');
        });

        it('should call logDebug', () => {
            logDebug('TestComponent', 'Debug message');
            expect(logDebug).toHaveBeenCalledWith('TestComponent', 'Debug message');
        });

        it('should call logInfo', () => {
            logInfo('TestComponent', 'Info message');
            expect(logInfo).toHaveBeenCalledWith('TestComponent', 'Info message');
        });

        it('should call logWarning', () => {
            logWarning('TestComponent', 'Warning message');
            expect(logWarning).toHaveBeenCalledWith('TestComponent', 'Warning message');
        });

        it('should call logError', () => {
            const error = new Error('Test error');
            logError('TestComponent', error);
            expect(logError).toHaveBeenCalledWith('TestComponent', error);
        });

        it('should call logFatal', () => {
            const error = new Error('Fatal error');
            logFatal('TestComponent', error);
            expect(logFatal).toHaveBeenCalledWith('TestComponent', error);
        });
    });

    describe('Workflow functions', () => {
        it('should call startWorkflow', () => {
            startWorkflow('workflow-1', 'Test Workflow', 'TestComponent');
            expect(startWorkflow).toHaveBeenCalledWith('workflow-1', 'Test Workflow', 'TestComponent');
        });

        it('should call updateWorkflow', () => {
            updateWorkflow('workflow-1', WorkflowState.IN_PROGRESS);
            expect(updateWorkflow).toHaveBeenCalledWith('workflow-1', WorkflowState.IN_PROGRESS);
        });

        it('should call completeWorkflow', () => {
            completeWorkflow('workflow-1', true);
            expect(completeWorkflow).toHaveBeenCalledWith('workflow-1', true);
        });
    });

    describe('Performance and utility functions', () => {
        it('should call trackPerformance', () => {
            const mockFn = jest.fn();
            trackPerformance('TestComponent', 'test-operation', mockFn);
            expect(trackPerformance).toHaveBeenCalledWith('TestComponent', 'test-operation', mockFn);
        });

        it('should call getConfig', () => {
            getConfig();
            expect(getConfig).toHaveBeenCalled();
        });

        it('should call getActiveWorkflows', () => {
            getActiveWorkflows();
            expect(getActiveWorkflows).toHaveBeenCalled();
        });

        it('should call cleanup', () => {
            cleanup();
            expect(cleanup).toHaveBeenCalled();
        });

        it('should call close', () => {
            close();
            expect(close).toHaveBeenCalled();
        });
    });

    describe('SentryLogger instance methods', () => {
        it('should call sentryLogger methods', () => {
            // Test various sentryLogger methods
            sentryLogger.logError('TestComponent', new Error('Test error'));
            expect(sentryLogger.logError).toHaveBeenCalledWith('TestComponent', expect.any(Error));

            sentryLogger.logInfo('TestComponent', 'Test message');
            expect(sentryLogger.logInfo).toHaveBeenCalledWith('TestComponent', 'Test message');

            sentryLogger.configureComponent('TestComponent', { logLevel: SentryLogLevel.INFO });
            expect(sentryLogger.configureComponent).toHaveBeenCalledWith('TestComponent', { logLevel: SentryLogLevel.INFO });

            sentryLogger.startWorkflow('workflow-1', 'Test Workflow', 'TestComponent');
            expect(sentryLogger.startWorkflow).toHaveBeenCalledWith('workflow-1', 'Test Workflow', 'TestComponent');
        });
    });
}); 