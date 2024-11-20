import { inject, injectable } from "inversify";
import { GameConfigStore } from "../game/game-configs";
import { RoundRunningHandlers } from "../game/rounds";
import { GameClientEmitMessage, IHandler } from "../shared";
import { GatewayConnectionStore, ISocketOption } from "./gateway-connection-store";

export namespace GatewayConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(@inject(GatewayConnectionStore) protected readonly store: GatewayConnectionStore) {}

        handle(customizeOptions?: ISocketOption) {
            this.store.initConnection(customizeOptions);
        }
    }

    @injectable()
    export class InGameHandler implements IHandler<string> {
        constructor(
            @inject(GatewayConnectionStore) private readonly connectionStore: GatewayConnectionStore,
            @inject(RoundRunningHandlers) private readonly roundRunning: RoundRunningHandlers,
            @inject(GameConfigStore) private readonly gameConfigStore: GameConfigStore
        ) {}

        handle(gameName: string) {
            if (this.gameConfigStore.initialized) {
                return;
            }
            this.roundRunning.stopRunner();
            this.connectionStore.send(GameClientEmitMessage.inGame, gameName);
        }
    }

    @injectable()
    export class RetryGameHandler implements IHandler<void> {
        private retryGameId: NodeJS.Timeout;

        constructor(@inject(GatewayConnectionStore) private readonly connectionStore: GatewayConnectionStore) {}

        handle() {
            this.clearInterval();
            this.retryGameId = setInterval(() => {
                this.connectionStore.send(GameClientEmitMessage.retry, null);
            }, 1000);
        }

        clearInterval() {
            this.retryGameId && clearInterval(this.retryGameId);
        }
    }

    @injectable()
    export class CloseConnectHandler implements IHandler<string> {
        constructor(@inject(GatewayConnectionStore) private readonly connectionStore: GatewayConnectionStore) {}

        handle(gameName: string) {
            this.connectionStore.closeSocket(gameName);
            // this.connectionStore.reset();
        }
    }

    @injectable()
    export class SignInHandler {
        constructor(@inject(GatewayConnectionStore) protected readonly store: GatewayConnectionStore) {}

        handle(gameName: string) {
            this.store.signIn(gameName);
        }
    }
}
