# Threading

## spawn

Runs a function on a new thread and returns a handler.

```
let handle = spawn myFunction(arg1, arg2)
```

The spawned function runs concurrently. The handler is used to communicate with it and retrieve its return value.

## await

Blocks until the thread finishes and returns its return value.

```
let result = await handle
```

## send / receive

Threads communicate with their parent through a message channel. Messages are strings.

Inside a spawned function, `send` sends a message to the parent:

```
def worker(Int n) -> Int:
    send("halfway")
    return n * 2
end
```

The parent calls `.receive()` on the handler to block until a message arrives:

```
let handle = spawn worker(5)
let msg = handle.receive()   // blocks until worker calls send()
let val = await handle
```

The same also works vice-versa:

```
def worker:
    let res = receive()
    print("Got:", res)
end

let handle = spawn worker()
handle.send("okay")
await handle
```

## done / pending

```
while(!handle.done() || handle.pending()):
    let msg = handle.receive()
    print(msg)
end
```

`done()` returns true once the thread has finished. `pending()` returns the number of unread messages.

## timeout

`timeout(ms, handle)` waits up to `ms` milliseconds for a thread to finish and returns a `TimeoutResponse<T>` (see [Types](/Floral/Types/Types.html)).

```
def worker() -> Integer:
    sleep_ms(100)
    return 42

let result = timeout(500, spawn worker())

if result.fail:
    print("timed out")
else:
    print(result.returnValue)
```

If the timeout fires, the child thread is signalled to stop. Any call to `await` inside that thread will throw. You cannot await a handler after its timeout has expired.

```
let h = spawn worker()
let result = timeout(100, h)

if result.fail:
    // h is no longer usable here, do not await it
    print("gave up")
```

## Shared variables

Pass shared variables into a spawned function to share state between threads.

```
shared total = 0

def accumulate(shared Int total, Int amount):
    total = total + amount
end

let h = spawn accumulate(total, 42)
await h
print(total)   // 42
```

All accesses to a shared variable are atomic.
