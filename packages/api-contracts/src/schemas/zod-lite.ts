// Lightweight, zero-dependency Zod-compatible validation module
export class ZodError extends Error {
  errors: { path: string[]; message: string }[];
  constructor(errors: { path: string[]; message: string }[]) {
    super(errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
    this.name = 'ZodError';
    this.errors = errors;
  }
}

export abstract class ZodType<T = any> {
  abstract parse(val: unknown, path?: string[]): T;

  safeParse(val: unknown): { success: true; data: T } | { success: false; error: ZodError } {
    try {
      const data = this.parse(val);
      return { success: true, data };
    } catch (err: any) {
      if (err instanceof ZodError) {
        return { success: false, error: err };
      }
      return { success: false, error: new ZodError([{ path: [], message: String(err) }]) };
    }
  }

  optional(): ZodOptional<this> {
    return new ZodOptional(this);
  }

  nullable(): ZodNullable<this> {
    return new ZodNullable(this);
  }

  default(val: T): ZodDefault<this> {
    return new ZodDefault(this, val);
  }

  or<U extends ZodType<any>>(other: U): ZodUnion<[this, U]> {
    return new ZodUnion([this, other]);
  }
}

export class ZodString extends ZodType<string> {
  private minLen?: { len: number; msg?: string };
  private maxLen?: { len: number; msg?: string };
  private pattern?: { regex: RegExp; msg?: string };

  min(len: number, msg?: string): this {
    this.minLen = { len, msg };
    return this;
  }
  max(len: number, msg?: string): this {
    this.maxLen = { len, msg };
    return this;
  }
  regex(regex: RegExp, msg?: string): this {
    this.pattern = { regex, msg };
    return this;
  }
  email(msg?: string): this {
    return this.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg || 'Invalid email');
  }

  parse(val: unknown, path: string[] = []): string {
    if (typeof val !== 'string') {
      throw new ZodError([{ path, message: 'Expected string, received ' + typeof val }]);
    }
    if (this.minLen && val.length < this.minLen.len) {
      throw new ZodError([{ path, message: this.minLen.msg || `Must be at least ${this.minLen.len} characters` }]);
    }
    if (this.maxLen && val.length > this.maxLen.len) {
      throw new ZodError([{ path, message: this.maxLen.msg || `Must be at most ${this.maxLen.len} characters` }]);
    }
    if (this.pattern && !this.pattern.regex.test(val)) {
      throw new ZodError([{ path, message: this.pattern.msg || 'Invalid format' }]);
    }
    return val;
  }
}

export class ZodNumber extends ZodType<number> {
  private isPositive = false;
  private isInt = false;
  private isNonNeg = false;
  private minVal?: number;
  private maxVal?: number;

  positive(msg?: string): this {
    this.isPositive = true;
    return this;
  }
  int(msg?: string): this {
    this.isInt = true;
    return this;
  }
  nonnegative(msg?: string): this {
    this.isNonNeg = true;
    return this;
  }
  min(min: number): this {
    this.minVal = min;
    return this;
  }
  max(max: number): this {
    this.maxVal = max;
    return this;
  }

  parse(val: unknown, path: string[] = []): number {
    const num = Number(val);
    if (typeof val !== 'number' && isNaN(num)) {
      throw new ZodError([{ path, message: 'Expected number' }]);
    }
    if (this.isInt && !Number.isInteger(num)) {
      throw new ZodError([{ path, message: 'Expected integer' }]);
    }
    if (this.isPositive && num <= 0) {
      throw new ZodError([{ path, message: 'Number must be positive' }]);
    }
    if (this.isNonNeg && num < 0) {
      throw new ZodError([{ path, message: 'Number cannot be negative' }]);
    }
    if (this.minVal !== undefined && num < this.minVal) {
      throw new ZodError([{ path, message: `Minimum value is ${this.minVal}` }]);
    }
    if (this.maxVal !== undefined && num > this.maxVal) {
      throw new ZodError([{ path, message: `Maximum value is ${this.maxVal}` }]);
    }
    return num;
  }
}

