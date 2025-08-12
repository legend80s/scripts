// oxlint-disable no-unused-vars
export function uuid_V4_5<const T extends string>(str: UUID_V4<T>): T {
  return str
}

type UUID_V4<T extends string> = Length36<T> & ISHexSeparatedByHyphen<T>

type Length36<T extends string> = IsStringOfLength<T, 36> extends true ? T : never
// type Yes = Length36<'abcdefghijklmnopqrstuvwxyz1234567890'> // 'abcdefghijklmnopqrstuvwxyz1234567890'
// type No = Length36<'abcd'> // never

// type FiveGroupsV4 = `${string}-${string}-4${string}-${string}-${string}`

type ISHexSeparatedByHyphen<T extends string> =
  T extends `${infer G1}-${infer G2}-${infer G3}-${infer G4}-${infer G5}`
    ? AllHex<G1> extends true
      ? AllHex<G2> extends true
        ? AllHex<G3> extends true
          ? AllHex<G4> extends true
            ? AllHex<G5> extends true
              ? T
              : never
            : never
          : never
        : never
      : never
    : never

// type X3 = ISHexSeparatedByHyphen<'ff61003f-5ce9-4c06-ada3-d033671b9beb'> // return what passed in
// type X4 = ISHexSeparatedByHyphen<'ff61003f-5ce9-4cO6-ada3-d033671b9beb'> // never

// https://github.com/type-challenges/type-challenges/issues/359#issuecomment-2432354667
type StringToTuple<T extends string> = T extends `${infer First}${infer Rest}`
  ? [First, ...StringToTuple<Rest>]
  : []

type LengthOfString<S extends string> = StringToTuple<S>['length']
type IsStringOfLength<S extends string, Length extends number> =
  LengthOfString<S> extends Length ? true : false

type StringToUnion<T extends string> = T extends `${infer First}${infer Rest}`
  ? First | StringToUnion<Rest>
  : never

type Hex = StringToUnion<'abcdef1234567890'>

type All<T extends string, Chars extends unknown> = T extends `${infer First}${infer Rest}`
  ? First extends Chars
    ? Rest extends ''
      ? true // 退出条件：剩余部分为空字符串，说明遍历到了结尾
      : All<Rest, Chars> // 否则继续递归遍历剩余字母
    : false
  : false

type AllHex<T extends string> = All<T, Hex>

// type X1 = AllHex<'abc'> // true
// type X2 = AllHex<'d033671b9bf*'> // false
// type X31 = AllHex<''> // false

// // ✅ 总长度 36，分 5 组且第 3 组第 1 个字符是 '4'
// const key1 = uuid_v4('8a169be6-7a2a-420b-a2fe-da59f4ddd416') // OK

// // ❌ 长度非 36
// const key2 = uuid_v4('8a169be6-7a2a-420b-a2fe-da59f4ddd41') // Error
// // ❌ 分隔符缺少
// const key3 = uuid_v4('8a169be6x7a2ax420bxa2fexda59f4ddd416') // Error
// // ❌ 分组少了
// const key4 = uuid_v4('8a169be6-7a2ax420b-a2fe-da59f4ddd416') // Error
// // ❌ 分组多了
// const key5 = uuid_v4('8a169-be6-7a2a-420b-a2fe-da59f4ddd416') // Error
// // ❌ 存在非 hex 字符 `-`
// const key6 = uuid_v4('8a169be6-7a2a-420b-a2fe-da59f4ddd41-') // Error
// // ❌ 存在非 hex 字符 `*`
// const key7 = uuid_v4('8a169be6-7a2a-420b-a2fe-da59f4ddd41*') // Error

type HexDigit =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'

type IsHexCharsOfLength<S extends string, Len extends number> =
  AllHex<S> extends true ? (IsStringOfLength<S, Len> extends true ? true : false) : false

type Is8HexChars<S extends string> = IsHexCharsOfLength<S, 8>
type Is4HexChars<S extends string> = IsHexCharsOfLength<S, 4>
type Is3HexChars<S extends string> = IsHexCharsOfLength<S, 3>
type Is12HexChars<S extends string> = IsHexCharsOfLength<S, 12>

type UUID_V4_5<S extends string> =
  S extends `${infer G1}-${infer G2}-${'4'}${infer G3}-${'8' | '9' | 'a' | 'b'}${infer G4}-${infer G5}`
    ? Is8HexChars<G1> extends true
      ? Is4HexChars<G2> extends true
        ? Is3HexChars<G3> extends true
          ? Is3HexChars<G4> extends true
            ? Is12HexChars<G5> extends true
              ? S
              : never
            : never
          : never
        : never
      : never
    : never

// type UUID_V4_5 =
//   `${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}-${HexDigit}${HexDigit}${HexDigit}${HexDigit}-4${HexDigit}${HexDigit}${HexDigit}-${
//     | '8'
//     | '9'
//     | 'a'
//     | 'b'}${HexDigit}${HexDigit}${HexDigit}-${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}${HexDigit}`

// 测试
type x = UUID_V4_5<'8a169be6-7a2a-420b-a2fe-da59f4ddd416'> // '8a169be6-7a2a-420b-a2fe-da59f4ddd416'
const key1 = uuidV_4_52('8a169be6-7a2a-420b-a2fe-da59f4ddd416') // OK
const key2 = uuidV_4_52('abcd') // Error: Type '"abcd"' is not assignable to type 'UUID_V4_5'.

