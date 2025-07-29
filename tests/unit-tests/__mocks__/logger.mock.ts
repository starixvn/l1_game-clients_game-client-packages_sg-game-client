// Comprehensive mock for the enhanced SentryLogger
// This mock provides all the new functionality while maintaining backward compatibility

export enum SentryLogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
    // Legacy levels for backward compatibility
    DISABLED = 'disabled',
    ERROR_ONLY = 'error_only',
    WARNING_AND_ERROR = 'warning_and_error',
    ALL = 'all'
}

export enum WorkflowState {
    STARTED = 'started',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface ComponentConfig {
    name: string;
    logLevel: SentryLogLevel;
    enableWorkflowTracking?: boolean;
    enablePerformanceTracking?: boolean;
}

export interface WorkflowConfig {
    id: string;
    name: string;
    component: string;
    logLevel: SentryLogLevel;
    enablePerformanceTracking?: boolean;
    metadata?: Record<string, any>;
}

export interface GlobalSentryConfig {
    enabled: boolean;
    defaultLogLevel: SentryLogLevel;
    enableWorkflowTracking: boolean;
    enablePerformanceTracking: boolean;
    enableConsoleOverride: boolean;
    componentConfigs: Map<string, ComponentConfig>;
    workflowConfigs: Map<string, WorkflowConfig>;
}

// Mock SentryLogger class
class MockSentryLogger {
    private globalConfig: GlobalSentryConfig = {
        enabled: true,
        defaultLogLevel: SentryLogLevel.INFO,
        enableWorkflowTracking: true,
        enablePerformanceTracking: true,
        enableConsoleOverride: true,
        componentConfigs: new Map(),
        workflowConfigs: new Map()
    };

    private activeWorkflows: Map<string, { config: WorkflowConfig; startTime: number; metadata: Record<string, any> }> = new Map();
    private isInitialized = false;
    private sentryUrl = "";
    private env = "";
    private identifier = "";
    private loaded = false;

    // Mock methods
    initialize = jest.fn((config?: Partial<GlobalSentryConfig>) => {
        this.isInitialized = true;
        if (config) {
            this.globalConfig = { ...this.globalConfig, ...config };
        }
    });

    start = jest.fn((sentryUrl = "", env = "", identifier = "") => {
        this.sentryUrl = sentryUrl;
        this.env = env;
        this.identifier = identifier;
        this.loaded = true;
    });

    setGlobalEnabled = jest.fn((enabled: boolean) => {
        this.globalConfig.enabled = enabled;
    });

    setDefaultLogLevel = jest.fn((level: SentryLogLevel) => {
        this.globalConfig.defaultLogLevel = level;
    });

    configureComponent = jest.fn((componentName: string, config: Partial<ComponentConfig>) => {
        const existingConfig = this.globalConfig.componentConfigs.get(componentName) || {
            name: componentName,
            logLevel: this.globalConfig.defaultLogLevel,
            enableWorkflowTracking: this.globalConfig.enableWorkflowTracking,
            enablePerformanceTracking: this.globalConfig.enablePerformanceTracking
        };

        this.globalConfig.componentConfigs.set(componentName, {
            ...existingConfig,
            ...config
        });
    });

    getComponentConfig = jest.fn((componentName: string): ComponentConfig | undefined => {
        return this.globalConfig.componentConfigs.get(componentName) || {
            name: componentName,
            logLevel: this.globalConfig.defaultLogLevel,
            enableWorkflowTracking: this.globalConfig.enableWorkflowTracking,
            enablePerformanceTracking: this.globalConfig.enablePerformanceTracking
        };
    });

