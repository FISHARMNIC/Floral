# Syntax

## Blocks

A block is a sequence of statements following a `:`. Indentation is conventional but not enforced.

```
def greet(String name):
    print("hello", name)
    print("goodbye", name)
```

`end` is not required when the block occupies its own lines. It is only used to close a block that is written inline on the same line as its header:

```
if(x > 0): print("positive") end

while(running): tick() end

def noop: end
```

Without `end`, the block runs until the next statement at the same syntactic level.

Lambdas never use `end` — their body is always a single expression:

```
let double = lambda(Int x) -> Int: x * 2
```

## Comments

Line comments start with `//`. There are no block comments.

```
// this is a comment
let x = 1  // inline comment
```

## Semicolons

Semicolons are optional and ignored. They may be used for style or to separate statements on one line.

```
let x = 1; let y = 2
```

## Identifiers

Identifiers start with a letter or underscore and contain letters, digits, and underscores. Type names conventionally start with an uppercase letter.
