
import React, { useState } from "react";
import "./App.css";

// Define the different fancy text styles
const styles = {
  Bold: (str) => str.replace(/[a-zA-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + (c >= "a" ? 0x1d41a - 97 : 0x1d400 - 65))),
  Italic: (str) => str.replace(/[a-zA-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + (c >= "a" ? 0x1d44e - 97 : 0x1d434 - 65))),
  Script: (str) => str.replace(/[a-zA-Z]/g, (c) => String.fromCharCode(c >= "a" ? 0x1d4b6 + c.charCodeAt(0) - 97 : 0x1d49c + c.charCodeAt(0) - 65)),
  Bubble: (str) => str.replace(/[a-zA-Z0-9]/g, (c) => {
    if (c >= "a" && c <= "z") return String.fromCharCode(0x24d0 + c.charCodeAt(0) - 97);
    if (c >= "A" && c <= "Z") return String.fromCharCode(0x24b6 + c.charCodeAt(0) - 65);
    if (c >= "0" && c <= "9") return String.fromCharCode(0x2460 + c.charCodeAt(0) - 1);
    return c;
  }),
  "Small Caps": (str) => str.replace(/[a-z]/g, (c) => String.fromCharCode(0x1d00 + c.charCodeAt(0) - 97)),
};

function App() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Handle copying text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle copying all styles at once
  const copyAll = () => {
    const allText = Object.values(styles)
      .map((func) => func(input))
      .join("\n\n");
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="App">
      <h1>Fancy Word Generator</h1>
      <input
        type="text"
        placeholder="Enter your word or phrase"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={copyAll}>Copy All</button>
      {copied && <p>Copied to clipboard!</p>}
      <div className="output">
        {Object.entries(styles).map(([name, func]) => (
          <div key={name} className="style-block">
            <h3>{name}</h3>
            <p>{func(input)}</p>
            <button onClick={() => copyToClipboard(func(input))}>Copy</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
