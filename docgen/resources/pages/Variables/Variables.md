# Variables

## let

Declares a normal variable. Type is inferred from the right-hand side. An explicit type annotation is optional.

```
let x = 42
let name = "alice"
let List<String> words = ["hello", "world"]
let Int x = 10
```

## shared

Declares a variable as a shared reference. Shared variables can be safely read and written from multiple threads.

```
shared counter = 0
shared List<String> names = ["alice", "bob"]
```

Accessing an unshared global variable from inside a function produces a warning. Use `shared` for any variable that will be read or written across thread boundaries.

## const

Declares an immutable global constant. No warning is produced when accessing a `const` from inside a function.

```
const MAX = 100
const GREETING = "hello"
```

## restricted

Declares a variable that can only be written to by the current functional scope (i.e. a `while` statement doesnt matter). This is is not recommended to be used on important data (due to possible torn reads) and should only be used in programs that require more speed, as `shared` has an overhead

```
restricted x = 100

def jon:
    print(x) // non-atomic read
    // x = 123 <- not allowed, compiler throws error

repeat(i, 10):
    x = i // is allowed, but is not atomic
