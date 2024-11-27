import { SiteConfigs } from "../../../../src/configs";
import { UrlUtils } from "../../../../src/shared/utils";
import { siteConfigs } from "../../container.test";

describe("UrlUtils", () => {
    beforeEach(() => {
        Object.defineProperty(window, "location", {
            value: { hostname: "www.unittest.com" },
            writable: true,
        });

        Object.defineProperty(siteConfigs, "serverDomain", {
            value: "unittest.com",
            writable: true,
        });

        Object.defineProperty(siteConfigs, "subGuideDomain", {
            value: "guides",
            writable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("buildUrl", () => {
        it("should build a URL with default values", () => {
            //Arrange
            const expected = "http://unittest.com/";

            // Act
            const url = UrlUtils.buildUrl(undefined, undefined, siteConfigs);

            // Assert
            expect(url).toBe(expected);
        });

        it("should build a URL with custom protocol, path, and configs", () => {
            //Arrange
            const expected = "https://unittest.com/about";

            // Act
            const url = UrlUtils.buildUrl("https", "/about", siteConfigs);

            // Assert
            expect(url).toBe(expected);
        });

        it("should build a URL with overrided game service url", () => {
            //Arrange
            const expected = "https://overrided.unittest.com/about";

            // Act
            const url = UrlUtils.buildUrl("https", "/about", siteConfigs, "overrided");

            // Assert
            expect(url).toBe(expected);
        });
    });

    describe("getRootDomain", () => {
        it("should return root domain from serverDomain if available", () => {
            //Arrange
            const expected = "unittest.com";

            // Act
            const rootDomain = UrlUtils.getRootDomain(siteConfigs);

            // Assert
            expect(rootDomain).toBe(expected);
        });
    });

    describe("extractDomainFromHostName", () => {
        describe("should extract domain from hostName", () => {
            test.each`
                hostName        | expectedDomain
                ${"www.lg.com"} | ${"lg.com"}
                ${"www.sb.com"} | ${"sb.com"}
                ${"sb.com"}     | ${"sb.com"}
                ${"www.gs.com"} | ${"gs.com"}
                ${"gs.com"}     | ${"gs.com"}
                ${"www.vg.net"} | ${"vg.net"}
                ${"vg.net"}     | ${"vg.net"}
                ${"vg.win"}     | ${"vg.win"}
                ${"www.vg.win"} | ${"vg.win"}
                ${"w2.vg.win"}  | ${"vg.win"}
            `("should return domain", ({ hostName, expectedDomain }) => {
                // Arrange
                const actual = UrlUtils.extractDomainFromHostName(hostName);

                // Assert
                expect(actual).toEqual(expectedDomain);
            });
        });
    });

    describe("buildGameGuideUrl", () => {
        it("should build game guide URL with subGuideDomain", () => {
            // Arrange
            const expected = "http://guides.unittest.com";

            // Act
            const url = UrlUtils.buildGameGuideUrl(siteConfigs);

            // Assert
            expect(url).toBe(expected);
        });
    });

    describe("Test function getPath", () => {
        it("should return the path for gameId 0", () => {
            //Arrange
            const gameId = 0;
            const path = "game1";

            // Act
            const result = UrlUtils.getPath(gameId, path);

            // Assert
            expect(result).toBe("/game1");
        });

        test("should return the path for gameId other than 0", () => {
            //Arrange
            const expected = "/user/abc";
            const path = "abc";
            const gameId = 12;

            // Act
            const actual = UrlUtils.getPath(gameId, path);

            // Assert
            expect(actual).toEqual(expected);
        });
    });

    describe("getProxyRoute", () => {
        it("should return the default proxy route if websocket route is empty", () => {
            const configs: SiteConfigs = {
                websocket: {
                    route: "",
                    proxyPath: "",
                },

                isDev: true,
                systemType: "ENV1",
                ssl: false,
                serverDomain: "localhost:5002",
                subDomain: "",
                env: "LOCAL",
                subGuideDomain: "test-guide",
                enableMsgpackParserAllGames: false,
                enableMsgpackParserOnNotification: false,
                userServiceUrlDev: "http://localhost:3000/user",
                notificationServiceUrlDev: "http://localhost:3008",
                mainObserverNamespace: "",
                userServicePath: "user",
            };
            const result = UrlUtils.getProxyRoute(configs);
            expect(result).toBe("/socket.io");
        });

        it("should return the proxy route with subDirectory and websocket route", () => {
            const configs: SiteConfigs = {
                websocket: {
                    route: "ws",
                    proxyPath: "",
                },

                isDev: true,
                systemType: "ENV1",
                ssl: false,
                serverDomain: "localhost:5002",
                subDirectory: "exz",
                subDomain: "",
                env: "LOCAL",
                subGuideDomain: "test-guide",
                enableMsgpackParserAllGames: false,
                enableMsgpackParserOnNotification: false,
                userServiceUrlDev: "http://localhost:3000/user",
                notificationServiceUrlDev: "http://localhost:3008",
                mainObserverNamespace: "",
                userServicePath: "user",
            };

            const result = UrlUtils.getProxyRoute(configs);
            expect(result).toBe("/exz/ws/socket.io");
        });

        it("should return the proxy route without subDirectory if it is not provided", () => {
            const configs: SiteConfigs = {
                websocket: {
                    route: "ws",
                    proxyPath: "",
                },

                isDev: true,
                systemType: "ENV1",
                ssl: false,
                serverDomain: "localhost:5002",
                subDirectory: undefined,
                subDomain: "",
                env: "LOCAL",
                subGuideDomain: "test-guide",
                enableMsgpackParserAllGames: false,
                enableMsgpackParserOnNotification: false,
                userServiceUrlDev: "http://localhost:3000/user",
                notificationServiceUrlDev: "http://localhost:3008",
                mainObserverNamespace: "",
                userServicePath: "user",
            };

            const result = UrlUtils.getProxyRoute(configs);
            expect(result).toBe("/ws/socket.io");
        });
    });

    describe("getSubdirectory", () => {
        it("should return expected when subDirectory not empty", () => {
            // act
            const actual = UrlUtils.getSubDirectory("sit");

            // assert
            expect(actual).toBe("sit/");
        });
        it("should return expected when subDirectory is empty", () => {
            // act
            const actual = UrlUtils.getSubDirectory("");

            // assert
            expect(actual).toBe("");
        });
    });
});
