// Excuse Generator - runs with Node.js

const who = [
    "My dog",
    "My neighbor",
    "My little sister",
    "My best friend"
];

const action = [
    "accidentally deleted",
    "spilled coffee on",
    "forgot to return",
    "broke"
];

const what = [
    "my homework",
    "my phone charger",
    "the TV remote",
    "my laptop"
];

const when = [
    "today",
    "yesterday",
    "this morning",
    "last night"
];

const randomWho    = who[Math.floor(Math.random() * who.length)];
const randomAction = action[Math.floor(Math.random() * action.length)];
const randomWhat   = what[Math.floor(Math.random() * what.length)];
const randomWhen   = when[Math.floor(Math.random() * when.length)];

const excuse = `${randomWho} ${randomAction} ${randomWhat} ${randomWhen}.`;

console.log(excuse);
