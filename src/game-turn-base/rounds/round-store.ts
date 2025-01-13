import { inject, injectable } from "inversify";
import { MainPlayerStore } from "../../players";
import { GameConfigStore } from "../../game/game-configs";
import { RoundHistoryStore } from "../../game/round-histories";
import { SettlementStore } from "../../game/settlements";
import { RoundTimeStore } from "./round-time-store";
import { RoundOdds, RoundStore as RoundStoreBase } from "../../game/rounds";
import { action, makeObservable, observable } from "mobx";
import { GameServiceMessage } from "../../shared/models/game-messages";

@injectable()
export class RoundStore extends RoundStoreBase {
    protected override displayedRoundId: string = "drawId";

    constructor(
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(RoundHistoryStore) protected readonly roundHistoryStore: RoundHistoryStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(SettlementStore) protected readonly settlementStore: SettlementStore,
        public drawId: number = 0,
        public odds = {},
        public roundData: GameServiceMessage.TurnBaseGameRoundData = {
            balls: [],
            drawId: 0,
        }
    ) {
        super(gameConfigStore, roundHistoryStore, roundTimeStore, mainPlayerStore, settlementStore);

        this.drawId = drawId;
        this.odds = odds;
        this.roundData = roundData;

        makeObservable(this, {
            drawId: observable,
            odds: observable,
            roundData: observable,
            setRoundData: action,
        });
    }

    setRoundData(roundData: GameServiceMessage.TurnBaseGameRoundData) {
        this.roundData = roundData;
    }

    override get roundOdds(): RoundOdds {
        return {
            odds: this.odds,
            fractional: this.mainPlayerStore.fractionalOddsFormat,
            boostedChoices: [],
        };
    }
}
