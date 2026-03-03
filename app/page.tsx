"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Panel Principal
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

        <Link href="/jugadoras">
          <div className="bg-white p-6 rounded shadow hover:shadow-lg cursor-pointer text-center">
            <h2 className="text-xl font-semibold">
              Gestión de Jugadoras
            </h2>
          </div>
        </Link>

        <Link href="/entrenamientos">
          <div className="bg-white p-6 rounded shadow hover:shadow-lg cursor-pointer text-center">
            <h2 className="text-xl font-semibold">
              Entrenamientos
            </h2>
          </div>
        </Link>

        <Link href="/asistencias">
          <div className="bg-white p-6 rounded shadow hover:shadow-lg cursor-pointer text-center">
            <h2 className="text-xl font-semibold">
              Asistencias
            </h2>
          </div>
        </Link>

        <Link href="/partidos">
          <div className="bg-white p-6 rounded shadow hover:shadow-lg cursor-pointer text-center">
            <h2 className="text-xl font-semibold">
              Partidos
            </h2>
          </div>
        </Link>

        <Link href="/estadisticas">
          <div className="bg-white p-6 rounded shadow hover:shadow-lg cursor-pointer text-center border-2 border-indigo-500">
            <h2 className="text-xl font-semibold text-indigo-600">
              Estadísticas de Temporada
            </h2>
          </div>
        </Link>

      </div>
    </main>
  );
}