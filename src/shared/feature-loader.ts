import { Container } from "inversify";
import { IHandler, IMultipleHandlers, Mediator } from "./mediator";
import { isInjectable } from "./reflect-utils";

export function isMultipleHandlers(handler: IMultipleHandlers) {
    return !!handler?.eventHandleList;
}

export function isSingleHandler(handler: IHandler<any>) {
    return !!handler?.name && !!handler?.handle;
}

export function search(roots: Object[], condition: (input: unknown) => boolean) {
    const result = [];
    const objects = [...roots];

    while (objects.length !== 0) {
        const object = objects.pop();

        if (condition(object)) {
            result.push(object);
        }

        for (const key in object) {
            const value = object[key];
            const isObject = typeof value === "object";

            if (condition(value)) {
                result.push(value);
            } else if (isObject) {
                objects.push(value);
            }
        }
    }

    return result;
}

export function getAllFeatures(...roots: Object[]) {
    const isFeature = (object: Record<string, unknown>) => typeof object === "object" && !!object?.FEATURE_NAME;

    return search([...roots], isFeature);
}

export function getAllConstructors(...roots: Object[]) {
    const isConstructorAndInjectable = (object: Function) => typeof object === "function" && "prototype" in object && isInjectable(object);

    return search(roots, isConstructorAndInjectable);
}

export function loadFeature(feature: Record<string, unknown>, container: Container) {
    const constructors = getAllConstructors(feature);
    const mediator = container.get(Mediator);

    constructors.forEach((ctor) => {
        const instance = container.get<any>(ctor);

        if (isMultipleHandlers(instance)) {
            mediator.registerHandlers(instance);
        } else if (isSingleHandler(instance)) {
            mediator.registerHandler(instance);
        }
    });
}

export interface IFeatureLoaderOptions {
    disabledFeatures: string[];

    enabledFeatures: string[];

    container: Container;

    features: object[];
}

export function loadFeatures({ container, disabledFeatures, enabledFeatures, features }: IFeatureLoaderOptions) {
    const loadedFeatures = getAllFeatures(...features);
    // console.debug(`avail features: ${loadedFeatures.map(({ FEATURE_NAME }) => FEATURE_NAME).join(", ")}`);
    const filteredFeatures = loadedFeatures.filter(({ FEATURE_NAME }) =>
        enabledFeatures.length ? enabledFeatures.includes(FEATURE_NAME) : !disabledFeatures.includes(FEATURE_NAME)
    );

    filteredFeatures.forEach((feature) => loadFeature(feature, container));

    // console.debug(`Loaded features: ${filteredFeatures.map(({ FEATURE_NAME }) => FEATURE_NAME).join(", ")}`);
}
