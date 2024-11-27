import { SSOResponse } from "@sg/sg-user-service-client/dist/auth";
import { AuthStore, ISessionInfo } from "../../../src/auth";
import { StorageManager, localStorageKeys } from "../../../src/shared/utils/storage-manager";
import { MainPlayerStore } from "../../../src/players/main-player-store";
import { stub } from "jest-auto-stub";

const now = new Date("2023-01-01");
jest.useFakeTimers().setSystemTime(now);
jest.mock("../../../src/shared/utils/storage-manager", () => ({
    StorageManager: {},
    localStorageKeys: { session: "session-key", directMode: "direct", returnUrl: "rurl" },
}));

describe("AuthStore tests", () => {
    let mainPlayerStore: MainPlayerStore;
    beforeEach(() => {
        mainPlayerStore = stub<MainPlayerStore>();
    });
    describe("setAuthSSOStore", () => {
        it("should set store sso", () => {
            // arrange
            const store = new AuthStore(mainPlayerStore);
            const ssoResponse = {
                isAuthenticated: true,
                username: "user",
                language: "vi-VN",
                ss: "session",
                system: 1,
                memberName: "name",
                isUM: false,
            };

            // act
            store.setAuthSSOStore(ssoResponse as SSOResponse);

            // assert
            expect(store.isAuthenticated).toBe(ssoResponse.isAuthenticated);
            expect(store.username).toBe(ssoResponse.username);
            expect(store.language).toBe(ssoResponse.language);
            expect(store.session).toBe(ssoResponse.ss);
            expect(store.system).toBe(ssoResponse.system);
            expect(store.memberName).toBe(ssoResponse.memberName);
            expect(store.ssoTime).toEqual(now);
        });
    });

    describe("getSessionInfo", () => {
        it("should return session info", () => {
            // arrange
            const store = new AuthStore(mainPlayerStore);
            store.isAuthenticated = true;
            store.username = "username";
            store.language = "vi-VN";
            store.session = "session";
            store.system = 1;
            store.memberName = "memberName";
            store.ssoTime = now;
            const expected = {
                isAuthenticated: store.isAuthenticated,
                username: store.username,
                language: store.language,
                session: store.session,
                system: store.system,
                memberName: store.memberName,
                ssoTime: store.ssoTime,
            };

            // act
            const actual = store.getSessionInfo();

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("signOut", () => {
        let store: AuthStore;
        beforeEach(() => {
            StorageManager.remove = jest.fn();
            store = new AuthStore(mainPlayerStore);
        });
        it("should set reset username, session, isAuthenticated and set session timeout", () => {
            // arrange
            store.isAuthenticated = true;
            store.username = "username";
            store.session = "session";

            // act
            store.signOut();

            // assert
            expect(store.isAuthenticated).toBe(false);
            expect(store.username).toBeNull();
            expect(store.session).toBeNull();
        });

        it("should call remove StorageManager", async () => {
            // act
            store.signOut();

            // assert
            expect(StorageManager.remove).toHaveBeenCalledWith(localStorageKeys.session);
        });
    });

    describe("setAuthStoreFromStorage", () => {
        it("should set store", () => {
            // arrange
            const store = new AuthStore(mainPlayerStore);
            const info: ISessionInfo = {
                isAuthenticated: true,
                username: "user",
                language: "vi-VN",
                session: "session",
                system: 1,
                memberName: "name",
            };

            // act
            store.setAuthStoreFromStorage(info);

            // assert
            expect(store.isAuthenticated).toBe(info.isAuthenticated);
            expect(store.username).toBe(info.username);
            expect(store.language).toBe(info.language);
            expect(store.session).toBe(info.session);
            expect(store.system).toBe(info.system);
            expect(store.memberName).toBe(info.memberName);
            expect(store.ssoTime).toEqual(now);
        });
    });

    describe("setAuthStoreFromUrlParam", () => {
        it("should set store", () => {
            // arrange
            const store = new AuthStore(mainPlayerStore);
            const params = {
                ss: "session",
                uname: "username",
                lang: "vi-VN",
                appType: 1,
            };
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach((key) => params[key] && searchParams.append(key, params[key]));

            // act
            store.setAuthStoreFromUrlParam(searchParams);

            // assert
            expect(store.isAuthenticated).toBe(true);
            expect(store.username).toBe(params.uname);
            expect(store.language).toBe(params.lang);
            expect(store.session).toBe(params.ss);
            expect(store.system).toBe(params.appType);
            expect(store.memberName).toBe("");
            expect(store.ssoTime).toEqual(now);
        });
    });
});
