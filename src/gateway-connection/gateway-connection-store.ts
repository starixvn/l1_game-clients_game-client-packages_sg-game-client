import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { ManagerOptions, Socket, SocketOptions, io } from "socket.io-client";
import * as MsgpackParser from "socket.io-msgpack-parser";
import { AuthStore, ISessionInfo } from "../auth";
import { SiteConfigs } from "../configs/site-configs";
import { GameClientEmitMessage, Mediator } from "../shared";
import { SocketEvents } from "../shared/constants/socket-event";
import { StorageManager, UrlUtils, localStorageKeys, sentryLogger } from "../shared/utils";

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

@injectable()
export class GatewayConnectionStore {
    constructor(
        @inject(Mediator) protected readonly mediator: Mediator,
        @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs,
        @inject(AuthStore) protected readonly authStore: AuthStore
    ) {
        makeAutoObservable(this);
    }

    connection: Socket = null;
    isConnected: boolean = null;
    isConnectFailed = false;
    signedIn = false;
    isDisconnect = false;

    initConnection(customizeOptions?: ISocketOption) {
        if (this.connection && this.isConnected) {
            return;
        }

        const socketUri = UrlUtils.buildSocketGatewayUrl("http", "/", this.siteConfigs.subSocketGatewayDomain, this.siteConfigs);
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
    }

    onHandleData(event: string, data: any) {
        if (event?.toLocaleLowerCase() === "message") {
            Object.entries(data).forEach((entry) => {
                const [key, value] = entry;

                this.mediator.emit(key, value);
            });
        } else {
            this.mediator.emit(event, data);
        }
    }

    signIn(gameName: string) {
        const { session, username, system } = (StorageManager.get(localStorageKeys.session) as ISessionInfo) || {};

        const payload = new GameClientEmitMessage.Signin();
        payload.ss = session;
        payload.username = username;
        payload.system = system;

        this.send("signIn", { gameName, session: payload });
    }

    onSignedIn() {
        this.signedIn = true;
    }

    onConnectFailed(error?: Error) {
        this.isConnectFailed = true;
        this.handleConnectionStatus(false, error);
    }

    onDisconnected(reason = "") {
        this.handleDisconnectionReason(reason);
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
        this.connection.emit("outGame", "SeDie");

        error && this.logError(error);
    }

    private isServerDisconnect(reason: string | unknown) {
        return reason === "io server disconnect";
    }

    private shouldLogDisconnection(reason: string | unknown) {
        return reason && reason !== "io client disconnect";
    }

    private logError(reason: string | Error) {
        sentryLogger.logError(reason);
    }

    send(eventName: string, data: any) {
        this.connection?.emit(eventName, data);
    }

    closeSocket(gameName: string) {
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
