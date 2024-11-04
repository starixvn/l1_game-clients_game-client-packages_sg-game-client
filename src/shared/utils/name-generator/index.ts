import { NumberUtils } from "../number-utils";
import { animals } from "./dictionaries/animals";
import { colors } from "./dictionaries/colors";
import { cools } from "./dictionaries/cools";
import { fruits } from "./dictionaries/fruits";
import { marvels } from "./dictionaries/marvels";
import { new202010 } from "./dictionaries/new202010";

export class NameGenerator {
    public static generateName(): string {
        const dictionaries = [...colors, ...animals, ...marvels, ...fruits, ...cools, ...new202010];
        const randomIndex = NumberUtils.getRandomIntInRange(0, dictionaries.length - 1);
        const shortName = dictionaries[randomIndex];

        const numberLength = shortName.length < 10 ? 6 : 14 - shortName.length;
        let maxNumber = parseInt("9".repeat(numberLength), 10);
        const randomNumber = NumberUtils.getRandomIntInRange(1, maxNumber);

        return `${shortName}${randomNumber}`;
    }
}
