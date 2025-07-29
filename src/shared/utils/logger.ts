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
    private static instance: SentryLogger;
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
        }
        return SentryLogger.instance;
    }

    // Initialize the SentryLogger with global configuration
    initialize(config?: Partial<GlobalSentryConfig>): void {
        if (this.isInitialized) {
            console.warn('SentryLogger already initialized');
            return;
        }

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
                    sentryScript.setAttribute("src", "https://browser.sentry-cdn.com/7.0.0/bundle.min.js");
                    sentryScript.setAttribute("integrity", "sha384-7QvYdSWJ9VGhc7ZbzBEjSAHojwxpAgPyMvU3zHnHlN4u7hhTf/ot2W09f6JxL5Drg");
                    sentryScript.setAttribute("crossorigin", "anonymous");
                    sentryScript.onload = () => {
                        this.loadScript();
                    };
                }
                document?.head.appendChild(sentryScript);
            }
        } catch (err) {
            console.log(err);
        }
    }

    // Global enable/disable
    setGlobalEnabled(enabled: boolean): void {
        this.globalConfig.enabled = enabled;
        console.log(`SentryLogger global logging ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Set default log level for all components
    setDefaultLogLevel(level: SentryLogLevel): void {
        this.globalConfig.defaultLogLevel = level;
        console.log(`SentryLogger default log level set to: ${level}`);
    }

    // Component-specific configuration
    configureComponent(componentName: string, config: Partial<ComponentConfig>): void {
        const defaultConfig: ComponentConfig = {
            name: componentName,
            logLevel: this.globalConfig.defaultLogLevel,
            enableWorkflowTracking: this.globalConfig.enableWorkflowTracking,
            enablePerformanceTracking: this.globalConfig.enablePerformanceTracking
        };

        const finalConfig = { ...defaultConfig, ...config };
        this.componentConfigs.set(componentName, finalConfig);
        console.log(`Component '${componentName}' configured:`, finalConfig);
    }

    // Get component configuration
    getComponentConfig(componentName: string): ComponentConfig | undefined {
        return this.componentConfigs.get(componentName);
    }

    // Check if logging is enabled for a component and level
    isLoggingEnabled(componentName: string, level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean {
        if (!this.globalConfig.enabled) return false;

        const componentConfig = this.getComponentConfig(componentName);
        const logLevel = componentConfig?.logLevel || this.globalConfig.defaultLogLevel;

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
        if (!this.globalConfig.enableWorkflowTracking) return;

        const workflowConfig: WorkflowConfig = {
            id: workflowId,
            name: workflowName,
            component: componentName,
            logLevel: this.getComponentConfig(componentName)?.logLevel || this.globalConfig.defaultLogLevel,
            enablePerformanceTracking: this.globalConfig.enablePerformanceTracking,
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
        if (!workflow) return;

        const { config } = workflow;
        const componentName = config.component;

        // Update metadata
        if (metadata) {
            workflow.metadata = { ...workflow.metadata, ...metadata };
        }

        // Log workflow update
        this.logInfo(componentName, `Workflow updated: ${config.name}`, {
            workflowId,
            workflowName: config.name,
            state,
            metadata: workflow.metadata
        });
    }

    completeWorkflow(workflowId: string, success: boolean = true, metadata?: Record<string, any>): void {
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow) return;

        const { config, startTime } = workflow;
        const componentName = config.component;
        const endTime = performance.now();
        const duration = endTime - startTime;

        const state = success ? WorkflowState.COMPLETED : WorkflowState.FAILED;

        // Log workflow completion
        const logMethod = success ? 'logInfo' : 'logError';
        const message = success ? `Workflow completed: ${config.name}` : `Workflow failed: ${config.name}`;

        this[logMethod](componentName, message, {
            workflowId,
            workflowName: config.name,
            state,
            duration: `${duration.toFixed(2)}ms`,
            metadata: { ...workflow.metadata, ...metadata }
        });

        // Clean up
        this.activeWorkflows.delete(workflowId);
        this.globalConfig.workflowConfigs.delete(workflowId);
    }

    // Performance tracking
    trackPerformance(componentName: string, operationName: string, operation: () => Promise<any> | any): Promise<any> {
        if (!this.globalConfig.enablePerformanceTracking) {
            return Promise.resolve(operation());
        }

        const startTime = performance.now();
        const workflowId = `perf_${componentName}_${operationName}_${Date.now()}`;

        this.startWorkflow(workflowId, `Performance: ${operationName}`, componentName);

        const executeOperation = async () => {
            try {
                const result = await operation();
                this.completeWorkflow(workflowId, true, { result: 'success' });
                return result;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.completeWorkflow(workflowId, false, { error: errorMessage });
                throw error;
            }
        };

        return executeOperation();
    }

    // Private helper methods
    private captureMessage(componentName: string, message: string, level: string, context?: Record<string, any>): void {
        if (this.isEnabled()) {
            this.loadScript();
            const fullMessage = `[${this.identifier}] [${componentName}] ${message}`;

            if (context) {
                globalThis.Sentry?.setExtra('context', context);
            }

            globalThis.Sentry?.setTag('component', componentName);
            globalThis.Sentry?.setTag('logLevel', level);
            globalThis.Sentry?.captureMessage(fullMessage, level as any);
        }
    }

    private captureError(componentName: string, error: Error | string, context?: Record<string, any>, level: string = 'error'): void {
        if (this.isEnabled()) {
            this.loadScript();
            const errorMessage = typeof error === 'string' ? error : error.message;
            const fullMessage = `[${this.identifier}] [${componentName}] ${errorMessage}`;

            if (context) {
                globalThis.Sentry?.setExtra('context', context);
            }

            globalThis.Sentry?.setTag('component', componentName);
            globalThis.Sentry?.setTag('logLevel', level);
            globalThis.Sentry?.captureMessage(fullMessage, level as any);
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
        return { ...this.globalConfig };
    }

    // Get active workflows
    getActiveWorkflows(): Map<string, { config: WorkflowConfig; startTime: number; metadata: Record<string, any> }> {
        return new Map(this.activeWorkflows);
    }

    // Cleanup
    cleanup(): void {
        this.activeWorkflows.clear();
        this.componentConfigs.clear();
        this.globalConfig.componentConfigs.clear();
        this.globalConfig.workflowConfigs.clear();
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
export const {
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
} = sentryLogger;

export default SentryLogger;
