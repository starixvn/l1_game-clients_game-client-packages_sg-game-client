import { ignoreErrors } from "../constants/ignore-errors";

declare global {
    interface Window {
        Sentry: any;
    }
}

// Standard Sentry log levels as per Sentry documentation
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

// Workflow tracking states
export enum WorkflowState {
    STARTED = 'started',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

// Component tracking configuration
export interface ComponentConfig {
    name: string;
    logLevel: SentryLogLevel;
    enableWorkflowTracking?: boolean;
    enablePerformanceTracking?: boolean;
}

// Workflow tracking configuration
export interface WorkflowConfig {
    id: string;
    name: string;
    component: string;
    logLevel: SentryLogLevel;
    enablePerformanceTracking?: boolean;
    metadata?: Record<string, any>;
}

// Global Sentry configuration
export interface GlobalSentryConfig {
    enabled: boolean;
    defaultLogLevel: SentryLogLevel;
    enableWorkflowTracking: boolean;
    enablePerformanceTracking: boolean;
    enableConsoleOverride: boolean;
    componentConfigs: Map<string, ComponentConfig>;
    workflowConfigs: Map<string, WorkflowConfig>;
}

// Sentry initialization configuration
interface SentryInitConfig {
    dsn: string;
    environment: string;
    componentName: string;
    release?: string;
    debug?: boolean;
    maxValueLength?: number;
    ignoreErrors?: Array<string | RegExp>;
}

class SentryLogger {
    private static instance: SentryLogger | null = null;

    private globalConfig: GlobalSentryConfig;
    private activeWorkflows: Map<string, { config: WorkflowConfig; startTime: number; metadata: Record<string, any> }>;
    private componentConfigs: Map<string, ComponentConfig>;
    private isInitialized = false;
    private sentryUrl = "";
    private env = "";
    private identifier = "";
    private loaded = false;
    private originalConsoleError: typeof console.error;
    private originalConsoleWarn: typeof console.warn;
    private originalConsoleInfo: typeof console.info;
    private originalConsoleDebug: typeof console.debug;
    private originalConsoleTrace: typeof console.trace;

    private constructor() {
        this.globalConfig = {
            enabled: true,
            defaultLogLevel: SentryLogLevel.INFO,
            enableWorkflowTracking: true,
            enablePerformanceTracking: true,
            enableConsoleOverride: true,
            componentConfigs: new Map(),
            workflowConfigs: new Map()
        };
        this.activeWorkflows = new Map();
        this.componentConfigs = new Map();
        this.originalConsoleError = console.error;
        this.originalConsoleWarn = console.warn;
        this.originalConsoleInfo = console.info;
        this.originalConsoleDebug = console.debug;
        this.originalConsoleTrace = console.trace;
    }

    static getInstance(): SentryLogger {
        if (!SentryLogger.instance) {
            SentryLogger.instance = new SentryLogger();
            // Initialize with default config
            SentryLogger.instance.initialize();
        }
        return SentryLogger.instance;
    }

    // Reset instance for testing - completely new instance
    static resetInstance(): void {
        if (SentryLogger.instance) {
            SentryLogger.instance.cleanup();
        }
        SentryLogger.instance = null;
    }

    // Initialize the SentryLogger with global configuration
    initialize(config?: Partial<GlobalSentryConfig>): void {
        // Merge provided config with defaults
        if (config) {
            this.globalConfig = { ...this.globalConfig, ...config };
        }

        this.isInitialized = true;
        console.log('SentryLogger initialized with config:', this.globalConfig);
    }

    // Check if Sentry is enabled and ready
    isEnabled(): boolean {
        if (typeof document !== "undefined") {
            return this.globalConfig.enabled && this.sentryUrl && !!document?.head;
        }
        return this.globalConfig.enabled;
    }

