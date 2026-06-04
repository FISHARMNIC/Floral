# Types

| Name | Description | Example |
|------|-------------|---------|
| `Integer` / `Int` | 64-bit integer | `42` |
| `Float` | 64-bit float | `3.14` |
| `String` | UTF-8 string | `"hello"` |
| `Boolean` | true or false | `true` |
| `List<T>` | Ordered list of T | `[1, 2, 3]` |
| `None` | No value (return type only) | |

## Shared types

Prefix any type with `$` or the word `shared` to make it a shared reference, safe to pass across threads.

```
def worker($Int n):
    n = n + 1

def worker2(shared String msg):
    print(msg)
```

`$List<Int>` is a shared list. `List<$Int>` is not valid, the shared modifier applies to the top-level type only.

## Generic types

### List 
`List<T>`

The type parameter must be a concrete type:

```
let List<String> names = ["alice", "bob"]
let nums = [1, 2, 3]    // inferred as List<Integer>
```

### Handler
`Handler<T>`

Returned by spawn.