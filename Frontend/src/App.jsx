import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../src/Pages/Home";
import Result from "../src/Pages/Result";
import Navbar from "../src/Components/Navbar";
function App() {
  return (
     <div className="min-h-screen">
        {/* <Navbar /> */}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* <Route path="/result" element={<Result />} /> */}
          </Routes>
        </main>
      </div>
  );
}

export default App;