    // Load Sentry script and initialize
    loadScript(): void {
        if (globalThis.Sentry && !this.loaded) {
            globalThis.Sentry.init({
                dsn: this.sentryUrl,
                environment: this.env,
                maxValueLength: 5000,
                ignoreErrors,
                debug: process.env.NODE_ENV === 'development',
                release: process.env.TAG_VERSION || process.env.npm_package_version,
                // Performance monitoring
                tracesSampleRate: 0.1,
                // Error sampling
                sampleRate: 1.0,
                // Before send hook for filtering
                beforeSend(event: any, hint: any) {
                    // Add component context
                    event.tags = {
                        ...event.tags,
                        component: 'SG-Game-Client',
                        version: process.env.TAG_VERSION || process.env.npm_package_version || 'unknown'
                    };
                    return event;
                }
            });
            globalThis.Sentry.setTag("game-client", this.identifier);

            this.loaded = true;

            // Override console methods if enabled
            if (this.globalConfig.enableConsoleOverride) {
                this.overrideConsoleMethods();
            }
        }
    }

    // Start Sentry with configuration
    start(sentryUrl = "", env = "", identifier = ""): void {
        try {
            if (!sentryUrl) {
                return;
            }
            this.sentryUrl = sentryUrl;
            this.env = env;
            this.identifier = identifier;

            if (typeof document !== "undefined") {
                const sentryScript = document?.createElement("script");
                if (sentryScript) {
                    sentryScript.setAttribute("id", "sentry-logger");
                    sentryScript.src = "https://browser.sentry-cdn.com/7.0.0/bundle.min.js";
                    sentryScript.integrity = "sha384-...";
                    sentryScript.crossOrigin = "anonymous";
                    sentryScript.onload = () => {
                        this.loadScript();
                    };
                    document.head.appendChild(sentryScript);
                }
            }
        } catch (error) {
            console.error('Failed to start Sentry:', error);
        }
    }

    setGlobalEnabled(enabled: boolean): void {
        this.globalConfig.enabled = enabled;
    }

    setDefaultLogLevel(level: SentryLogLevel): void {
        this.globalConfig.defaultLogLevel = level;
    }

    configureComponent(componentName: string, config: Partial<ComponentConfig>): void {
        const existingConfig = this.componentConfigs.get(componentName) || {
            name: componentName,
            logLevel: this.globalConfig.defaultLogLevel,
            enableWorkflowTracking: this.globalConfig.enableWorkflowTracking,
            enablePerformanceTracking: this.globalConfig.enablePerformanceTracking
        };

        this.componentConfigs.set(componentName, { ...existingConfig, ...config });
    }

    getComponentConfig(componentName: string): ComponentConfig | undefined {
        return this.componentConfigs.get(componentName);
    }

