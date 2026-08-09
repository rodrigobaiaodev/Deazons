import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh]">
      <Navbar />
      <main className="flex-1 pt-16 pb-[env(safe-area-inset-bottom)]">{children}</main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Layout;
