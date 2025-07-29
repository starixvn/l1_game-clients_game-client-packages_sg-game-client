// Comprehensive examples for using the updated SentryLogger
// This file demonstrates various usage patterns for the enhanced logger with all six log levels

// Node.js process type declaration for browser environments
declare const process: {
    env: {
        NODE_ENV?: string;
    };
    memoryUsage: () => {
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
    cpuUsage: () => {
        user: number;
        system: number;
    };
};

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
} from './logger';

// Example 1: Global Configuration
export const configureGlobalSentry = () => {
    // Initialize with custom configuration
    configureSentry({
        enabled: true,
        defaultLogLevel: SentryLogLevel.INFO,
        enableWorkflowTracking: true,
        enablePerformanceTracking: true,
        enableConsoleOverride: true
    });

    // Or use convenience functions
    enableSentry();
    setLogLevel(SentryLogLevel.WARN);
};

// Example 2: Component-Specific Configuration
export const configureComponents = () => {
    // Configure different components with different log levels
    configureComponent('GameEngine', {
        logLevel: SentryLogLevel.INFO,
        enableWorkflowTracking: true,
        enablePerformanceTracking: true
    });

    configureComponent('BettingSystem', {
        logLevel: SentryLogLevel.ERROR,
        enableWorkflowTracking: false,
        enablePerformanceTracking: true
    });

    configureComponent('UserProfile', {
        logLevel: SentryLogLevel.DISABLED,
        enableWorkflowTracking: false,
        enablePerformanceTracking: false
    });
};

// Example 3: Basic Logging with All Six Levels
export const basicLoggingExample = () => {
    const componentName = 'GameEngine';

    // Log different types of events using all six standard levels
    logTrace(componentName, 'Function entry point reached', {
        functionName: 'processGameState',
        parameters: { gameId: 'game123', userId: 'user456' }
    });

    logDebug(componentName, 'Game state variables', {
        currentState: 'playing',
        playerCount: 4,
        roundNumber: 3
    });

    logInfo(componentName, 'User joined game lobby', {
        userId: 'user123',
        lobbyId: 'lobby456',
        timestamp: Date.now()
    });

    logWarning(componentName, 'User balance is low', {
        userId: 'user123',
        balance: 10.50,
        threshold: 20.00
    });

    try {
        // Simulate some operation that might fail
        throw new Error('Failed to join game room');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError(componentName, errorMessage, {
            userId: 'user123',
            gameRoomId: 'room789',
            action: 'join_game'
        });
    }

    // Fatal errors for critical system failures
    try {
        // Simulate a critical system failure
        throw new Error('Database connection lost - system cannot continue');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logFatal(componentName, errorMessage, {
            systemComponent: 'database',
            critical: true,
            requiresImmediate: true
        });
    }
};

// Example 4: Workflow Tracking
export const workflowTrackingExample = async () => {
    const componentName = 'GameSession';
    const workflowId = 'game_session_123';

    // Start a workflow
    startWorkflow(workflowId, 'Game Session Initialization', componentName, {
        userId: 'user123',
        gameType: 'rng-soccer',
        betAmount: 100
    });

    try {
        // Update workflow state
        updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
            step: 'loading_game_assets',
            progress: 25
        });

        // Simulate some async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
            step: 'connecting_to_server',
            progress: 50
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
            step: 'game_ready',
            progress: 100
        });

        // Complete workflow successfully
        completeWorkflow(workflowId, true, {
            sessionDuration: '2000ms',
            finalStatus: 'ready'
        });

    } catch (error: unknown) {
        // Complete workflow with failure
        completeWorkflow(workflowId, false, {
            error: error instanceof Error ? error.message : String(error),
            step: 'failed'
        });
    }
};

// Example 5: Performance Tracking
export const performanceTrackingExample = async () => {
    const componentName = 'DataLoader';

    // Track a simple operation
    const result = await trackPerformance(componentName, 'Load User Data', async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return { userId: 'user123', name: 'John Doe' };
    });

    // Track a complex operation with error handling
    try {
        await trackPerformance(componentName, 'Process Payment', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            throw new Error('Payment failed');
        });
    } catch (error: unknown) {
        // Error is automatically logged by trackPerformance
        console.log('Payment processing failed');
    }
};

