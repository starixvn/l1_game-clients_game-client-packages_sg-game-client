# SentryLogger - Enhanced Sentry Integration

The `SentryLogger` is a comprehensive utility that provides granular control over Sentry logging for the SG-Game-Client library. It implements all six standard Sentry log levels and offers workflow tracking, performance monitoring, and component-specific configuration.

## 🚀 Features

-   **Six Standard Log Levels**: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
-   **Global Enable/Disable**: Turn Sentry logging on/off globally
-   **Component-Specific Configuration**: Different log levels for different components
-   **Workflow Tracking**: Track complex operations with states and metadata
-   **Performance Monitoring**: Automatic timing and performance tracking
-   **Console Override**: Optional console method override for automatic logging
-   **Legacy Support**: Backward compatibility with existing log levels

## 📋 Quick Start

### 1. Initialize SentryLogger

```typescript
import { configureSentry, enableSentry, setLogLevel } from "./shared/utils/logger";

// Initialize with custom configuration
configureSentry({
    enabled: true,
    defaultLogLevel: SentryLogLevel.INFO,
    enableWorkflowTracking: true,
    enablePerformanceTracking: true,
    enableConsoleOverride: true,
});

// Or use convenience functions
enableSentry();
setLogLevel(SentryLogLevel.WARN);
```

### 2. Configure Components

```typescript
import { configureComponent } from "./shared/utils/logger";

// Configure different components with different log levels
configureComponent("GameEngine", {
    logLevel: SentryLogLevel.DEBUG,
    enableWorkflowTracking: true,
    enablePerformanceTracking: true,
});

configureComponent("BettingSystem", {
    logLevel: SentryLogLevel.ERROR,
    enableWorkflowTracking: false,
    enablePerformanceTracking: true,
});
```

### 3. Start Sentry

```typescript
import { sentryLogger } from "./shared/utils/logger";

sentryLogger.start("your-sentry-dsn", "production", "sg-game-client");
```

## 🔧 Configuration Options

### Global Configuration

```typescript
interface GlobalSentryConfig {
    enabled: boolean; // Master switch for Sentry
    defaultLogLevel: SentryLogLevel; // Default log level for all components
    enableWorkflowTracking: boolean; // Enable workflow tracking
    enablePerformanceTracking: boolean; // Enable performance monitoring
    enableConsoleOverride: boolean; // Override console methods
}
```

### Component Configuration

```typescript
interface ComponentConfig {
    name: string; // Component name
    logLevel: SentryLogLevel; // Log level for this component
    enableWorkflowTracking?: boolean; // Enable workflow tracking for component
    enablePerformanceTracking?: boolean; // Enable performance tracking for component
}
```

## 📊 Log Levels

### Standard Sentry Log Levels

```typescript
enum SentryLogLevel {
    TRACE = "trace", // Very fine-grained debugging events
    DEBUG = "debug", // Debugging events
    INFO = "info", // Informational events
    WARN = "warn", // Warning events
    ERROR = "error", // Error events
    FATAL = "fatal", // Fatal errors (system crashes)
}
```

### Legacy Log Levels (Backward Compatibility)

```typescript
enum SentryLogLevel {
    DISABLED = "disabled", // No logging
    ERROR_ONLY = "error_only", // Only errors
    WARNING_AND_ERROR = "warning_and_error", // Warnings and errors
    ALL = "all", // All log levels
}
```

### Log Level Hierarchy

The log levels follow a hierarchy where higher levels include all lower levels:

-   **TRACE**: Includes all levels
-   **DEBUG**: Includes DEBUG, INFO, WARN, ERROR, FATAL
-   **INFO**: Includes INFO, WARN, ERROR, FATAL
-   **WARN**: Includes WARN, ERROR, FATAL
-   **ERROR**: Includes ERROR, FATAL
-   **FATAL**: Includes only FATAL

## 📝 Logging Methods

### Basic Logging

```typescript
import { logTrace, logDebug, logInfo, logWarning, logError, logFatal } from "./shared/utils/logger";

// Trace level - for very detailed debugging
logTrace("ComponentName", "Function entry point", { functionName: "processData" });

// Debug level - for debugging information
logDebug("ComponentName", "Variable values", { userId: "123", status: "active" });

// Info level - for general information
logInfo("ComponentName", "User action completed", { userId: "123", action: "login" });

// Warning level - for warnings
logWarning("ComponentName", "Low balance detected", { userId: "123", balance: 10 });

// Error level - for errors
logError("ComponentName", "Operation failed", { userId: "123", error: "timeout" });

// Fatal level - for critical system failures
logFatal("ComponentName", "System crash", { component: "database", critical: true });
```

### Context and Metadata

All logging methods support optional context objects:

```typescript
logInfo("GameEngine", "Game started", {
    gameId: "game_123",
    playerCount: 4,
    gameMode: "tournament",
    timestamp: Date.now(),
});
```

## 🔄 Workflow Tracking