    isLoggingEnabled(componentName: string, level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean {
        if (!this.globalConfig || !this.globalConfig.enabled) return false;

        const componentConfig = this.getComponentConfig(componentName);
        const logLevel = componentConfig?.logLevel || this.globalConfig.defaultLogLevel || SentryLogLevel.INFO;

        // Define level hierarchy (higher number = more important)
        const levelHierarchy = {
            'trace': 0,
            'debug': 1,
            'info': 2,
            'warn': 3,
            'error': 4,
            'fatal': 5
        };

        switch (logLevel) {
            case SentryLogLevel.DISABLED:
                return false;
            case SentryLogLevel.TRACE:
                return levelHierarchy[level] >= levelHierarchy['trace'];
            case SentryLogLevel.DEBUG:
                return levelHierarchy[level] >= levelHierarchy['debug'];
            case SentryLogLevel.INFO:
                return levelHierarchy[level] >= levelHierarchy['info'];
            case SentryLogLevel.WARN:
                return levelHierarchy[level] >= levelHierarchy['warn'];
            case SentryLogLevel.ERROR:
                return levelHierarchy[level] >= levelHierarchy['error'];
            case SentryLogLevel.FATAL:
                return levelHierarchy[level] >= levelHierarchy['fatal'];
            // Legacy levels for backward compatibility
            case SentryLogLevel.ERROR_ONLY:
                return level === 'error' || level === 'fatal';
            case SentryLogLevel.WARNING_AND_ERROR:
                return level === 'warn' || level === 'error' || level === 'fatal';
            case SentryLogLevel.ALL:
                return true;
            default:
                return false;
        }
    }

    // Logging methods for all levels
    logTrace(componentName: string, message: string, context?: Record<string, any>): void {
        if (!this.isLoggingEnabled(componentName, 'trace')) return;
        this.captureMessage(componentName, message, 'trace', context);
    }

    logDebug(componentName: string, message: string, context?: Record<string, any>): void {
        if (!this.isLoggingEnabled(componentName, 'debug')) return;
        this.captureMessage(componentName, message, 'debug', context);
    }

    logInfo(componentName: string, message: string, context?: Record<string, any>): void {
        if (!this.isLoggingEnabled(componentName, 'info')) return;
        this.captureMessage(componentName, message, 'info', context);
    }

    logWarning(componentName: string, message: string, context?: Record<string, any>): void {
        if (!this.isLoggingEnabled(componentName, 'warn')) return;
        this.captureMessage(componentName, message, 'warning', context);
    }

    logError(componentName: string, error: Error | string, context?: Record<string, any>): void {
        if (!this.isLoggingEnabled(componentName, 'error')) return;
        this.captureError(componentName, error, context);
    }

    logFatal(componentName: string, error: Error | string, context?: Record<string, any>): void {
        if (!this.isLoggingEnabled(componentName, 'fatal')) return;
        this.captureError(componentName, error, context, 'fatal');
    }

    // Workflow tracking methods
    startWorkflow(workflowId: string, workflowName: string, componentName: string, metadata?: Record<string, any>): void {
        if (!this.globalConfig || !this.globalConfig.enableWorkflowTracking) return;

        const workflowConfig: WorkflowConfig = {
            id: workflowId,
            name: workflowName,
            component: componentName,
            logLevel: this.getComponentConfig(componentName)?.logLevel || this.globalConfig.defaultLogLevel || SentryLogLevel.INFO,
            enablePerformanceTracking: this.globalConfig.enablePerformanceTracking || false,
            metadata
        };

        this.globalConfig.workflowConfigs.set(workflowId, workflowConfig);
        this.activeWorkflows.set(workflowId, {
            config: workflowConfig,
            startTime: performance.now(),
            metadata: metadata || {}
        });

        this.logInfo(componentName, `Workflow started: ${workflowName}`, {
            workflowId,
            workflowName,
            state: WorkflowState.STARTED,
            metadata
        });
    }

    updateWorkflow(workflowId: string, state: WorkflowState, metadata?: Record<string, any>): void {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            console.warn(`Workflow ${workflowId} not found for update`);
            return;
        }

        const { config } = workflow;
        const updatedMetadata = { ...workflow.metadata, ...metadata };

        this.activeWorkflows.set(workflowId, {
            ...workflow,
            metadata: updatedMetadata
        });

        this.logInfo(config.component, `Workflow updated: ${config.name}`, {
            workflowId,
            workflowName: config.name,
            state,
            metadata: updatedMetadata
        });
    }

    completeWorkflow(workflowId: string, success: boolean = true, metadata?: Record<string, any>): void {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) {
            console.warn(`Workflow ${workflowId} not found for completion`);
            return;
        }

        const { config } = workflow;
        const finalMetadata = { ...workflow.metadata, ...metadata };
        const duration = performance.now() - workflow.startTime;

        this.activeWorkflows.delete(workflowId);
        this.globalConfig.workflowConfigs.delete(workflowId);

        const state = success ? WorkflowState.COMPLETED : WorkflowState.FAILED;
        this.logInfo(config.component, `Workflow completed: ${config.name}`, {
            workflowId,
            workflowName: config.name,
            state,
            duration,
            success,
            metadata: finalMetadata
        });
    }

