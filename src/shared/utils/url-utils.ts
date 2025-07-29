import { SiteConfigs } from "../../configs";
import { sentryLogger } from "./logger";

export namespace UrlUtils {
    export const buildUrl = (protocol = "http", path = "/", configs: SiteConfigs, overideSubDomain: string = null) => {
        const ssl = configs.ssl;
        const domain = getRootDomain(configs);
        const subDomain = overideSubDomain ?? configs.subDomain;
        const subDomainText = `${subDomain}.`;

        return `${protocol}${ssl ? "s" : ""}://${subDomain === "" ? "" : subDomainText}${domain}${path}`;
    };

    export const getRootDomain = (configs: SiteConfigs) => {
        return configs.serverDomain;
    };

    export const extractDomainFromHostName = (hostName: string) => {
        if (!hostName) {
            return "";
        }

        const domainParts = hostName?.split(".")?.reverse();
        return `${domainParts[1]}.${domainParts[0]}`;
    };

    export const buildGameGuideUrl = (configs: SiteConfigs) => {
        if (configs.isDev) {
            return configs.gameGuideUrlDev;
        }
        return buildUrlFromSubDomain(configs, configs.subGuideDomain);
    };

    export const buildUrlFromSubDomain = (configs: SiteConfigs, subDomain?: string) => {
        return `${"http"}${configs.ssl ? "s" : ""}://${subDomain}.${getRootDomain(configs)}`;
    };

    export const buildUrlWithPath = (path: string, configs: SiteConfigs) => {
        return buildUrl("http", path, configs);
    };

    export const buildServerUrl = (protocol = "http", path = "/", gameId = 0, configs: SiteConfigs) => {
        const gamePath = getPath(gameId, path);
        return buildUrl(protocol, gamePath, configs, configs.gameServiceSubDomain);
    };

    export const getPath = (gameId: number, path: string) => {
        path = path.toLowerCase();
        let pathStr = "";
        if (gameId === 0) {
            pathStr = `/${path}`;
        } else {
            pathStr = `/user/${path}`;
        }

        return pathStr;
    };

    export const getProxyRoute = (configs: SiteConfigs) => {
        if (configs?.websocket?.route === "") {
            return "/socket.io";
        }

        const subDirectory = configs?.subDirectory ? `${configs?.subDirectory}/` : "";
        return `/${subDirectory}${configs?.websocket?.route}/socket.io`;
    };

    export const getSubDomain = (url: string) => {
        try {
            return /http(s?):\/\/([^\/]+)/.exec(url)[0];
        } catch (e) {
            sentryLogger.logError('UrlUtils', `Can not get subdomain with url ${url}`);
            return "";
        }
    };

    export function getSubDirectory(subDirectory: string) {
        return subDirectory?.length > 0 ? `${subDirectory}/` : "";
    }

    export const buildSocketGatewayUrl = (protocol = "http", path = "/", subDomain: string, configs: SiteConfigs) => {
        return buildUrl(protocol, path, configs, subDomain);
    };
}
