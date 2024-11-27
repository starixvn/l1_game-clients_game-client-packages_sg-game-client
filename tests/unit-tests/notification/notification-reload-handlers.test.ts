import { AuthStore } from "../../../src/auth/auth-store";
import { NoticeStore } from "../../../src/game/notices";
import { NotificationReloadHandlers } from "../../../src/notification";
import { MainPlayerStore } from "../../../src/players/main-player-store";
import { NotificationServiceMessage } from "../../../src/shared";
import { AppTypes } from "./../../../src/shared/constants/app-type";
import { Translator } from "./../../../src/shared/utils/localization-manager";
import { stub } from "jest-auto-stub";

jest.mock("../../../src/shared/utils/localization-manager", () => {
    return {
        Translator: {
            translate: jest.fn(),
            gameTranslate: jest.fn(),
            commonTranslate: jest.fn().mockImplementation((key, option) => key),
            getMessageFollowSystem: jest.fn().mockImplementation((system, key, option) => key),
        },
    };
});

describe("NotificationReloadHandlers", () => {
    let handler: NotificationReloadHandlers.NotificationReload;
    let noticeStore: NoticeStore;
    let authStore: AuthStore;
    let mainPlayerStore: MainPlayerStore;
    beforeEach(() => {
        mainPlayerStore = stub<MainPlayerStore>();
        noticeStore = new NoticeStore();
        authStore = new AuthStore(mainPlayerStore);
        authStore.system = 1;

        handler = new NotificationReloadHandlers.NotificationReload(noticeStore, authStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("NotificationReload", () => {
        it("has name is equal reloadEventName", () => {
            // assert
            expect(handler.name).toEqual(NotificationServiceMessage.reloadEventName);
        });

        describe("handle", () => {
            it("should call add notice", () => {
                // arrange
                authStore.system = AppTypes.Club;
                const messageMock = "message_new_update_available";
                const titleMock = "notice";
                noticeStore.addNotice = jest.fn();
                handler = new NotificationReloadHandlers.NotificationReload(noticeStore, authStore);

                // act
                handler.handle();

                // assert
                expect(Translator.getMessageFollowSystem).toHaveBeenCalledWith(1, messageMock);
                expect(Translator.commonTranslate).toHaveBeenCalledWith(titleMock);
            });
        });

        it("should call Translator.getMessageFollowSystem with auth system", () => {
            // arrange
            authStore.system = 2;
            handler = new NotificationReloadHandlers.NotificationReload(noticeStore, authStore);

            // act
            handler.handle();

            // assert
            expect(Translator.getMessageFollowSystem).toHaveBeenCalledWith(2, "message_new_update_available");
        });
    });
});
