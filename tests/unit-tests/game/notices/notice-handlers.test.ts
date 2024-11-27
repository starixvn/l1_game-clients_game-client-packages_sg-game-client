import { stub } from "jest-auto-stub";
import { AuthStore } from "../../../../src/auth/auth-store";
import { NoticeHandlers, NoticeStore } from "../../../../src/game/notices";
import { RoundStore } from "../../../../src/game/rounds/round-store";
import { GameServiceMessage } from "../../../../src/shared";
import { GameSetting } from "../../../../src/game/game-configs";
jest.mock("../../../../src/shared/utils/localization-manager", () => ({
    Translator: { translate: jest.fn(), gameTranslate: jest.fn(), commonTranslate: jest.fn().mockImplementation((key, option) => key) },
}));

describe("NoticeHandlers test", () => {
    let instance: NoticeHandlers;
    let roundStore: RoundStore;
    let noticeStore: NoticeStore;
    let authStore: AuthStore;
    let gameSetting: GameSetting;
    beforeAll(() => {
        roundStore = stub<RoundStore>();
        noticeStore = stub<NoticeStore>();
        gameSetting = stub<GameSetting>();
        instance = new NoticeHandlers(roundStore, noticeStore, authStore, gameSetting);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("handleNotice", () => {
        it("do nothing, when notice data does not contain gameRoundId", () => {
            // Arrange
            const data = stub<GameServiceMessage.Notice>();
            delete data.gameRoundId;

            // Act
            instance.handleNotice(data);

            // Assert
            expect(noticeStore.addWarning).not.toBeCalled();
        });

        it("do nothing, when notice data contain gameRoundId, but not equal current round id", () => {
            // Arrange
            const data = stub<GameServiceMessage.Notice>();
            data.gameRoundId = 1;
            roundStore.roundId = 2;

            // Act
            instance.handleNotice(data);

            // Assert
            expect(noticeStore.addWarning).not.toBeCalled();
        });

        it("show warning, when notice data contain gameRoundId, and equal current round id", () => {
            // Arrange
            const data = stub<GameServiceMessage.Notice>({
                hedgeBetGroup: [],
                errorCode: "1001",
            });
            data.gameRoundId = 1;
            roundStore.roundId = 1;

            // Act
            instance.handleNotice(data);

            // Assert
            expect(noticeStore.addWarning).toBeCalled();
        });
    });
});
