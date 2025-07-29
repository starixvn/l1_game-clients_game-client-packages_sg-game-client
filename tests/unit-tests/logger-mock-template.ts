// Logger Mock Template
// Copy this template into your test files to mock the enhanced logger

export const loggerMock = {
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
        initialize: jest.fn()
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
};

// Usage in test files:
// jest.mock("../../../src/shared/utils/logger", () => loggerMock); 