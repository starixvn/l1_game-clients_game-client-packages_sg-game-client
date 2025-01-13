import { inject, injectable } from "inversify";

import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { RoundStore } from "./round-store";

@injectable()
export class RoundHandlers implements IMultipleHandlers {
    constructor(@inject(RoundStore) protected readonly store: RoundStore) {}

    handleRoundId(roundId: number) {
        if (roundId > 0) {
            this.store.roundId = roundId;
        }
    }

    handleOwnBets(ownBets: GameServiceMessage.OwnBets) {
        this.store.ownBets = ownBets;
    }

    handleTotalBets(totalBets: GameServiceMessage.TotalBets) {
        this.store.setTotalBets(totalBets);
    }

    handleResultHash(resultHash: GameServiceMessage.ResultHash) {
        this.store.resultHash = resultHash;
    }

    handleUserBetPercent(userBetPercent: GameServiceMessage.UserBetPercentage) {
        this.store.userBetPercentage = userBetPercent;
    }

    handleBetPercent(betPercent: GameServiceMessage.BetPercentage) {
        this.store.betPercentage = betPercent;
    }

    handleBoostedOdds(boostedOdds: GameServiceMessage.BoostedOddsType) {
        this.store.boostedOdds = boostedOdds;
    }

    eventHandleList = [
        {
            name: GameServiceMessage.roundId,
            handle: this.handleRoundId,
        },
        {
            name: GameServiceMessage.OwnBets.eventName,
            handle: this.handleOwnBets,
        },
        {
            name: GameServiceMessage.TotalBets.eventName,
            handle: this.handleTotalBets,
        },
        {
            name: GameServiceMessage.ResultHash.eventName,
            handle: this.handleResultHash,
        },
        {
            name: GameServiceMessage.UserBetPercentage.eventName,
            handle: this.handleUserBetPercent,
        },

        {
            name: GameServiceMessage.BetPercentage.eventName,
            handle: this.handleBetPercent,
        },
        {
            name: GameServiceMessage.BoostedOdds.eventName,
            handle: this.handleBoostedOdds,
        },
    ];
}
