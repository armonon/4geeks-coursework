const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const stylesheet = `<link rel="stylesheet" href="assets/tailwind.css">`;
const targetFiles = [
    "index.html",
    "catalog.html",
    "product.html",
    "cart.html",
    "checkout.html"
];

const stylePattern =
    /<style data-tailwind-inline>[\s\S]*?<\/style>|<style data-critical-css>[\s\S]*?<\/style><link rel="(?:preload|stylesheet)" href="assets\/tailwind\.css"(?: as="style")?(?: media="print")? onload="(?:this\.onload=null;this\.rel='stylesheet'|this\.media='all')"><noscript><link rel="stylesheet" href="assets\/tailwind\.css"><\/noscript>|<link rel="stylesheet" href="assets\/tailwind\.css">/;

for (const fileName of targetFiles) {
    const filePath = path.join(root, fileName);
    const html = fs.readFileSync(filePath, "utf8");

    if (!stylePattern.test(html)) {
        throw new Error(`No stylesheet marker found in ${fileName}`);
    }

    fs.writeFileSync(filePath, html.replace(stylePattern, stylesheet));
}
