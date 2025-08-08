import { inject, injectable } from "inversify";
import { ISocketOption } from "../game/connection";
import { GatewayConnectionStore } from "./gateway-connection-store";

export namespace GatewayConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(@inject(GatewayConnectionStore) protected readonly store: GatewayConnectionStore) { }

        handle(customizeOptions?: ISocketOption) {
            console.log("[GatewayHandlers] Initializing connection with options:", customizeOptions);
            this.store.initConnection(customizeOptions);
        }

        reset() {
            console.log("[GatewayHandlers] Resetting gateway connection");
            this.store.reset();
        }

        disconnect() {
            console.log("[GatewayHandlers] Disconnecting gateway connection");
            this.store.connection?.disconnect();
        }
    }
}
