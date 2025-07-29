import { ReCheckInResponse, UMInfo } from "@sg/sg-user-service-client/dist/auth";
import { inject, injectable } from "inversify";
import { NoticeInfo, NoticeStore, NoticeType } from "../game/notices/notice-store";
import { PlayerSelectionHandlers } from "../game/player-selections";
import { MainPlayerStore } from "../players";
import { GameServiceMessage, IHandler, utils } from "../shared";
import { AppTypes } from "../shared/constants/app-type";
import { BrowserDomUtils } from "../shared/utils/browser-dom-utils";
import { Translator } from "../shared/utils/localization-manager";
import { sentryLogger, logInfo, logError, logWarning } from "../shared/utils/logger";
import { NameGenerator } from "../shared/utils/name-generator";
import { StorageManager, localStorageKeys } from "../shared/utils/storage-manager";
import { AppStore } from "./../app/app-store";
import { AuthStore, ISessionInfo } from "./auth-store";
import { UserService } from "./user-service";
import { SiteConfigs } from "../configs";

const { ErrorUtils, AuthUtils } = utils;

interface IAuthorizeResponse {
    errorCode?: string;
    message?: string;
    isSuccessful?: boolean;
    isUM?: boolean;
    umInfo?: UMInfo;
    authorized?: boolean;
    user?: GameServiceMessage.User;
}

export interface ISSOInfo {
    token?: string;
    ref?: string;
    returnUrl?: string;
    appType?: number;
    parentUrl?: string;
    isUserGesture?: string;
    operator?: string;
}

export namespace AuthHandlers {
    @injectable()
    export class SignOut implements IHandler<void> {
        constructor(@inject(AppStore) private readonly appStore: AppStore, @inject(AuthStore) private readonly authStore: AuthStore) { }
        handle() {
            this.authStore.signOut();
            this.appStore.setTimeOut();
        }
    }

    @injectable()
    export class ReCheckIn implements IHandler<{ sessionInfo: ISessionInfo }> {
        constructor(
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(UserService) private readonly userService: UserService,
            @inject(SignOut) private readonly signOutHandler: SignOut
        ) { }

        async handle({ sessionInfo }) {
            const { session, username } = sessionInfo;
            const response = await this.userService.reCheckIn(session || this.authStore.session, username || this.authStore.username);
            if (response.isSuccessful) {
                this.handleSuccessful(response, sessionInfo);
            } else {
                this.signOutHandler.handle();
            }
        }

        private handleSuccessful(response: ReCheckInResponse, sessionInfo: ISessionInfo) {
            if (response.apiError) {
                this.handleError(response);
            } else {
                this.authStore.setAuthStoreFromStorage(sessionInfo);
                StorageManager.set(localStorageKeys.session, this.authStore.getSessionInfo());
                this.mainPlayerStore.setBalance(response.balance, response.scoins, response.availSpins);
            }
        }

        private handleError(response: ReCheckInResponse) {
            if (response.isDisableAccount) {
                this.authStore.isDisabledAccount = response.isDisableAccount;
            }
            const errorCode = response.apiError.errorCode.toString();
            this.authStore.errorCode = errorCode;
        }
    }

    @injectable()
    export class TriggerRecheckIn implements IHandler<void> {
        private reCheckInId: NodeJS.Timeout;

        constructor(@inject(ReCheckIn) private readonly reCheckIn: ReCheckIn, @inject(SignOut) private readonly signOutHandler: SignOut) { }

        async handle() {
            this.clearInterval();
            this.reCheckInId = setInterval(() => {
                this.handleRecheckIn();
            }, 60 * 1000);
            this.handleRecheckIn();
        }

        private async handleRecheckIn() {
            try {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                const isSessionExpired = AuthUtils.verifySession(sessionInfo);

                if (isSessionExpired) {
                    this.signOutHandler.handle();
                } else {
                    await this.reCheckIn.handle({ sessionInfo });
                }
            } catch (error) {
                logError('TriggerRecheckIn', error instanceof Error ? error : new Error(String(error)));
            }
        }

        clearInterval() {
            this.reCheckInId && clearInterval(this.reCheckInId);
        }
    }

