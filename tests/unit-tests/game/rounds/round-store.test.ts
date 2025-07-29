import { stub } from "jest-auto-stub";
import { GameConfigStore } from "../../../../src/game/game-configs/game-config-store";
import { RoundHistoryStore } from "../../../../src/game/round-histories/round-history-store";
import { ROUND_STATE, RoundTimeStore } from "../../../../src/game/rounds";
import { RoundStore } from "../../../../src/game/rounds/round-store";
import { SettlementStore } from "../../../../src/game/settlements/settlement-store";
import { MainPlayerStore } from "../../../../src/players/main-player-store";
jest.mock("mobx");
const gameConfig = {
    minBet: 1,
    maxBet: 40000,
    maxBetPerChoices: {
        even: 40000,
        odd: 40000,
        red3: 40000,
        white3: 40000,
        red4: 4000,
        white4: 4000,
        red2: 40000,
    },
    chips: ["1", "5", "10", "50", "100", "200", "500", "1000", "2000", "3000", "5000", "10000", "20000"],
    stakeLevels: [],
    odds: {
        even: 1.96,
        odd: 1.96,
        red3: 3.75,
        white3: 3.75,
        red4: 14.4,
        white4: 14.4,
        red2: 2.4,
    },
    enableFreeBet: false,
};

