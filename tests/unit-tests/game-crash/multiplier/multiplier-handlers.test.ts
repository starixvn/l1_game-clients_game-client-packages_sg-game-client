import { stub } from "jest-auto-stub";

import { RocketState } from "../../../../src/game-crash";
import { MultiplierHandlers } from "../../../../src/game-crash/multiplier/multiplier-handlers";
import { MultiplierStore } from "../../../../src/game-crash/multiplier/multiplier-store";
import { RoundTimeStore } from "../../../../src/game/rounds/round-time-store";

describe("MultiplierHandlers", () => {
    let multiplierHandlers: MultiplierHandlers;
    let multiplierStore: MultiplierStore;
    let roundTimeStore: RoundTimeStore;

    beforeAll(() => {
        multiplierStore = stub<MultiplierStore>();
        roundTimeStore = stub<RoundTimeStore>({
            gameSetting: {
                durations: {
                    placingBet: 10,
                    startRound: 1
                }
            }
        });
    });

    beforeEach(() => {
        multiplierHandlers = new MultiplierHandlers(multiplierStore, roundTimeStore);
    });

    describe("handle", () => {
        const multiplierInfo = { m: 1, t: 2000 };

        it("should update multiplier", async () => {
            // Arrange

            // Act
            multiplierHandlers.handle(multiplierInfo);

            // Assert
            expect(multiplierHandlers["multiplierStore"].multiplier).toEqual(multiplierInfo.m);
        });

        it("should update time", async () => {
            // Arrange

            // Act
            multiplierHandlers.handle(multiplierInfo);

            // Assert
            expect(multiplierHandlers["multiplierStore"].time).toEqual(multiplierInfo.t);
        });
    });

    describe("handleMultiplierCrashed", () => {
        it("should update multiplier", async () => {
            // Arrange
            const multiplier = 10;

            // Act
            multiplierHandlers.handleMultiplierCrashed(multiplier);

            // Assert
            expect(multiplierHandlers["multiplierStore"].multiplier).toEqual(multiplier);
        });
    });

    describe("handleRocketState", () => {
        it("should update isCrashed", async () => {
            // Arrange
            const rocketState = RocketState.CRASHED;

            // Act
            multiplierHandlers.handleRocketState(rocketState);

            // Assert
            expect(multiplierHandlers["multiplierStore"].rocketState).toEqual(rocketState);
        });
    });

    describe("changeRocketState", () => {
        it("when round time greater than 0", () => {
            // Arrange
            const roundTime = 8;
            multiplierHandlers.handleRocketState = jest.fn();

            // Act
            multiplierHandlers.changeRocketState(roundTime);

            // Assert
            expect(multiplierHandlers.handleRocketState).toBeCalledWith(RocketState.ONLAND);
        });

        it("when round time less than 0", () => {
            // Arrange
            const roundTime = -1;
            multiplierHandlers.handleRocketState = jest.fn();

            // Act
            multiplierHandlers.changeRocketState(roundTime);

            // Assert
            expect(multiplierHandlers.handleRocketState).toBeCalledWith(RocketState.FLYING);
        });

        it("when round time greater than placing bet + starting round", () => {
            // Arrange
            const roundTime = 12;
            multiplierHandlers.handleRocketState = jest.fn();
            // Ensure the mock returns the correct values
            Object.defineProperty(roundTimeStore, 'placingBet', {
                get: jest.fn().mockReturnValue(10)
            });
            Object.defineProperty(roundTimeStore, 'startRound', {
                get: jest.fn().mockReturnValue(1)
            });

            // Act
            multiplierHandlers.changeRocketState(roundTime);

            // Assert
            expect(multiplierHandlers.handleRocketState).toBeCalledWith(RocketState.CRASHED);
        });
    });
});
