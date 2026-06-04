# Control Flow

## if / elif / else

```
if(x > 0):
    print("positive")
elif(x == 0):
    print("zero")
else:
    print("negative")
```

## while

```
let i = 0
while(i < 10):
    print(i)
    i = i + 1
```

## break

Exits the nearest enclosing loop.

```
while(true):
    if(done): 
```

## Operators

| Operator | Meaning |
|----------|---------|
| `==, !=` | equality |
| `<, >, <=, >=` | comparison |
| `+, -, *, /, %` | arithmetic |
| `&&, \|\|` | logical and / or |
| `!` | logical not |

## Inline C++

Raw C++ expressions can be embedded with `cpp(...)`:

```
let raw = cpp("std::rand() % 100")
```
