import { AuthStore } from "../../../../src/auth";
import { MainPlayerStore } from "../../../../src/players/main-player-store";
import { GameServiceMessage } from "../../../../src/shared";
import { AccountClosedHandlers } from "./../../../../src/game/account-closed/account-closed-handlers";
import { stub } from "jest-auto-stub";

describe("AccountClosedHandlers", () => {
    let accountClosedHandlers: AccountClosedHandlers;
    let authStore: AuthStore;
    let mainPlayerStore: MainPlayerStore;

    beforeEach(() => {
        mainPlayerStore = stub<MainPlayerStore>();
        authStore = new AuthStore(mainPlayerStore);
        accountClosedHandlers = new AccountClosedHandlers(authStore);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("handle", () => {
        it("should call setAccountClosed with the error code if isDisabledAccount is true", () => {
            const errorCode = "2002";
            const accountCloseInfo: GameServiceMessage.AccountClosed = {
                isDisabledAccount: true,
                errorCode: errorCode,
            };

            const setAccountClosedSpy = jest.spyOn(authStore, "setAccountClosed");

            accountClosedHandlers.handle(accountCloseInfo);

            expect(setAccountClosedSpy).toHaveBeenCalledWith(errorCode);
        });

        it("should not call setAccountClosed if isDisabledAccount is false", () => {
            const accountCloseInfo: GameServiceMessage.AccountClosed = {
                isDisabledAccount: false,
                errorCode: "2002",
            };

            const setAccountClosedSpy = jest.spyOn(authStore, "setAccountClosed");

            accountClosedHandlers.handle(accountCloseInfo);

            expect(setAccountClosedSpy).not.toHaveBeenCalled();
        });
    });
});
