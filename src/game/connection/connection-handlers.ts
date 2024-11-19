import { inject, injectable } from "inversify";
import { GameClientEmitMessage, IHandler } from "../../shared";
import { GameConfigStore } from "../game-configs/game-config-store";
import { RoundRunningHandlers } from "../rounds";
import { ConnectionStore, ISocketOption } from "./connection-store";

export namespace ConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(@inject(ConnectionStore) protected readonly store: ConnectionStore) {}

        handle(customizeOptions?: ISocketOption) {
            this.store.initConnection(customizeOptions);
        }
    }

    @injectable()
    export class InGameHandler implements IHandler<void> {
        constructor(
            @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
            @inject(RoundRunningHandlers) private readonly roundRunning: RoundRunningHandlers,
            @inject(GameConfigStore) private readonly gameConfigStore: GameConfigStore
        ) {}

        handle() {
            if (this.gameConfigStore.initialized) {
                return;
            }
            this.roundRunning.stopRunner();
            this.connectionStore.send(GameClientEmitMessage.inGame, null);
        }

        handleGateway(gameName?: string) {
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

        constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) {}

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
    export class CloseConnectHandler implements IHandler<void> {
        constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) {}

        handle() {
            this.connectionStore.closeSocket();
            this.connectionStore.reset();
        }

        handleGateway(gameName: string) {
            this.connectionStore.closeSocketGateway(gameName);
            this.connectionStore.reset();
        }
    }

    @injectable()
    export class SignInHandler {
        constructor(@inject(ConnectionStore) protected readonly store: ConnectionStore) {}

        handle(gameName: string) {
            this.store.signIn(gameName);
        }
    }
}