// Example 6: Complex Workflow with Multiple Steps
export const complexWorkflowExample = async () => {
    const componentName = 'TournamentManager';
    const workflowId = 'tournament_creation_456';

    startWorkflow(workflowId, 'Tournament Creation', componentName, {
        tournamentName: 'Championship Cup',
        maxPlayers: 32,
        entryFee: 50
    });

    const steps = [
        { name: 'validate_tournament_config', duration: 200 },
        { name: 'create_tournament_record', duration: 300 },
        { name: 'setup_brackets', duration: 500 },
        { name: 'notify_participants', duration: 400 }
    ];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
            currentStep: step.name,
            progress: ((i + 1) / steps.length) * 100,
            stepNumber: i + 1,
            totalSteps: steps.length
        });

        try {
            await trackPerformance(componentName, step.name, async () => {
                await new Promise(resolve => setTimeout(resolve, step.duration));

                // Simulate potential failure in setup_brackets
                if (step.name === 'setup_brackets' && Math.random() > 0.8) {
                    throw new Error('Failed to setup tournament brackets');
                }
            });
        } catch (error) {
            completeWorkflow(workflowId, false, {
                failedStep: step.name,
                error: error instanceof Error ? error.message : String(error)
            });
            return;
        }
    }

    completeWorkflow(workflowId, true, {
        totalDuration: '1400ms',
        participantsNotified: 32,
        tournamentStatus: 'ready'
    });
};

