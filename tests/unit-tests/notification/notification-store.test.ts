/// <reference types="jest" />

import { io } from "socket.io-client/dist/socket.io.js";
import { NotificationStore, events } from "../../../src/notification";
import { Mediator, NotificationServiceMessage } from "../../../src/shared";
import { StorageManager, localStorageKeys } from "../../../src/shared/utils";
import { sentryLogger, logError } from "../../../src/shared/utils/logger";

jest.mock("mobx");
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
}));

jest.mock("socket.io-client/dist/socket.io.js", () => ({
    io: jest.fn().mockReturnValue({ on: jest.fn() }),
}));

let store: NotificationStore;
let mediator: Mediator;
describe("NotificationStore tests", () => {
    beforeAll(() => {
        // arrange
        mediator = new Mediator();
        mediator.emit = jest.fn();
        store = new NotificationStore(mediator);
        store.connection = io("", {});
        store.connection.on = jest.fn();
    });

    describe("initBaseListener", () => {
        describe("when connection not null", () => {
            beforeAll(() => {
                // act
                store.initListener();
            });

            it("should init listeners onConnected", () => {
                // assert
                expect(store.connection.on).toHaveBeenCalled();
                expect(store.connection.on.mock.calls[0][0]).toBe(events.connect);
                expect(store.connection.on.mock.calls[0][1].toString()).toBe(store.onConnected.bind(store).toString());
            });

            it("should init listeners onConnectFailed and event is connect_error", () => {
                // assert
                expect(store.connection.on).toHaveBeenCalled();
                expect(store.connection.on.mock.calls[1][0]).toBe(events.connectError);
                expect(store.connection.on.mock.calls[1][1].toString()).toBe(store.onConnectFailed.bind(store).toString());
            });

            it("should init listeners onConnectFailed and event is connect_failed", () => {
                // assert
                expect(store.connection.on).toHaveBeenCalled();
                expect(store.connection.on.mock.calls[2][0]).toBe(events.connectFailed);
                expect(store.connection.on.mock.calls[2][1].toString()).toBe(store.onConnectFailed.bind(store).toString());
            });

            it("should init listeners onDisconnected and event is disconnect", () => {
                // assert
                expect(store.connection.on).toHaveBeenCalled();
                expect(store.connection.on.mock.calls[3][0]).toBe(events.disconnect);
                expect(store.connection.on.mock.calls[3][1].toString()).toBe(store.onDisconnected.bind(store).toString());
            });
        });
    });
    describe("onConnected", () => {
        beforeAll(() => {
            const sessionInfo = { session: "session", username: "username", system: 1 };
            StorageManager.set(localStorageKeys.session, sessionInfo);

            // arrange
            store.connection.onAny = jest.fn();

            // act
            store.onConnected();
        });

        afterAll(() => {
            StorageManager.set(localStorageKeys.session, {});
        });

        it("should set isConnected true", () => {
            // assert
            expect(store.isConnected).toBe(true);
        });

        it("should set isConnectFailed false", () => {
            // assert
            expect(store.isConnectFailed).toBe(false);
        });
    });

    describe("onConnectFailed", () => {
        const error = new Error("error");

        beforeAll(() => {
            // arrange
            store.connection.disconnect = jest.fn();

            // act
            store.onConnectFailed(error);
        });

        it("should set isConnectFailed is true", () => {
            // assert
            expect(store.isConnectFailed).toBe(true);
        });

        it("should set isConnected is false", () => {
            // assert
            expect(store.isConnected).toBe(false);
        });

        it("should call connection disconnect", () => {
            // assert
            expect(store.connection.disconnect).toHaveBeenCalled();
        });

        it("should log error", () => {
            // assert
            expect(logError).toHaveBeenCalledWith('NotificationStore', error);
        });
    });

    describe("onDisconnected", () => {
        beforeAll(() => {
            // arrange
            store.connection.disconnect = jest.fn();

            // act
            store.onDisconnected();
        });
        it("should set isConnected is false", () => {
            // assert
            expect(store.isConnected).toBe(false);
        });

        it("should call connection disconnect", () => {
            // assert
            expect(store.connection.disconnect).toHaveBeenCalled();
        });
    });

    describe("onHandleKickedOut", () => {
        it("should call  mediator emit with notification service session timeout when data is true", () => {
            // assert
            store.onHandleKickedOut(true);

            // assert
            expect(mediator.emit).toHaveBeenCalledWith(NotificationServiceMessage.sessionTimeoutEventName);
        });

        it("should call mediator emit with notification service um when data not type boolean", () => {
            // arrange
            const fakeUmInfo: NotificationServiceMessage.UnderMaintenanceInfo = {
                message: "Game đang được bảo trì, vui lòng quay lại sau 10 phút.",
                umInfo: {
                    isUM: true,
                    startTime: new Date("2023-05-19"),
                    endTime: new Date("2023-05-20"),
                    operatorId: "2",
                },
            };

            // act
            store.onHandleKickedOut(fakeUmInfo);

            // assert
            expect(mediator.emit).toHaveBeenCalledWith(NotificationServiceMessage.UnderMaintenanceInfo.eventName, fakeUmInfo);
        });
    });
});
