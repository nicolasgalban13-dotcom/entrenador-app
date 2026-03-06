import "./globals.css";
import Link from "next/link";
import AuthGuard from "./components/AuthGuard";

export const metadata = {
  title: "Entrenador App",
  description: "Sistema de gestión deportiva",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthGuard>
          <nav className="bg-gray-900 text-white p-4 flex gap-6">
            <Link href="/" className="hover:text-blue-400">
              Inicio
            </Link>

            <Link href="/jugadoras" className="hover:text-blue-400">
              Jugadoras
            </Link>

            <Link href="/entrenamientos" className="hover:text-blue-400">
              Entrenamientos
            </Link>

            <Link href="/asistencias" className="hover:text-blue-400">
              Asistencias
            </Link>

            <Link href="/partidos" className="hover:text-blue-400">
              Partidos
            </Link>

            <Link href="/estadisticas" className="hover:text-blue-400">
              Estadisticas
            </Link>
            <Link href="/partidoenvivo" className="hover:text-blue-400">
              Partido en Vivo
            </Link>
          </nav>

          <div>{children}</div>
        </AuthGuard>
      </body>
    </html>
  );
}