import { DSError } from "../compiler/DSError";

export function addEnds(content: string): string // @todo lazy and temprorary function
{
    const idx = content.indexOf(":\n") + 2;
    if(idx == 1)
    {
        return content;
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
    
    const mapped = contentArr.map(x => {
        let i = 0;

        while(true)
        {
            const t = x.trim();
            if(t.length == 0 || t.slice(0,2) == "//")
            {
                x = "";
            }

            const s = i * indendationAmount;
            const sliced = x.slice(s, s + indendationAmount);
            if(sliced[0] != spacechar)
            {
                break;
            }
            else if(sliced != tab)
            {
                throw new DSError(`Bad indentation level, expected [${indendationAmount}] ${spacechar == " "? "space(s)" : "tab(s)"}`);
            }
            i++;
        }
        return {indent: i, content: x, trimmed: x.slice(indendationAmount * i)}
    })

    let final = ""
    for(let i = 1; i < mapped.length; i++)
    {
        const prev = mapped[i-1];
        const curr = mapped[i];

        const first4 = curr.trimmed.slice(0,4);

        // console.log("FIRST4", first4)
        if(curr.indent < prev.indent && first4 != "elif" && first4 != "else" && first4 != "end")
        {
            const ind = prev.indent - 1
            const s = tab.repeat(ind) + "end";
            mapped.splice(i, 0, {indent: ind, content: s, trimmed: s.slice(ind * indendationAmount)})
        }

        final += prev.content + '\n';
    }

    // append the last line, which the loop never reaches as prev
    final += mapped[mapped.length - 1].content + '\n';

    return final;
}

