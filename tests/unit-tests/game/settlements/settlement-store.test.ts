import { stub } from "jest-auto-stub";
import { makeAutoObservable } from "mobx";
import { SettlementStore } from "../../../../src/game/settlements";
import { MainPlayerStore } from "../../../../src/players/main-player-store";
import { GameServiceMessage } from "../../../../src/shared";
import { NumberUtils } from "../../../../src/shared/utils/number-utils";
import { makeObservable } from "mobx";

jest.mock("../../../../src/shared/utils/number-utils", () => ({ NumberUtils: { getValueByCurrency: jest.fn() } }));
jest.mock("mobx", () => ({
    makeObservable: jest.fn(),
    makeAutoObservable: jest.fn(),
    observable: jest.fn(),
    computed: jest.fn(),
    action: jest.fn()
}));

describe("SettlementStore tests", () => {
    let store: SettlementStore;
    let mainPlayerStore: MainPlayerStore;

    beforeEach(() => {
        mainPlayerStore = stub<MainPlayerStore>();
        store = new SettlementStore(mainPlayerStore);
    });

    describe("constructor", () => {
        it("should call makeObservable", () => {
            // assert
            expect(makeObservable).toHaveBeenCalledWith(store, {
                roundId: expect.any(Function),
                result: expect.any(Function),
                settlementResult: expect.any(Function),
                md5Result: expect.any(Function),
                currentFinish: expect.any(Function),
                pf: expect.any(Function),
                isFinishedShowResult: expect.any(Function),
                winningPlayers: expect.any(Function),
                setSettlementStore: expect.any(Function),
                resetSettlementStore: expect.any(Function)
            });
        });
    });
    describe("setSettlementStore", () => {
        it("should set settlement store", () => {
            // arrange
            const finish = new GameServiceMessage.Finish();
            finish.roundId = 1;
            const result = { red1: false, red2: true, red3: true, red4: true };
            finish.result = result;
            const settlementResult = { odd: true, even: false, red2: false, red3: true, red4: false, white3: false, white4: false };
            finish.settlementResult = settlementResult;
            finish.winningPlayers = {};

            // act
            store.setSettlementStore(finish);

            // assert
            expect(store.isFinishedShowResult).toBe(false);
            expect(store.roundId).toBe(1);
            expect(store.result).toEqual(result);
            expect(store.settlementResult).toEqual(settlementResult);
        });
    });

    describe("get winningPlayers", () => {
        it("should convert rate for balance before return value", () => {
            // arrange
            mainPlayerStore.rate = 1;
            const mockWinningPlayers = {
                "1234": {
                    bet: 1,
                    rate: 0.5,
                    win: true,
                    winningByChoices: {
                        choice1: 2,
                    },
                },
            };
            (NumberUtils.getValueByCurrency as jest.Mock).mockReturnValueOnce(0.5);
            store.winningPlayers = mockWinningPlayers;
            const expected = {
                "1234": {
                    ...mockWinningPlayers[1234],
                    bet: 0.5,
                },
            };
            // act
            const actual = store.winningPlayers;

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("resetSettlementStore", () => {
        it("should reset winningPlayers and settlementResult to null", () => {
            // Act
            store.winningPlayers = stub<GameServiceMessage.TWinningPlayers>();
            store.settlementResult = stub<GameServiceMessage.TSettlementResult>();

            // Arrange
            store.resetSettlementStore();

            // Assert
            expect(store.winningPlayers).toBeNull();
            expect(store.settlementResult).toBeNull();
        });

        it("should reset winningPlayers, settlementResult and result to null even if they are already null", () => {
            // Arrange
            store.resetSettlementStore();

            // Assert
            expect(store.winningPlayers).toBeNull();
            expect(store.settlementResult).toBeNull();
            expect(store.result).toBeNull();
        });
    });
});
