# Floral

Floral is a thread-focused language that compiles to C++. Concurrency is a first-class concept: threads are spawned like function calls and communicate through message passing.

## Quick example

```
shared counter = 0

def worker($Int n, Int steps) -> Int:
    while(n < steps):
        n = n + 1
    return n

let handle = spawn worker(counter, 10)
let result = await handle
print("result:", result)
```
