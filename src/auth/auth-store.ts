import { SSOResponse } from "@sg/sg-user-service-client/dist/auth";
import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { MainPlayerStore } from "../players";
import { URLParams } from "../shared/constants/url-params";
import { StorageManager, localStorageKeys } from "../shared/utils";

export interface ISessionInfo {
    isAuthenticated: boolean;
    username: string;
    language: string;
    session: string;
    system: number;
    memberName?: string;
    ssoTime?: Date;
}

@injectable()
export class AuthStore {
    isAuthenticated = false;
    username = "";
    language = "";
    session = "";
    system = 0;
    memberName = "";
    browserUserAgent = "";
    isDisabledAccount = false;
    errorCode = "";
    ssoErrorMessage = "";
    ssoTime: Date;
    isShowSignName = false;

    constructor(
        @inject(MainPlayerStore)
        protected readonly mainPlayerStore: MainPlayerStore
    ) {
        makeAutoObservable(this);
    }

    private _isAuthorized?: boolean = null;
    public get isAuthorized(): boolean {
        return this._isAuthorized;
    }
    public set isAuthorized(value: boolean) {
        this._isAuthorized = value;
    }

    getSessionInfo(): ISessionInfo {
        return {
            isAuthenticated: this.isAuthenticated,
            username: this.username,
            language: this.language,
            session: this.session,
            system: this.system,
            memberName: this.memberName,
            ssoTime: this.ssoTime,
        };
    }

    signOut() {
        this.username = null;
        this.session = null;
        this.isAuthenticated = false;
        StorageManager.remove(localStorageKeys.session);
    }

    setAuthSSOStore(response: SSOResponse) {
        this.session = response.ss;
        response?.offerGames && this.mainPlayerStore.setOfferGames(response?.offerGames);
        this.mainPlayerStore.setFractionalOddsFormat(response?.fractionalOddsFormat);
        this.setAuthStore(response);
    }

    setAuthStoreFromStorage(response: ISessionInfo) {
        this.session = response.session;
        this.setAuthStore(response);
    }

    setAuthStoreFromUrlParam(urlParams: URLSearchParams) {
        const sessionInfo: ISessionInfo = {
            isAuthenticated: true,
            session: urlParams.get(URLParams.session),
            username: urlParams.get(URLParams.username),
            language: urlParams.get(URLParams.language),
            system: +urlParams.get(URLParams.appType),
        };
        this.setAuthStoreFromStorage(sessionInfo);
    }

    private setAuthStore(response: ISessionInfo | SSOResponse) {
        this.isAuthenticated = response.isAuthenticated;
        this.username = response.username;
        this.language = response.language;
        this.system = +response.system;
        response.memberName && (this.memberName = response.memberName);
        this.ssoTime = new Date();
    }

    setAccountClosed(errorCode: string) {
        this.isDisabledAccount = true;
        this.errorCode = errorCode;
    }

    reset() {
        this.isAuthenticated = false;
        this.errorCode = "";
    }
}
