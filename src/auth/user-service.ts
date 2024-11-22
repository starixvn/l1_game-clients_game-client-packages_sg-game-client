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

    public sso(token: string, system?: number) {
        return this.auth.sso(token, system);
    }

    public authorize(session: string, username: string) {
        return this.auth.authorize(session, username);
    }

    public reCheckIn(session: string, username: string) {
        return this.auth.reCheckIn(session, username);
    }

    public getBalance(session: string, username: string) {
        return this.auth.getBalance(session, username);
    }

    public signName(session: string, username: string, nickName: string) {
        return this.auth.signName(session, username, nickName);
    }

    public getChipSetting(session: string, username: string) {
        return this.setting.getSettings(session, username);
    }
}
