import { inject, injectable } from "inversify";
import { ISocketOption } from "../game/connection";
import { GatewayConnectionStore } from "./gateway-connection-store";

export namespace GatewayConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(@inject(GatewayConnectionStore) protected readonly store: GatewayConnectionStore) { }

        handle(customizeOptions?: ISocketOption) {
            this.store.initConnection(customizeOptions);
        }

        reset() {
            console.log('GatewayConnectionHandlers reset');
            this.store.reset();
        }

        disconnect() {
            console.log('GatewayConnectionHandlers disconnect');
            this.store.connection?.disconnect();
        }
    }
}
