import { inject, injectable } from "inversify";
import { AppHandlers } from "../../app/app-handlers";
import { AuthStore } from "../../auth";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { DefaultLanguage, SupportedLanguages } from "../../shared/languages";
import { Translator } from "../../shared/utils/localization-manager";
import { ConnectionStore } from "../connection/connection-store";
import { NoticeInfo, NoticeStore, NoticeType } from "../notices";
import { RoundRunningHandlers } from "../rounds";
import { ROUND_STATE, RoundTimeStore } from "../rounds/round-time-store";
import { AppTypes } from "./../../shared/constants/app-type";
import { DisabledGameStore } from "./disabled-game-store";

@injectable()
export class DisableGameHandlers implements IMultipleHandlers {
    constructor(
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(DisabledGameStore) protected readonly disabledGameStore: DisabledGameStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(AppHandlers.BackToOperatorLobby) protected readonly backToOperatorLobby: AppHandlers.BackToOperatorLobby,
        @inject(RoundRunningHandlers) protected readonly roundRunningHandlers: RoundRunningHandlers
    ) {
        this.onClosedHandle = this.onClosedHandle.bind(this);
    }

    onClosedHandle() {
        if (!this.isInstantOrDirectApp()) {
            this.connectionStore.onDisconnected();
            this.backToOperatorLobby.handle();
        }
    }

    isInstantOrDirectApp() {
        return this.authStore.system === AppTypes.Instant || this.authStore.system === AppTypes.Direct;
    }

    showPopupHandle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        if (this.disabledGameStore.um || this.roundTimeStore.roundState === ROUND_STATE.NONE) {
            const language = SupportedLanguages.includes(this.authStore.language) ? this.authStore.language : DefaultLanguage;
            this.noticeStore.addNotice({
                message: disabledGameInfo[language],
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: this.onClosedHandle,
                showBtnConfirmButton: true,
                noticeInfo: NoticeInfo.DisabledGame,
            });

            this.disabledGameStore.setShowPopup(true);
            this.roundTimeStore.roundState === ROUND_STATE.NONE && this.disabledGameStore.setGameStatus(true);
        }
    }

    inGameHandle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        if (this.disabledGameStore.disabled) {
            if (!this.disabledGameStore.showPopup && this.roundTimeStore.isShowDisabledGameMessage && this.disabledGameStore.um) {
                this.showPopupHandle(disabledGameInfo);
                this.roundRunningHandlers.stopRunner();
            }
        } else {
            this.disabledGameStore.setGameStatus(true);
            this.roundTimeStore.resetRoundTime();
        }
    }

    joinGameHandle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        !this.disabledGameStore.showPopup && this.showPopupHandle(disabledGameInfo);
    }

    handle(disabledGameInfo: GameServiceMessage.DisabledGameInfo) {
        this.roundTimeStore.endRound ? this.inGameHandle(disabledGameInfo) : this.joinGameHandle(disabledGameInfo);
    }

    handleUM(um: boolean) {
        this.disabledGameStore.um = um;
    }

    eventHandleList = [
        {
            name: GameServiceMessage.DisabledGameInfo.eventName,
            handle: this.handle,
        },
        {
            name: GameServiceMessage.um,
            handle: this.handleUM,
        },
    ];
}