    @injectable()
    export class Authorize implements IHandler<{ session?: string; username?: string }> {
        private session = "";
        private username = "";
        constructor(
            @inject(NoticeStore) protected readonly noticeStore: NoticeStore,
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(UserService) private readonly userService: UserService,
            @inject(SignOut) private readonly signOutHandler: SignOut,
            @inject(TriggerRecheckIn) private readonly triggerRecheckIn: TriggerRecheckIn
        ) { }

        async handle({ session = "", username = "" }) {
            try {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                this.session = session || sessionInfo?.session;
                this.username = username || sessionInfo?.username;

                const response = (await this.userService.authorize(this.session, this.username)) as IAuthorizeResponse;

                if (response.isUM) {
                    this.appStore.setUM(response.umInfo);
                } else if (response.isSuccessful === false) {
                    this.signOutHandler.handle();
                } else {
                    await this.handleAuthorizedResponse(response);

                    this.triggerRecheckIn.handle();
                }
            } catch (err) {
                logError('Authorize', err instanceof Error ? err : new Error(String(err)));
            }
        }

        private async handleAuthorizedResponse(response: IAuthorizeResponse) {
            if (this.needAutoGenerateNickname(response?.authorized)) {
                await this.handleAutoGenerateName();
                return;
            }

            if (!response?.authorized && !response?.user) {
                this.authStore.isShowSignName = true;
                return;
            }

            if (response?.user) {
                this.mainPlayerStore.setAuthorizeStore(response.user);
            }

            this.authStore.isAuthorized = response?.authorized;
        }

        private needAutoGenerateNickname(isAuthorized: boolean) {
            return !isAuthorized && this.appStore?.isAutoCreateNickname;
        }

        async handleAutoGenerateName() {
            let count = 1;
            let success = false;
            while (!success && count < 10) {
                success = await this.handleSignName(NameGenerator.generateName());
                count++;
            }

            if (!success) {
                this.showErrorMessageSignName(ErrorUtils.ExistingNameErrorCode);
            }
        }

        async handleSignName(username: string) {
            if (!this.session || !this.username) {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                this.session = sessionInfo?.session;
                this.username = sessionInfo?.username;
            }

            const response = (await this.userService.signName(this.session, this.username, username)) as IAuthorizeResponse;
            if (response.authorized) {
                this.authStore.isShowSignName = false;
                await this.handleAuthorizedResponse(response);
                return true;
            } else {
                return false;
            }
        }

        private showErrorMessageSignName(errorCode: string) {
            const key = ErrorUtils.parseErrorCode(errorCode);
            const text = Translator.translate(key);
            this.noticeStore.addNotice({
                message: text,
                title: Translator.commonTranslate("notice"),
                type: NoticeType.Error,
                onClose: null,
                showBtnConfirmButton: true,
                noticeInfo: NoticeInfo.SignName,
            });
        }

        async verifySessionFromStorage() {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            this.session = sessionInfo?.session;
            this.username = sessionInfo?.username;

            const response = (await this.userService.authorize(this.session, this.username)) as IAuthorizeResponse;

            return response?.isSuccessful && response?.authorized;
        }
    }

    @injectable()
    export class SSO implements IHandler<ISSOInfo> {
        constructor(
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(AppStore) private readonly appStore: AppStore,
            @inject(UserService) private readonly userService: UserService,
            @inject(Authorize) private readonly authorizeHandler: Authorize,
            @inject(SignOut) private readonly signOutHandler: SignOut,
            @inject(PlayerSelectionHandlers.ClearHandlers)
            private readonly playerSelectionClearHandler: PlayerSelectionHandlers.ClearHandlers,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(SiteConfigs) private readonly siteConfigs: SiteConfigs
        ) { }

        async handle(ssoInfo: ISSOInfo) {
            try {
                this.authStore.reset();
                if (!this.isValidSessionStorage(ssoInfo)) {
                    return;
                }

                await this.handleAuthorizeWithParams(ssoInfo);
            } catch (err) {
                this.authStore.ssoErrorMessage = Translator.commonTranslate("splash_connection_lost");
                this.appStore.setTimeOut();
                logError('SSO', err instanceof Error ? err : new Error(String(err)));
            }
        }

