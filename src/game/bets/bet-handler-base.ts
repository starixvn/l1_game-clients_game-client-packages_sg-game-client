import { inject, injectable } from "inversify";

import { MainPlayerStore } from "../../players";
import { GameClientEmitMessage } from "../../shared";
import { Translator } from "../../shared/utils/localization-manager";
import { ConnectionHandlers, ConnectionStore } from "../connection";
import { GameSetting } from "../game-configs/game-setting";
import { NoticeStore } from "../notices";
import { OrientationStore } from "../orientation";
import { ROUND_STATE, RoundTimeStore } from "../rounds";
import { BetStore } from "./bet-store";

@injectable()
export class BetHandlerBase {
    constructor(
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(OrientationStore) protected readonly orientationStore: OrientationStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler,
        @inject(GameSetting) protected readonly gameSetting: GameSetting
    ) {}

    isValidBet(amount: number) {
        if (this.isInPhasePreventBet()) {
            return this.invalidateBet();
        }

        if (this.betStore.isProcessingBet) {
            this.showWarningProcessingBet();
            return this.invalidateBet();
        }

        const availableBalance = this.betStore.availableBalance;
        if (this.gameSetting?.validateBalanceWhenBet && amount > availableBalance) {
            this.showNoticePlaceBetFailure();
            return this.invalidateBet();
        }

        return true;
    }

    invalidateBet(): boolean {
        this.betStore.validBet = { value: false };
        return false;
    }

    getBetAmount() {
        return this.betStore.amount;
    }

    createCommonBetData() {
        const { freebetEnabled } = this.betStore;
        return {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            freeBet: freebetEnabled,
            amount: this.getBetAmount(),
            clientSentTime: new Date(),
        };
    }

    createBetData(data: any) {
        const common = this.createCommonBetData();
        return { ...common, ...data };
    }

    handleBetData(data: any) {
        const amount = data.amount;
        if (this.isValidBet(amount)) {
            this.betStore.isProcessingBet = true;
            this.betStore.validBet = { value: false };
            const betData = this.gameSetting?.isSocketGateway ? { gameName: data?.gameName, betData: data } : data;
            this.connectionStore.send(GameClientEmitMessage.Bet.eventName, betData);

            this.retryGameHandler.handle();
        }
    }

    showNoticePlaceBetFailure() {
        const message = this.betStore.freebetEnabled
            ? Translator.commonTranslate("not_enough_scoin")
            : Translator.commonTranslate("not_enough_money");
        this.noticeStore.addWarning(message);
    }

    showWarningProcessingBet() {
        this.noticeStore.addProcessWarning(Translator.commonTranslate("message_processing_action"));
    }

    isInPhasePreventBet() {
        const isPreventBet = this.roundTimeStore.roundState !== ROUND_STATE.PLACING_BET;

        if (isPreventBet) {
            const isStartingRound = this.roundTimeStore.isStartingRound;
            const warningMsg = isStartingRound
                ? Translator.commonTranslate("message_cannot_bet")
                : Translator.commonTranslate("message_placebet_next_round");

            this.noticeStore.addWarning(warningMsg);
        }

        return isPreventBet;
    }
}
