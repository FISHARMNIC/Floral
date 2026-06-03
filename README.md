# <img width="30px" alt="hyd-blue" src="https://github.com/user-attachments/assets/e3c2b8f3-ef33-4daa-8648-9281ceb6b981"/> Floral
### A simple concurrent scripting language 
* Fully compiled (C++ backend)
* Easy spawn/await (No manual futures :P)

<p align="center">
<!-- <img width="800" alt="Screenshot 2026-06-01 at 11 12 03 PM_rounded (1)" src="https://github.com/user-attachments/assets/2854d247-fb03-404a-b06b-eb49923c71d4" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/02d37026-a48c-45c1-b833-ddbd4de7349b" /> -->
<img width="800" alt="codye" src="https://github.com/user-attachments/assets/76b46e86-b12b-43f9-b54d-740124d6b4f9" />

</p>

<details>
<summary>See Output</summary>

```
doing work on the main thread...
counter: 0
counter: 1
counter: 2
counter: 3
counter: 4
counter: 5
Got notification: Halfway there!
counter: 6
counter: 7
counter: 8
counter: 9
Returned: [hi, bye]
final counter: 10
counter: 0
counter: 1
counter: 2
counter: 3
counter: 4
counter: 5
counter: 6
counter: 7
counter: 8
counter: 9
[hi, bye]
```
</details>
<details>
<summary>See Generated C++</summary>

```C++
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

inline Daisy::SharedInteger counter = Daisy::NewShared(static_cast<uint64_t>(0));
DAISY_FUNCTION(Daisy::Integer, incrementer, Daisy::SharedInteger n, Daisy::Integer steps)
{
Daisy::Integer halfway = n->get() + steps / static_cast<uint64_t>(2);
while (n->get() < steps) {
Daisy::print("counter:", n);
if (n->get() == halfway) {
__DAISY_channel.send("Halfway there!");
}
Daisy::Timing::sleep_ms(static_cast<uint64_t>(50));
n->set(n->get() + static_cast<uint64_t>(1));
}
return static_cast<uint64_t>(123);

}


int main() {
auto handler = Daisy::Threads::spawn(incrementer , counter, static_cast<uint64_t>(10));
Daisy::print("doing work on the main thread...");
Daisy::String notification = handler.receive();
Daisy::print("Got notification:", notification);
Daisy::Integer res = handler.await();
Daisy::print("Returned:", res);
Daisy::print("final counter:", counter);
counter->set(static_cast<uint64_t>(0));
Daisy::Threads::call(incrementer, counter, static_cast<uint64_t>(10));
  Daisy::Threads::join_all();
  return 0;
}

```

</details>

## Usage
* install: `npm install -g && npm run build`
* run: `floral --run  examples/showcase.bud`
* compile: `floral examples/showcase.bud -o a.out`
* see generated code: `floral examples/showcase.bud --generate`

## Status
* variables: `let, shared, const`
* control flow: `if, elif, else`
* looping: `while()`
* functions
* types
  * primitives: `Integer, String, Bool, None`
  * templates: `Handler, List`
* concurrency: `spawn, await, messaging, several Handler methods`
* js-like methods: `.split, .join, .toInteger, ...etc`

## Plans
* Add structs, classes, arrays
* Auto templating with untyped parameters
* signaling between children without manual locks using shareds
* string interpolation and more high level features