// Example 7: Conditional Logging Based on Environment
export const conditionalLoggingExample = () => {
    const componentName = 'DebugPanel';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Only log detailed info in development
    if (isDevelopment) {
        logTrace(componentName, 'Debug information', {
            memoryUsage: process.memoryUsage(),
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`
        });
    }

    // Always log errors regardless of environment
    try {
        // Some operation that might fail
        throw new Error('Critical system error');
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError(componentName, errorMessage, {
            environment: process.env.NODE_ENV,
            timestamp: Date.now()
        });
    }
};

// Example 8: Batch Operations with Workflow Tracking
export const batchOperationsExample = async () => {
    const componentName = 'DataProcessor';
    const workflowId = 'batch_processing_789';

    startWorkflow(workflowId, 'Batch Data Processing', componentName, {
        batchSize: 1000,
        operationType: 'user_data_cleanup'
    });

    const batchSize = 1000;
    const batchResults = {
        processed: 0,
        failed: 0,
        skipped: 0
    };

    for (let i = 0; i < batchSize; i += 100) {
        const batchId = `batch_${i}_${i + 99}`;

        updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
            currentBatch: batchId,
            progress: (i / batchSize) * 100,
            processed: batchResults.processed,
            failed: batchResults.failed
        });

        try {
            await trackPerformance(componentName, `Process Batch ${batchId}`, async () => {
                // Simulate batch processing
                await new Promise(resolve => setTimeout(resolve, 50));

                // Simulate some failures
                if (Math.random() > 0.95) {
                    throw new Error(`Batch ${batchId} processing failed`);
                }

                batchResults.processed += 100;
            });
        } catch (error) {
            batchResults.failed += 100;
            logWarning(componentName, `Batch processing failed`, {
                batchId,
                error: error instanceof Error ? error.message : String(error),
                retryCount: 0
            });
        }
    }

    completeWorkflow(workflowId, true, {
        totalProcessed: batchResults.processed,
        totalFailed: batchResults.failed,
        successRate: (batchResults.processed / batchSize) * 100
    });
};

// Example 9: Error Recovery and Retry Logic
export const errorRecoveryExample = async () => {
    const componentName = 'ConnectionManager';
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await trackPerformance(componentName, `Connection Attempt ${attempt}`, async () => {
                // Simulate connection attempt
                await new Promise(resolve => setTimeout(resolve, 200));

                // Simulate connection failure
                if (Math.random() > 0.7) {
                    throw new Error(`Connection failed on attempt ${attempt}`);
                }
            });

            logInfo(componentName, 'Connection established successfully', {
                attempt,
                duration: '200ms'
            });
            break;

        } catch (error) {
            logWarning(componentName, 'Connection attempt failed', {
                attempt,
                maxRetries,
                error: error instanceof Error ? error.message : String(error),
                willRetry: attempt < maxRetries
            });

            if (attempt === maxRetries) {
                logError(componentName, new Error('All connection attempts failed'), {
                    totalAttempts: maxRetries,
                    finalError: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }
};

// Example 10: User Interaction Tracking
export const userInteractionExample = () => {
    const componentName = 'UserInterface';

    const trackUserAction = (action: string, details: Record<string, any>) => {
        logInfo(componentName, `User action: ${action}`, {
            action,
            ...details,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });
    };

    const trackUserError = (action: string, error: string, details: Record<string, any>) => {
        logWarning(componentName, `User error during ${action}`, {
            action,
            error,
            ...details,
            timestamp: Date.now()
        });
    };

    // Example usage
    trackUserAction('button_click', {
        buttonId: 'play_game',
        userId: 'user123',
        gameType: 'rng-soccer'
    });

    trackUserError('form_submission', 'Invalid bet amount', {
        userId: 'user123',
        betAmount: -50,
        formId: 'betting_form'
    });
};

// Example 11: Game-Specific Logging Patterns
export const gameSpecificLoggingExample = () => {
    const gameComponent = 'RNGSoccerGame';

    // Game initialization
    logInfo(gameComponent, 'Game session started', {
        gameId: 'game_123',
        playerCount: 4,
        gameMode: 'tournament'
    });

    // Betting actions
    logDebug(gameComponent, 'Player placed bet', {
        playerId: 'player_456',
        betAmount: 100,
        betType: 'home_win',
        odds: 2.5
    });

    // Game state changes
    logTrace(gameComponent, 'Game state transition', {
        fromState: 'betting',
        toState: 'playing',
        transitionTime: Date.now()
    });

    // Game events
    logInfo(gameComponent, 'Goal scored', {
        team: 'home',
        minute: 23,
        scorer: 'player_789',
        score: '1-0'
    });

    // Game completion
    logInfo(gameComponent, 'Game completed', {
        finalScore: '2-1',
        winner: 'home',
        duration: '90min',
        totalBets: 150
    });
};

// Example 12: System Health Monitoring
export const systemHealthMonitoringExample = () => {
    const systemComponent = 'SystemMonitor';

    // Monitor system performance
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
        logWarning(systemComponent, 'High memory usage detected', {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external
        });
    }

    if (cpuUsage.user > 1000000) { // 1 second
        logWarning(systemComponent, 'High CPU usage detected', {
            user: cpuUsage.user,
            system: cpuUsage.system
        });
    }

    // Monitor connection health
    const connectionStatus = 'healthy';
    if (connectionStatus !== 'healthy') {
        logError(systemComponent, 'Connection health check failed', {
            status: connectionStatus,
            timestamp: Date.now()
        });
    }
};

// Example 13: Security and Audit Logging
export const securityAuditLoggingExample = () => {
    const securityComponent = 'SecurityAudit';

    // Login attempts
    logInfo(securityComponent, 'User login attempt', {
        userId: 'user_123',
        ipAddress: '192.168.1.1',
        userAgent: navigator.userAgent,
        timestamp: Date.now()
    });

    // Failed login
    logWarning(securityComponent, 'Failed login attempt', {
        userId: 'user_123',
        ipAddress: '192.168.1.1',
        reason: 'invalid_password',
        attemptCount: 3
    });

    // Suspicious activity
    logError(securityComponent, 'Suspicious activity detected', {
        userId: 'user_123',
        activity: 'multiple_failed_logins',
        ipAddress: '192.168.1.1',
        riskLevel: 'high'
    });

    // Critical security breach
    logFatal(securityComponent, 'Security breach detected', {
        breachType: 'unauthorized_access',
        affectedUsers: ['user_123', 'user_456'],
        severity: 'critical',
        requiresImmediate: true
    });
};

// Example 14: Integration with Existing Code
export const integrationExample = () => {
    // Initialize Sentry for the application
    configureSentry({
        enabled: true,
        defaultLogLevel: SentryLogLevel.INFO,
        enableWorkflowTracking: true,
        enablePerformanceTracking: true,
        enableConsoleOverride: true
    });

    // Configure components based on their importance
    configureComponent('GameEngine', {
        logLevel: SentryLogLevel.DEBUG,
        enableWorkflowTracking: true,
        enablePerformanceTracking: true
    });

    configureComponent('UserInterface', {
        logLevel: SentryLogLevel.WARN,
        enableWorkflowTracking: false,
        enablePerformanceTracking: true
    });

    configureComponent('DataProcessor', {
        logLevel: SentryLogLevel.ERROR,
        enableWorkflowTracking: false,
        enablePerformanceTracking: false
    });

    // Start Sentry
    sentryLogger.start('your-sentry-dsn', 'production', 'sg-game-client');

    console.log('SentryLogger configured and ready for use');
};

export default {
    configureGlobalSentry,
    configureComponents,
    basicLoggingExample,
    workflowTrackingExample,
    performanceTrackingExample,
    complexWorkflowExample,
    conditionalLoggingExample,
    batchOperationsExample,
    errorRecoveryExample,
    userInteractionExample,
    gameSpecificLoggingExample,
    systemHealthMonitoringExample,
    securityAuditLoggingExample,
    integrationExample
}; 