import { inject, injectable } from "inversify";
import { GatewayConnectionStore, ISocketOption } from "./gateway-connection-store";

export namespace GatewayConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(@inject(GatewayConnectionStore) protected readonly store: GatewayConnectionStore) {}

        handle(customizeOptions?: ISocketOption) {
            this.store.initConnection(customizeOptions);
        }
    }
}
