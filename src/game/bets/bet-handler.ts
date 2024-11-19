import { injectable } from "inversify";

import { BetHandlerBase } from "./bet-handler-base";

export interface IBetInfo {
    betChoice: string;
    amount: number;
    gameName?: string;
}

@injectable()
export class BetHandler extends BetHandlerBase {
    handle(betInfo: IBetInfo) {
        const betData = this.createBetData(betInfo);
        this.handleBetData(betData);
    }
}
