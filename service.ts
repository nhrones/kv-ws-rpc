const DEV = !!Deno.env.get("DEV")
const PORT = 9099
const db = await Deno.openKv()

type TaskType = {
   text: string,
   disabled: boolean
}

type DbRpcPayload = {
   procedure: 'GET' | 'SET',
   key: Deno.KvKey,
   value:string | [string, TaskType[]][]
}

/** handle each http request */
Deno.serve({ port: PORT }, (request: Request): Promise<Response> => {
   try {
      if (request.headers.get("upgrade") === "websocket") {
         const { socket, response } = Deno.upgradeWebSocket(request);
         connectClient(socket, request)
         return Promise.resolve(response);
      }
      const errMsg = `Error: Request was not a valid WebSocket request! (405)`
      console.error(errMsg)
      return Promise.resolve(new Response(errMsg, { status: 405 }))
   } catch (err: unknown) {
      const errMsg = `Internal server error! 
    ${JSON.stringify(err)}`
      console.error(errMsg)
      return Promise.resolve(new Response(errMsg, { status: 500 }))
   }
})

/** handle WebSocket connect request. */
function connectClient(socket: WebSocket, _request: Request) {

   let isAlive = false;

   if (DEV) console.log(`Connecting client.`)

   // when ready, send the client their unique id from its key
   socket.onopen = () => {
      if (socket.readyState === 1) { // OPEN
         if (DEV) { console.log(`Client has connected.`) }
         isAlive = true;
      }
   }

   // when this client closes the connection
   socket.onclose = () => {
      if (isAlive === true) {
         if (DEV) { console.log(`Client has disconnected.`) }
         isAlive = false
      }
   }

   // on message, call a procedure      
   socket.onmessage = async (event) => {
      if (DEV) console.info(`onmessage event.data: ${event.data}`)
      const { txID, payload } = JSON.parse(event.data)
      const { procedure, key, value } = payload as DbRpcPayload
      if (DEV) console.log(`onmessage event procedure: ${procedure}`)
      if (socket.readyState === 1) {
         switch (procedure) {
            case 'GET': {
               if (DEV) console.log(`switch procedure GET `)
               const result = await db.get(key) ?? ""
               const msg = JSON.stringify({txID, error: '', result})
               socket.send(msg)
               if (DEV) { console.log(`Server sent msg`) }
               break;
            }
            case 'SET': {
               if (DEV) console.log(`switch procedure SET `)
               const result = await db.set(key, value) ?? ""
               if (DEV) { console.log(`putTodos result: ${result}`) }
               break;
            }
            default:
               if (DEV) console.log(`switch procedure default `)
               break;
         }

         isAlive = true;
      }
   }
}
