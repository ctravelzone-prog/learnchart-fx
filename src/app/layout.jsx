// ---------------------------------------------------------------------------
// layout.jsx — root layout: fonts, metadata, pill nav + footer on every
// page. Public pages are indexable; gated pages set noindex themselves.
// ---------------------------------------------------------------------------
import "./globals.css";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";

export const metadata = {
  title: "LearnChart FX — Mastering Trading With Experts",
  description:
    "LearnChart FX — forex trading premium course, premium live trade support every day and trading consultation. Mentors Siam Chowdhury and Rex Mizan.",
  openGraph: {
    title: "LearnChart FX — Mastering Trading With Experts",
    description:
      "Forex trading premium course, premium live trade support every day and trading consultation. Mentors Siam Chowdhury and Rex Mizan.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* The pill nav is wrapped so the Community page can hide it on
            desktop widths: there the Instagram rail (inside the page)
            is the navigation. See globals.css (.site-nav-wrap). */}
        <div className="site-nav-wrap"><Nav /></div>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
