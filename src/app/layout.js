import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Zehnix AI",
  description: "Zehnix AI — your everyday AI assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    // Page show hone se pehle hi background dark kar do taake white flash na aaye
                    document.documentElement.style.backgroundColor = '#0f0f0f'; 
                  } else {
                    document.documentElement.classList.remove('dark');
                    // Light mode ke liye white background
                    document.documentElement.style.backgroundColor = '#ffffff'; 
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-surface text-ink tracking-[0.015em]`}>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}