    isLoggingEnabled = jest.fn((componentName: string, level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean => {
        if (!this.globalConfig.enabled) return false;

        const componentConfig = this.getComponentConfig(componentName);
        const componentLevel = componentConfig?.logLevel || this.globalConfig.defaultLogLevel;

        // Handle legacy levels
        if (componentLevel === SentryLogLevel.DISABLED) return false;
        if (componentLevel === SentryLogLevel.ERROR_ONLY) {
            return level === 'error' || level === 'fatal';
        }
        if (componentLevel === SentryLogLevel.WARNING_AND_ERROR) {
            return level === 'warn' || level === 'error' || level === 'fatal';
        }
        if (componentLevel === SentryLogLevel.ALL) return true;

        // Handle standard levels
        const levelHierarchy = {
            'trace': 0, 'debug': 1, 'info': 2, 'warn': 3, 'error': 4, 'fatal': 5
        };
        const componentLevelValue = levelHierarchy[componentLevel as keyof typeof levelHierarchy] ?? 2;
        const messageLevelValue = levelHierarchy[level];

        return messageLevelValue >= componentLevelValue;
    });

    logTrace = jest.fn((componentName: string, message: string, context?: Record<string, any>) => {
        if (this.isLoggingEnabled(componentName, 'trace')) {
            console.log(`[TRACE] [${componentName}] ${message}`, context);
        }
    });

    logDebug = jest.fn((componentName: string, message: string, context?: Record<string, any>) => {
        if (this.isLoggingEnabled(componentName, 'debug')) {
            console.log(`[DEBUG] [${componentName}] ${message}`, context);
        }
    });

    logInfo = jest.fn((componentName: string, message: string, context?: Record<string, any>) => {
        if (this.isLoggingEnabled(componentName, 'info')) {
            console.log(`[INFO] [${componentName}] ${message}`, context);
        }
    });

    logWarning = jest.fn((componentName: string, message: string, context?: Record<string, any>) => {
        if (this.isLoggingEnabled(componentName, 'warn')) {
            console.warn(`[WARN] [${componentName}] ${message}`, context);
        }
    });

    logError = jest.fn((componentName: string, error: Error | string, context?: Record<string, any>) => {
        if (this.isLoggingEnabled(componentName, 'error')) {
            console.error(`[ERROR] [${componentName}] ${error}`, context);
        }
    });

    logFatal = jest.fn((componentName: string, error: Error | string, context?: Record<string, any>) => {
        if (this.isLoggingEnabled(componentName, 'fatal')) {
            console.error(`[FATAL] [${componentName}] ${error}`, context);
        }
    });

    startWorkflow = jest.fn((workflowId: string, workflowName: string, componentName: string, metadata?: Record<string, any>) => {
        if (!this.globalConfig.enableWorkflowTracking) return;

        const componentConfig = this.getComponentConfig(componentName);
        if (!componentConfig?.enableWorkflowTracking) return;

        const workflowConfig: WorkflowConfig = {
            id: workflowId,
            name: workflowName,
            component: componentName,
            logLevel: componentConfig.logLevel,
            enablePerformanceTracking: componentConfig.enablePerformanceTracking,
            metadata
        };

        this.activeWorkflows.set(workflowId, {
            config: workflowConfig,
            startTime: Date.now(),
            metadata: metadata || {}
        });
    });

    updateWorkflow = jest.fn((workflowId: string, state: WorkflowState, metadata?: Record<string, any>) => {
        const workflow = this.activeWorkflows.get(workflowId);
        if (workflow && metadata) {
            workflow.metadata = { ...workflow.metadata, ...metadata };
        }
    });

    completeWorkflow = jest.fn((workflowId: string, success: boolean = true, metadata?: Record<string, any>) => {
        const workflow = this.activeWorkflows.get(workflowId);
        if (workflow) {
            if (metadata) {
                workflow.metadata = { ...workflow.metadata, ...metadata };
            }
            this.activeWorkflows.delete(workflowId);
        }
    });

    trackPerformance = jest.fn(async (componentName: string, operationName: string, operation: () => Promise<any> | any) => {
        if (!this.globalConfig.enablePerformanceTracking) {
            return await operation();
        }

        const componentConfig = this.getComponentConfig(componentName);
        if (!componentConfig?.enablePerformanceTracking) {
            return await operation();
        }

        const startTime = Date.now();
        try {
            const result = await operation();
            const duration = Date.now() - startTime;
            console.log(`[PERF] [${componentName}] ${operationName} completed in ${duration}ms`);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[PERF] [${componentName}] ${operationName} failed after ${duration}ms`, error);
            throw error;
        }
    });

    getConfig = jest.fn((): GlobalSentryConfig => {
        return { ...this.globalConfig };
    });

    getActiveWorkflows = jest.fn(() => {
        return new Map(this.activeWorkflows);
    });

    cleanup = jest.fn(() => {
        this.activeWorkflows.clear();
        this.globalConfig.componentConfigs.clear();
        this.globalConfig.workflowConfigs.clear();
    });

    close = jest.fn(() => {
        this.cleanup();
        this.isInitialized = false;
        this.loaded = false;
    });

    // Legacy methods for backward compatibility - using different names to avoid conflicts
    legacyLogInfo = jest.fn((message: string, context?: Record<string, any>) => {
        console.log(`[INFO] ${message}`, context);
    });

    legacyLogError = jest.fn((error: Error | string, context?: Record<string, any>) => {
        console.error(`[ERROR] ${error}`, context);
    });
}

// Create singleton instance
const mockSentryLogger = new MockSentryLogger();

// Export all the functions and classes
export const sentryLogger = mockSentryLogger;

// Export all the new functions
export const configureSentry = jest.fn((config?: Partial<GlobalSentryConfig>) => mockSentryLogger.initialize(config));
export const enableSentry = jest.fn(() => mockSentryLogger.setGlobalEnabled(true));
export const disableSentry = jest.fn(() => mockSentryLogger.setGlobalEnabled(false));
export const setLogLevel = jest.fn((level: SentryLogLevel) => mockSentryLogger.setDefaultLogLevel(level));
export const configureComponent = jest.fn((name: string, config: Partial<ComponentConfig>) => mockSentryLogger.configureComponent(name, config));
export const getComponentConfig = jest.fn((name: string) => mockSentryLogger.getComponentConfig(name));
export const isLoggingEnabled = jest.fn((componentName: string, level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') => mockSentryLogger.isLoggingEnabled(componentName, level));

// Logging methods
export const logTrace = jest.fn((componentName: string, message: string, context?: Record<string, any>) => mockSentryLogger.logTrace(componentName, message, context));
export const logDebug = jest.fn((componentName: string, message: string, context?: Record<string, any>) => mockSentryLogger.logDebug(componentName, message, context));
export const logInfo = jest.fn((componentName: string, message: string, context?: Record<string, any>) => mockSentryLogger.logInfo(componentName, message, context));
export const logWarning = jest.fn((componentName: string, message: string, context?: Record<string, any>) => mockSentryLogger.logWarning(componentName, message, context));
export const logError = jest.fn((componentName: string, error: Error | string, context?: Record<string, any>) => mockSentryLogger.logError(componentName, error, context));
export const logFatal = jest.fn((componentName: string, error: Error | string, context?: Record<string, any>) => mockSentryLogger.logFatal(componentName, error, context));

// Workflow methods
export const startWorkflow = jest.fn((id: string, name: string, component: string, metadata?: Record<string, any>) => mockSentryLogger.startWorkflow(id, name, component, metadata));
export const updateWorkflow = jest.fn((id: string, state: WorkflowState, metadata?: Record<string, any>) => mockSentryLogger.updateWorkflow(id, state, metadata));
export const completeWorkflow = jest.fn((id: string, success?: boolean, metadata?: Record<string, any>) => mockSentryLogger.completeWorkflow(id, success, metadata));
export const trackPerformance = jest.fn((component: string, operation: string, fn: () => Promise<any> | any) => mockSentryLogger.trackPerformance(component, operation, fn));

// Utility methods
export const getConfig = jest.fn(() => mockSentryLogger.getConfig());
export const getActiveWorkflows = jest.fn(() => mockSentryLogger.getActiveWorkflows());
export const cleanup = jest.fn(() => mockSentryLogger.cleanup());
export const close = jest.fn(() => mockSentryLogger.close());

// Export the mock instance for direct access in tests
export { mockSentryLogger }; 