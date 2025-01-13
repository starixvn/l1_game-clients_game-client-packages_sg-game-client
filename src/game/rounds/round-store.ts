import { inject, injectable } from "inversify";
import { computed, makeObservable, observable, action } from "mobx";

import { MainPlayerStore } from "../../players";
import { GameServiceMessage } from "../../shared";
import { GameConfigStore } from "../game-configs";
import { RoundHistoryStore } from "../round-histories";
import { SettlementStore } from "../settlements";
import { ROUND_STATE, RoundTimeStore } from "./round-time-store";

export type Bets = {
    [betChoice: string]: number;
};

export type RoundOdds = {
    odds: GameServiceMessage.Odds;
    boostedChoices: string[];
    fractional: boolean;
};

export interface THighlightAnim {
    isAnim: boolean;
    settlementResult: GameServiceMessage.TSettlementResult;
}

export interface THighlightStatic {
    settlementResult: GameServiceMessage.TSettlementResult;
    result: GameServiceMessage.TResult;
}

@injectable()
export class RoundStore {
    totalBets: GameServiceMessage.TotalBets = {};
    _clientRoundId = 0;
    protected displayedRoundId: string = "roundId";

    constructor(
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(RoundHistoryStore) protected readonly roundHistoryStore: RoundHistoryStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(SettlementStore) protected readonly settlementStore: SettlementStore,
        public roundId = 0,
        public resultHash = null,
        public ownBets = {},
        public userBetPercentage = null,
        public betPercentage = {},
        public boostedOdds: GameServiceMessage.BoostedOddsType = null
    ) {
        this.roundId = roundId;
        this.resultHash = resultHash;
        this.ownBets = ownBets;
        this.userBetPercentage = userBetPercentage;
        this.betPercentage = betPercentage;
        this.boostedOdds = boostedOdds;

        makeObservable(this, {
            roundId: observable,
            resultHash: observable,

            totalBets: observable,
            setTotalBets: action,

            ownBets: observable,
            userBetPercentage: observable,
            betPercentage: observable,
            boostedOdds: observable,

            clientRoundId: computed,
            setClientRoundId: action,

            historyRoundId: computed,
            minBet: computed,
            maxBet: computed,
            roundOdds: computed,

            isResetHighlight: computed,
            highLightAnim: computed,
            highlightStatic: computed,

            resetForNewRound: action,
            resetRoundStore: action,
        });
    }

    get clientRoundId() {
        const currentFinish = this.settlementStore.currentFinish;

        if (!currentFinish || this.historyRoundId >= currentFinish[this.displayedRoundId]) {
            return this.historyRoundId;
        }

        return currentFinish[this.displayedRoundId];
    }

    get historyRoundId() {
        let lastRoundId = 0;

        if (this.roundHistoryStore.histories.length > 0) {
            lastRoundId = this.roundHistoryStore.histories[0][this.displayedRoundId];
        }

        if (
            this.roundTimeStore.roundState === ROUND_STATE.STARTING_ROUND ||
            this.roundTimeStore.roundState === ROUND_STATE.PLACING_BET ||
            this.roundTimeStore.roundState === ROUND_STATE.LOCKING_BET ||
            this.roundTimeStore.roundState === ROUND_STATE.WAITING
        ) {
            lastRoundId++;
        }

        // when clearing all active data in database and having data in archive collection
        if (this.roundHistoryStore.histories.length === 0 && this[this.displayedRoundId] > 0) {
            lastRoundId = this[this.displayedRoundId];
        }

        if (this._clientRoundId < lastRoundId) {
            this._clientRoundId = lastRoundId;
        }
        return this._clientRoundId;
    }

    get minBet() {
        return Math.max(this.gameConfigStore.minBet, this.mainPlayerStore.stakeLevel.minBet);
    }

    get maxBet() {
        return Math.min(this.gameConfigStore.maxBet, this.mainPlayerStore.stakeLevel.maxBet);
    }

    get roundOdds() {
        return {
            odds: this.gameConfigStore.odds,
            fractional: this.mainPlayerStore.fractionalOddsFormat,
            boostedChoices: this.gameConfigStore.boostedChoices,
        };
    }

    get isResetHighlight(): boolean {
        let isResetHighlight = false;

        switch (this.roundTimeStore.roundState) {
            case ROUND_STATE.LOCKING_BET:
            case ROUND_STATE.STOP_GAME_LOOP:
            case ROUND_STATE.SHOW_ANIMATION_RESULT:
                isResetHighlight = true;
                break;
        }

        return isResetHighlight;
    }

    get highLightAnim(): THighlightAnim {
        const isAnim = this.settlementStore.isFinishedShowResult;
        const settlementResult = this.roundHistoryStore?.getLastRound()?.settlementResult;

        return {
            isAnim,
            settlementResult,
        };
    }

    get highlightStatic(): THighlightStatic {
        let settlementResult: GameServiceMessage.TSettlementResult = null;
        let result: GameServiceMessage.TResult = null;
        if (this.roundTimeStore.isPlacingBet || this.roundTimeStore.isStartingRound) {
            const lastRound = this.roundHistoryStore?.getLastRound();
            settlementResult = lastRound?.settlementResult;
            result = lastRound?.result;
        }

        return { settlementResult, result };
    }

    setClientRoundId(roundId: number) {
        this._clientRoundId = roundId;
    }

    setTotalBets(totalBets: GameServiceMessage.TotalBets) {
        this.totalBets = Object.keys(totalBets).reduce((total, betChoice) => {
            total[betChoice] = this.totalBets[betChoice] / this.mainPlayerStore.rate;
            return total;
        }, {});
    }

    resetForNewRound() {
        this.ownBets = {};
        this.totalBets = {};
        this.userBetPercentage = null;
        this.betPercentage = {};
    }

    resetRoundStore() {
        this.resetForNewRound();
        this.resultHash = null;
    }
}
