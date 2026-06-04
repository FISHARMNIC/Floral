# Functions

Functions are declared with `def` or `function`. Parameters require explicit types. The return type follows `->` and defaults to `None` if omitted.

```
def add(Int a, Int b) -> Int:
    return a + b

def greet(String name):
    print("hello", name)
```

## Parameters

Each parameter is written as `Type name`. Shared parameters use `$Type` or `shared Type`:

```
// or increment($Int counter)
def increment(shared Int counter):
    counter = counter + 1
```

## Return type

```
def clamp(Int x, Int lo, Int hi) -> Int:
    if(x < lo): 
        return lo
    if(x > hi): 
        return hi
    return x
```

## Lambdas

Anonymous functions are written with `lam` or `lambda`. A return type annotation is required when passing to methods like `map`.

```
let double = lambda(Int x) -> Int: x * 2

let nums = [1, 2, 3]
let tripled = nums.map(lambda(Int x) -> Int: x * 3)
```

A lambda body is a single expression. Lambdas capture the surrounding scope by reference.

## First-class functions

Named functions and built-in converters can be passed directly without wrapping in a lambda:

```
let strings = ["1", "2", "3"]
let nums = strings.map(toInteger)
```
