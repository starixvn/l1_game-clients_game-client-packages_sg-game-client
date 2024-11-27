import { stub } from "jest-auto-stub";
import { GameServiceMessage } from "../../../../src/shared";
import { ErrorUtils } from "../../../../src/shared/utils";
import { AppTypes } from "./../../../../src/shared/constants/app-type";
jest.mock("../../../../src/shared/utils/localization-manager", () => {
    return {
        Translator: {
            translate: jest.fn().mockImplementation((key, option) => key),
            gameTranslate: jest.fn().mockImplementation((key, option) => key),
            commonTranslate: jest.fn().mockImplementation((key, option) => key),
        },
    };
});
describe("ErrorUtils", () => {
    const gameName = "test";
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("parseErrorCode", () => {
        const testCases = [
            { system: AppTypes.Club, expected: "Common.message_error_occurred" },
            { system: AppTypes.Instant, expected: "InstantGame.message_error_occurred" },
        ];

        it.each(testCases)("should return $expected for undefined error code", ({ system, expected }) => {
            const result = ErrorUtils.parseErrorCode("undefined", false, system);
            expect(result).toEqual(expected);
        });

        it("should return the correct error message for valid error codes", () => {
            const result = ErrorUtils.parseErrorCode("1001");
            expect(result).toEqual("Common.message_session_timeout");

            const result2 = ErrorUtils.parseErrorCode("2002");
            expect(result2).toEqual("Common.message_close_account");
        });

        it("should add suffix 'PlaceBet' for CommonErrorCodeList and isPlaceBet = true", () => {
            const result = ErrorUtils.parseErrorCode("1000", true, AppTypes.Instant);
            expect(result).toEqual("InstantGame.message_error_occurred_place_bet");
        });

        it("should not add suffix 'PlaceBet' for non-CommonErrorCodeList and isPlaceBet = true", () => {
            const result = ErrorUtils.parseErrorCode("SB1939", true);
            expect(result).toEqual("Common.message_hedge_bet");
        });
    });

    describe("getErrorMessage", () => {
        const testCases = [
            {
                system: AppTypes.Club,
                expected: "Common.message_error_occurred",
            },
            {
                system: AppTypes.Instant,
                expected: "InstantGame.message_error_occurred_place_bet",
            },
        ];

        it.each(testCases)("should return correct error message when AppTypes = %s", ({ system, expected }) => {
            const notice = stub<GameServiceMessage.Notice>({
                hedgeBetGroup: ["choice1", "choice2"],
                errorCode: "1000",
            });

            const result = ErrorUtils.getErrorMessage(notice, system, gameName);

            expect(result).toBe(expected);
        });
    });

    describe("createOptionForHedgeBetGroup", () => {
        it("should return a string with the correct error message", () => {
            const hedgeBetGroup = ["choice1", "choice2"];

            const result = ErrorUtils.createOptionForHedgeBetGroup(hedgeBetGroup, gameName);

            expect(result["betChoice1"]).toEqual(`${gameName}.glossary_choice1`);
            expect(result["betChoice2"]).toEqual(`${gameName}.glossary_choice2`);
        });
    });

    describe("isSessionTimeoutError", () => {
        test.each([
            ["1001", true],
            ["1002", true],
            ["SB0002", true],
            ["SB0011", true],
            ["9999", false],
        ])("should return true if error code is one of the expected token error codes", (errorCode, expected) => {
            // Act
            const result = ErrorUtils.isSessionTimeoutError(errorCode);

            // Assert
            expect(result).toBe(expected);
        });
    });
});
