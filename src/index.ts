import { DaisyParser } from './parser';

export * as AST from './parser/ast';


const parser = new DaisyParser();

const ast = parser.parse(`
function myChild -> None:
    send("Knock Knock")
    while(true):
        let recv = receive()
        print(recv)
        if(recv == "Who is there?"):
            send("Your child!")
        elif(recv == "Oh hi!"):
            send("Wassup")
            break
        end
    end
end

let handler = spawn myChild()
while(true):
    let recv = handler.receive()
    print(recv)
    if(recv == "Knock Knock"):
        handler.send("Who is there?")
    elif(recv == "Your child!"):
        handler.send("Oh hi!")
    elif(recv == "Wassup"):
        break
    end
end

await handler()`
)

console.log(ast)