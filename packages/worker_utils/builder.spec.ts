import 'jasmine'

import { build, Parsers } from './builder'

type BasicType = {
  a: string
  b: string
}

type PointType = {
  x: number
  y: number
}

describe('Builder', () => {
  it('parses values from a list', () => {
    let results = build<BasicType>(['--a=x', '--b=y'])
      .next('a', Parsers.id)
      .next('b', Parsers.id)
      .finish()

    expect(results).toEqual({ a: 'x', b: 'y' })
  })

  it('throws on missing arguments', () => {
    expect(() =>
      build<BasicType>(['--a=x'])
        .next('a', Parsers.id)
        .next('b', Parsers.id)
        .finish()
    ).toThrowError(/Required argument b not found/)
  })

  it('throws on extra arguments', () => {
    expect(() =>
      build<BasicType>(['--a=x', '--b=y', 'xyz'])
        .next('a', Parsers.id)
        .next('b', Parsers.id)
        .finish()
    ).toThrowError(/Leftover arguments/)
  })
})

describe('Builder parsing', () => {
  it('Verifies non-empty strings', () => {
    expect(
      build<BasicType>(['--a=x', '--b=y'])
        .next('a', Parsers.nonEmptyString)
        .next('b', Parsers.nonEmptyString)
        .finish()
    ).toEqual({ a: 'x', b: 'y' })

    expect(() => {
      build<BasicType>(['--a=', '--b=y'])
        .next('a', Parsers.nonEmptyString)
        .next('b', Parsers.nonEmptyString)
        .finish()
    }).toThrowError(/Value cannot be empty/)
  })

  it('Parses numbers', () => {
    expect(
      build<PointType>(['--x=1', '--y=2'])
        .next('x', Parsers.int)
        .next('y', Parsers.int)
        .finish()
    ).toEqual({ x: 1, y: 2 })

    expect(() => {
      build<PointType>(['--x=', '--y=2'])
        .next('x', Parsers.int)
        .next('y', Parsers.int)
        .finish()
    }).toThrowError(/Not a number/)

    expect(() => {
      build<PointType>(['--x=a', '--y=2'])
        .next('x', Parsers.int)
        .next('y', Parsers.int)
        .finish()
    }).toThrowError(/Not a number/)
  })
})
