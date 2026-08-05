const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const criticalCss = fs.readFileSync(path.join(root, "assets", "critical.css"), "utf8");
const fullCssLoader = [
    `<style data-critical-css>${criticalCss}</style>`,
    `<link rel="stylesheet" href="assets/tailwind.css" media="print" onload="this.media='all'">`,
    `<noscript><link rel="stylesheet" href="assets/tailwind.css"></noscript>`
].join("");
const targetFiles = [
    "index.html",
    "index.es.html",
    "application.html",
    "application.es.html"
];

const stylePattern =
    /<style data-tailwind-inline>[\s\S]*?<\/style>|<style data-critical-css>[\s\S]*?<\/style><link rel="(?:preload|stylesheet)" href="assets\/tailwind\.css"(?: as="style")?(?: media="print")? onload="(?:this\.onload=null;this\.rel='stylesheet'|this\.media='all')"><noscript><link rel="stylesheet" href="assets\/tailwind\.css"><\/noscript>|<link rel="stylesheet" href="assets\/tailwind\.css">/;

for (const fileName of targetFiles) {
    const filePath = path.join(root, fileName);
    const html = fs.readFileSync(filePath, "utf8");

    if (!stylePattern.test(html)) {
        throw new Error(`No stylesheet marker found in ${fileName}`);
    }

    fs.writeFileSync(filePath, html.replace(stylePattern, fullCssLoader));
}
