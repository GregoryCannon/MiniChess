import React from "react";
import "./App.css";
import GameManager from "./GameManager";

function App() {
  return (
    <div className="App">
      <header>
        <h1>Welcome to Mini Chess!</h1>
        <p>Developed by Greg Cannon, for AI purposes</p>
      </header>

      <GameManager />
    </div>
  );
}

export default App;
