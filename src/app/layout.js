import './globals.css';

export const metadata = {
  title: 'Hair Atelier — Салон красоты',
  description: 'Пространство, где мастерство встречает стиль. Стрижки, окрашивание, уход, обучение.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
