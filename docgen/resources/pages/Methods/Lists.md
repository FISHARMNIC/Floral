# List methods

Methods are called with dot syntax: `list.method(args)`.

## length

Returns the number of elements.

```
let n = [1, 2, 3].length()   // 3
```

## map

Applies a function to each element and returns a new list. The callback must have an explicit return type.

```
let nums   = [1, 2, 3]
let doubled = nums.map(lambda(Int x) -> Int: x * 2)

let strings = ["1", "2", "3"]
let parsed  = strings.map(toInt)
```

## filter

Returns a new list containing only elements for which the callback returns true.

```
let evens = [1, 2, 3, 4].filter(lambda(Int x) -> Boolean: x % 2 == 0)
```

## reduce

Folds the list into a single value. The callback takes an accumulator and the current item.

```
let sum = [1, 2, 3, 4].reduce(lambda(Int acc, Int x) -> Int: acc + x)
```

## join

Concatenates all elements into a string with a separator.

```
let s = ["a", "b", "c"].join(", ")   // "a, b, c"
```