export class ZodLiteral<T> extends ZodType<T> {
  constructor(private literalValue: T) {
    super();
  }
  parse(val: unknown, path: string[] = []): T {
    if (val !== this.literalValue) {
      throw new ZodError([{ path, message: `Expected literal ${this.literalValue}` }]);
    }
    return val as T;
  }
}

export class ZodEnum<T extends [string, ...string[]]> extends ZodType<T[number]> {
  constructor(private values: T) {
    super();
  }
  parse(val: unknown, path: string[] = []): T[number] {
    if (!this.values.includes(val as any)) {
      throw new ZodError([{ path, message: `Expected one of ${this.values.join(', ')}` }]);
    }
    return val as T[number];
  }
}

export class ZodArray<T extends ZodType<any>> extends ZodType<ReturnType<T['parse']>[]> {
  private minCount?: { count: number; msg?: string };
  constructor(private itemSchema: T) {
    super();
  }
  min(count: number, msg?: string): this {
    this.minCount = { count, msg };
    return this;
  }
  parse(val: unknown, path: string[] = []): ReturnType<T['parse']>[] {
    if (!Array.isArray(val)) {
      throw new ZodError([{ path, message: 'Expected array' }]);
    }
    if (this.minCount && val.length < this.minCount.count) {
      throw new ZodError([{ path, message: this.minCount.msg || `Must have at least ${this.minCount.count} items` }]);
    }
    return val.map((item, idx) => this.itemSchema.parse(item, [...path, String(idx)]));
  }
}

export class ZodObject<T extends Record<string, ZodType<any>>> extends ZodType<{ [K in keyof T]: ReturnType<T[K]['parse']> }> {
  constructor(public shape: T) {
    super();
  }
  parse(val: unknown, path: string[] = []): { [K in keyof T]: ReturnType<T[K]['parse']> } {
    if (typeof val !== 'object' || val === null) {
      throw new ZodError([{ path, message: 'Expected object' }]);
    }
    const res: any = {};
    for (const key of Object.keys(this.shape)) {
      const fieldVal = (val as any)[key];
      res[key] = this.shape[key].parse(fieldVal, [...path, key]);
    }
    return res;
  }
}

export class ZodOptional<T extends ZodType<any>> extends ZodType<ReturnType<T['parse']> | undefined> {
  constructor(private inner: T) {
    super();
  }
  parse(val: unknown, path: string[] = []): ReturnType<T['parse']> | undefined {
    if (val === undefined) return undefined;
    return this.inner.parse(val, path);
  }
}

export class ZodNullable<T extends ZodType<any>> extends ZodType<ReturnType<T['parse']> | null> {
  constructor(private inner: T) {
    super();
  }
  parse(val: unknown, path: string[] = []): ReturnType<T['parse']> | null {
    if (val === null) return null;
    return this.inner.parse(val, path);
  }
}

export class ZodDefault<T extends ZodType<any>> extends ZodType<ReturnType<T['parse']>> {
  constructor(private inner: T, private defaultValue: any) {
    super();
  }
  parse(val: unknown, path: string[] = []): ReturnType<T['parse']> {
    if (val === undefined || val === null) return this.defaultValue;
    return this.inner.parse(val, path);
  }
}

export class ZodUnion<T extends [ZodType<any>, ...ZodType<any>[]]> extends ZodType<any> {
  constructor(private options: T) {
    super();
  }
  parse(val: unknown, path: string[] = []): any {
    for (const opt of this.options) {
      try {
        return opt.parse(val, path);
      } catch {}
    }
    throw new ZodError([{ path, message: 'Value did not match union options' }]);
  }
}

export const z = {
  string: () => new ZodString(),
  number: () => new ZodNumber(),
  literal: <T>(val: T) => new ZodLiteral(val),
  enum: <T extends [string, ...string[]]>(values: T) => new ZodEnum(values),
  array: <T extends ZodType<any>>(schema: T) => new ZodArray(schema),
  object: <T extends Record<string, ZodType<any>>>(shape: T) => new ZodObject(shape)
};

export namespace z {
  export type infer<T extends ZodType<any>> = ReturnType<T['parse']>;
}

