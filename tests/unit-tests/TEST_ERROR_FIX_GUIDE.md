# Test Error Fix Guide

This guide explains how to fix all the test errors related to the enhanced SentryLogger implementation.

## Current Issues

### 1. Duplicate Identifier Errors

The logger mock file has conflicting function declarations for `logInfo` and `logError`.

### 2. Module Not Found Errors

Some test files are trying to import mock files that don't exist or have incorrect paths.

### 3. Jest Type Errors

TypeScript is not recognizing Jest types in some test files.

## Solutions

### Solution 1: Fix Logger Mock File

Replace the content of `tests/unit-tests/__mocks__/logger.mock.ts` with this simplified version:

```typescript
// Simplified logger mock without duplicate declarations
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
};
```

### Solution 2: Update Test Files

For each test file that uses the logger, replace the mock with this inline version:

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

### Solution 3: Update Test Assertions

Update all test assertions to include component names:

**Before:**

```typescript
expect(sentryLogger.logError).toHaveBeenCalledWith(error);
```

**After:**

```typescript
expect(sentryLogger.logError).toHaveBeenCalledWith("ComponentName", error);
```

### Solution 4: Fix Jest Configuration

Add this to your `tsconfig.json` or create a separate `tsconfig.test.json`:

```json
{
    "compilerOptions": {
        "types": ["jest", "node"]
    },
    "include": ["tests/**/*", "src/**/*"],
    "exclude": ["node_modules"]
}
```

## Files That Need Updates

### 1. `notification-store.test.ts`

-   ✅ Already updated with inline mock
-   ✅ Assertion updated to include 'NotificationStore' component name

### 2. `connection-store.test.ts`

-   ✅ Already updated with inline mock
-   ✅ Assertion updated to include 'ConnectionStore' component name

### 3. `auth-handlers.test.ts`

-   ✅ Already updated with inline mock
-   ⚠️ Need to update assertions for:
    -   TriggerRecheckIn component
    -   Authorize component
    -   SSO component

### 4. `app-handlers.test.ts`

-   ⚠️ Need to update mock and assertions for BackToOperatorLobby component

### 5. `gateway-connection-store.test.ts`

-   ⚠️ Need to update mock and assertions for GatewayConnectionStore component

## Step-by-Step Fix Process

### Step 1: Fix the Mock File

```bash
# Delete the problematic mock file
rm tests/unit-tests/__mocks__/logger.mock.ts

# Create a new simplified version
# (Use the template above)
```

### Step 2: Update Each Test File

For each test file that fails:

1. **Replace the mock import** with the inline mock template
2. **Update assertions** to include component names
3. **Add component-specific imports** if needed

### Step 3: Update Assertions

Find all `sentryLogger.logError` calls and update them:

```typescript
// Find this pattern in test files:
expect(sentryLogger.logError).toHaveBeenCalledWith(error);

// Replace with:
expect(sentryLogger.logError).toHaveBeenCalledWith("ComponentName", error);
```

### Step 4: Test the Fixes

```bash
# Run the tests to verify fixes
npm test

# Or run specific test files
npm test -- notification-store.test.ts
npm test -- connection-store.test.ts
npm test -- auth-handlers.test.ts
```

## Component Names to Use

Use these exact component names in your assertions:

-   `NotificationStore` - for notification system
-   `ConnectionStore` - for game connections
-   `GatewayConnectionStore` - for gateway connections
-   `TriggerRecheckIn` - for recheck-in operations
-   `Authorize` - for authorization operations
-   `SSO` - for SSO operations
-   `BackToOperatorLobby` - for lobby navigation
-   `AuthUtils` - for authentication utilities

## Example Fix

### Before (Broken):

```typescript
jest.mock("../../../src/shared/utils/logger", () => require("../../__mocks__/logger.mock.ts"));

// Later in test:
expect(sentryLogger.logError).toHaveBeenCalledWith(error);
```

### After (Fixed):

```typescript
jest.mock("../../../src/shared/utils/logger", () => ({
    sentryLogger: {
        logError: jest.fn(),
        // ... other methods
    },
    // ... other exports
}));

// Later in test:
expect(sentryLogger.logError).toHaveBeenCalledWith("ComponentName", error);
```

## Troubleshooting

### If you still get Jest type errors:

1. Install Jest types: `npm install --save-dev @types/jest`
2. Add Jest to tsconfig types array
3. Restart your TypeScript server

### If mocks aren't working:

1. Ensure mock is defined before imports
2. Check that all required methods are mocked
3. Clear Jest cache: `npm test -- --clearCache`

### If assertions are failing:

1. Verify component names match exactly
2. Check that new function signatures are used
3. Ensure mocks are properly reset between tests

## Quick Fix Commands

```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run specific failing test
npm test -- notification-store.test.ts

# Run tests with coverage
npm test -- --coverage
```

## Verification Checklist

After applying fixes, verify:

-   [ ] No duplicate identifier errors
-   [ ] No module not found errors
-   [ ] All test assertions include component names
-   [ ] All tests pass
-   [ ] No Jest type errors
-   [ ] Logger functionality works as expected

## Support

If you encounter issues:

1. Check the error messages carefully
2. Verify component names match exactly
3. Ensure all required methods are mocked
4. Clear Jest cache and restart
5. Check TypeScript configuration
