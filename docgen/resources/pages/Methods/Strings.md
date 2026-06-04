# String methods

Methods are called with dot syntax: `str.method(args)`.

## length

Returns the number of characters.

```
let n = "hello".length()   // 5
```

## at

Returns the character at a given index. Negative indices count from the end.

```
let ch = "hello".at(0)    // "h"
let ch = "hello".at(-1)   // "o"
```

## slice

Returns a substring from `start` (inclusive) to `end` (exclusive). Negative indices count from the end. `end` defaults to the length of the string.

```
let s = "hello world".slice(6, 11)   // "world"
let s = "hello".slice(1)             // "ello"
```

## split

Splits the string by a delimiter and returns a `List<String>`.

```
let parts = "a,b,c".split(",")   // ["a", "b", "c"]
```

## toInteger

Parses the string as an integer.

```
let n = "42".toInteger()   // 42
```

## toFloat

Parses the string as a float.

```
let f = "3.14".toFloat()
```

