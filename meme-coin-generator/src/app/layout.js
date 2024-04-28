import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

export const metadata = {
  title: "Meme coin generator",
  description: "Generate your meme coin in 1 minute, without any coding!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"/>
      <link href="https://fonts.googleapis.com/css2?family=Jersey+10&display=swap" rel="stylesheet"/>
      <body>{children}</body>
    </html>
  );
}
