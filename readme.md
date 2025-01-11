# DenoKV WebSocket RPC
Simple remote data provider for my Todo app.    
see: https://github.com/nhrones/To-Do-List

This service is hosted on Deno Deploy.     
It provides Remote Procedure Calls for a DenoKV todo db.

A client (Todo app), first establishes a WebSocket connection.    
Once connected, the socket is used for async procedure calls.    

On the client, a `procedure call` returns a promise.     
A reference to the promise is stored in a Map with a unique transaction ID.

When a remote procedure completes, the returned transaction-ID is used     
to lookup and call the original promise resolve or reject callback.       
This helps keep the UI thread clean and responsive.

## Strongly Typed
All remote procedure calls are strongly typed.    
All calls to the service contain the transactionID and       
the strongly typed payload as follows:
```ts
type DbRpcPayload = {
   procedure: 'GET' | 'SET',
   key: Deno.KvKey,
   value: string | [string, TaskType[]][]
}

type TaskType = {
   text: string,
   disabled: boolean
}
```
## Kv Data Record
The above `value-type` was designed to provide for       
data that is stored in a cacheMap; an es6-Map data-cache.    
This type represents the cacheMap.entries() result-type.    

In this local-cache scheme, we simply store and retrieve    
all todo values in a single record in the remote DenoKv.    

On start-up we load the cacheMap from a `get` procedure.    
Whenever our cacheMap is mutated, we simply use a `set`      
procedure to persist the cache in the remote DenoKv.    

Using transactions, we're assured that the data remains consistent.    
This works well for this simple todo app, as we never expect    
it to exceed the 64kb limit of a DenoKv value. 

## Run with:
```bash
$ deno run -A --unstable-kv service.ts
```