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

Structs are copied when passed to a spawned function. Use `shared` only if the thread needs to mutate the same instance the caller holds.
