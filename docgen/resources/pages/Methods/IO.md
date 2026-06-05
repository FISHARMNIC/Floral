# IO methods

User input and output are accessed through the global `io` object.

## prompt

Displays a message and waits for the user to type a line, returning it as a `String`.

```
let name = io.prompt("Enter your name: ")
print("Hello,", name)
```

(As with everything) `prompt` can also be spawned to read input on a background thread while the main thread continues:

```
let handler = spawn io.prompt("Enter something: ")

while(!handler.done()):
    print("waiting...")
    sleep_ms(500)

print("You entered:", await handler)
```
