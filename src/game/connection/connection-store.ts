import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { ManagerOptions, Socket, SocketOptions, io } from "socket.io-client";
import * as MsgpackParser from "socket.io-msgpack-parser";
import { AuthStore, ISessionInfo } from "../../auth";
import { SiteConfigs } from "../../configs/site-configs";
import { GatewayConnectionStore } from "../../gateway-connection";
import { GameClientEmitMessage, Mediator } from "../../shared";
import { SocketEvents } from "../../shared/constants/socket-event";
import { BrowserDomUtils, StorageManager, UrlUtils, localStorageKeys, sentryLogger } from "../../shared/utils";
import { GameSetting } from "../game-configs";
import { AppTypes } from "./../../shared/constants/app-type";

export const events = {
    ...SocketEvents,
    ...{
        signedIn: "signedIn",
    },
};

export interface ISocketOption {
    socketUri: string;
    proxyRoute?: string;
    forceNew?: boolean;
    enableMsgpackParser?: boolean;
    transports?: string[];
    upgrade?: boolean;
    path?: string;
    extraHeaders?: object;
    parser?: any;
    auth?: any;
}
export type TMessageEmit = {
    gameName: string;
    session: GameClientEmitMessage.Signin;
    serviceName?: string;
};

@injectable()
export class ConnectionStore {
    constructor(
        @inject(Mediator) protected readonly mediator: Mediator,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs,
        @inject(AuthStore) protected readonly authStore: AuthStore,
        @inject(GatewayConnectionStore) protected readonly gatewayStore: GatewayConnectionStore
    ) {
        makeAutoObservable(this);
    }

    connection: Socket = null;
    isConnected: boolean = null;
    isConnectFailed = false;
    signedIn = false;
    isDisconnect = false;

    initConnection(customizeOptions?: ISocketOption) {
        this.reset();

        const gameId = this.gameSetting.id;
        const socketUri = UrlUtils.buildServerUrl("http", `${this.siteConfigs.websocket.proxyPath}`, gameId, this.siteConfigs);

        const optionsDefault: ISocketOption = {
            path: UrlUtils.getProxyRoute(this.siteConfigs),
            socketUri,
            transports: ["websocket"],
            upgrade: false,
            forceNew: true,
        };
        const options = { ...optionsDefault, ...customizeOptions } as Partial<ManagerOptions & SocketOptions>;

        if (this.siteConfigs.enableMsgpackParserAllGames) {
            options.parser = MsgpackParser;
            this.connection = io(socketUri, options);
        } else {
            this.connection = io(socketUri, options);
        }

        this.initBaseListener();
    }

    initGatewayConnection() {
        this.reset();
        this.connection = this.gatewayStore?.connection;
        this.isConnected = this.gatewayStore?.isConnected;
        this.initBaseListener();
        this.connection && this.connection.onAny(this.onHandleData.bind(this));
    }

    initBaseListener() {
        if (this.connection) {
            this.connection.on(events.connect, this.onConnected.bind(this));
            this.connection.on(events.signedIn, this.onSignedIn.bind(this));
            this.connection.on(events.connectError, this.onConnectFailed.bind(this));
            this.connection.on(events.connectFailed, this.onConnectFailed.bind(this));
            this.connection.on(events.disconnect, this.onDisconnected.bind(this));
        }
    }

    onConnected() {
        this.isConnected = true;
        this.isConnectFailed = false;
        this.connection.onAny(this.onHandleData.bind(this));
        this.signIn();
    }

    onHandleData(event: string, data: any) {
        if (event?.toLocaleLowerCase() === this.gameSetting?.name.toLocaleLowerCase() || event?.toLocaleLowerCase() === "message") {
            Object.entries(data).forEach((entry) => {
                const [key, value] = entry;
                if (key === "signedIn" && value) {
                    this.onSignedIn();
                }
                this.mediator.emit(key, value);
            });
        } else {
            this.mediator.emit(event, data);
        }
    }

    signIn(gameName?: string, serviceName?: string) {
        const { session, username, system } = (StorageManager.get(localStorageKeys.session) as ISessionInfo) || {};

        const payload = new GameClientEmitMessage.Signin();
        payload.ss = session;
        payload.username = username;
        payload.system = system;

        const message: TMessageEmit | GameClientEmitMessage.Signin = gameName ? { gameName, session: payload } : payload;
        if (gameName && serviceName) {
            (message as TMessageEmit).serviceName = serviceName;
        }

        this.send(GameClientEmitMessage.Signin.eventName, message);
    }

    joinGame(gameName: string, serviceName?: string) {
        const { session, username, system } = (StorageManager.get(localStorageKeys.session) as ISessionInfo) || {};

        const payload = new GameClientEmitMessage.JoinGame();
        payload.ss = session;
        payload.username = username;
        payload.system = system;

        const message: TMessageEmit = { gameName, session: payload };
        if (serviceName) {
            message.serviceName = serviceName;
        }

        this.send(GameClientEmitMessage.JoinGame.eventName, message);
    }

    onSignedIn() {
        this.signedIn = true;
    }

    onConnectFailed(error?: Error) {
        this.isConnectFailed = true;
        this.isInstant() && this.postDisconnectMessage();
        this.handleConnectionStatus(false, error);
    }

    onDisconnected(reason = "") {
        this.handleDisconnectionReason(reason);
        this.isInstant() && this.handleDisconnectInstant(reason);
        this.handleConnectionStatus(false);
    }

    handleDisconnectionReason(reason = "") {
        if (this.isServerDisconnect(reason)) {
            this.isDisconnect = true;
            return;
        }

        if (this.shouldLogDisconnection(reason)) {
            this.isConnectFailed = true;
        }
    }

    handleConnectionStatus(connected: boolean, error?: Error) {
        this.isConnected = connected;
        this.signedIn = connected;
        if (this.gameSetting?.isSocketGateway) {
            this.connection.emit("outGame", this.gameSetting?.name.toLocaleLowerCase());
        } else {
            this.connection.disconnect();
        }

        error && this.logError(error);
    }

    handleDisconnectInstant(reason: string | unknown) {
        if (this.shouldPostDisconnectMessage(reason)) {
            this.postDisconnectMessage();
        }
    }

    private shouldPostDisconnectMessage(reason: string | unknown) {
        return this.isServerDisconnect(reason) || this.isTransportClose(reason);
    }

    private isServerDisconnect(reason: string | unknown) {
        return reason === "io server disconnect";
    }

    private isTransportClose(reason: string | unknown) {
        return reason === "transport close";
    }

    private postDisconnectMessage() {
        BrowserDomUtils.postMessageToParent({ isDisconnect: true });
    }

    private shouldLogDisconnection(reason: string | unknown) {
        return reason && reason !== "io client disconnect";
    }

    private logError(reason: string | Error) {
        sentryLogger.logError(reason);
    }

    private isInstant() {
        return this.authStore.system === AppTypes.Instant;
    }

    send(eventName: string, data: any) {
        this.connection?.emit(eventName, data);
    }

    closeSocket() {
        this.connection?.disconnect();
    }

    closeSocketGateway(gameName: string) {
        this.connection?.emit("outGame", gameName);
    }

    reset() {
        this.connection = null;
        this.isConnected = null;
        this.isConnectFailed = false;
        this.signedIn = false;
        this.isDisconnect = false;
    }
}
