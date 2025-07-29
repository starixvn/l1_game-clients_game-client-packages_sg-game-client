import type { ISessionInfo } from "../../auth/auth-store";
import { UserService } from "../../auth/user-service";
import { sentryLogger } from "./logger";

export const SESSION_EXPIRED_TIMEOUT_MINUTES = 19.8;
export class AuthUtils {
    public static readonly verifySession = (sessionInfo: ISessionInfo) => {
        let isSessionExpired = true;

        try {
            if (sessionInfo && sessionInfo.ssoTime) {
                const now: Date = new Date();
                const lastRecheckIn: Date = new Date(sessionInfo.ssoTime);
                const differenceInMinutes = Math.abs(now.getTime() - lastRecheckIn.getTime()) / (1000 * 60);

                if (differenceInMinutes <= SESSION_EXPIRED_TIMEOUT_MINUTES) {
                    isSessionExpired = false;
                }
            }
        } catch (ex) {
            sentryLogger.logError('AuthUtils', ex instanceof Error ? ex : new Error(String(ex)));
            console.log(ex);
        }

        return isSessionExpired;
    };

    public static async verifySessionFromStorage(sessionInfo: ISessionInfo, userService: UserService) {
        if (!AuthUtils.verifySession(sessionInfo)) {
            const { session, username } = sessionInfo;
            const response = await userService.reCheckIn(session, username);
            return response.isSuccessful;
        }

        return false;
    }
}
