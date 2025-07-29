import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { ChipStore } from "./chip-store";

@injectable()
export class ChipHandlers implements IMultipleHandlers {
    private _eventHandleList: Array<{ name: string; handle: (input: any) => any }> | null = null;

    constructor(@inject(new LazyServiceIdentifer(() => ChipStore)) protected readonly store: ChipStore) { }

    get eventHandleList() {
        if (!this._eventHandleList) {
            this._eventHandleList = [
                {
                    name: GameServiceMessage.Chips.eventName,
                    handle: (input: any) => this.handleChips(input),
                },
                {
                    name: GameServiceMessage.PlayerChip.eventName,
                    handle: (input: any) => this.handlePlayerChip(input),
                },
                {
                    name: GameServiceMessage.OwnChip.eventName,
                    handle: (input: any) => this.handleOwnChip(input),
                },
                {
                    name: GameServiceMessage.ReBet.eventName,
                    handle: (input: any) => this.handleReBet(input),
                },
            ];
        }
        return this._eventHandleList;
    }

    handleChips(chips: GameServiceMessage.Chips) {
        this.store.chips = chips;
        this.store.convertChips();
    }

    handlePlayerChip(playerChip: GameServiceMessage.PlayerChip) {
        this.store.playerChip = playerChip;
        if (this.store.playerChip) {
            const { betChoice, amount } = this.store.playerChip;
            this.addChipToClientChips({ betChoice, amount });
        }
    }

    handleOwnChip(ownChip: GameServiceMessage.OwnChip) {
        this.store.ownChip = ownChip;
        this.addChipToClientChips(this.store.ownChip);
    }

    addChipToClientChips(chip: GameServiceMessage.OwnChip) {
        const { betChoice, amount } = chip;
        const betChoiceData = this.store.clientChips[betChoice] || {};
        const current = betChoiceData[amount] || 0;
        betChoiceData[amount] = current + 1;
        this.store.clientChips[betChoice] = betChoiceData;
    }

    handleReBet(reBet: GameServiceMessage.ReBet) {
        this.store.reBet = reBet;
    }
}
