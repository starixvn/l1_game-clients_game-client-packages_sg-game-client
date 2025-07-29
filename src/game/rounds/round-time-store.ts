import { inject, injectable } from "inversify";
import { action, computed, makeAutoObservable, makeObservable, observable } from "mobx";

import { GameSetting } from "../game-configs";

/**
 * Timeline:
 *
 *   Settle                                                                                                 Settle
 *   |                                                                                                        |
 *   V                                                                                                        V
 *   |-------------------------|---------------|-------------------|---------------|---------------|-----------|-------------------------|
 *   |  SHOW_ANIMATION_RESULT  |  SHOW_RESULT  |   STARTING_ROUND  |  PLACING_BET  |  LOCKING_BET  |  WAITING  |  SHOW_ANIMATION_RESULT  |
 *   |-------------------------|---------------|-------------------|---------------|---------------|-----------|-------------------------|
 *   | in 2s(generatingResult) |               | in 1s(startRound) |               |               |           |
 *   39 Whole round            37              31                  30              5               0       0...|... 39 Whole round
 */

export const ROUND_STATE = {
    START_GAME_LOOP: "startGameLoop",
    STARTING_ROUND: "startingRound",
    PLACING_BET: "placingBet",
    LOCKING_BET: "lockingBet",
    WAITING: "waiting",
    SHOW_ANIMATION_RESULT: "showAnimationResult",
    SHOW_RESULT: "showResult",
    CHANGE_REMAINING_TIME: "changeRemainingTime",
    STOP_GAME_LOOP: "stopGameLoop",
    NONE: "none",
};

export const RoundTimeInitValue = -99999;

@injectable()
export class RoundTimeStore {
    durationShowPromptMessage = 2;

    constructor(
        @inject(GameSetting) readonly gameSetting: GameSetting,
        public roundTime = RoundTimeInitValue,
        public roundState = ROUND_STATE.NONE,
        public teamData = {},
        public countdownTimer = 0,
        public remaining = 0,
        public startNewRound = false,
        public endRound = false,
        public startPlacingBet = false,
        public endPlacingBet = false
    ) {
        this.roundState = roundState;
        this.roundTime = roundTime;
        this.teamData = teamData;
        this.countdownTimer = countdownTimer;
        this.remaining = remaining;
        this.startNewRound = startNewRound;
        this.endRound = endRound;
        this.startPlacingBet = startPlacingBet;
        this.endPlacingBet = endPlacingBet;

        makeObservable(this, {
            roundTime: observable,
            roundState: observable,
            teamData: observable,
            countdownTimer: observable,
            remaining: observable,
            startNewRound: observable,
            endRound: observable,
            startPlacingBet: observable,
            endPlacingBet: observable,
            durationShowPromptMessage: observable,

            isWaiting: computed,
            isStartWaiting: computed,
            isLocking: computed,
            isStartLocking: computed,
            isPlacingBet: computed,
            isStartPlacingBet: computed,
            isShowAnimationResult: computed,
            isShowResult: computed,
            isStartRound: computed,
            isStartingRound: computed,
            isTimeOut: computed,
            isInRoundTime: computed,
            isShowDisabledGameMessage: computed,
            isDisplayingResultState: computed,
            isVisibleReBet: computed,
            isShowStartBetMessage: computed,

            resetRoundTime: action,
            setDurationShowPromptMessage: action,
            resetRoundTimeStore: action,
            start: action,
            calculateRoundStatus: action,
            countdown: action
        });

        this.setDurationShowPromptMessage(gameSetting?.durationShowPromptMessage);
    }

    get wholeRound() {
        return this.gameSetting.durations.wholeRound;
    }
    get placingBet() {
        return this.gameSetting.durations.placingBet;
    }
    get lockingBet() {
        return this.gameSetting.durations.lockingBet;
    }
    get generatingResult() {
        return this.gameSetting.durations.generatingResult;
    }
    get showingResult() {
        return this.gameSetting.durations.showingResult;
    }
    get startRound() {
        return this.gameSetting.durations.startRound;
    }
    get wholeShoe() {
        return this.gameSetting.durations.wholeShoe;
    }

    get initialized() {
        return this.roundTime !== RoundTimeInitValue;
    }

    get isWaiting() {
        return this.roundTime > this.placingBet;
    }

    get isStartWaiting() {
        return this.roundTime === this.wholeRound;
    }

    get isLocking() {
        return this.roundTime <= this.lockingBet && this.roundTime > 0;
    }

    get isStartLocking() {
        return this.roundTime === this.lockingBet;
    }

