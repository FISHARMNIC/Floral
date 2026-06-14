# <img width="30px" alt="hyd-blue" src="https://github.com/user-attachments/assets/e3c2b8f3-ef33-4daa-8648-9281ceb6b981"/> Floral - A Parallel Scripting Language 
### 
* Fully compiled (C++ backend)
* Any function can be called normally, `spawn`ed onto a new thread, or spawned with a `timeout` (no marking sync vs. async)
* Floral warns you about discontinuities across calling and spawning, and unsafe variable access
* Easy spawn/await (No need to wrap return types in futures)
* Message passing to and from children and un-related threads (`send`, `receive`, `Signal`)
* JS-like methods (`map`, `filter`, `slice`, etc.)
* [Documentation](https://fisharmnic.github.io/Floral/)
<p align="center">
<!-- <img width="800" alt="Screenshot 2026-06-01 at 11 12 03 PM_rounded (1)" src="https://github.com/user-attachments/assets/2854d247-fb03-404a-b06b-eb49923c71d4" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/02d37026-a48c-45c1-b833-ddbd4de7349b" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/76b46e86-b12b-43f9-b54d-740124d6b4f9" /> -->
<!-- <img width="800" alt="codye2" src="https://github.com/user-attachments/assets/e4fe0286-5024-45d1-ba65-8f247acca915" /> -->
<!-- <img width="800" alt="codye2" src="https://github.com/user-attachments/assets/93206247-e949-4067-8723-459209e7724f" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/4f5f5a00-eef6-450b-a20e-49a18d5c4acf" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/6ed50354-db99-45d0-9583-5beefa3337aa" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/15a3bc20-0f82-40ea-a46b-86977ac518fa" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/ee8d1648-fe2c-4532-a463-59b6d9e697ca" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/33908791-ee16-4a5a-870a-e9a7ae91f178" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/52b3bd8b-3f01-4b31-ac53-42758c94a240" /> -->
<!-- <img width="800" alt="codye" src="https://github.com/user-attachments/assets/18016515-eaf6-45a2-b28e-6fe1f2d4224b" /> -->
<img width="800" alt="codye" src="https://github.com/user-attachments/assets/458fca7c-55c3-442b-aa56-b72dacebe08a" />


</p>


```
✔ Compiled
waiting for notifications...
from a: About to do some more work...
from b: About to do some more work...
Worker Nico is done!
Worker Rio is done!
Nico: 155 | Rio: 190 | Total: 345
```

<details>
<summary>See Generated C++</summary>

```C++

module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module showcase3;


export struct Report {
            Daisy::String name;
Daisy::LocalList<Daisy::String> expenses;
            };
DAISY_FUNCTION(Daisy::Integer, calculator, Daisy::_Local<Report> report, Daisy::SharedInteger total)
auto nums = Daisy::LocalList<Daisy::Integer>(Daisy::util::listmap(report.get().expenses.get(), Daisy::util::toInteger).get());
auto sum = Daisy::util::listreduce(nums.get(), [&](auto acc, auto x){ return acc + x; });
total->modify([&](auto __v){ return __v + sum; });
__DAISY_channel.send("About to do some more work...");
Daisy::Timing::sleep_ms(static_cast<Daisy::Integer>(50));
Daisy::builtin::io::print("Worker", report.get().name, "is done!");
return sum;

}
export Daisy::SharedInteger household = {};
export Daisy::Threads::Handler<Daisy::Integer> a = {};
export Daisy::Threads::Handler<Daisy::Integer> b = {};
export Daisy::Integer ra = {};
export Daisy::Integer rb = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/showcase3.bud";

household = Daisy::NewShared(static_cast<Daisy::Integer>(0));
a = Daisy::Threads::spawn(calculator, Daisy::_Local<Report>(((Report){.name = "Nico",.expenses = Daisy::LocalList<Daisy::String>(Daisy::List<Daisy::String>{"100", "20", "35"})})), household);
b = Daisy::Threads::spawn(calculator, Daisy::_Local<Report>(((Report){.name = "Rio",.expenses = Daisy::LocalList<Daisy::String>(Daisy::List<Daisy::String>{"15", "150", "25"})})), household);
Daisy::builtin::io::print("waiting for notifications...");
Daisy::builtin::io::print("from a:", a.receive());
Daisy::builtin::io::print("from b:", b.receive());
ra = a.await();
rb = b.await();
Daisy::builtin::io::print(("Nico: " + Daisy::util::toString(ra) + " | Rio: " + Daisy::util::toString(rb) + " | Total: " + Daisy::util::toString(household)));


Daisy::Threads::join_all();
return 0;
}
}

```

</details>
<br><br>

## Usage
* install: `npm install -g && npm run build`
* run: `bud --run examples/showcase.bud`
* compile: `bud examples/showcase.bud -o a.out`
* see generated code: `bud examples/showcase.bud --generate`  

## Status
* variables: `let, shared, const`
* control flow: `if, elif, else`
* looping: `while, repeat`
* functions
* types
  * primitives: `Integer, String, Bool, Float, Byte, Complex, None`
  * templates: `Handler, List, Timeout, Signal`
  * custom structs: `type`
  * string interpolation: `"my name is ${name}"`
* threading: `spawn, await, timeout_ms, signal`
* spawned handler methods `.send, .receive, .done, .pending, ...etc`
* js-like methods: `.split, .join, .map, ...etc`
* type conversions: `.toInteger(), .toString(), ...etc` (first class versions too)
* built-in libraries: `web, io, file, process`
* import/export: `export def fn: ..., import "module" as myModule`  

## Plans
* classes
* auto templating with untyped parameters
* more utility methods on primitives
* more builtin libraries
