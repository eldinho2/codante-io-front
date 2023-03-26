import type { LinksFunction, MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';
import Footer from '~/components/footer';
import Navbar from '~/components/navbar';
import stylesheet from '~/tailwind.css';
import { user } from './services/auth.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', href: '/favicon.svg' },
];

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Codante - Cursos e Projetos Online de Programação',
  viewport: 'width=device-width,initial-scale=1',
});

export function loader({ request }: { request: Request }) {
  return user({ request });
}


export default function App() {
  const user = useLoaderData();
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-800 text-white">
        <div>
          <Navbar user={user} />
          <main className='min-h-screen mx-auto max-w-7xl'>
            <Outlet />
          </main>
          <Footer />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
