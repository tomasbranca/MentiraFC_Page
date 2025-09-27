import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import News from "./pages/News/News";
import Squad from "./pages/Squad/Squad";
import Table from "./pages/Table/Table";
import Record from "./pages/Record/Record";
import NavBar from "./components/NavBar/NavBar";
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <div className="pt-24">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/noticias" element={<News />} />
          <Route path="/plantel" element={<Squad />} />
          <Route path="/tabla" element={<Table />} />
          <Route path="/historial" element={<Record />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
