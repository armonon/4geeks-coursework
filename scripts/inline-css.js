const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const cssPath = path.join(root, "assets", "tailwind.css");
const css = fs.readFileSync(cssPath, "utf8");
const inlineStyle = `<style data-tailwind-inline>${css}</style>`;
const targetFiles = [
    "index.html",
    "index.es.html",
    "application.html",
    "application.es.html"
];

const stylesheetPattern =
    /<style data-tailwind-inline>[\s\S]*?<\/style>|<link rel="stylesheet" href="assets\/tailwind\.css">/;

for (const fileName of targetFiles) {
    const filePath = path.join(root, fileName);
    const html = fs.readFileSync(filePath, "utf8");

    if (!stylesheetPattern.test(html)) {
        throw new Error(`No Tailwind stylesheet marker found in ${fileName}`);
    }

    fs.writeFileSync(filePath, html.replace(stylesheetPattern, inlineStyle));
}
