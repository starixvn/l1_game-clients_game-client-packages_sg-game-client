export namespace NumberUtils {
    export const getRandomInt = (length: number) => {
        const randomBytes = new Uint32Array(1);
        globalThis.crypto.getRandomValues(randomBytes);
        const randomNumber = randomBytes[0];
        return Math.floor((randomNumber / 0xffffffff) * length);
    };

    export const getValueByCurrency = (value: number, mainPlayerRate: number, otherPlayerRate?: number): number => {
        if (!otherPlayerRate) {
            otherPlayerRate = 1;
        }

        return (value * otherPlayerRate) / mainPlayerRate;
    };

    export const getRandomIntInRange = (n1: number, n2: number) => {
        // Ensure n1 is the minimum and n2 is the maximum
        const min = Math.min(n1, n2);
        const max = Math.max(n1, n2);

        // Create a typed array to hold one 32-bit unsigned integer
        const randomBytes = new Uint32Array(1);

        // Generate a cryptographically secure random value
        globalThis.crypto.getRandomValues(randomBytes);

        // Normalize the random value to a floating-point number between 0 and 1
        const randomNumber = randomBytes[0] / (0xffffffff + 1);

        // Scale and return the result within the range [min, max]
        return Math.floor(randomNumber * (max - min + 1)) + min;
    };
}
