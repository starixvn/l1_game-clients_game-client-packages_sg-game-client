import { stub } from "jest-auto-stub";
import { ChipHandlers, ChipStore } from "../../../../src/game/chips";
import { GameConfigStore } from "../../../../src/game/game-configs";
import { RoundStore, RoundTimeStore } from "../../../../src/game/rounds";
import { MainPlayerStore } from "../../../../src/players";
import { GameServiceMessage } from "../../../../src/shared";

describe("ChipHandlers", () => {
    let chipHandlers: ChipHandlers;
    let chipStoreMock: ChipStore;
    let mainPlayerStore: MainPlayerStore;
    let roundTimeStore: RoundTimeStore;
    let gameConfigStore: GameConfigStore;
    let roundStore: RoundStore;

    beforeEach(() => {
        mainPlayerStore = stub<MainPlayerStore>();
        mainPlayerStore.rate = 1;
        roundTimeStore = stub<RoundTimeStore>();
        gameConfigStore = stub<GameConfigStore>();
        roundStore = stub<RoundStore>();
        chipStoreMock = new ChipStore(mainPlayerStore, roundTimeStore, gameConfigStore, roundStore);
        chipStoreMock.chips = {
            "1": {
                even: {
                    "5": 4,
                },
            },
        };

        chipHandlers = new ChipHandlers(chipStoreMock);
    });

    test("can handle chips message", () => {
        // Arrange
        const chipsMessage = {
            "1": {
                even: {
                    "5": 4,
                },
            },
        };

        // Act
        chipHandlers.handleChips(chipsMessage);

        // Assert
        expect(chipStoreMock.chips).toEqual(chipsMessage);
    });

    test("can handle player chip message", () => {
        // Arrange
        gameConfigStore.chips = ["2", "5"];
        const playerChipMessage = {
            playerId: "1",
            betChoice: "even",
            amount: 5,
            red: 10,
        };
        const addChipToClientChipsSpy = jest.spyOn(chipHandlers, "addChipToClientChips");

        // Act
        chipHandlers.handlePlayerChip(playerChipMessage);

        // Assert
        expect(chipStoreMock.playerChip).toEqual(playerChipMessage);
        expect(addChipToClientChipsSpy).toBeCalled();
    });

    test("can handle own chip message", () => {
        // Arrange
        const ownChipMessage = {
            playerId: 1,
            betChoice: "even",
            amount: 10,
            red: 10,
        };
        const addChipToClientChipsSpy = jest.spyOn(chipHandlers, "addChipToClientChips");

        // Act
        chipHandlers.handleOwnChip(ownChipMessage);

        // Assert
        expect(chipStoreMock.ownChip).toEqual(ownChipMessage);
        expect(addChipToClientChipsSpy).toBeCalledWith(chipStoreMock.ownChip);
    });

    describe("addChipToClientChips", () => {
        it("should add chip to clientChips, when not exist chip value of specific bet choice", () => {
            // Arrange
            const ownChipMessage = {
                playerId: 1,
                betChoice: "even",
                amount: 10,
                red: 10,
            };
            chipStoreMock.clientChips = {};

            // Act
            chipHandlers.addChipToClientChips(ownChipMessage);

            // Assert
            expect(chipStoreMock.clientChips["even"]["10"]).toEqual(1);
        });

        it("should increase number of chips , when exist chip value on specific bet choice.", () => {
            // Arrange
            const ownChipMessage = {
                playerId: 1,
                betChoice: "even",
                amount: 10,
                red: 10,
            };
            chipStoreMock.clientChips = {
                even: { 10: 2 },
            };

            // Act
            chipHandlers.addChipToClientChips(ownChipMessage);

            // Assert
            expect(chipStoreMock.clientChips["even"]["10"]).toEqual(3);
        });
    });

    test("eventHandleList contains the correct handlers", () => {
        // Arrange
        const eventHandleList = chipHandlers.eventHandleList;

        // Assert
        expect(eventHandleList).toHaveLength(4);
        expect(eventHandleList[0].name).toBe(GameServiceMessage.Chips.eventName);
        expect(eventHandleList[1].name).toBe(GameServiceMessage.PlayerChip.eventName);
        expect(eventHandleList[2].name).toBe(GameServiceMessage.OwnChip.eventName);
        expect(eventHandleList[3].name).toBe(GameServiceMessage.ReBet.eventName);
        expect(typeof eventHandleList[0].handle).toBe('function');
        expect(typeof eventHandleList[1].handle).toBe('function');
        expect(typeof eventHandleList[2].handle).toBe('function');
        expect(typeof eventHandleList[3].handle).toBe('function');
    });
});
