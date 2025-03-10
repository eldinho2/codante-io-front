import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import Footer from "~/components/footer";
import Navbar from "~/components/navbar";
import { ColorModeProvider } from "~/contexts/color-mode-context";
import stylesheet from "~/tailwind.css";
import { DarkModeScriptInnerHtml } from "~/utils/dark-mode";
import { user } from "./services/auth.server";
import { Toaster } from "react-hot-toast";
import LoadingBar from "~/components/loading-bar";
import { getOgGeneratorUrl } from "./utils/path-utils";
import { GoogleTagManager } from "./components/google-tag-manager";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://rsms.me" },
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
  { rel: "icon", href: "/favicon.svg" },
];

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Codante - Cursos e Projetos Online de Programação",
  viewport: "width=device-width,initial-scale=1",
  description:
    "Fuja dos mesmos cursos e tutoriais de sempre e aprimore suas skills em programação com workshops e mini projetos ensinados pelos melhores profissionais do mercado!",

  "og:title": "Codante - Cursos e Projetos Online de Programação",
  "og:description": "Codante - Cursos e Projetos Online de Programação",
  "og:image": getOgGeneratorUrl("Codante"),
  "og:type": "website",

  "twitter:card": "summary_large_image",
  "twitter:domain": "codante.io",
  "twitter:title": "Codante - Cursos e Projetos Online de Programação",
  "twitter:description": "Codante - Cursos e Projetos Online de Programação",
  "twitter:image": getOgGeneratorUrl("Codante"),
  "twitter:image:alt": "Codante",
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
      <body className="text-gray-800 bg-white dark:bg-gradient-to-br dark:from-gray-darkest dark:to-gray-dark bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:text-gray-50">
        <script
          dangerouslySetInnerHTML={{
            __html: DarkModeScriptInnerHtml,
          }}
        />
        <GoogleTagManager
          environment={process.env.NODE_ENV}
          gtmTrackingId="GTM-NXHM2J7"
        />
        <ColorModeProvider>
          <LoadingBar />
          <Navbar user={user} />
          {/* altura do footer de 170px. Se mudar deve mudar o cálculo aqui */}
          <main className="lg:py-10 py-6 min-h-[calc(100vh-170px)] mx-auto">
            <Outlet context={{ user }} />
          </main>
          <Footer />
        </ColorModeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Toaster
          toastOptions={{
            className:
              "bg-background-50 dark:bg-background-800 dark:text-gray-50",
          }}
        />
        {process.env.NODE_ENV !== "production" && (
          <div className="fixed z-50 w-20 py-2 font-bold text-center text-blue-700 bg-blue-100 rounded-full bottom-2 left-2">
            <span className="block md:hidden">sm</span>
            <span className="hidden md:block lg:hidden">md</span>
            <span className="hidden lg:block xl:hidden">lg</span>
            <span className="hidden xl:block 2xl:hidden">xl</span>
            <span className="hidden 2xl:block">2xl</span>
          </div>
        )}
      </body>
    </html>
  );
}