function uuidV_4_52<const T extends string>(str: UUID_V4_5<T>): T {
  return str
}

type UUID_V4_READABLE<S extends string> =
  S extends `${infer G1}-${infer G2}-${'4'}${infer G3}-${'8' | '9' | 'a' | 'b'}${infer G4}-${infer G5}`
    ? Is8HexChars<G1> extends true
      ? Is4HexChars<G2> extends true
        ? Is3HexChars<G3> extends true
          ? Is3HexChars<G4> extends true
            ? Is12HexChars<G5> extends true
              ? S
              : '__INVALID_UUID_GROUP_5_NOT_12_HEX_CHARS__'
            : '__INVALID_UUID_GROUP_4_NOT_4_HEX_CHARS__'
          : '__INVALID_UUID_GROUP_3_NOT_4_HEX_CHARS__'
        : '__INVALID_UUID_GROUP_2_NOT_4_HEX_CHARS__'
      : '__INVALID_UUID_GROUP_1_NOT_8_HEX_CHARS__'
    : '__INVALID_UUID_V4_NOT_HAVE_5_GROUPS_OR_NOT_HAVE_4_IN_GROUP_3_OR_NOT_STARTS_WITH_8_9_A_B_IN_GROUP_4__'

function uuidV_4_53<T extends string>(str: UUID_V4_READABLE<T>): T {
  // @ts-expect-error
  return str
}

// OK
const key21 = uuidV_4_53('8a169be6-7a2a-420b-a2fe-da59f4ddd416')

// "__INVALID_UUID_V4_NOT_HAVE_5_GROUPS_OR_NOT_HAVE_4_IN_GROUP_3_OR_NOT_STARTS_WITH_8_9_A_B_IN_GROUP_4__"
const key22 = uuidV_4_53('8a169be6-7a2a-120b-a2fe-da59f4ddd416')

// "__INVALID_UUID_V4_NOT_HAVE_5_GROUPS_OR_NOT_HAVE_4_IN_GROUP_3_OR_NOT_STARTS_WITH_8_9_A_B_IN_GROUP_4__"
const key23 = uuidV_4_53('8a169be6-7a2a-120b-a2fe')

// __INVALID_UUID_GROUP_1_NOT_8_HEX_CHARS__
const key24 = uuidV_4_53('!a169be6-7a2a-420b-a2fe-da59f4ddd416')

// __INVALID_UUID_GROUP_2_NOT_4_HEX_CHARS__
const key25 = uuidV_4_53('8a169be6-!a2a-420b-a2fe-da59f4ddd416')

// __INVALID_UUID_GROUP_3_NOT_4_HEX_CHARS__
const key26 = uuidV_4_53('8a169be6-7a2a-4!0b-a2fe-da59f4ddd416')

// "__INVALID_UUID_V4_NOT_HAVE_5_GROUPS_OR_NOT_HAVE_4_IN_GROUP_3_OR_NOT_STARTS_WITH_8_9_A_B_IN_GROUP_4__"
const key27 = uuidV_4_53('8a169be6-7a2a-420b-22fe-da59f4ddd416')

// __INVALID_UUID_GROUP_5_NOT_12_HEX_CHARS__
const key28 = uuidV_4_53('8a169be6-7a2a-420b-a2fe-d!59f4ddd416')

// __INVALID_UUID_GROUP_5_NOT_12_HEX_CHARS__
const key29 = uuidV_4_53('8a169be6-7a2a-420b-a2fe-d59f4d')

// __INVALID_UUID_GROUP_2_NOT_4_HEX_CHARS__
const key30 = uuidV_4_53('8a169be6-a2a-420b-a2fe-da59f4ddd416')

// __INVALID_UUID_V4_NOT_HAVE_5_GROUPS_OR_NOT_HAVE_4_IN_GROUP_3_OR_NOT_STARTS_WITH_8_9_A_B_IN_GROUP_4__
const key31 = uuidV_4_53('abcd') // Error: Type '"abcd"' is not assignable to type 'UUID V4'.

type Digit = StringToUnion<'0123456789'>

type IDigit1 = `${Digit}${Digit}${Digit}`
type IDigit2 = `${Digit}${Digit}${Digit}${Digit}`
type IDigit3 = `${Digit}${Digit}${Digit}${Digit}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
type IDigit4 = `${Digit}${Digit}${Digit}${Digit}${Digit}`

// const valid: IHexStringOfLength3 = 'abc'
// const invalid: IHexStringOfLength3 = 'abx'

type IHexStringOfLength3<S extends string> = S extends `${infer A}${infer B}${infer C}`
  ? A extends Hex
    ? B extends Hex
      ? C extends Hex
        ? true
        : false
      : false
    : false
  : false

// type Valid = IHexStringOfLength3<'abc'>
// type Invalid1 = IHexStringOfLength3<'abx'>
// type Invalid2 = IHexStringOfLength3<'abcd'>

type IHexStringOfLength6<S extends string> = S extends `${infer G1}-${infer G2}`
  ? IHexStringOfLength3<G1> extends true
    ? IHexStringOfLength3<G2> extends true
      ? true
      : false
    : false
  : false

type Valid = IHexStringOfLength6<'abc-123'>
type Invalid1 = IHexStringOfLength6<'abc'>
type Invalid2 = IHexStringOfLength6<'abx-123'>
type Invalid3 = IHexStringOfLength6<'abc123'>
