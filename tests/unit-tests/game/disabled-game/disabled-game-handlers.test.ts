import { stub } from "jest-auto-stub";
import { AppHandlers } from "../../../../src/app";
import { AppStore } from "../../../../src/app/app-store";
import { AuthStore } from "../../../../src/auth/auth-store";
import { ConnectionStore } from "../../../../src/game/connection";
import { DisableGameHandlers, DisabledGameStore } from "../../../../src/game/disabled-game";
import { NoticeInfo, NoticeStore, NoticeType } from "../../../../src/game/notices";
import { PlayerSelectionHandlers, PlayerSelectionStore } from "../../../../src/game/player-selections";
import { RoundRunningHandlers } from "../../../../src/game/rounds";
import { RoundTimeStore } from "../../../../src/game/rounds/round-time-store";
import { GameServiceMessage } from "../../../../src/shared";
import { gameSettings } from "../../container.test";
import { AppTypes } from "./../../../../src/shared/constants/app-type";
import { MainPlayerStore } from "../../../../src/players/main-player-store";

jest.mock("../../../../src/shared/utils/localization-manager", () => {
    return {
        Translator: {
            translate: jest.fn(),
            gameTranslate: jest.fn(),
            commonTranslate: jest.fn().mockImplementation((key, option) => key),
        },
    };
});

