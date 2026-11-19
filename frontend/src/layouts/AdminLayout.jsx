import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";

import "../styles/layout.css";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">

      {/* Thanh menu */}
      <Sidebar
        role="admin"
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Lớp phủ trên điện thoại */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Khu vực nội dung */}
      <div className="app-main">

        <Header
          onToggleSidebar={toggleSidebar}
          isOpen={sidebarOpen}
        />

        <main className="app-content">

          <Outlet />

        </main>

        <Footer />

      </div>

    </div>
  );
}

export default AdminLayout;
