import { inject, injectable } from "inversify";
import { GameClientEmitMessage, IHandler } from "../../shared";
import { GameSetting } from "../game-configs";
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

        handleGateway() {
            this.store.initGatewayConnection();
        }
    }

    @injectable()
    export class JoinGameHandler {
        constructor(
            @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
            @inject(GameSetting) protected readonly gameSetting: GameSetting
        ) {}

        handle() {
            this.connectionStore.joinGame(this.gameSetting.gameName, this.gameSetting?.serviceName);
        }
    }

    @injectable()
    export class InGameHandler implements IHandler<void> {
        constructor(
            @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
            @inject(RoundRunningHandlers) private readonly roundRunning: RoundRunningHandlers,
            @inject(GameConfigStore) private readonly gameConfigStore: GameConfigStore,
            @inject(GameSetting) protected readonly gameSetting: GameSetting
        ) {}

        handle() {
            if (this.gameConfigStore.initialized) {
                return;
            }
            this.roundRunning.stopRunner();
            this.connectionStore.send(GameClientEmitMessage.inGame, null);
        }

        handleGateway() {
            if (this.gameConfigStore.initialized) {
                return;
            }
            this.roundRunning.stopRunner();
            // this.connectionStore.send(GameClientEmitMessage.inGame, this.gameSetting.gameName);
            this.connectionStore.send(GameClientEmitMessage.inGame, { id: "123" });
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
        constructor(
            @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
            @inject(GameSetting) protected readonly gameSetting: GameSetting
        ) {}

        handle() {
            this.connectionStore.closeSocket();
            this.connectionStore.reset();
        }

        handleGateway() {
            this.connectionStore.closeSocketGateway(this.gameSetting.gameName);
            this.connectionStore.reset();
        }
    }

    @injectable()
    export class SignInHandler {
        constructor(
            @inject(ConnectionStore) protected readonly store: ConnectionStore,
            @inject(GameSetting) protected readonly gameSetting: GameSetting
        ) {}

        handle() {
            this.store.signIn(this.gameSetting.gameName, this.gameSetting?.serviceName);
        }
    }
}
