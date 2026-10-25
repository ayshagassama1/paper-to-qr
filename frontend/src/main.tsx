import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router"

import "./index.css"
import { CustomerMenuPage } from "@/pages/CustomerMenuPage"
import { HomePage } from "@/pages/HomePage"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:slug" element={<CustomerMenuPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
