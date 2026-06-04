/*
 * Converts a directory of .md files into a static website.
 *
 * template.html must contain:
 *   <div class="sidenav">
 *       <!-- !IN_NAV -->
 *   </div>
 *
 *   <div id="__main__"></div>
 *
 *   <div id="__link_train__"></div>
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

const NAV_MARKER    = "<!-- !IN_NAV -->"
const CONTENT_MARKER = '<div id="__main__"></div>'
const BREADCRUMB_MARKER = '<div id="__link_train__"></div>'

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

function buildBreadcrumb(pagePath) {
    const parts = pagePath.slice(1).split("/")
    let build = ""
    return parts
        .map(x => `<a href="${build += "/" + x}">${x}</a>`)
        .join(" > ")
}

const pagesFrom = function (directory, templatePath, path404, useLinks = true) {
    fse.emptyDirSync(docsPath)

    const pattern = path.join(rootPath, directory, "**/*")
    const pageData = []

    glob(pattern, function (err, files) {
        files.forEach(file => {
            if (path.extname(file) !== ".md") return

            const parsed   = path.parse(file)
            const dirPart  = parsed.dir.slice(parsed.dir.indexOf(directory) + directory.length)
            const pagePath = `${dirPart}/${parsed.name}`

            if (pageData.find(p => p.pagePath === pagePath)) {
                console.error(`Duplicate page: "${file}"`)
                process.exit(1)
            }

            pageData.push({ file, dirPart, pagePath, name: parsed.name })
        })

        let template = fs.readFileSync(templatePath, "utf8")

        if (useLinks) {
            const markerPos = template.indexOf(NAV_MARKER)
            if (markerPos === -1) {
                console.error(`Template must contain "${NAV_MARKER}" inside the sidenav.`)
                process.exit(1)
            }
            const nav = buildNavLinks(pageData.map(p => p.pagePath))
            template = template.slice(0, markerPos) + nav + template.slice(markerPos + NAV_MARKER.length)
        }

        pageData.forEach(({ file, dirPart, pagePath, name }) => {
            const html       = converter.makeHtml(fs.readFileSync(file, "utf8"))
            const breadcrumb = buildBreadcrumb(`/docs${pagePath}`)

            const page = template
                .replace(CONTENT_MARKER,    `<div id="__main__">${html}</div>`)
                .replace(BREADCRUMB_MARKER, `<div id="__link_train__">${breadcrumb}</div>`)

            fse.outputFileSync(path.join(docsPath, dirPart, `${name}.html`), page)
        })

        fse.outputFileSync(path.join(docsPath, "404.html"), fs.readFileSync(path404, "utf8"))
    })
}

module.exports = { rootPath, pagesFrom }
