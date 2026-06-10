# Modules

Files can be imported and exported in a JS-like fashion

```
// file 1
export type Human = {String name, Int age}

export def worker(Int a, shared String shaStr, Human human):
    print("Got a: ${a}")
    shaStr = "OKAY"
    print("Hello ${human.name} who is ${human.age} years old")
```

```
// file 2
import "module_export" as myModule;

let a = 123
shared b = "hi"
let c = Human{name: "Nico", age: 19} // types are imported as top level (for now)

myModule.worker(a, b, c)
print(b)
```

For now the following can be exported: variables, function defs, types