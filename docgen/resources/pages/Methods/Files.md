# File methods

File operations are accessed through the global `file` object.

## resolve

Returns a path relative to the source file's directory.

```
let path = file.resolve("data.txt")
```

## read

Reads the entire contents of a file and returns it as a string. Returns an empty string on error.

```
let contents = file.read("/etc/hostname")
let contents = file.read(file.resolve("data.txt"))
```

## write

Writes a string to a file, replacing its contents. Returns `true` on success.

```
file.write("/tmp/out.txt", "hello\n")
```

## append

Appends a string to a file without truncating it. Returns `true` on success.

```
file.append("/tmp/log.txt", "another line\n")
```

## exists

Returns `true` if a file or directory exists at the given path.

```
if file.exists("/tmp/out.txt"):
    print("found it")
```

## remove

Deletes a file. Returns `true` if the file was removed.

```
file.remove("/tmp/out.txt")
```

## mkdir

Creates a directory and any missing parents. Returns `true` if created.

```
file.mkdir("/tmp/myapp/data")
```

## size

Returns the size of a file in bytes, or `-1` on error.

```
let n = file.size("/tmp/out.txt")
```

## listDir

Returns a `List<String>` of filenames (not full paths) in a directory.

```
let entries = file.listDir("/tmp")
```
