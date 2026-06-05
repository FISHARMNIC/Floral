# Structs

Define a named struct with `type`:

```
type Point = {Integer x, Integer y}
type Person = {String name, Integer age}
```

## Instantiation

Use `StructName { field: value, ... }` to create an instance:

```
let p = Point { x: 10, y: 20 }
let alice = Person { name: "Alice", age: 30 }
```

## Field access

```
print(alice.name)   // Alice
print(alice.age)    // 30
```

## Field assignment

```
alice.age = 31
```

## Shared structs

Prefix with `$` or `shared` to make the whole struct shared across threads.

```
shared bob = Person { name: "Bob", age: 25 }

def birthday($Person p):
    p.age = p.age + 1

spawn birthday(bob)
```

Individual fields cannot be marked shared, share the whole struct instead.

## Structs and threads

Pass a struct to a spawned function by making it shared. The underlying data is reference-counted so there are no lifetime issues even if the declaring scope exits before the thread finishes.

```
type Report = {String name, List<String> expenses}

def process(Report r, $Integer total) -> Integer:
    // ...

shared total = 0
let h = spawn process(Report { name: "Alice", expenses: ["10", "20"] }, total)
print(await h)
```
