# Web methods

HTTP operations are accessed through the global `web` object.

## fetch

Fetches the contents of a URL and returns the response body as a `String`. Returns an empty string on error.

```
let body = web.fetch("example.com")
print(body)
```

(As with everything) `fetch` can be spawned to run concurrently:

```
let handler = spawn web.fetch("example.com")
print("fetching...")
print(await handler)
```
