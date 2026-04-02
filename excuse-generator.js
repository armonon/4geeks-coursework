// Excuse Generator - runs with Node.js

const who = [
    "My dog",
    "My neighbor",
    "My little sister",
    "The mailman"
];

const action = [
    "accidentally deleted",
    "spilled coffee on",
    "sat on",
    "lost"
];

const what = [
    "my homework",
    "my charger",
    "my alarm clock",
    "my notes"
];

const when = [
    "today",
    "yesterday",
    "this morning",
    "last night"
];

const randomWho = who[Math.floor(Math.random() * who.length)];
const randomAction = action[Math.floor(Math.random() * action.length)];
const randomWhat = what[Math.floor(Math.random() * what.length)];
const randomWhen = when[Math.floor(Math.random() * when.length)];

const excuse = `${randomWho} ${randomAction} ${randomWhat} ${randomWhen}.`;

console.log(excuse);
