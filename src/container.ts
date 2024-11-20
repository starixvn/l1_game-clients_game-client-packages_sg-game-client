import { Container } from "inversify";

import * as App from "./app";
import * as Auth from "./auth";
import * as ChipSetting from "./chip-setting";
import * as Configs from "./configs";
import * as Game from "./game";
import * as GameTurnBase from "./game-turn-base";
import * as GameConfigs from "./game/game-configs";
import * as GatewayConnection from "./gateway-connection";
import * as Notification from "./notification";
import * as Players from "./players";
import type { AnyConstructor } from "./shared";
import { FeatureLoader } from "./shared";
import * as UnderMaintenance from "./under-maintenance";

export interface IContainerOptions {
    onContainerCreated?: (container: Container) => void;

    disabledFeatures?: string[];

    enabledFeatures?: string[];

    globalContainer?: Container;

    features?: object[];
}

function serializeOptions(input: IContainerOptions): IContainerOptions {
    const defaultOptions: IContainerOptions = {
        onContainerCreated: () => {},
        disabledFeatures: [],
        globalContainer: null,
        enabledFeatures: [],
    };

    return Object.assign(defaultOptions, input);
}

export const defaultFeatures = [Auth, Players, Configs, Game, Notification, UnderMaintenance, ChipSetting];

export function getContainer(options: IContainerOptions = {}) {
    const { onContainerCreated, disabledFeatures, globalContainer, enabledFeatures, features } = serializeOptions(options);

    const container = new Container({
        autoBindInjectable: true,
        defaultScope: "Singleton",
    });

    container.parent = globalContainer;

    onContainerCreated(container);

    const featureLoaderOptions: FeatureLoader.IFeatureLoaderOptions = {
        container: container,
        disabledFeatures: disabledFeatures,
        enabledFeatures: enabledFeatures,
        features: features ?? defaultFeatures,
    };

    FeatureLoader.loadFeatures(featureLoaderOptions);

    return container;
}

export function buildObserverContainer(container: Container) {
    return {
        resolve: (ctor: AnyConstructor) => container.get(ctor),
    };
}

const getCommonStore = (sharedContainer: Container) => {
    const appStore = sharedContainer.get(App.AppStore);
    const authStore = sharedContainer.get(Auth.AuthStore);
    const notificationStore = sharedContainer.get(Notification.NotificationStore);
    const mainPlayerStore = sharedContainer.get(Players.MainPlayerStore);
    const gatewayConnectionStore = sharedContainer.get(GatewayConnection.GatewayConnectionStore);
    return {
        appStore,
        authStore,
        notificationStore,
        mainPlayerStore,
        gatewayConnectionStore,
    };
};

export function getGameContainer(
    gameSetting: GameConfigs.GameSetting,
    siteConfig: Configs.SiteConfigs,
    sharedContainer: Container
): IContainerOptions {
    const { appStore, authStore, notificationStore, mainPlayerStore, gatewayConnectionStore } = getCommonStore(sharedContainer);
    return {
        onContainerCreated: (container) => {
            container.bind(GameConfigs.GameSetting).toConstantValue(gameSetting);
            container.bind(Configs.SiteConfigs).toConstantValue(siteConfig);

            container.bind(App.AppStore).toConstantValue(appStore);
            container.bind(Auth.AuthStore).toConstantValue(authStore);
            container.bind(Notification.NotificationStore).toConstantValue(notificationStore);
            container.bind(Players.MainPlayerStore).toConstantValue(mainPlayerStore);
            container.bind(GatewayConnection.GatewayConnectionStore).toConstantValue(gatewayConnectionStore);
        },
    };
}

export const getGameTurnBaseContainer = (
    gameSetting: GameTurnBase.GameConfigs.GameSetting,
    siteConfig: Configs.SiteConfigs,
    sharedContainer: Container
): IContainerOptions => {
    const { appStore, authStore, notificationStore, mainPlayerStore } = getCommonStore(sharedContainer);
    return {
        onContainerCreated: (container) => {
            container.bind(GameTurnBase.GameConfigs.GameSetting).toConstantValue(gameSetting);
            container.bind(Configs.SiteConfigs).toConstantValue(siteConfig);

            container.bind(App.AppStore).toConstantValue(appStore);
            container.bind(Auth.AuthStore).toConstantValue(authStore);
            container.bind(Notification.NotificationStore).toConstantValue(notificationStore);

            container.bind(Players.MainPlayerStore).toConstantValue(mainPlayerStore);

            GameTurnBase.onContainerCreated(container);
        },
    };
};
