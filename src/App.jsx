import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Chart from "./Chart";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Chart />
    </>
  );
}

export default App;
