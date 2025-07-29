# Logger Mock Update Guide

This guide explains how to update unit test mocks to work with the new enhanced SentryLogger.

## Overview

The enhanced SentryLogger now supports:

-   Six standard log levels: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
-   Component-specific configuration
-   Workflow tracking
-   Performance monitoring
-   Backward compatibility with legacy methods

## Required Updates

### 1. Update Import Statements

**Before:**

```typescript
import { sentryLogger } from "../../../src/shared/utils/logger";
```

**After:**

```typescript
import {
    sentryLogger,
    logInfo,
    logError,
    logWarning,
    logDebug,
    logTrace,
    logFatal,
    configureComponent,
    isLoggingEnabled,
} from "../../../src/shared/utils/logger";
```

### 2. Update Logger Mock Configuration

**Before:**

```typescript
jest.mock("../../../src/shared/utils/logger", () => ({
    sentryLogger: { logError: jest.fn() },
}));
```

**After:**

```typescript
jest.mock("../../../src/shared/utils/logger", () => ({
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
        TRACE: "trace",
        DEBUG: "debug",
        INFO: "info",
        WARN: "warn",
        ERROR: "error",
        FATAL: "fatal",
        DISABLED: "disabled",
        ERROR_ONLY: "error_only",
        WARNING_AND_ERROR: "warning_and_error",
        ALL: "all",
    },
    WorkflowState: {
        STARTED: "started",
        IN_PROGRESS: "in_progress",
        COMPLETED: "completed",
        FAILED: "failed",
        CANCELLED: "cancelled",
    },
}));
```

### 3. Update Test Assertions

**Before:**

```typescript
expect(sentryLogger.logError).toHaveBeenCalledWith(error);
```

**After:**

```typescript
expect(sentryLogger.logError).toHaveBeenCalledWith("ComponentName", error);
// OR
expect(logError).toHaveBeenCalledWith("ComponentName", error);
```

### 4. Update Component-Specific Logging

**Before:**

```typescript
sentryLogger.logError(error);
```

**After:**

```typescript
logError("ComponentName", error);
// OR
sentryLogger.logError("ComponentName", error);
```

## Files That Need Updates

### 1. `notification-store.test.ts`

-   Update logger mock
-   Update assertion: `expect(sentryLogger.logError).toHaveBeenCalledWith('NotificationStore', error);`

### 2. `connection-store.test.ts`

-   Update logger mock
-   Update assertion: `expect(sentryLogger.logError).toHaveBeenCalledWith('ConnectionStore', error);`

### 3. `auth-handlers.test.ts`

-   Update logger mock
-   Update assertions for TriggerRecheckIn, Authorize, and SSO components

### 4. `app-handlers.test.ts`

-   Update logger mock
-   Update assertion: `expect(sentryLogger.logError).toHaveBeenCalledWith('BackToOperatorLobby', error);`

### 5. `gateway-connection-store.test.ts`

-   Update logger mock
-   Update assertion: `expect(sentryLogger.logError).toHaveBeenCalledWith('GatewayConnectionStore', error);`

## Component Names to Use

Use these component names in your tests:

-   `NotificationStore` - for notification system
-   `ConnectionStore` - for game connections
-   `GatewayConnectionStore` - for gateway connections
-   `TriggerRecheckIn` - for recheck-in operations
-   `Authorize` - for authorization operations
-   `SSO` - for SSO operations
-   `BackToOperatorLobby` - for lobby navigation
-   `AuthUtils` - for authentication utilities

## Example Test Updates

### Before:

```typescript
describe("Error handling", () => {
    it("should log error when connection fails", () => {
        const error = new Error("Connection failed");
        store.onConnectFailed(error);

        expect(sentryLogger.logError).toHaveBeenCalledWith(error);
    });
});
```

### After:

```typescript
describe("Error handling", () => {
    it("should log error when connection fails", () => {
        const error = new Error("Connection failed");
        store.onConnectFailed(error);

        expect(sentryLogger.logError).toHaveBeenCalledWith("ComponentName", error);
        // OR
        expect(logError).toHaveBeenCalledWith("ComponentName", error);
    });
});
```

## Testing New Features

### Component Configuration

```typescript
it("should configure component logging", () => {
    configureComponent("TestComponent", {
        logLevel: SentryLogLevel.DEBUG,
        enableWorkflowTracking: true,
    });

    expect(configureComponent).toHaveBeenCalledWith("TestComponent", {
        logLevel: SentryLogLevel.DEBUG,
        enableWorkflowTracking: true,
    });
});
```

### Log Level Testing

```typescript
it("should respect log level hierarchy", () => {
    configureComponent("TestComponent", { logLevel: SentryLogLevel.WARN });

    expect(isLoggingEnabled("TestComponent", "trace")).toBe(false);
    expect(isLoggingEnabled("TestComponent", "warn")).toBe(true);
    expect(isLoggingEnabled("TestComponent", "error")).toBe(true);
});
```

### Workflow Tracking

```typescript
it("should track workflow", () => {
    startWorkflow("workflow-id", "Test Workflow", "TestComponent");
    updateWorkflow("workflow-id", WorkflowState.IN_PROGRESS);
    completeWorkflow("workflow-id", true);

    expect(startWorkflow).toHaveBeenCalledWith("workflow-id", "Test Workflow", "TestComponent");
    expect(updateWorkflow).toHaveBeenCalledWith("workflow-id", WorkflowState.IN_PROGRESS);
    expect(completeWorkflow).toHaveBeenCalledWith("workflow-id", true);
});
```

## Jest Configuration Issues

If you encounter Jest type errors, you may need to:

1. **Add Jest types to tsconfig.json:**

```json
{
    "compilerOptions": {
        "types": ["jest", "node"]
    }
}
```

2. **Create a separate tsconfig for tests:**

```json
// tsconfig.test.json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "types": ["jest", "node"]
    },
    "include": ["tests/**/*", "src/**/*"],
    "exclude": ["node_modules"]
}
```

3. **Update Jest configuration:**

```javascript
// jest.config.js
module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapping: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
};
```

## Migration Checklist

-   [ ] Update import statements in test files
-   [ ] Update logger mock configurations
-   [ ] Update test assertions to include component names
-   [ ] Test component-specific logging
-   [ ] Test log level hierarchy
-   [ ] Test workflow tracking (if applicable)
-   [ ] Verify backward compatibility
-   [ ] Run all tests to ensure they pass

## Troubleshooting

### Common Issues:

1. **TypeScript errors with Jest:**

    - Install `@types/jest` and `@types/node`
    - Update tsconfig to include Jest types

2. **Mock not working:**

    - Ensure mock is defined before imports
    - Check that mock path is correct

3. **Assertion failures:**

    - Verify component names match exactly
    - Check that new function signatures are used

4. **Import errors:**
    - Ensure all new exports are included in mock
    - Check import paths are correct

## Support

For issues with the logger mock updates, refer to:

-   The enhanced logger documentation
-   The logger examples file
-   The comprehensive test suite in `logger.test.ts`