describe("DisableGameHandlers tests", () => {
    const fakeDisabledGameInfo: GameServiceMessage.DisabledGameInfo = {
        "vi-VN": "Fake disabled game message VN",
        "en-US": "Fake disabled game message",
        "zh-CN": "Fake disabled game message CN",
        "zh-TW": "Fake disabled game message TW",
        "th-TH": "Fake disabled game message TH",
        "id-ID": "Fake disabled game message ID",
    };

    let connectionStore: ConnectionStore,
        authStore: AuthStore,
        disabledGameStore: DisabledGameStore,
        noticeStore: NoticeStore,
        roundTimeStore: RoundTimeStore,
        backToOperatorLobby: AppHandlers.BackToOperatorLobby,
        handler: DisableGameHandlers,
        roundRunningHandlers: RoundRunningHandlers,
        mainPlayerStore: MainPlayerStore;

    beforeAll(() => {
        // arrange
        connectionStore = stub<ConnectionStore>();
        mainPlayerStore = stub<MainPlayerStore>();
        authStore = new AuthStore(mainPlayerStore);
        disabledGameStore = new DisabledGameStore();
        disabledGameStore.setGameStatus = jest.fn();
        disabledGameStore.setShowPopup = jest.fn();

        noticeStore = new NoticeStore();
        noticeStore.addNotice = jest.fn();
        gameSettings.durations.placingBet = 36;

        roundTimeStore = new RoundTimeStore(gameSettings);
        roundTimeStore.resetRoundTime = jest.fn();
        roundTimeStore.startNewRound = true;

        roundRunningHandlers = new RoundRunningHandlers(roundTimeStore, gameSettings);

        backToOperatorLobby = new AppHandlers.BackToOperatorLobby(
            new AppStore(),
            new PlayerSelectionHandlers.ClearHandlers(new PlayerSelectionStore())
        );

        handler = new DisableGameHandlers(
            connectionStore,
            authStore,
            roundTimeStore,
            disabledGameStore,
            noticeStore,
            backToOperatorLobby,
            roundRunningHandlers
        );
    });

    describe("onClosedHandle", () => {
        beforeEach(() => {
            connectionStore.onDisconnected = jest.fn();
            backToOperatorLobby.handle = jest.fn();
        });
        describe("when already disable game", () => {
            it("should disconnect socket and back to lobby", () => {
                // act
                handler.onClosedHandle();

                // assert
                expect(connectionStore.onDisconnected).toBeCalledTimes(1);
                expect(backToOperatorLobby.handle).toBeCalledTimes(1);
            });
        });

        it("should not call onDisconnected and handle when instant app", () => {
            // arrange
            authStore.system = AppTypes.Instant;

            // act
            handler.onClosedHandle();

            // assert
            expect(connectionStore.onDisconnected).not.toHaveBeenCalled();
            expect(backToOperatorLobby.handle).not.toHaveBeenCalled();
        });
    });

    describe("showPopupHandle", () => {
        const authStoreLangs = [
            ["vi-VN", fakeDisabledGameInfo["vi-VN"]],
            ["en-US", fakeDisabledGameInfo["en-US"]],
            ["zh-CN", fakeDisabledGameInfo["zh-CN"]],
            ["zh-TW", fakeDisabledGameInfo["zh-TW"]],
            ["th-TH", fakeDisabledGameInfo["th-TH"]],
            ["id-ID", fakeDisabledGameInfo["id-ID"]],
        ];
        test.each(authStoreLangs)("should set disable game true and open popup.", (authStoreLang, expectedDisabledMessages) => {
            // arrange
            disabledGameStore.um = true;
            disabledGameStore.disabled = true;
            authStore.language = authStoreLang;

            // act
            handler.showPopupHandle(fakeDisabledGameInfo);

            // assert
            expect(disabledGameStore.setShowPopup).toBeCalledWith(true);
            expect(noticeStore.addNotice).toHaveBeenCalledWith({
                message: expectedDisabledMessages,
                title: "notice",
                type: NoticeType.Error,
                onClose: expect.any(Function),
                showBtnConfirmButton: true,
                noticeInfo: NoticeInfo.DisabledGame,
            });
        });
    });

    describe("inGameHandle", () => {
        describe("when game is already disabled ", () => {
            describe("when popup is not show and run to next round", () => {
                it("should show popup and clear round running", () => {
                    // arrange
                    disabledGameStore.disabled = true;
                    disabledGameStore.um = true;
                    disabledGameStore.showPopup = false;
                    roundTimeStore.roundTime = 33;

                    handler.showPopupHandle = jest.fn();
                    roundRunningHandlers.stopRunner = jest.fn();

                    // act
                    handler.inGameHandle(fakeDisabledGameInfo);

                    // assert
                    expect(handler.showPopupHandle).toHaveBeenCalled();
                    expect(roundRunningHandlers.stopRunner).toHaveBeenCalled();
                });
            });

            describe("when popup is already show  and run to next round", () => {
                it("should not show popup and not touch to round running", () => {
                    // arrange
                    disabledGameStore.disabled = true;
                    disabledGameStore.showPopup = true;
                    roundTimeStore.roundTime = 33;

                    handler.showPopupHandle = jest.fn();
                    roundRunningHandlers.stopRunner = jest.fn();

                    // act
                    handler.inGameHandle(fakeDisabledGameInfo);

                    // assert
                    expect(handler.showPopupHandle).not.toHaveBeenCalled();
                    expect(roundRunningHandlers.stopRunner).not.toHaveBeenCalled();
                });
            });

            describe("when  popup is not show  adnnot run to next round ", () => {
                it("should not show popup", () => {
                    // arrange
                    disabledGameStore.disabled = true;
                    disabledGameStore.showPopup = false;
                    roundTimeStore.roundTime = 39;

                    handler.showPopupHandle = jest.fn();

                    // act
                    handler.inGameHandle(fakeDisabledGameInfo);

                    // assert
                    expect(handler.showPopupHandle).not.toHaveBeenCalled();
                });
            });
        });

        describe("when game is enable ", () => {
            it("should call stores", () => {
                // arrange
                disabledGameStore.disabled = false;
                roundTimeStore.roundTime = 39;

                // Reset mock call counts
                jest.clearAllMocks();

                // act
                handler.inGameHandle(fakeDisabledGameInfo);

                // assert
                expect(disabledGameStore.setGameStatus).toBeCalledTimes(1);
                expect(roundTimeStore.resetRoundTime).toBeCalledTimes(1);
            });
        });
    });

    describe("joinGameHandle", () => {
        it("should show popup", () => {
            // arrange
            handler.showPopupHandle = jest.fn();

            // act
            handler.joinGameHandle(fakeDisabledGameInfo);

            // assert
            expect(handler.showPopupHandle).toHaveBeenCalled();
        });
    });

    describe("handle", () => {
        test.each([
            [true, true, 1, 0],
            [false, false, 0, 1],
        ])(
            "should call in game and join game handle correctly.",
            (endRound, um, expectedNumerousInGameCall, expectedNumerousJoinGameCall) => {
                // arrange
                disabledGameStore.um = um;
                roundTimeStore.endRound = endRound;
                handler.inGameHandle = jest.fn();
                handler.joinGameHandle = jest.fn();

                // act
                handler.handle(fakeDisabledGameInfo);

                // assert
                expect(handler.inGameHandle).toBeCalledTimes(expectedNumerousInGameCall);
                expect(handler.joinGameHandle).toBeCalledTimes(expectedNumerousJoinGameCall);
            }
        );
    });
});
