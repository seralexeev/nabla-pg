export type LiteralValueType = string | number | undefined | null;

export class Literal {
    public constructor(public readonly value: LiteralValueType) {}

    public toString() {
        return String(this.value ?? null);
    }

    public static isLiteral(value: unknown): value is Literal {
        return value instanceof Literal;
    }
}

export const literal = (value: LiteralValueType) => new Literal(value);