        private isValidSessionStorage(ssoInfo: ISSOInfo) {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            const isSessionExpired = AuthUtils.verifySession(sessionInfo);
            if (isSessionExpired && !ssoInfo.token) {
                this.signOutHandler.handle();

                return false;
            }

            return true;
        }

        private async handleAuthorizeWithParams(ssoInfo: ISSOInfo) {
            const storageToken = StorageManager.get(localStorageKeys?.token);
            if (ssoInfo?.token && ssoInfo?.token != storageToken) {
                StorageManager.set(localStorageKeys.token, ssoInfo?.token);

                this.playerSelectionClearHandler.handle();
                this.appStore.setDataStore(ssoInfo);
                const token = ssoInfo?.token;
                const system = +ssoInfo?.appType || this.siteConfigs.appType || AppTypes.LivePage;

                if (ssoInfo?.operator) {
                    StorageManager.set(localStorageKeys.operator, ssoInfo?.operator);
                }
                await this.handleSSOAndAuthorize(token, system);
                BrowserDomUtils.postMessageToParent({ hasSSO: true });
            } else {
                this.authStore.setAuthStoreFromStorage(StorageManager.get(localStorageKeys.session) as ISessionInfo);
                this.appStore.loadReturnUrlAnd();
                this.appStore.loadDirectMode();
                this.appStore.loadApp();
                this.mainPlayerStore.loadOfferGames();
                this.mainPlayerStore.loadFractionalOddsFormat();
                await this.handleAuthorize();
            }
        }

        private async handleSSOAndAuthorize(token: string, system: number) {
            const response = await this.userService.sso(token, system);
            if (response.isUM) {
                this.appStore.setUM(response.umInfo);
                return;
            }
            if (response.isAuthenticated) {
                this.authStore.setAuthSSOStore(response);
                this.appStore.isSessionTimeout = false;
                this.saveDataSSOInStorage();
                await this.handleAuthorize(response.ss, response.username);
            } else {
                this.authStore.ssoErrorMessage = Translator.commonTranslate("splash_login_failed");
                this.appStore.setTimeOut();
            }
        }

        private saveDataSSOInStorage() {
            this.clearDataSSOInStorage();
            StorageManager.set(localStorageKeys.session, this.authStore.getSessionInfo());
            if (this.appStore.isDirectMode) {
                this.appStore.saveDirectModeInfo();
            }
            this.appStore.saveReturnUrl();
            this.appStore.saveIsApp();
        }

        private clearDataSSOInStorage() {
            StorageManager.remove(localStorageKeys.session);
            StorageManager.remove(localStorageKeys.directMode);
            StorageManager.remove(localStorageKeys.returnUrl);
            StorageManager.remove(localStorageKeys.isApp);
        }

        private async handleAuthorize(session?: string, username?: string) {
            if (!session || !username) {
                const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
                if (!sessionInfo) {
                    this.signOutHandler.handle();

                    return;
                }
                session = sessionInfo.session;
                username = sessionInfo.username;
            }
            await this.authorizeHandler.handle({ session, username });
        }
    }

    @injectable()
    export class GetBalance implements IHandler<void> {
        constructor(
            @inject(AuthStore) private readonly authStore: AuthStore,
            @inject(MainPlayerStore) private readonly mainPlayerStore: MainPlayerStore,
            @inject(UserService) private readonly userService: UserService
        ) { }

        async handle() {
            const sessionInfo = StorageManager.get(localStorageKeys.session) as ISessionInfo;
            const response = await this.userService.getBalance(
                this.authStore.session || sessionInfo?.session,
                this.authStore.username || sessionInfo?.username
            );
            if (response.isSuccessful) {
                this.mainPlayerStore.setBalance(response.balance, response.scoins, response.availableSpins);
            } else {
                this.authStore.errorCode = response.errorCode;
            }
        }
    }

    @injectable()
    export class ClearRecheckInInterval implements IHandler<void> {
        constructor(@inject(TriggerRecheckIn) private readonly triggerRecheckIn: TriggerRecheckIn) { }

        handle() {
            this.triggerRecheckIn.clearInterval();
            StorageManager.remove(localStorageKeys.session);
        }
    }
}