### Basic Workflow

```typescript
import { startWorkflow, updateWorkflow, completeWorkflow, WorkflowState } from "./shared/utils/logger";

const workflowId = "user_login_123";

// Start workflow
startWorkflow(workflowId, "User Login Process", "AuthComponent", {
    userId: "user123",
    loginMethod: "email",
});

try {
    // Update workflow state
    updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
        step: "validating_credentials",
        progress: 25,
    });

    // Your logic here
    await validateCredentials();

    updateWorkflow(workflowId, WorkflowState.IN_PROGRESS, {
        step: "creating_session",
        progress: 75,
    });

    await createSession();

    // Complete successfully
    completeWorkflow(workflowId, true, {
        sessionId: "session456",
        duration: "1500ms",
    });
} catch (error) {
    // Complete with failure
    completeWorkflow(workflowId, false, {
        error: error.message,
        step: "failed",
    });
}
```

### Workflow States

```typescript
enum WorkflowState {
    STARTED = "started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
}
```

## ⚡ Performance Tracking

### Automatic Performance Tracking

```typescript
import { trackPerformance } from "./shared/utils/logger";

// Track any operation automatically
const result = await trackPerformance("DataLoader", "Load User Data", async () => {
    // Your async operation here
    const response = await fetch("/api/user-data");
    return response.json();
});

// The operation is automatically timed and logged
```

### Manual Performance Tracking

```typescript
const workflowId = "operation_123";
startWorkflow(workflowId, "Complex Operation", "MyComponent", { userId: "user123" });

try {
    // Your operation here
    const result = await complexOperation();

    completeWorkflow(workflowId, true, { result: "success" });
    return result;
} catch (error) {
    completeWorkflow(workflowId, false, { error: error.message });
    throw error;
}
```

## 🎯 Component-Specific Configuration

### Configure Individual Components

```typescript
import { configureComponent, SentryLogLevel } from "./shared/utils/logger";

// Critical components - full logging
configureComponent("GameEngine", {
    logLevel: SentryLogLevel.DEBUG,
    enableWorkflowTracking: true,
    enablePerformanceTracking: true,
});

// Important components - info and above
configureComponent("BettingSystem", {
    logLevel: SentryLogLevel.INFO,
    enableWorkflowTracking: false,
    enablePerformanceTracking: true,
});

// UI components - warnings and above
configureComponent("UserInterface", {
    logLevel: SentryLogLevel.WARN,
    enableWorkflowTracking: false,
    enablePerformanceTracking: false,
});

// Utility components - errors only
configureComponent("DataProcessor", {
    logLevel: SentryLogLevel.ERROR,
    enableWorkflowTracking: false,
    enablePerformanceTracking: false,
});

// Disabled components
configureComponent("DebugPanel", {
    logLevel: SentryLogLevel.DISABLED,
    enableWorkflowTracking: false,
    enablePerformanceTracking: false,
});
```

## 🔍 Utility Functions

### Check Logging Status

```typescript
import { isLoggingEnabled, getComponentConfig, getConfig } from "./shared/utils/logger";

// Check if logging is enabled for a component and level
const canLogInfo = isLoggingEnabled("MyComponent", "info");
const canLogError = isLoggingEnabled("MyComponent", "error");

// Get component configuration
const config = getComponentConfig("MyComponent");

// Get global configuration
const globalConfig = getConfig();
```

### Workflow Management

```typescript
import { getActiveWorkflows } from "./shared/utils/logger";

// Get all active workflows
const activeWorkflows = getActiveWorkflows();
console.log(`Active workflows: ${activeWorkflows.size}`);
```

### Cleanup

```typescript
import { cleanup, close } from "./shared/utils/logger";

// Clean up all workflows and configurations
cleanup();

// Close Sentry and restore console methods
close();
```

## 🛠️ Environment-Specific Configuration

### Development Environment

```typescript
if (process.env.NODE_ENV === "development") {
    configureSentry({
        enabled: true,
        defaultLogLevel: SentryLogLevel.DEBUG,
        enableWorkflowTracking: true,
        enablePerformanceTracking: true,
        enableConsoleOverride: true,
    });
}
```

### Production Environment

```typescript
if (process.env.NODE_ENV === "production") {
    configureSentry({
        enabled: true,
        defaultLogLevel: SentryLogLevel.INFO,
        enableWorkflowTracking: false,
        enablePerformanceTracking: true,
        enableConsoleOverride: true,
    });
}
```

### Test Environment

```typescript
if (process.env.NODE_ENV === "test") {
    configureSentry({
        enabled: false,
        defaultLogLevel: SentryLogLevel.DISABLED,
        enableWorkflowTracking: false,
        enablePerformanceTracking: false,
        enableConsoleOverride: false,
    });
}
```

## 📚 Usage Examples

### Game-Specific Logging

