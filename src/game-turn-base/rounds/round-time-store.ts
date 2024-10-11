import { inject, injectable } from "inversify";
import { GameSetting } from "../game-configs/game-setting";
import type { TurnBaseDurationSetting } from "../game-configs/game-setting";
import { ROUND_STATE, RoundTimeInitValue, RoundTimeStore as RoundTimeStoreBase } from "../../game/rounds";

export const TURN_ROUND_STATE = {
    ...ROUND_STATE,
    SWITCH_ROUND: "SwitchRound",
};

@injectable()
export class RoundTimeStore extends RoundTimeStoreBase {
    private _durations: TurnBaseDurationSetting = null;
    totalMainRoundTime = RoundTimeInitValue;

    constructor(@inject(GameSetting) readonly gameSetting: GameSetting) {
        super(gameSetting);
        this._durations = this.gameSetting.durations as TurnBaseDurationSetting;
    }

    get totalTurns() {
        return this.gameSetting.totalTurns || 1;
    }

    get wholeTurn() {
        return this._durations.wholeTurn || 0;
    }

    get switchRoundAnimation() {
        return this._durations.switchRoundAnimation;
    }

    override resetRoundTime() {
        this.roundTime = this.wholeTurn;
        this.totalMainRoundTime = this.wholeRound;
    }

    get isSwitchRoundInTurn() {
        if (this.wholeRound > 0) {
            const startSwitchRoundPointTime = this.wholeRound - this.showingResult;
            const endSwitchRoundPointTime = startSwitchRoundPointTime - this.switchRoundAnimation;

            if (startSwitchRoundPointTime >= this.totalMainRoundTime && this.totalMainRoundTime > endSwitchRoundPointTime) {
                return true;
            }
        }

        return false;
    }

    get isShowResult() {
        if (this.totalTurns > 1) {
            return super.isShowResult;
        } else {
            return this.roundTime <= this.wholeRound - this.generatingResult + 1 && this.roundTime > this.placingBet;
        }
    }
    getRemainingTime(totalRoundTime: number): number {
        const turnRemainingTime = this.getRoundRemainingTimeToCalculateTurnRemainingTime(totalRoundTime) % this._durations.wholeTurn;

        return turnRemainingTime <= 0 ? this._durations.wholeTurn : turnRemainingTime;
    }

    getRoundRemainingTimeToCalculateTurnRemainingTime(remainingTime: number): number {
        const { wholeRound, showingResult, switchRoundAnimation, startRound } = this._durations;
        const startSwitchRoundPointTime = wholeRound - showingResult;
        const endSwitchRoundPointTime = startSwitchRoundPointTime - switchRoundAnimation;

        if (remainingTime > startSwitchRoundPointTime) {
            return remainingTime - switchRoundAnimation;
        }

        if (startSwitchRoundPointTime >= remainingTime && remainingTime > endSwitchRoundPointTime - startRound) {
            return endSwitchRoundPointTime - startRound;
        }

        return remainingTime;
    }

    override countdown() {
        if (this.totalMainRoundTime <= 1) {
            this.totalMainRoundTime = 0;
        } else {
            this.totalMainRoundTime--;
        }

        this.roundTime = this.getRemainingTime(this.totalMainRoundTime);
        this.calculateRoundStatus();
    }

    override getCurrentRoundState(): string {
        return this.isSwitchRoundInTurn ? TURN_ROUND_STATE.SWITCH_ROUND : super.getCurrentRoundState();
    }

    isInDisplayResultState() {
        return this.roundState === TURN_ROUND_STATE.SHOW_RESULT || this.roundState === TURN_ROUND_STATE.STARTING_ROUND;
    }
}