    trackPerformance(componentName: string, operationName: string, operation: () => Promise<any> | any): Promise<any> {
        if (!this.globalConfig || !this.globalConfig.enablePerformanceTracking) {
            return Promise.resolve(operation());
        }

        const startTime = performance.now();
        const executeOperation = async () => {
            try {
                const result = await operation();
                const duration = performance.now() - startTime;
                this.logInfo(componentName, `Performance tracked: ${operationName}`, {
                    operationName,
                    duration,
                    success: true
                });
                return result;
            } catch (error) {
                const duration = performance.now() - startTime;
                this.logError(componentName, `Performance tracked: ${operationName} failed`, {
                    operationName,
                    duration,
                    success: false,
                    error
                });
                throw error;
            }
        };

        return executeOperation();
    }

    private captureMessage(componentName: string, message: string, level: string, context?: Record<string, any>): void {
        if (!this.isEnabled() || !globalThis.Sentry) return;

        globalThis.Sentry.setExtra('component', componentName);
        globalThis.Sentry.setExtra('context', context);
        globalThis.Sentry.setTag('component', componentName);
        globalThis.Sentry.setTag('logLevel', level);
        globalThis.Sentry.captureMessage(`[${this.identifier}] [${componentName}] ${message}`, level);
    }

    private captureError(componentName: string, error: Error | string, context?: Record<string, any>, level: string = 'error'): void {
        if (!this.isEnabled() || !globalThis.Sentry) return;

        globalThis.Sentry.setExtra('component', componentName);
        globalThis.Sentry.setExtra('context', context);
        globalThis.Sentry.setTag('component', componentName);
        globalThis.Sentry.setTag('logLevel', level);

        if (typeof error === 'string') {
            globalThis.Sentry.captureMessage(`[${this.identifier}] [${componentName}] ${error}`, level);
        } else {
            globalThis.Sentry.captureException(error);
        }
    }

    private overrideConsoleMethods(): void {
        // Override console.trace
        console.trace = (...args: any[]) => {
            this.originalConsoleTrace(...args);
            if (this.isEnabled()) {
                const message = args.map(arg => typeof arg === 'string' ? arg : arg?.message || String(arg)).join(' ');
                this.captureMessage('Console', message, 'trace');
            }
        };

        // Override console.debug
        console.debug = (...args: any[]) => {
            this.originalConsoleDebug(...args);
            if (this.isEnabled()) {
                const message = args.map(arg => typeof arg === 'string' ? arg : arg?.message || String(arg)).join(' ');
                this.captureMessage('Console', message, 'debug');
            }
        };

        // Override console.info
        console.info = (...args: any[]) => {
            this.originalConsoleInfo(...args);
            if (this.isEnabled()) {
                const message = args.map(arg => typeof arg === 'string' ? arg : arg?.message || String(arg)).join(' ');
                this.captureMessage('Console', message, 'info');
            }
        };

        // Override console.warn
        console.warn = (...args: any[]) => {
            this.originalConsoleWarn(...args);
            if (this.isEnabled()) {
                const message = args.map(arg => typeof arg === 'string' ? arg : arg?.message || String(arg)).join(' ');
                this.captureMessage('Console', message, 'warning');
            }
        };

        // Override console.error
        console.error = (...args: any[]) => {
            this.originalConsoleError(...args);
            if (this.isEnabled()) {
                const message = args.map(arg => typeof arg === 'string' ? arg : arg?.message || String(arg)).join(' ');
                this.captureError('Console', message);
            }
        };
    }

    // Get current configuration
    getConfig(): GlobalSentryConfig {
        if (!this.globalConfig) {
            return {
                enabled: true,
                defaultLogLevel: SentryLogLevel.INFO,
                enableWorkflowTracking: true,
                enablePerformanceTracking: true,
                enableConsoleOverride: true,
                componentConfigs: new Map(),
                workflowConfigs: new Map()
            };
        }
        return { ...this.globalConfig };
    }

