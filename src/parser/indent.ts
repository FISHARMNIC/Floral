import { DSError } from "../compiler/DSError";

type MappedInfo = {
    indent: number;
    content: string;
    trimmed: string;
    lineNumber: number;
}

export type ProcessedLine = {
    lineNumber: number; // 0 for synthetic `end` lines inserted by the preprocessor
    content: string;
}

export let activeSourceCode: ProcessedLine[] = []; // @todo cleanup

export function addEnds(content: string): ProcessedLine[]
{
    content = content.split("\n").join("\n");  //.filter(x => x.trim().length != 0).join("\n");
    const idx = content.indexOf(":\n") + 2;
    if(idx == 1)
    {
        // No blocks - each line maps 1:1 to its original line number
        const res = content.split("\n").map((line, i) => ({ lineNumber: i + 1, content: line }));
        activeSourceCode = res;
        return res;
    }

    const spacechar = content[idx];

    if(!(spacechar == " " || spacechar == "\t"))
    {
        throw new DSError(`Character "${spacechar}" cannot be used as newline`);
    }

    let indendationAmount = 0;
    while(content[indendationAmount + idx] == spacechar)
    {
        indendationAmount++
    }

    const contentArr = content.split("\n");

    const tab = spacechar.repeat(indendationAmount);

    let lastIndent = 0;

    const mapped: MappedInfo[] = contentArr.map((x, index) => {
        let i = 0;

        while(true)
        {
            const t = x.trim();
            if(t.length == 0 || t.slice(0,2) == "//")
            {
                x = tab.repeat(lastIndent) + t;
            }

            const s = i * indendationAmount;
            const sliced = x.slice(s, s + indendationAmount);
            if(sliced[0] != spacechar)
            {
                break;
            }
            else if(sliced != tab)
            {
                // console.log(sliced, x)
                throw new DSError(`Bad indentation level, expected [${indendationAmount}] ${spacechar == " " ? "space(s)" : "tab(s)"}`);
            }
            i++;
        }
        lastIndent = i;
        return { indent: i, content: x, trimmed: x.slice(indendationAmount * i), lineNumber: index + 1 }
    })

    const result: ProcessedLine[] = [];

    for(let i = 1; i < mapped.length; i++)
    {
        const prev = mapped[i-1];
        const curr = mapped[i];

        const first4 = curr.trimmed.slice(0, 4);

        if(curr.indent < prev.indent && first4 != "elif" && first4 != "else" && first4 != "end")
        {
            const ind = prev.indent - 1;
            const s = tab.repeat(ind) + "end";
            mapped.splice(i, 0, { indent: ind, content: s, trimmed: s.slice(ind * indendationAmount), lineNumber: 0 });
        }

        result.push({ lineNumber: prev.lineNumber, content: prev.content });
    }

    // append the last line
    result.push({ lineNumber: mapped[mapped.length - 1].lineNumber, content: mapped[mapped.length - 1].content });

    activeSourceCode = result;
    // console.log("ASC", activeSourceCode)
    
    // console.log(result.map(x => x.content).join("\n"))
    // process.exit()

    return result;
}
