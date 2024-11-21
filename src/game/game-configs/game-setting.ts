export type DurationSetting = {
    wholeRound: number;
    placingBet: number;
    lockingBet: number;
    showingResult?: number;
    generatingResult?: number;
    startRound?: number;
    wholeShoe?: number;
};

export class GameSetting {
    id: number;
    name: string;
    configName?: string;
    durations: DurationSetting;
    choices?: string[];
    hedgeBetGroups?: string[][];
    numberOfRoundHistory: number;
    validateBalanceWhenBet?: boolean;
    durationShowPromptMessage?: number;
    isSocketGateway?: false;
    serviceName?: string;
    gameName: string;
}
