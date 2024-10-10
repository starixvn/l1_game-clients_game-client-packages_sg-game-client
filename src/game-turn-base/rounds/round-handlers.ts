import { inject, injectable } from "inversify";

import { GameServiceMessage } from "../../shared";
import { RoundStore } from "./round-store";
import { GameSetting } from "../game-configs/game-setting";
import { RoundTimeStore, TURN_ROUND_STATE } from "./round-time-store";
import { GameTurnBaseServiceMessage } from "../game-turn-base-messages";
import { RoundHandlers as RoundHandlersBase } from "../../game/rounds";
import { BetStore } from "../../game/bets";

@injectable()
export class RoundHandlers extends RoundHandlersBase {
    constructor(
        @inject(RoundStore) protected readonly store: RoundStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(GameSetting) readonly gameSetting: GameSetting
    ) {
        super(store);
    }

    handleOwnChip(ownChip: GameTurnBaseServiceMessage.OwnChip) {
        this.betStore.betChoice = Object.keys(ownChip.betChoices)[0];
    }

    handleDrawId(drawId: number) {
        const { roundTime, isDisplayingResultState, isShowResult } = this.roundTimeStore;
        if (roundTime < 0) {
            return;
        }
        if (isDisplayingResultState && isShowResult) {
            this.store.setClientRoundId(drawId - 1);
        } else {
            this.store.setClientRoundId(drawId);
        }
    }

    handleOdds(odds: GameServiceMessage.Odds) {
        this.store.odds = odds;
    }

    handleRoundData(roundData: GameServiceMessage.TurnBaseGameRoundData) {
        this.store.setRoundData(roundData);
    }

    handleFinish(finish: GameServiceMessage.Finish | undefined) {
        const result = finish?.result as GameServiceMessage.LuckyNextResult;
        const resultRoundData = {
            balls: [result?.ball],
        };

        this.store.setRoundData({
            balls: this.store.roundData?.balls?.concat(resultRoundData.balls) || resultRoundData.balls,
            drawId: result?.drawId,
        });
    }

    eventHandleList = [
        {
            name: GameTurnBaseServiceMessage.drawId,
            handle: this.handleDrawId,
        },
        {
            name: GameTurnBaseServiceMessage.odds,
            handle: this.handleOdds,
        },
        {
            name: GameServiceMessage.TurnBaseGameRoundData.eventName,
            handle: this.handleRoundData,
        },
        {
            name: GameServiceMessage.Finish.eventName,
            handle: this.handleFinish,
        },
        {
            name: GameTurnBaseServiceMessage.OwnChip.eventName,
            handle: this.handleOwnChip,
        },
    ];
}
