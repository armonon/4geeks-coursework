# The Excuse Generator (JavaScript)

Disneyland for procrastinators and lazy people.

This project is ideal for avoiding someone annoying. It takes no more than 20 lines of code and can save you for the rest of your life.

## Objective

This project is designed as a first practical experience with JavaScript, focused on learning by doing. Through the creation of an excuse generator that runs in the console, students will work with a reduced amount of code, allowing them to focus on the fundamentals of the language without unnecessary distractions.

During the development of the project, key concepts such as the use of arrays, random data selection, and string construction will be reinforced. Due to its simplicity and playful nature, this exercise works as an excellent starting point for those beginning their journey as developers.

Additionally, the project introduces the use of Copilot as a development support tool. The goal is not just to obtain a functional program, but to learn how to guide the AI through clear and progressive instructions, understanding and validating each part of the generated code before moving on to the next step.

## Project Rules

- Work **step by step**, following the indicated order.
- Do not request all the code in a single prompt.
- Read and understand the code before continuing to the next step.
- Run the project using **Node.js**.
- Print the final result in the console with `console.log`.

---

<onlyfor saas="false" withBanner="false">
  
## 🌱 How to Start This Project

Do not clone this repository because we are going to use a different template.

We recommend opening the `excuses-generator-with-prompts` repository using a development environment like [Codespaces](https://4geeks.com/lesson/what-is-github-codespaces) (recommended) or [Gitpod](https://4geeks.com/lesson/how-to-use-gitpod). Alternatively, you can clone it on your local computer using the `git clone` command.

This is the repository you need to open or clone:

```text
https://github.com/4GeeksAcademy/excuses-generator-with-prompts
```

**👉 Please follow these steps on** [how to start a coding project](https://4geeks.com/lesson/how-to-start-a-project).

</onlyfor>

## Step-by-Step Instructions (Prompts for Copilot)

### Step 1 – Create the File
- Ask Copilot to create a JavaScript file called `excuse-generator.js`, prepared to run with Node.js.

---

### Step 2 – "Who" Array
- Ask Copilot to create an array called `who` with at least 4 possible subjects that can start an excuse.

---

### Step 3 – "Action" Array
- Ask Copilot to create an array called `action` with past tense actions that can be part of an excuse.

---

### Step 4 – "What" Array
- Ask Copilot to create an array called `what` with objects or situations related to the excuse.

---

### Step 5 – "When" Array
- Ask Copilot to create an array called `when` with time references (for example: today, yesterday, this morning, etc.).

---

### Step 6 – Random Selection
- Ask Copilot to generate a line of code to get a random value from the `who` array.
- Ask Copilot to generate a line of code to get a random value from the `action` array.
- Ask Copilot to generate a line of code to get a random value from the `what` array.
- Ask Copilot to generate a line of code to get a random value from the `when` array.
- Use `Math.random()` and `Math.floor()` for random selection.

---

### Step 7 – Build the Excuse
- Ask Copilot to concatenate the random values obtained into a single sentence.
- Store the resulting sentence in a variable called `excuse`.

---

### Step 8 – Print to Console
- Ask Copilot to print the value of the `excuse` variable using `console.log`.

---

## Running the Program

Run the project from the terminal with the following command:

```bash
node excuse-generator.js
```
