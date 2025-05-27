import { inject, injectable } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { RoundRunningHandlers } from "./round-running-handlers";
import { RoundTimeStore } from "./round-time-store";

@injectable()
export class RoundTimeHandlers implements IMultipleHandlers {
    constructor(
        @inject(RoundTimeStore) protected readonly store: RoundTimeStore,
        @inject(RoundRunningHandlers) protected readonly roundRunningHandlers: RoundRunningHandlers
    ) { }

    handleRemainingTime(remainingTime: number) {
        this.roundRunningHandlers.stopRunner();
        this.store.roundTime = remainingTime;
        this.roundRunningHandlers.startRunner();
    }

    handleMatch(match: GameServiceMessage.Match) {
        this.store.teamData = match;
    }

    handleStartNewRoundStatus(snr: boolean) {
        this.store.startNewRound = snr;
    }

    handleStartPlacingBetStatus(spb: boolean) {
        this.store.startPlacingBet = spb;
    }

    handleEndPlacingBetStatus(epb: boolean) {
        this.store.endPlacingBet = epb;
    }

    handleEndRoundStatus(finish: GameServiceMessage.Finish | undefined) {
        if (finish) {
            this.store.endRound = true;
            this.store.endPlacingBet = false;
            this.store.startPlacingBet = false;
            this.store.startNewRound = false;
        }
    }

    eventHandleList = [
        {
            name: GameServiceMessage.remainingTime,
            handle: this.handleRemainingTime,
        },
        {
            name: GameServiceMessage.Match.eventName,
            handle: this.handleMatch,
        },
        {
            name: GameServiceMessage.snr,
            handle: this.handleStartNewRoundStatus,
        },
        {
            name: GameServiceMessage.spb,
            handle: this.handleStartPlacingBetStatus,
        },
        {
            name: GameServiceMessage.epb,
            handle: this.handleEndPlacingBetStatus,
        },
        {
            name: GameServiceMessage.Finish.eventName,
            handle: this.handleEndRoundStatus,
        },
    ];
}
