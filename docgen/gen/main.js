var build = require("./lib.js")

build.pagesFrom("resources/pages", build.rootPath + "/resources/mandatory/template.html", build.rootPath + "/resources/mandatory/404.html", true)
