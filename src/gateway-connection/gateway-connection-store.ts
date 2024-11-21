import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { ManagerOptions, Socket, SocketOptions, io } from "socket.io-client";
import * as MsgpackParser from "socket.io-msgpack-parser";
import { AuthStore } from "../auth";
import { SiteConfigs } from "../configs/site-configs";
import { ISocketOption } from "../game/connection/connection-store";
import { Mediator } from "../shared";
import { SocketEvents } from "../shared/constants/socket-event";
import { UrlUtils, sentryLogger } from "../shared/utils";

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
        this.reset();

        const socketUri = UrlUtils.buildUrlWithPath("/", this.siteConfigs);
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
            this.connection.on(SocketEvents.connect, this.onConnected.bind(this));
            this.connection.on(SocketEvents.connectError, this.onConnectFailed.bind(this));
            this.connection.on(SocketEvents.connectFailed, this.onConnectFailed.bind(this));
            this.connection.on(SocketEvents.disconnect, this.onDisconnected.bind(this));
        }
    }

    onConnected() {
        this.isConnected = true;
        this.isConnectFailed = false;
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

    reset() {
        this.connection = null;
        this.isConnected = null;
        this.isConnectFailed = false;
        this.signedIn = false;
        this.isDisconnect = false;
    }
}
