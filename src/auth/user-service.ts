import UserServiceClient from "@sg/sg-user-service-client";
import Auth from "@sg/sg-user-service-client/dist/auth";
import Setting from "@sg/sg-user-service-client/dist/setting";
import { inject, injectable } from "inversify";
import { SiteConfigs } from "../configs";
import { UrlUtils } from "../shared/utils";

@injectable()
export class UserService {
    readonly auth: Auth;
    readonly setting: Setting;
    readonly userServiceClient: UserServiceClient;

    constructor(@inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs) {
        const path = this.siteConfigs?.subDirectory
            ? `/${this.siteConfigs.subDirectory}/${this.siteConfigs.userServicePath}`
            : `/${this.siteConfigs.userServicePath}`;
        const url = this.siteConfigs.isDev ? this.siteConfigs.userServiceUrlDev : UrlUtils.buildUrlWithPath(path, this.siteConfigs);

        this.userServiceClient = new UserServiceClient(url);
        this.auth = this.userServiceClient.auth;
        this.setting = this.userServiceClient.setting;
    }

    public async sso(token: string, system?: number) {
        console.log("[UserService] SSO request with token:", token, "system:", system);
        const response = await this.auth.sso(token, system);
        console.log("[UserService] SSO response:", response);
        return response;
    }

    public async authorize(session: string, username: string) {
        console.log("[UserService] Authorize request for user:", username);
        const response = await this.auth.authorize(session, username);
        console.log("[UserService] Authorization response:", response);
        return response;
    }

    public async reCheckIn(session: string, username: string) {
        console.log("[UserService] ReCheckIn request for user:", username);
        const response = await this.auth.reCheckIn(session, username);
        console.log("[UserService] ReCheckIn response:", response);
        return response;
    }

    public async getBalance(session: string, username: string) {
        console.log("[UserService] Getting balance for user:", username);
        const response = await this.auth.getBalance(session, username);
        console.log("[UserService] Balance response:", response);
        return response;
    }

    public async signName(session: string, username: string, nickName: string) {
        console.log("[UserService] SignName request for user:", username, "nickname:", nickName);
        const response = await this.auth.signName(session, username, nickName);
        console.log("[UserService] SignName response:", response);
        return response;
    }

    public getChipSetting(session: string, username: string) {
        return this.setting.getSettings(session, username);
    }
}
