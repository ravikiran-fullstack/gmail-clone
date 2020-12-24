const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "demo/gmailScript.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js"
  },
  mode:"development"
}