const mockHistories = [
    {
        roundId: 1,
        result: {
            red1: false,
            red2: false,
            red3: true,
            red4: true,
        },
        settlementResult: {
            odd: false,
            even: true,
            red2: true,
            red3: false,
            red4: false,
            white3: false,
            white4: false,
        },
    },
];
describe("RoundStore", () => {
    let roundStore: RoundStore;
    let gameConfigStore: GameConfigStore;
    let mainPlayerStore: MainPlayerStore;
    let roundHistoryStore: RoundHistoryStore;
    let roundTimeStore: RoundTimeStore;
    let settlementStore: SettlementStore;

    beforeEach(() => {
        gameConfigStore = stub<GameConfigStore>();
        gameConfigStore.setGameConfigs(gameConfig);
        mainPlayerStore = stub<MainPlayerStore>();
        roundHistoryStore = stub<RoundHistoryStore>();
        roundTimeStore = stub<RoundTimeStore>();
        settlementStore = stub<SettlementStore>();
        roundStore = new RoundStore(gameConfigStore, roundHistoryStore, roundTimeStore, mainPlayerStore, settlementStore);
    });

    afterEach(() => jest.clearAllMocks());

    it("should have initial values", () => {
        // Assert
        expect(roundStore.roundId).toEqual(0);
        expect(roundStore.ownBets).toEqual({});
        expect(roundStore.totalBets).toEqual({});
        expect(roundStore.resultHash).toEqual(null);
    });

    it("should have minBet and maxBet from gameConfigStore and mainPlayerStore", () => {
        expect(roundStore.minBet).toEqual(Math.max(gameConfigStore.minBet, mainPlayerStore.stakeLevel.minBet));
        expect(roundStore.maxBet).toEqual(Math.min(gameConfigStore.maxBet, mainPlayerStore.stakeLevel.maxBet));
    });

    it("total bets should be converted rate", () => {
        // arrange
        mainPlayerStore.rate = 0.5;
        roundStore.totalBets = { even: 10, red4: 20, red3: 5 };

        // act
        const actual = roundStore.convertedTotalBets;

        // assert
        expect(actual).toEqual({ even: 20, red4: 40, red3: 10 });
    });

    it("resetForNewRound() should reset ownBets and totalBets", () => {
        // Arrange
        roundStore.ownBets = { "option A": 10, "option B": 20 };
        roundStore.totalBets = { "option A": 50, "option B": 70 };

        // Act
        roundStore.resetForNewRound();

        // Assert
        expect(roundStore.ownBets).toEqual({});
        expect(roundStore.totalBets).toEqual({});
    });

    it("resetRoundStore() should reset ownBets, totalBets, and resultHash", () => {
        // Arrange
        roundStore.ownBets = { even: 10, red4: 20 };
        roundStore.totalBets = { even: 10, red4: 20 };
        roundStore.resultHash = {
            rawValue: "rawTest",
            extraInfos: "infoTest",
            hashValue: "hashTest",
        };

        // Act
        roundStore.resetRoundStore();

        // Assert
        expect(roundStore.ownBets).toEqual({});
        expect(roundStore.totalBets).toEqual({});
        expect(roundStore.resultHash).toEqual(null);
    });

    describe("isResetHighlight", () => {
        test.each([
            [ROUND_STATE.LOCKING_BET, true],
            [ROUND_STATE.STOP_GAME_LOOP, true],
            [ROUND_STATE.SHOW_ANIMATION_RESULT, true],
            [ROUND_STATE.PLACING_BET, false],
        ])("should return %s when roundState is %s", (roundState, expected) => {
            // Arrange
            roundTimeStore.roundState = roundState;

            // Act
            const result = roundStore.isResetHighlight;

            // Assert
            expect(result).toBe(expected);
        });
    });

    describe("get highLightAnim", () => {
        test.each([
            [true, mockHistories[0].settlementResult],
            [false, mockHistories[0].settlementResult],
        ])("should return { isAnim: %s, settlementResult: %s }", (expectedIsAnim, expectedSettlementResult) => {
            // Arrange
            settlementStore.isFinishedShowResult = expectedIsAnim;
            jest.spyOn(roundHistoryStore, "getLastRound").mockReturnValue(mockHistories[0]);

            // Act
            const result = roundStore.highLightAnim;

            // Assert
            expect(result).toEqual({ isAnim: expectedIsAnim, settlementResult: expectedSettlementResult });
        });
    });

    describe("get highLightBorder()", () => {
        test.each([
            [
                ROUND_STATE.PLACING_BET,
                {
                    settlementResult: mockHistories[0].settlementResult,
                    result: mockHistories[0].result,
                },
            ],
            [
                ROUND_STATE.STARTING_ROUND,
                {
                    settlementResult: mockHistories[0].settlementResult,
                    result: mockHistories[0].result,
                },
            ],
            // Add more test cases as needed
        ])("returns the expected result for roundState %s", (roundState, expected) => {
            // Arrange
            roundTimeStore.roundState = roundState;

            jest.spyOn(roundHistoryStore, "getLastRound").mockReturnValue(mockHistories[0]);

            // Act
            const result = roundStore.highlightStatic;

            // Assert
            expect(result).toEqual(expected);
        });
    });

    describe("historyRoundId", () => {
        describe("when round history is NOT empty", () => {
            describe("when clientRoundId < lastRoundId", () => {
                test.each([[ROUND_STATE.STARTING_ROUND], [ROUND_STATE.PLACING_BET], [ROUND_STATE.LOCKING_BET], [ROUND_STATE.WAITING]])(
                    "when roundState is %s, should return lastRoundId + 1",
                    (roundState) => {
                        // Arrange
                        roundTimeStore.roundState = roundState;
                        roundHistoryStore.histories = [
                            { roundId: 11, result: {}, settlementResult: {}, winningPlayers: {} },
                            { roundId: 12, result: {}, settlementResult: {}, winningPlayers: {} },
                        ];
                        roundStore._clientRoundId = 0;

                        // Act
                        const result = roundStore.historyRoundId;

                        // Assert
                        expect(result).toEqual(12);
                    }
                );

                it("when roundState after settle time, should return lastRoundId", () => {
                    // Arrange
                    roundTimeStore.roundState = ROUND_STATE.SHOW_ANIMATION_RESULT;
                    roundHistoryStore.histories = [
                        { roundId: 11, result: {}, settlementResult: {}, winningPlayers: {} },
                        { roundId: 12, result: {}, settlementResult: {}, winningPlayers: {} },
                    ];
                    roundStore._clientRoundId = 0;

                    // Act
                    const result = roundStore.historyRoundId;

                    // Assert
                    expect(result).toEqual(11);
                });
            });

            describe("when clientRoundId >= lastRoundId", () => {
                test.each([[ROUND_STATE.STARTING_ROUND], [ROUND_STATE.PLACING_BET], [ROUND_STATE.LOCKING_BET], [ROUND_STATE.WAITING]])(
                    "when roundState is %s, should return clientRoundId",
                    (roundState) => {
                        // Arrange
                        roundTimeStore.roundState = roundState;
                        roundHistoryStore.histories = [
                            { roundId: 11, result: {}, settlementResult: {}, winningPlayers: {} },
                            { roundId: 12, result: {}, settlementResult: {}, winningPlayers: {} },
                        ];
                        roundStore._clientRoundId = 15;

                        // Act
                        const result = roundStore.historyRoundId;

                        // Assert
                        expect(result).toEqual(15);
                    }
                );

                it("when roundState after settle time, should return clientRoundId", () => {
                    // Arrange
                    roundTimeStore.roundState = ROUND_STATE.SHOW_ANIMATION_RESULT;
                    roundHistoryStore.histories = [
                        { roundId: 11, result: {}, settlementResult: {}, winningPlayers: {} },
                        { roundId: 12, result: {}, settlementResult: {}, winningPlayers: {} },
                    ];
                    roundStore._clientRoundId = 15;

                    // Act
                    const result = roundStore.historyRoundId;

                    // Assert
                    expect(result).toEqual(15);
                });
            });
        });

        describe("when round history is empty", () => {
            describe("when clientRoundId < lastRoundId", () => {
                it("when roundId > 0, should return roundId", () => {
                    // Arrange
                    roundTimeStore.roundState = ROUND_STATE.SHOW_ANIMATION_RESULT;
                    roundHistoryStore.histories = [];
                    roundStore._clientRoundId = 0;
                    roundStore.roundId = 20;

                    // Act
                    const result = roundStore.historyRoundId;

                    // Assert
                    expect(result).toEqual(20);
                });
            });
            describe("when clientRoundId > lastRoundId", () => {
                it("when roundId > 0, should return clientRoundId", () => {
                    // Arrange
                    roundTimeStore.roundState = ROUND_STATE.SHOW_ANIMATION_RESULT;
                    roundHistoryStore.histories = [];
                    roundStore._clientRoundId = 30;
                    roundStore.roundId = 20;

                    // Act
                    const result = roundStore.historyRoundId;

                    // Assert
                    expect(result).toEqual(30);
                });
            });
        });
    });
});
