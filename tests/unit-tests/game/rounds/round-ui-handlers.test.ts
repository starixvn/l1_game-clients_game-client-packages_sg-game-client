import { stub } from "jest-auto-stub";
import { RoundUIHandlers } from "../../../../src/game/rounds/round-ui-handlers";
import { ChipStore } from "../../../../src/game/chips";
import { RoundStore } from "../../../../src/game/rounds/round-store";
import { RoundTimeStore } from "../../../../src/game/rounds/round-time-store";
import { SettlementStatusStore } from "../../../../src/game/settlements/settlement-status-store";
import { SettlementStore } from "../../../../src/game/settlements/settlement-store";

describe("RoundUIHandlers", () => {
    let roundTimeStore: RoundTimeStore;
    let roundStore: RoundStore;
    let settlementStatusStore: SettlementStatusStore;
    let settlementStore: SettlementStore;
    let chipStore: ChipStore;
    let chipStoreFactory: () => ChipStore;
    let startingRoundHandler: RoundUIHandlers.StartingRoundHandler;

    beforeEach(() => {
        roundTimeStore = stub<RoundTimeStore>();
        roundStore = stub<RoundStore>();
        settlementStatusStore = stub<SettlementStatusStore>();
        settlementStore = stub<SettlementStore>();
        chipStore = stub<ChipStore>();

        // Create a factory function that returns the chipStore
        chipStoreFactory = jest.fn(() => chipStore);

        startingRoundHandler = new RoundUIHandlers.StartingRoundHandler(
            roundTimeStore,
            roundStore,
            settlementStatusStore,
            settlementStore,
            chipStoreFactory
        );
    });

    describe("StartingRoundHandler", () => {
        it("should reset all stores when handle is called", () => {
            // Arrange
            jest.spyOn(startingRoundHandler, 'resetForNewRound');

            // Act
            startingRoundHandler.handle();

            // Assert
            expect(startingRoundHandler.resetForNewRound).toHaveBeenCalled();
        });

        it("should reset chips, round, settlement status, and settlement store", () => {
            // Arrange
            jest.spyOn(chipStore, 'resetChips');
            jest.spyOn(roundStore, 'resetForNewRound');
            jest.spyOn(settlementStatusStore, 'resetSettlementStatus');
            jest.spyOn(settlementStore, 'resetSettlementStore');

            // Act
            startingRoundHandler.resetForNewRound();

            // Assert
            expect(chipStore.resetChips).toHaveBeenCalled();
            expect(roundStore.resetForNewRound).toHaveBeenCalled();
            expect(settlementStatusStore.resetSettlementStatus).toHaveBeenCalled();
            expect(settlementStore.resetSettlementStore).toHaveBeenCalled();
        });
    });
});
