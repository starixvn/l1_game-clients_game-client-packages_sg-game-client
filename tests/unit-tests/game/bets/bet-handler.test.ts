import { stub } from "jest-auto-stub";
import { BetHandler, BetStore } from "../../../../src/game/bets";
import { GameSetting } from "../../../../src/game/game-configs/game-setting";
import { NoticeStore } from "../../../../src/game/notices";
import { ROUND_STATE, RoundTimeStore } from "../../../../src/game/rounds";
import { MainPlayerStore } from "../../../../src/players";
import { GameClientEmitMessage } from "../../../../src/shared";
import { Translator } from "../../../../src/shared/utils/localization-manager";
import { ConnectionHandlers, ConnectionStore } from "./../../../../src/game/connection";
import { OrientationStore } from "./../../../../src/game/orientation";

jest.mock("../../../../src/shared/utils/localization-manager", () => ({
    Translator: { translate: jest.fn(), gameTranslate: jest.fn(), commonTranslate: jest.fn().mockImplementation((key, option) => key) },
}));

describe("BetHandler", () => {
    let connectionStore: ConnectionStore;
    let betStore: BetStore;
    let mainPlayerStore: MainPlayerStore;
    let orientationStore: OrientationStore;
    let roundTimeStore: RoundTimeStore;
    let noticeStore: NoticeStore;
    let betHandler: BetHandler;
    let retryHandler: ConnectionHandlers.RetryGameHandler;
    let betChoice: string;
    let showWarningProcessingBet;
    let gameSetting: GameSetting;
    let betInfo: any = {};

    beforeEach(() => {
        noticeStore = new NoticeStore();
        mainPlayerStore = new MainPlayerStore(noticeStore);
        connectionStore = stub<ConnectionStore>();
        betStore = new BetStore(mainPlayerStore);
        orientationStore = new OrientationStore();
        retryHandler = stub<ConnectionHandlers.RetryGameHandler>();

        gameSetting = stub<GameSetting>({
            isSocketGateway: false,
            gameName: "testGame"
        });
        roundTimeStore = stub<RoundTimeStore>();
    });

    beforeEach(() => {
        betHandler = new BetHandler(
            connectionStore,
            betStore,
            mainPlayerStore,
            orientationStore,
            roundTimeStore,
            noticeStore,
            retryHandler,
            gameSetting
        );
        showWarningProcessingBet = jest.spyOn(betHandler, "showWarningProcessingBet");

        betChoice = "even";
        connectionStore.send = jest.fn();
        noticeStore.addWarning = jest.fn();
        noticeStore.addProcessWarning = jest.fn();
        mainPlayerStore.name = "player";
        mainPlayerStore.balance = 100;
        mainPlayerStore.scoin = 100;
        betStore.isProcessingBet = false;
        roundTimeStore.roundState = ROUND_STATE.PLACING_BET;
        betInfo = { betChoice, amount: 200 };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handle", () => {
        it("should show warning, please bet next round, when locking bet", () => {
            // Arrange
            roundTimeStore.roundState = ROUND_STATE.LOCKING_BET;
            Translator.commonTranslate = jest.fn(() => "Please wait for the next round.");

            // Act
            betHandler.handle(betInfo);

            // Assert
            expect(noticeStore.addWarning).toBeCalledWith("Please wait for the next round.");
            expect(showWarningProcessingBet).not.toBeCalled();
            expect(connectionStore.send).not.toBeCalled();
        });

        it("should show warning, can not bet at the moment, when starting round", () => {
            // Arrange
            roundTimeStore.roundState = ROUND_STATE.STARTING_ROUND;
            Object.defineProperty(roundTimeStore, "isStartingRound", { value: true, configurable: true, writable: true });
            Translator.commonTranslate = jest.fn(() => "Cannot bet at the moment. Please wait for a few seconds.");

            // Act
            betHandler.handle(betInfo);

            // Assert
            expect(noticeStore.addWarning).toBeCalledWith("Cannot bet at the moment. Please wait for a few seconds.");
            expect(showWarningProcessingBet).not.toBeCalled();
            expect(connectionStore.send).not.toBeCalled();
        });

        it("should showWarningProcessingBet when isProcessingBet true", () => {
            // Arrange
            betStore.isProcessingBet = true;

            // Act
            betHandler.handle(betInfo);

            // Assert
            expect(showWarningProcessingBet).toBeCalled();
            expect(connectionStore.send).not.toBeCalled();
        });

        describe("BetHandler when game client check balance", () => {
            let betInfo: any = {};
            beforeEach(() => {
                mainPlayerStore.balance = 100;
                betStore.amount = 200;
                gameSetting.validateBalanceWhenBet = true;
            });

            afterEach(() => {
                gameSetting.validateBalanceWhenBet = false;
            });

            it("should show error notice when amount is greater than balance", () => {
                // Arrange
                betStore.freebetEnabled = false;
                Translator.commonTranslate = jest.fn(() => "Your account has insufficient funds.");

                // Act
                betHandler.handle(betInfo);

                // Assert
                expect(noticeStore.addWarning).toBeCalledWith("Your account has insufficient funds.");
                expect(connectionStore.send).not.toBeCalled();
            });

            it("should show error notice when freebet is enabled and scoin is less than amount", () => {
                // Arrange
                betStore.freebetEnabled = true;
                Translator.commonTranslate = jest.fn(() => "Not enough Scoin to place bet.");

                // Act
                betHandler.handle(betInfo);

                // Assert
                expect(noticeStore.addWarning).toBeCalledWith("Not enough Scoin to place bet.");
                expect(connectionStore.send).not.toBeCalled();
            });
        });

        describe("BetHandler when game client without check balance", () => {
            let betInfo: any = {};
            beforeEach(() => {
                mainPlayerStore.balance = 100;
                betStore.amount = 200;
                gameSetting.validateBalanceWhenBet = false;
            });

            it("without show error notice when amount is greater than balance and game client without check balance", () => {
                // Arrange
                betStore.freebetEnabled = false;
                Translator.commonTranslate = jest.fn(() => "Your account has insufficient funds.");

                // Act
                betHandler.handle(betInfo);

                // Assert
                expect(noticeStore.addWarning).not.toBeCalled();
                expect(connectionStore.send).toBeCalled();
            });

            it("without show error notice when freebet is enabled and scoin is less than amount and game client without check balance", () => {
                // Arrange
                betStore.freebetEnabled = true;
                Translator.commonTranslate = jest.fn(() => "Not enough Scoin to place bet.");

                // Act
                betHandler.handle(betInfo);

                // Assert
                expect(noticeStore.addWarning).not.toBeCalled();
                expect(connectionStore.send).toBeCalled();
            });
        });

        it("should send bet data to server when amount is less than scoin or balance ", () => {
            // Arrange
            mainPlayerStore.scoin = 100;
            mainPlayerStore.balance = 100;
            betStore.amount = 50;
            betInfo = { betChoice, amount: 50 };

            // Act
            betHandler.handle(betInfo);

            // Assert
            expect(noticeStore.addWarning).not.toBeCalled();
            expect(connectionStore.send).toBeCalledWith(GameClientEmitMessage.Bet.eventName, {
                m: orientationStore.m,
                username: mainPlayerStore.name,
                betChoice,
                amount: betStore.amount,
                freeBet: betStore.freebetEnabled,
                clientSentTime: expect.any(Date),
            });
            expect(retryHandler.handle).toBeCalled();
        });

        it("should send bet data in gateway format when isSocketGateway is true", () => {
            // Arrange
            mainPlayerStore.scoin = 100;
            mainPlayerStore.balance = 100;
            betStore.amount = 50;
            betInfo = { betChoice, amount: 50 };
            Object.defineProperty(gameSetting, 'isSocketGateway', { value: true, writable: true });
            Object.defineProperty(gameSetting, 'gameName', { value: "testGame", writable: true });

            // Act
            betHandler.handle(betInfo);

            // Assert
            expect(noticeStore.addWarning).not.toBeCalled();
            expect(connectionStore.send).toBeCalledWith(GameClientEmitMessage.Bet.eventName, {
                gameName: "testGame",
                betData: {
                    m: orientationStore.m,
                    username: mainPlayerStore.name,
                    betChoice,
                    amount: betStore.amount,
                    freeBet: betStore.freebetEnabled,
                    clientSentTime: expect.any(Date),
                }
            });
            expect(retryHandler.handle).toBeCalled();
        });
    });

    describe("showWarningProcessingBet", () => {
        it("should showWarningProcessingBet when isProcessingBet true", () => {
            // Arrange
            Translator.commonTranslate = jest.fn(() => "Data are being processed. Please wait...");
            const text = "Data are being processed. Please wait...";

            // Act
            betHandler.showWarningProcessingBet();

            // Assert
            expect(noticeStore.addProcessWarning).toBeCalledWith(text);
        });
    });

    describe("isInPhasePreventBet", () => {
        it("should return false when round state is placing bet", () => {
            // Arrange
            roundTimeStore.roundState = ROUND_STATE.PLACING_BET;

            // Act
            const value = betHandler.isInPhasePreventBet();

            // Assert
            expect(value).toEqual(false);
        });

        it("should return true when round state is locking bet", () => {
            // Arrange
            roundTimeStore.roundState = ROUND_STATE.LOCKING_BET;

            // Act
            const value = betHandler.isInPhasePreventBet();

            // Assert
            expect(value).toEqual(true);
        });
    });
});