    // Get active workflows
    getActiveWorkflows(): Map<string, { config: WorkflowConfig; startTime: number; metadata: Record<string, any> }> {
        return new Map(this.activeWorkflows || new Map());
    }

    // Cleanup
    cleanup(): void {
        if (this.activeWorkflows) {
            this.activeWorkflows.clear();
        }
        if (this.componentConfigs) {
            this.componentConfigs.clear();
        }
        if (this.globalConfig) {
            if (this.globalConfig.componentConfigs) {
                this.globalConfig.componentConfigs.clear();
            }
            if (this.globalConfig.workflowConfigs) {
                this.globalConfig.workflowConfigs.clear();
            }
        }
        this.isInitialized = false;
        console.log('SentryLogger cleaned up');
    }

    // Close Sentry
    close(): void {
        if (this.isInitialized) {
            // Restore original console methods
            console.error = this.originalConsoleError;
            console.warn = this.originalConsoleWarn;
            console.info = this.originalConsoleInfo;
            console.debug = this.originalConsoleDebug;
            console.trace = this.originalConsoleTrace;

            this.isInitialized = false;
            console.log(`SentryLogger closed for component: ${this.identifier}`);
        }
    }
}

// Export singleton instance
export const sentryLogger = SentryLogger.getInstance();

// Export convenience functions for easy usage
export const configureSentry = (config?: Partial<GlobalSentryConfig>) => sentryLogger.initialize(config);
export const enableSentry = () => sentryLogger.setGlobalEnabled(true);
export const disableSentry = () => sentryLogger.setGlobalEnabled(false);
export const setLogLevel = (level: SentryLogLevel) => sentryLogger.setDefaultLogLevel(level);
export const configureComponent = (name: string, config: Partial<ComponentConfig>) => sentryLogger.configureComponent(name, config);

// Export workflow convenience functions
export const startWorkflow = (id: string, name: string, component: string, metadata?: Record<string, any>) =>
    sentryLogger.startWorkflow(id, name, component, metadata);
export const updateWorkflow = (id: string, state: WorkflowState, metadata?: Record<string, any>) =>
    sentryLogger.updateWorkflow(id, state, metadata);
export const completeWorkflow = (id: string, success?: boolean, metadata?: Record<string, any>) =>
    sentryLogger.completeWorkflow(id, success, metadata);
export const trackPerformance = (component: string, operation: string, fn: () => Promise<any> | any) =>
    sentryLogger.trackPerformance(component, operation, fn);

// Export all log level methods for convenience
export const logTrace = (componentName: string, message: string, context?: Record<string, any>) => sentryLogger.logTrace(componentName, message, context);
export const logDebug = (componentName: string, message: string, context?: Record<string, any>) => sentryLogger.logDebug(componentName, message, context);
export const logInfo = (componentName: string, message: string, context?: Record<string, any>) => sentryLogger.logInfo(componentName, message, context);
export const logWarning = (componentName: string, message: string, context?: Record<string, any>) => sentryLogger.logWarning(componentName, message, context);
export const logError = (componentName: string, error: Error | string, context?: Record<string, any>) => sentryLogger.logError(componentName, error, context);
export const logFatal = (componentName: string, error: Error | string, context?: Record<string, any>) => sentryLogger.logFatal(componentName, error, context);
export const isLoggingEnabled = (componentName: string, level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal') => sentryLogger.isLoggingEnabled(componentName, level);
export const getComponentConfig = (componentName: string) => sentryLogger.getComponentConfig(componentName);
export const getConfig = () => sentryLogger.getConfig();
export const getActiveWorkflows = () => sentryLogger.getActiveWorkflows();
export const cleanup = () => sentryLogger.cleanup();
export const close = () => sentryLogger.close();

export const resetLogger = () => SentryLogger.resetInstance();

export default SentryLogger;
