
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Anúncio Fixo no Topo */}
      <div dangerouslySetInnerHTML={{ __html: '<div joinadscode="Fixed" refresh="true" lazyload="true" position="top"></div>' }} />
      
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Layout;
