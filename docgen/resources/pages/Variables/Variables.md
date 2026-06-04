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