```typescript
const gameComponent = "RNGSoccerGame";

// Game initialization
logInfo(gameComponent, "Game session started", {
    gameId: "game_123",
    playerCount: 4,
    gameMode: "tournament",
});

// Betting actions
logDebug(gameComponent, "Player placed bet", {
    playerId: "player_456",
    betAmount: 100,
    betType: "home_win",
    odds: 2.5,
});

// Game events
logInfo(gameComponent, "Goal scored", {
    team: "home",
    minute: 23,
    scorer: "player_789",
    score: "1-0",
});

// Game completion
logInfo(gameComponent, "Game completed", {
    finalScore: "2-1",
    winner: "home",
    duration: "90min",
    totalBets: 150,
});
```

### Error Handling

```typescript
try {
    // Some operation that might fail
    await riskyOperation();
} catch (error) {
    logError("MyComponent", error instanceof Error ? error.message : String(error), {
        operation: "riskyOperation",
        userId: "user123",
        timestamp: Date.now(),
    });

    // Re-throw if needed
    throw error;
}
```

### Performance Monitoring

```typescript
// Track API calls
const userData = await trackPerformance("UserService", "Fetch User Profile", async () => {
    const response = await fetch("/api/user/profile");
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
});

// Track complex operations
const result = await trackPerformance("GameEngine", "Process Game State", async () => {
    // Complex game state processing
    await validateGameState();
    await updatePlayerPositions();
    await checkCollisions();
    return calculateScores();
});
```

## 🧪 Testing

The logger includes comprehensive test coverage. See `tests/unit-tests/shared/logger.test.ts` for examples of how to test the logger functionality.

### Testing Log Levels

```typescript
import { configureComponent, isLoggingEnabled, SentryLogLevel } from "./shared/utils/logger";

describe("Log Level Testing", () => {
    it("should respect log level hierarchy", () => {
        configureComponent("TestComponent", { logLevel: SentryLogLevel.WARN });

        expect(isLoggingEnabled("TestComponent", "trace")).toBe(false);
        expect(isLoggingEnabled("TestComponent", "debug")).toBe(false);
        expect(isLoggingEnabled("TestComponent", "info")).toBe(false);
        expect(isLoggingEnabled("TestComponent", "warn")).toBe(true);
        expect(isLoggingEnabled("TestComponent", "error")).toBe(true);
        expect(isLoggingEnabled("TestComponent", "fatal")).toBe(true);
    });
});
```

## 🔄 Migration from Legacy Logger

### Before (Legacy)

```typescript
import { sentryLogger } from "./shared/utils/logger";

sentryLogger.start("dsn", "env", "identifier");
sentryLogger.logInfo("User logged in");
sentryLogger.logError("Connection failed");
```

### After (Enhanced)

```typescript
import { sentryLogger, configureSentry, configureComponent, logInfo, logError } from "./shared/utils/logger";

// Configure the logger
configureSentry({
    enabled: true,
    defaultLogLevel: SentryLogLevel.INFO,
    enableWorkflowTracking: true,
    enablePerformanceTracking: true,
});

// Configure components
configureComponent("AuthComponent", { logLevel: SentryLogLevel.INFO });

// Start Sentry
sentryLogger.start("dsn", "env", "identifier");

// Use enhanced logging
logInfo("AuthComponent", "User logged in", { userId: "user123" });
logError("AuthComponent", "Connection failed", { retryCount: 3 });
```

## 📖 API Reference

### Main Exports

-   `sentryLogger`: Singleton instance of SentryLogger
-   `SentryLogLevel`: Enum of all available log levels
-   `WorkflowState`: Enum of workflow states
-   `configureSentry()`: Initialize global configuration
-   `enableSentry()`: Enable Sentry globally
-   `disableSentry()`: Disable Sentry globally
-   `setLogLevel()`: Set default log level
-   `configureComponent()`: Configure component-specific settings

### Logging Methods

-   `logTrace()`: Log trace-level messages
-   `logDebug()`: Log debug-level messages
-   `logInfo()`: Log info-level messages
-   `logWarning()`: Log warning-level messages
-   `logError()`: Log error-level messages
-   `logFatal()`: Log fatal-level messages

### Workflow Methods

-   `startWorkflow()`: Start a new workflow
-   `updateWorkflow()`: Update workflow state
-   `completeWorkflow()`: Complete a workflow
-   `trackPerformance()`: Track operation performance

### Utility Methods

-   `isLoggingEnabled()`: Check if logging is enabled
-   `getComponentConfig()`: Get component configuration
-   `getConfig()`: Get global configuration
-   `getActiveWorkflows()`: Get active workflows
-   `cleanup()`: Clean up all workflows
-   `close()`: Close Sentry and restore console

## 🤝 Contributing

When contributing to the logger:

1. Follow the existing code patterns
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Ensure backward compatibility when possible
5. Use the AAA (Arrange, Act, Assert) pattern for tests

## 📄 License

This logger is part of the SG-Game-Client library and follows the same licensing terms.