    get isPlacingBet() {
        return this.roundTime <= this.placingBet && this.roundTime > this.lockingBet;
    }

    get isStartPlacingBet() {
        return this.roundTime === this.placingBet;
    }

    get isShowAnimationResult() {
        if (this.roundTime > this.wholeRound) {
            return this.roundTime <= this.wholeShoe && this.roundTime > this.wholeShoe - this.generatingResult;
        }

        return (this.roundTime <= this.wholeRound && this.roundTime > this.wholeRound - this.generatingResult) || this.roundTime === 0;
    }

    get isShowResult() {
        if (this.roundTime > this.wholeRound) {
            return (
                this.roundTime <= this.wholeShoe - this.generatingResult &&
                this.roundTime >= this.wholeShoe - this.generatingResult - this.showingResult
            );
        }

        return (
            this.roundTime <= this.wholeRound - this.generatingResult + 1 &&
            this.roundTime > this.placingBet + this.startRound &&
            this.wholeRound !== 0
        );
    }

    get isStartRound() {
        return this.roundTime === this.placingBet + this.startRound;
    }

    get isStartingRound() {
        return this.roundTime <= this.placingBet + this.startRound && this.roundTime > this.placingBet;
    }

    get isTimeOut() {
        return this.roundTime === 0;
    }

    get isInRoundTime() {
        return this.roundState === ROUND_STATE.PLACING_BET || this.roundState === ROUND_STATE.LOCKING_BET;
    }

    get isShowDisabledGameMessage() {
        return this.roundTime <= this.placingBet;
    }

    get isDisplayingResultState() {
        return (
            this.roundState === ROUND_STATE.SHOW_ANIMATION_RESULT ||
            this.roundState === ROUND_STATE.SHOW_RESULT ||
            this.roundState === ROUND_STATE.STOP_GAME_LOOP
        );
    }

    get isVisibleReBet() {
        return this.isStartingRound || this.isLocking || this.isWaiting;
    }

    get isShowStartBetMessage() {
        return this.roundTime <= this.placingBet + this.durationShowPromptMessage && this.roundTime > this.placingBet;
    }

    resetRoundTime() {
        this.roundTime = this.wholeRound;
    }

    setDurationShowPromptMessage(durationShowPromptMessage?: number) {
        durationShowPromptMessage && (this.durationShowPromptMessage = durationShowPromptMessage);
    }

    countdown() {
        if (this.roundTime <= 1) {
            this.roundTime = 0;
        } else {
            this.roundTime--;
        }

        this.calculateRoundStatus();
    }

    calculateRoundStatus() {
        this.roundState = this.getCurrentRoundState();

        if (this.roundTime < 0) {
            return;
        }

        if (this.isWaiting) {
            this.remaining = this.roundTime - this.placingBet;
        }

        if (this.isShowAnimationResult) {
            this.remaining = this.generatingResult;
        }

        if (this.isShowResult) {
            let duration = 0;

            if (this.roundTime > this.wholeRound) {
                const minTime = this.wholeShoe - this.generatingResult - this.showingResult;
                duration = this.roundTime - minTime;
            } else {
                duration = this.roundTime - this.placingBet - this.startRound;
            }

            this.remaining = duration;
            this.countdownTimer = duration;
        }

        if (this.isStartingRound) {
            this.remaining = this.startRound;
        }

        if (this.isPlacingBet) {
            this.remaining = this.roundTime - this.lockingBet;
            this.countdownTimer = this.roundTime;
        }

        if (this.isLocking) {
            this.remaining = this.roundTime;
            this.countdownTimer = this.roundTime;
        }
    }

    getCurrentRoundState(): string {
        if (this.roundTime < 0) {
            return ROUND_STATE.WAITING;
        }

        if (this.isShowAnimationResult) {
            return ROUND_STATE.SHOW_ANIMATION_RESULT;
        }

        if (this.isShowResult) {
            return ROUND_STATE.SHOW_RESULT;
        }

        if (this.isStartingRound) {
            return ROUND_STATE.STARTING_ROUND;
        }

        if (this.isPlacingBet) {
            return ROUND_STATE.PLACING_BET;
        }

        if (this.isLocking) {
            return ROUND_STATE.LOCKING_BET;
        }

        if (this.isWaiting) {
            return ROUND_STATE.WAITING;
        }

        return ROUND_STATE.WAITING;
    }

    start() {
        this.roundState = ROUND_STATE.START_GAME_LOOP;
    }

    resetRoundTimeStore() {
        this.roundState = ROUND_STATE.STOP_GAME_LOOP;
    }
}
