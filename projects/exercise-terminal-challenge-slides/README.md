This project consists of **interactive slides** to learn about the command line.

## 🚀 Installation, Building, and Deployment of the Slides

To work with this project, follow the steps below.

### 1️. Install dependencies

Before running any process, install the necessary dependencies:

```bash
npm install
```
This will download all the required packages to view and modify the slides correctly.

### 2️. Build the slides
To generate the optimized version of the slides for production, run:

```bash
npm run build
```

This will create a `dist/` folder with the necessary files to view the slides in a browser.

If `dist/` is not generated correctly, check the terminal logs and ensure that `webpack.config.js` is configured correctly.

### 3. Run in development mode

If you want to view the slides locally before deploying them, use:

```bash
npm run start
```

This will start a local server that will allow you to view the slides in the browser.

### 4️. Deploy the slides on GitHub Pages

To publish the slides on **GitHub Pages**, run:

```bash
npm run deploy
```