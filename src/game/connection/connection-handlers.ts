import { inject, injectable } from "inversify";
import { GameClientEmitMessage, IHandler } from "../../shared";
import { GameSetting } from "../game-configs";
import { GameConfigStore } from "../game-configs/game-config-store";
import { RoundRunningHandlers } from "../rounds";
import { ConnectionStore, ISocketOption } from "./connection-store";

export namespace ConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(@inject(ConnectionStore) protected readonly store: ConnectionStore) { }

        handle(customizeOptions?: ISocketOption) {
            console.log("[ConnectionHandlers] Initializing connection with options:", customizeOptions);
            this.store.initConnection(customizeOptions);
        }

        handleGateway() {
            console.log("[ConnectionHandlers] Initializing gateway connection");
            this.store.initGatewayConnection();
        }
    }

    @injectable()
    export class JoinGameHandler {
        constructor(@inject(ConnectionStore) protected readonly connectionStore: ConnectionStore) { }

        handle() {
            console.log("[ConnectionHandlers] Joining game");
            this.connectionStore.joinGame();
        }
    }

    @injectable()
    export class InGameHandler implements IHandler<void> {
        constructor(
            @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
            @inject(RoundRunningHandlers) private readonly roundRunning: RoundRunningHandlers,
            @inject(GameConfigStore) private readonly gameConfigStore: GameConfigStore
        ) { }

        handle() {
            console.log("[ConnectionHandlers] Handling in-game state");
            if (this.gameConfigStore.initialized) {
                console.log("[ConnectionHandlers] Game config already initialized, skipping");
                return;
            }
            this.roundRunning.stopRunner();
            console.log("[ConnectionHandlers] Sending in-game message");
            this.connectionStore.send(GameClientEmitMessage.inGame, null);
        }

        handleGateway() {
            console.log("[ConnectionHandlers] Handling gateway in-game state");
            if (this.gameConfigStore.initialized) {
                console.log("[ConnectionHandlers] Game config already initialized, skipping gateway");
                return;
            }
            this.roundRunning.stopRunner();
            console.log("[ConnectionHandlers] Sending gateway in-game message");
            this.connectionStore.send(GameClientEmitMessage.inGame, { id: "123" });
        }
    }

    @injectable()
    export class RetryGameHandler implements IHandler<void> {
        private retryGameId: NodeJS.Timeout;

        constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) { }

        handle() {
            console.log("[ConnectionHandlers] Starting retry game handler");
            this.clearInterval();
            this.retryGameId = setInterval(() => {
                console.log("[ConnectionHandlers] Sending retry message");
                this.connectionStore.send(GameClientEmitMessage.retry, null);
            }, 1000);
        }

        clearInterval() {
            console.log("[ConnectionHandlers] Clearing retry interval");
            this.retryGameId && clearInterval(this.retryGameId);
        }
    }

    @injectable()
    export class CloseConnectHandler implements IHandler<void> {
        constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) { }

        handle() {
            console.log("[ConnectionHandlers] Closing socket connection");
            this.connectionStore.closeSocket();
            this.connectionStore.reset();
        }

        handleGateway() {
            console.log("[ConnectionHandlers] Closing gateway socket connection");
            this.connectionStore.closeSocketGateway();
            this.connectionStore.reset();
        }
    }

    @injectable()
    export class SignInHandler {
        constructor(
            @inject(ConnectionStore) protected readonly store: ConnectionStore,
            @inject(GameSetting) protected readonly gameSetting: GameSetting
        ) { }

        handle() {
            console.log("[ConnectionHandlers] Signing in to game:", this.gameSetting.gameName, "service:", this.gameSetting?.serviceName);
            this.store.signIn(this.gameSetting.gameName, this.gameSetting?.serviceName);
        }
    }
}
