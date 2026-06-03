/*
 * Converts a directory of .md files into a static website.
 *
 * template.html must contain:
 *   <div class="sidenav">
 *       <a href="index.html">Home</a>
 *       <!-- !IN_NAV -->
 *   </div>
 *
 *   <div id="__main__"></div>
 */

const fs   = require("fs")
const path = require("path")
const glob = require("glob")
const fse  = require("fs-extra")
const showdown = require("showdown")

showdown.setFlavor("github")
showdown.setOption("ghCodeBlocks", true)

const converter = new showdown.Converter({ tables: true })

const rootPath = path.join(__dirname, "..")
const docsPath = path.join(rootPath, "..", "docs")

const NAV_MARKER = "<!-- !IN_NAV -->"

function buildNavLinks(pages) {
    const links = []
    let lastSection = ""

    pages
        .filter(p => p !== "/index")
        .sort((a, b) => a.split("/").length - b.split("/").length)
        .forEach(page => {
            const section = page.slice(1, page.slice(1).indexOf("/") + 1)
            const name    = page.slice(page.indexOf(section) + section.length + 1)

            if (section !== lastSection) {
                links.push(`</details><details><summary>${section}</summary>`)
                lastSection = section
            }

            links.push(`<a href="/docs${page}.html">• ${name}</a>`)
        })

    return links.join("\n")
}

function buildLoadScript(template) {
    return `window.addEventListener('load', function () {
    var template = \`${template}\`
    var oldBody = document.body.innerHTML
    document.write(template)
    document.getElementById("__main__").innerHTML = oldBody
    var _path = window.location.pathname.slice(1).split("/")
    var build = ""
    document.getElementById("__link_train__").innerHTML = _path
        .map(x => \`<a href=\${build += "/" + x}>\${x}</a> >\`)
        .join(" ")
        .slice(0, -1)
})`
}

const pagesFrom = function (directory, templatePath, path404, useLinks = true) {
    fse.emptyDirSync(docsPath)

    const pattern = path.join(rootPath, directory, "**/*")
    const pages = []

    glob(pattern, function (err, files) {
        files.forEach(file => {
            if (path.extname(file) !== ".md") return

            const parsed     = path.parse(file)
            const dirPart    = parsed.dir.slice(parsed.dir.indexOf(directory) + directory.length)
            const pagePath   = `${dirPart}/${parsed.name}`
            const depth      = pagePath.split("/").length - 2
            const scriptPath = `${"../".repeat(depth)}loadIndex.js`

            if (pages.includes(pagePath)) {
                console.error(`Duplicate page: "${file}"`)
                process.exit(1)
            }

            const html = converter.makeHtml(fs.readFileSync(file, "utf8"))
            fse.outputFileSync(
                path.join(docsPath, dirPart, `${parsed.name}.html`),
                `${html}\n<script src="${scriptPath}"></script>`
            )
            pages.push(pagePath)
        })

        let template = fs.readFileSync(templatePath, "utf8")

        if (useLinks) {
            const markerPos = template.indexOf(NAV_MARKER)
            if (markerPos === -1) {
                console.error(`Template must contain "${NAV_MARKER}" inside the sidenav.`)
                process.exit(1)
            }
            const nav = buildNavLinks(pages)
            template = template.slice(0, markerPos) + nav + template.slice(markerPos)
        }

        fse.outputFileSync(path.join(docsPath, "template.html"), template)
        fse.outputFileSync(path.join(docsPath, "404.html"), fs.readFileSync(path404, "utf8"))
        fse.outputFileSync(path.join(docsPath, "loadIndex.js"), buildLoadScript(template))
    })
}

module.exports = { rootPath, pagesFrom }
