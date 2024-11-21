import { inject, injectable } from "inversify";
import { AuthStore } from "../../auth";
import { MainPlayerStore } from "../../players";
import { GameServiceMessage, IMultipleHandlers, utils } from "../../shared";
import { Translator } from "../../shared/utils/localization-manager";
import { ConnectionStore } from "../connection/connection-store";
import { GameSetting } from "../game-configs";
import { NoticeInfo, NoticeStore, NoticeType } from "../notices";
import { AppTypes } from "./../../shared/constants/app-type";
import { ErrorStore } from "./error-store";

const { ErrorUtils } = utils;

@injectable()
export class ErrorHandlers implements IMultipleHandlers {
    constructor(
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(ErrorStore) protected readonly errorStore: ErrorStore,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore
    ) {}

    getSystem = () => {
        return this.authStore?.system || AppTypes.Club;
    };

    handleApiError(apiError: GameServiceMessage.ApiError) {
        this.errorStore.apiError = apiError;
        const { minBet, maxBet, errorCode } = apiError;

        const errorCodeString = errorCode.toString();
        if (ErrorUtils.isSessionTimeoutError(errorCodeString)) {
            this.authStore.errorCode = errorCodeString;
            return;
        }

        if (!!minBet) {
            this.mainPlayerStore.stakeLevel.minBet = minBet;
        }

        if (!!maxBet) {
            this.mainPlayerStore.stakeLevel.maxBet = maxBet;
        }

        const text = ErrorUtils.getErrorMessage(apiError, this.getSystem(), this.gameSetting.name);
        this.noticeStore.addNotice({
            message: text,
            title: Translator.commonTranslate("notice"),
            type: NoticeType.Error,
            onClose: null,
            noticeInfo: NoticeInfo.ApiError,
        });
    }

    handleErrorCode(errorCode: string) {
        const errorCodeString = errorCode.toString();
        if (ErrorUtils.isSessionTimeoutError(errorCodeString)) {
            this.authStore.errorCode = errorCodeString;

            return;
        }

        if (ErrorUtils.isConnectFailed(errorCodeString)) {
            setTimeout(() => {
                this.connectionStore.isConnectFailed = true;
            }, 1000);

            return;
        }

        const text = ErrorUtils.getTranslateMessage(errorCode, this.getSystem(), this.gameSetting.name);
        this.noticeStore.addNotice({
            message: text,
            title: Translator.commonTranslate("notice"),
            type: NoticeType.Error,
            onClose: null,
            noticeInfo: NoticeInfo.ApiError,
        });
    }

    eventHandleList = [
        {
            name: GameServiceMessage.ApiError.eventName,
            handle: this.handleApiError,
        },
        {
            name: GameServiceMessage.ErrorCode.eventName,
            handle: this.handleErrorCode,
        },
    ];
}
