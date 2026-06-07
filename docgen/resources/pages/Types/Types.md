# Types

## Primitives

| Type | Description | Example |
|------|-------------|---------|
| `Integer` / `Int` | 64-bit unsigned integer | `42` |
| `Float` | 64-bit float | `3.14` |
| `String` | UTF-8 string | `"hello"` |
| `Boolean` | true or false | `true` |
| `None` | No value (return type only) | |

## Generic types

Generic types take a type parameter in angle brackets.

### `List<T>`

An ordered, resizable list of elements of type `T`.

```
let List<String> names = ["alice", "bob"]
let nums = [1, 2, 3]    // inferred as List<Integer>
```

### `Handler<T>`

Returned by `spawn`. Represents a running thread whose return value will be of type `T`.

```
def compute() -> Integer:
    return 42

let h = spawn compute()
let result = await h    // result is Integer
```

### `TimeoutResponse<T>`

Returned by `timeout`. Contains the result of a timed wait on a `Handler<T>`.

| Field | Type | Description |
|-------|------|-------------|
| `fail` | `Boolean` | `true` if the thread did not finish in time |
| `returnValue` | `T` | The thread's return value — only valid when `fail` is `false` |

```
let result = timeout(500, spawn compute())

if result.fail:
    print("timed out")
else:
    print(result.returnValue)
```

## User-defined types (structs)

See [Structs](/Floral/Types/Structs.html).

## Shared types

Prefix any type with `$` or the word `shared` to make it a shared reference, safe to pass across threads.

```
def worker($Int n):
    n = n + 1

def worker2(shared String msg):
    print(msg)
```

`shared List<Int>` is a shared list. The `shared` modifier applies to the outermost type only — `List<shared Int>` is not valid.