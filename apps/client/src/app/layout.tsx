import './global.css';
import Providers from './Providers'

export const metadata = {
  title: 'E-Learning Platform',
  description: 'Frontend for E-Learning Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
