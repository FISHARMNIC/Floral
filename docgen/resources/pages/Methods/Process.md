# Process methods

Shell command execution is accessed through the global `process` object.

## exec

Runs a shell command and returns its output as a `String`. Blocks until the command finishes.

```
let output = process.exec("echo hello")
print(output)
```

Use `file.resolve` to build paths relative to the source file:

```
let path = file.resolve("other.bud")
let output = process.exec("bud --run " + path)
print(output)
```

(As with everything) `exec` can be spawned to run a command in the background:

```
let path = file.resolve("other.bud")
let handler = spawn process.exec("bud --run " + path)
print("running in background...")
print(await handler)
```
