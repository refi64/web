export namespace Parsers {
  export class Failure extends Error {
    constructor(message: string) {
      super(message)
    }
  }

  export function int(x: string): number {
    if (!x.match(/^[0-9]+$/)) {
      throw new Failure(`Not a number: ${x}`)
    }

    return parseInt(x)
  }

  export function nonEmptyString(x: string): string {
    if (x.length === 0) {
      throw new Failure(`Value cannot be empty`)
    }

    return x
  }

  export function id(x: string): string {
    return x
  }

  export function list<T>(itemParser: (x: string) => T, delim: string = ';') {
    return function (x: string): T[] {
      if (x.length === 0) {
        return []
      }

      return x.split(delim).map(itemParser)
    }
  }

  export function jsonObject(x: string): { [key: string]: any } {
    let result

    try {
      result = JSON.parse(x)
    } catch (e) {
      throw new Failure(`Bad JSON: ${e}`)
    }

    // Easy object test
    if (result?.constructor !== Object) {
      throw new Failure(`Expected an object value`)
    }

    return result
  }
}

export class BuildFailure extends Error {
  constructor(message: string) {
    super(message)
  }
}

class BuilderImpl<T extends object, C extends object> {
  constructor(private values: string[], private result: C) {}

  next<K extends keyof T>(
    key: K,
    func: (x: string) => T[K]
  ): BuilderImpl<T, C & { [k in K]: T[K] }> {
    let value: string

    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i].startsWith(`--${key}=`)) {
        value = this.values.splice(i, 1)[0].split('=', 2)[1]
      }
    }

    if (value === undefined) {
      throw new BuildFailure(`Required argument ${key} not found`)
    }

    let transformed: T[K]
    try {
      transformed = func(value)
    } catch (e) {
      if (e instanceof Parsers.Failure) {
        throw new BuildFailure(`Failed to parse value of ${key}: ${e.message}`)
      } else {
        throw e
      }
    }

    return new BuilderImpl(
      this.values,
      Object.assign(this.result, { [key]: transformed } as { [k in K]: T[K] })
    )
  }

  finish(): C {
    if (this.values.length !== 0) {
      throw new BuildFailure(`Leftover arguments: ${this.values.join(';')}`)
    }

    return this.result
  }
}

export type EmptyBuilder<T extends object> = BuilderImpl<T, {}>
export type CompletedBuilder<T extends object> = BuilderImpl<T, T>

export function build<T extends object>(values: string[]): EmptyBuilder<T> {
  return new BuilderImpl(values, {})
}
