import { inject, injectable, LazyServiceIdentifer } from "inversify";
import { reaction, when } from "mobx";
import { IHandler } from "../../shared";
import { ChipStore } from "../chips";
import { SettlementStatusStore, SettlementStore } from "../settlements";
import { RoundStore } from "./round-store";
import { RoundTimeStore } from "./round-time-store";

export namespace RoundUIHandlers {
    @injectable()
    export class StartingRoundHandler implements IHandler<void> {
        private chipStore: ChipStore;

        constructor(
            @inject(RoundTimeStore) private readonly roundTimeStore: RoundTimeStore,
            @inject(RoundStore) private readonly roundStore: RoundStore,
            @inject(SettlementStatusStore) private readonly settlementStatusStore: SettlementStatusStore,
            @inject(SettlementStore) private readonly settlementStore: SettlementStore,
            @inject(new LazyServiceIdentifer(() => ChipStore)) private readonly chipStoreFactory: () => ChipStore
        ) {
            reaction(
                () => this.roundTimeStore.isStartingRound,
                (isStartRound) => isStartRound && this.handle()
            );

            when(
                () => !!this.roundTimeStore?.isStartingRound,
                () => {
                    this.handle();
                }
            );
        }

        handle() {
            this.resetForNewRound();
        }

        resetForNewRound() {
            this.chipStore = this.chipStoreFactory();
            this.chipStore.resetChips();
            this.roundStore.resetForNewRound();
            this.settlementStatusStore.resetSettlementStatus();
            this.settlementStore.resetSettlementStore();
        }
    }
}
