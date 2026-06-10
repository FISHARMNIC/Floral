# Signal

A `Signal<T>` lets threads block until another thread sends a value. Declare one as a shared variable so all threads can access it.

```
shared Signal<Int> sig

def worker:
    print("waiting...")
    let val = sig.wait()
    print("got", val)
end

spawn worker()
sleep_ms(10) // if notify triggers before wait, thread will never see it
sig.notify(42)
```

`.wait()` blocks the calling thread until `.notify()` is called and returns the value passed to `notify`. All threads currently waiting on the signal are unblocked at once.

`.notify(value)` sets the signal's value and wakes every waiting thread. If no value is given it uses the zero value of `T`.
