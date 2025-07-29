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
    close,
    resetLogger
} from '../../../src/shared/utils/logger';

// Mock global Sentry
const mockSentry = {
    init: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    captureMessage: jest.fn(),
    captureException: jest.fn()
};

// Mock globalThis.Sentry
Object.defineProperty(globalThis, 'Sentry', {
    value: mockSentry,
    writable: true
});

// Mock document for browser environment
const mockDocument = {
    createElement: jest.fn(() => ({
        setAttribute: jest.fn(),
        onload: jest.fn()
    })),
    head: {
        appendChild: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true
});

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    log: jest.fn()
};

Object.defineProperty(global, 'console', {
    value: mockConsole,
    writable: true
});

describe('SentryLogger', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset logger instance
        resetLogger();

        // Reset console
        Object.defineProperty(global, 'console', {
            value: originalConsole,
            writable: true
        });
    });

    afterEach(() => {
        cleanup();
    });

    describe('Initialization and Configuration', () => {
        it('should initialize with default configuration', () => {
            // Arrange
            const logger = sentryLogger;

            // Act
            configureSentry();

            // Assert
            const config = getConfig();
            expect(config.enabled).toBe(true);
            expect(config.defaultLogLevel).toBe(SentryLogLevel.INFO);
            expect(config.enableWorkflowTracking).toBe(true);
            expect(config.enablePerformanceTracking).toBe(true);
            expect(config.enableConsoleOverride).toBe(true);
        });

        it('should initialize with custom configuration', () => {
            // Arrange
            const customConfig = {
                enabled: false,
                defaultLogLevel: SentryLogLevel.ERROR,
                enableWorkflowTracking: false,
                enablePerformanceTracking: false,
                enableConsoleOverride: false
            };

            // Act
            configureSentry(customConfig);

            // Assert
            const config = getConfig();
            expect(config.enabled).toBe(false);
            expect(config.defaultLogLevel).toBe(SentryLogLevel.ERROR);
            expect(config.enableWorkflowTracking).toBe(false);
            expect(config.enablePerformanceTracking).toBe(false);
            expect(config.enableConsoleOverride).toBe(false);
        });

        it('should enable and disable Sentry globally', () => {
            // Arrange
            configureSentry({ enabled: false });

            // Act
            enableSentry();

            // Assert
            expect(getConfig().enabled).toBe(true);

            // Act
            disableSentry();

            // Assert
            expect(getConfig().enabled).toBe(false);
        });

        it('should set default log level', () => {
            // Arrange
            configureSentry();

            // Act
            setLogLevel(SentryLogLevel.DEBUG);

            // Assert
            expect(getConfig().defaultLogLevel).toBe(SentryLogLevel.DEBUG);
        });
    });

    describe('Component Configuration', () => {
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
            const componentConfig = getComponentConfig('TestComponent');
            expect(componentConfig).toBeDefined();
            expect(componentConfig?.name).toBe('TestComponent');
            expect(componentConfig?.logLevel).toBe(SentryLogLevel.DEBUG);
            expect(componentConfig?.enableWorkflowTracking).toBe(true);
            expect(componentConfig?.enablePerformanceTracking).toBe(false);
        });

        it('should use default configuration for component when not specified', () => {
            // Arrange
            configureSentry({ defaultLogLevel: SentryLogLevel.WARN });

            // Act
            configureComponent('TestComponent', {});

            // Assert
            const componentConfig = getComponentConfig('TestComponent');
            expect(componentConfig?.logLevel).toBe(SentryLogLevel.WARN);
            expect(componentConfig?.enableWorkflowTracking).toBe(true);
            expect(componentConfig?.enablePerformanceTracking).toBe(true);
        });
    });

    describe('Log Level Hierarchy', () => {
        beforeEach(() => {
            configureSentry({ enabled: true });
        });

        it('should enable logging for TRACE level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.TRACE });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should enable logging for DEBUG level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.DEBUG });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should enable logging for INFO level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.INFO });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should enable logging for WARN level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.WARN });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should enable logging for ERROR level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.ERROR });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should enable logging for FATAL level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.FATAL });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should disable all logging for DISABLED level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.DISABLED });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(false);
        });

        it('should handle legacy ERROR_ONLY level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.ERROR_ONLY });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should handle legacy WARNING_AND_ERROR level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.WARNING_AND_ERROR });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(false);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });

        it('should handle legacy ALL level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.ALL });

            // Assert
            expect(isLoggingEnabled('TestComponent', 'trace')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'debug')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'info')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'warn')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'error')).toBe(true);
            expect(isLoggingEnabled('TestComponent', 'fatal')).toBe(true);
        });
    });

    describe('Logging Methods', () => {
        beforeEach(() => {
            configureSentry({ enabled: true });
            configureComponent('TestComponent', { logLevel: SentryLogLevel.TRACE });
            sentryLogger.start('test-dsn', 'test-env', 'test-identifier');
        });

        it('should log TRACE messages when enabled', () => {
            // Arrange
            const message = 'Trace message';
            const context = { userId: '123', action: 'test' };

            // Act
            logTrace('TestComponent', message, context);

            // Assert
            expect(mockSentry.setExtra).toHaveBeenCalledWith('context', context);
            expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockSentry.setTag).toHaveBeenCalledWith('logLevel', 'trace');
            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                '[test-identifier] [TestComponent] Trace message',
                'trace'
            );
        });

        it('should log DEBUG messages when enabled', () => {
            // Arrange
            const message = 'Debug message';
            const context = { debugInfo: 'test' };

            // Act
            logDebug('TestComponent', message, context);

            // Assert
            expect(mockSentry.setExtra).toHaveBeenCalledWith('context', context);
            expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockSentry.setTag).toHaveBeenCalledWith('logLevel', 'debug');
            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                '[test-identifier] [TestComponent] Debug message',
                'debug'
            );
        });

        it('should log INFO messages when enabled', () => {
            // Arrange
            const message = 'Info message';

            // Act
            logInfo('TestComponent', message);

            // Assert
            expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockSentry.setTag).toHaveBeenCalledWith('logLevel', 'info');
            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                '[test-identifier] [TestComponent] Info message',
                'info'
            );
        });

        it('should log WARNING messages when enabled', () => {
            // Arrange
            const message = 'Warning message';

            // Act
            logWarning('TestComponent', message);

            // Assert
            expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockSentry.setTag).toHaveBeenCalledWith('logLevel', 'warning');
            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                '[test-identifier] [TestComponent] Warning message',
                'warning'
            );
        });

        it('should log ERROR messages when enabled', () => {
            // Arrange
            const error = new Error('Test error');
            const context = { errorCode: 'TEST_001' };

            // Act
            logError('TestComponent', error, context);

            // Assert
            expect(mockSentry.setExtra).toHaveBeenCalledWith('context', context);
            expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockSentry.setTag).toHaveBeenCalledWith('logLevel', 'error');
            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                '[test-identifier] [TestComponent] Test error',
                'error'
            );
        });

        it('should log FATAL messages when enabled', () => {
            // Arrange
            const error = new Error('Fatal error');
            const context = { critical: true };

            // Act
            logFatal('TestComponent', error, context);

            // Assert
            expect(mockSentry.setExtra).toHaveBeenCalledWith('context', context);
            expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'TestComponent');
            expect(mockSentry.setTag).toHaveBeenCalledWith('logLevel', 'fatal');
            expect(mockSentry.captureMessage).toHaveBeenCalledWith(
                '[test-identifier] [TestComponent] Fatal error',
                'fatal'
            );
        });

        it('should not log when component level is higher than message level', () => {
            // Arrange
            configureComponent('TestComponent', { logLevel: SentryLogLevel.ERROR });

            // Act
            logTrace('TestComponent', 'Trace message');
            logDebug('TestComponent', 'Debug message');
            logInfo('TestComponent', 'Info message');
            logWarning('TestComponent', 'Warning message');

            // Assert
            expect(mockSentry.captureMessage).not.toHaveBeenCalled();
        });

        it('should not log when Sentry is disabled', () => {
            // Arrange
            disableSentry();

            // Act
            logError('TestComponent', 'Error message');

            // Assert
            expect(mockSentry.captureMessage).not.toHaveBeenCalled();
        });
    });

    describe('Workflow Tracking', () => {
        beforeEach(() => {
            configureSentry({ enabled: true, enableWorkflowTracking: true });
            configureComponent('TestComponent', { logLevel: SentryLogLevel.INFO });
        });

        it('should start workflow tracking', () => {
            // Arrange
            const workflowId = 'test-workflow-123';
            const workflowName = 'Test Workflow';
            const metadata = { userId: '123', action: 'test' };

            // Act
            startWorkflow(workflowId, workflowName, 'TestComponent', metadata);

            // Assert
            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.has(workflowId)).toBe(true);

            const workflow = activeWorkflows.get(workflowId);
            expect(workflow?.config.name).toBe(workflowName);
            expect(workflow?.config.component).toBe('TestComponent');
            expect(workflow?.metadata).toEqual(metadata);
        });

        it('should update workflow state', () => {
            // Arrange
            const workflowId = 'test-workflow-123';
            startWorkflow(workflowId, 'Test Workflow', 'TestComponent');

            // Act
            updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, { step: 'processing' });

            // Assert
            const activeWorkflows = getActiveWorkflows();
            const workflow = activeWorkflows.get(workflowId);
            expect(workflow?.metadata.step).toBe('processing');
        });

        it('should complete workflow successfully', () => {
            // Arrange
            const workflowId = 'test-workflow-123';
            startWorkflow(workflowId, 'Test Workflow', 'TestComponent');

            // Act
            completeWorkflow(workflowId, true, { result: 'success' });

            // Assert
            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.has(workflowId)).toBe(false);
        });

        it('should complete workflow with failure', () => {
            // Arrange
            const workflowId = 'test-workflow-123';
            startWorkflow(workflowId, 'Test Workflow', 'TestComponent');

            // Act
            completeWorkflow(workflowId, false, { error: 'test error' });

            // Assert
            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.has(workflowId)).toBe(false);
        });

        it('should not track workflows when disabled', () => {
            // Arrange
            configureSentry({ enableWorkflowTracking: false });

            // Act
            startWorkflow('test-workflow', 'Test Workflow', 'TestComponent');

            // Assert
            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.size).toBe(0);
        });
    });

    describe('Performance Tracking', () => {
        beforeEach(() => {
            configureSentry({ enabled: true, enablePerformanceTracking: true });
            configureComponent('TestComponent', { logLevel: SentryLogLevel.INFO });
        });

        it('should track performance of successful operation', async () => {
            // Arrange
            const operation = jest.fn().mockResolvedValue('success');

            // Act
            const result = await trackPerformance('TestComponent', 'Test Operation', operation);

            // Assert
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalled();

            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.size).toBe(0); // Should be cleaned up after completion
        });

        it('should track performance of failed operation', async () => {
            // Arrange
            const error = new Error('Operation failed');
            const operation = jest.fn().mockRejectedValue(error);

            // Act & Assert
            await expect(trackPerformance('TestComponent', 'Test Operation', operation))
                .rejects.toThrow('Operation failed');

            expect(operation).toHaveBeenCalled();

            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.size).toBe(0); // Should be cleaned up after completion
        });

        it('should not track performance when disabled', async () => {
            // Arrange
            configureSentry({ enablePerformanceTracking: false });
            const operation = jest.fn().mockResolvedValue('success');

            // Act
            const result = await trackPerformance('TestComponent', 'Test Operation', operation);

            // Assert
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalled();

            const activeWorkflows = getActiveWorkflows();
            expect(activeWorkflows.size).toBe(0); // No workflow should be created
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle undefined component configuration gracefully', () => {
            // Arrange
            configureSentry({ enabled: true });

            // Act
            const isEnabled = isLoggingEnabled('NonExistentComponent', 'info');

            // Assert
            expect(isEnabled).toBe(true); // Should use default log level
        });

        it('should handle multiple initializations gracefully', () => {
            // Arrange
            configureSentry({ enabled: true });

            // Act
            configureSentry({ enabled: false });

            // Assert
            const config = getConfig();
            expect(config.enabled).toBe(true); // Should not change after first initialization
        });

        it('should handle workflow operations on non-existent workflow', () => {
            // Arrange
            configureSentry({ enabled: true, enableWorkflowTracking: true });

            // Act
            updateWorkflow('non-existent', WorkflowState.IN_PROGRESS);
            completeWorkflow('non-existent', true);

            // Assert
            // Should not throw errors
            expect(true).toBe(true);
        });

        it('should handle cleanup when no workflows exist', () => {
            // Arrange
            configureSentry({ enabled: true });

            // Act
            cleanup();

            // Assert
            const config = getConfig();
            expect(config.componentConfigs.size).toBe(0);
            expect(config.workflowConfigs.size).toBe(0);
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete logging workflow', () => {
            // Arrange
            configureSentry({
                enabled: true,
                defaultLogLevel: SentryLogLevel.INFO,
                enableWorkflowTracking: true,
                enablePerformanceTracking: true
            });

            configureComponent('GameEngine', { logLevel: SentryLogLevel.DEBUG });
            configureComponent('UserInterface', { logLevel: SentryLogLevel.WARN });

            sentryLogger.start('test-dsn', 'test-env', 'test-identifier');

            // Act
            logDebug('GameEngine', 'Game engine initialized');
            logWarning('UserInterface', 'User balance is low', { balance: 10 });

            const workflowId = 'game-session-123';
            startWorkflow(workflowId, 'Game Session', 'GameEngine', { userId: '123' });
            updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, { step: 'loading' });
            completeWorkflow(workflowId, true, { duration: '1000ms' });

            // Assert
            expect(mockSentry.captureMessage).toHaveBeenCalledTimes(4); // 2 logs + 2 workflow events
            expect(getActiveWorkflows().size).toBe(0);
        });

        it('should handle environment-specific configuration', () => {
            // Arrange
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            // Act
            configureSentry({ enabled: true });
            sentryLogger.start('test-dsn', 'development', 'test-identifier');

            // Assert
            expect(mockSentry.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    debug: true,
                    environment: 'development'
                })
            );

            // Cleanup
            process.env.NODE_ENV = originalEnv;
        });
    });
}); 