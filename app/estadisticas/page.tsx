"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EstadisticasTemporada() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [historialOficial, setHistorialOficial] = useState<any[]>([]);
  const [historialAmistoso, setHistorialAmistoso] = useState<any[]>([]);
  const [tablaTarjetas, setTablaTarjetas] = useState<any[]>([]);
  const [equipoStats, setEquipoStats] = useState<"Primera" | "Intermedia">("Primera");
const [resumenEquipo, setResumenEquipo] = useState({
  oficiales: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
  amistosos: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
});
const [formaReciente, setFormaReciente] = useState<string[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [equipoStats]);

  async function cargarDatos() {

    // ===============================
    // TRAER PARTIDOS DEL EQUIPO
    // ===============================

    const { data: partidosEquipo } = await supabase
      .from("partidos")
      .select("*")
      .eq("equipo", equipoStats);

    if (!partidosEquipo) return;

    const idsPartidos = partidosEquipo.map((p: any) => p.id);

// ===============================
// RESUMEN EQUIPO (OFICIALES / AMISTOSOS)
// ===============================

const resumen = {
  oficiales: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
  amistosos: { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 },
};

partidosEquipo.forEach((p: any) => {
  const grupo = p.tipo === "Oficial" ? resumen.oficiales : resumen.amistosos;

  grupo.pj++;
  grupo.gf += p.goles_favor;
  grupo.gc += p.goles_contra;

  if (p.goles_favor > p.goles_contra) grupo.pg++;
  else if (p.goles_favor < p.goles_contra) grupo.pp++;
  else grupo.pe++;
});

setResumenEquipo(resumen);

// ===============================
// FORMA ÚLTIMOS 5 PARTIDOS OFICIALES
// ===============================

const ultimosOficiales = partidosEquipo
  .filter((p: any) => p.tipo === "Oficial")
  .sort((a: any, b: any) =>
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )
  .slice(0, 5);

const forma = ultimosOficiales.map((p: any) => {
  if (p.goles_favor > p.goles_contra) return "🟢";
  if (p.goles_favor < p.goles_contra) return "🔴";
  return "🟡";
});

setFormaReciente(forma);

// ===============================
// GOLEADORAS + RACHA ACTIVA
// ===============================

    const { data: goles } = await supabase
      .from("goles")
      .select("jugadora_id, partidos(id, tipo, fecha), jugadoras(nombre)");

    if (!goles) return;

    const golesFiltrados = goles.filter((g: any) =>
      idsPartidos.includes(g.partidos?.id)
    );

    const estructura: any = {};

    golesFiltrados.forEach((g: any) => {
      const id = g.jugadora_id;

      if (!estructura[id]) {
        estructura[id] = {
          nombre: g.jugadoras?.nombre,
          oficiales: 0,
          amistosos: 0,
          golesPorPartido: {},
        };
      }

      if (g.partidos?.tipo === "Oficial") {
        estructura[id].oficiales++;

        if (!estructura[id].golesPorPartido[g.partidos.id]) {
          estructura[id].golesPorPartido[g.partidos.id] = 0;
        }

        estructura[id].golesPorPartido[g.partidos.id]++;
      } else {
        estructura[id].amistosos++;
      }
    });

    const partidosOficiales = partidosEquipo
      .filter((p: any) => p.tipo === "Oficial")
      .sort((a: any, b: any) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

    Object.values(estructura).forEach((j: any) => {
      let rachaActual = 0;

      for (const p of partidosOficiales) {
        if (j.golesPorPartido[p.id]) {
          rachaActual++;
        } else {
          break;
        }
      }

      j.rachaActiva = rachaActual;
    });

    const ordenado = Object.values(estructura).sort(
      (a: any, b: any) => b.oficiales - a.oficiales
    );

    setRanking(ordenado);

    // ===============================
    // TABLA DE TARJETAS
    // ===============================

    const { data: tarjetas } = await supabase
      .from("tarjetas")
      .select("jugadora_id, tipo, partidos(id), jugadoras(nombre)");

    const tarjetasFiltradas = tarjetas?.filter((t: any) =>
      idsPartidos.includes(t.partidos?.id)
    );

    const conteo: any = {};

    tarjetasFiltradas?.forEach((t: any) => {
      const id = t.jugadora_id;

      if (!conteo[id]) {
        conteo[id] = {
          nombre: t.jugadoras?.nombre,
          verde: 0,
          amarilla: 0,
          roja: 0,
        };
      }

      if (t.tipo === "Verde") conteo[id].verde++;
      if (t.tipo === "Amarilla") conteo[id].amarilla++;
      if (t.tipo === "Roja") conteo[id].roja++;
    });

    const rankingTarjetas = Object.values(conteo).sort(
      (a: any, b: any) =>
        b.roja - a.roja ||
        b.amarilla - a.amarilla ||
        b.verde - a.verde
    );

    setTablaTarjetas(rankingTarjetas);

    // ===============================
    // HISTORIAL VS RIVALES
    // ===============================

    const oficial: any = {};
    const amistoso: any = {};

    partidosEquipo.forEach((p: any) => {
      const grupo = p.tipo === "Oficial" ? oficial : amistoso;
      const rival = p.rival;

      if (!grupo[rival]) {
        grupo[rival] = {
          rival,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
        };
      }

      grupo[rival].pj++;
      grupo[rival].gf += p.goles_favor;
      grupo[rival].gc += p.goles_contra;

      if (p.goles_favor > p.goles_contra) grupo[rival].pg++;
      else if (p.goles_favor < p.goles_contra) grupo[rival].pp++;
      else grupo[rival].pe++;
    });

    setHistorialOficial(Object.values(oficial));
    setHistorialAmistoso(Object.values(amistoso));
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 space-y-10">
      <h1 className="text-3xl font-bold">
        Estadísticas de Temporada
      </h1>

      {/* SELECTOR EQUIPO */}

      <div className="flex gap-3">
        <button
          onClick={() => setEquipoStats("Primera")}
          className={`px-4 py-2 rounded ${
            equipoStats === "Primera"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Primera
        </button>

        <button
          onClick={() => setEquipoStats("Intermedia")}
          className={`px-4 py-2 rounded ${
            equipoStats === "Intermedia"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Intermedia
        </button>
      </div>

{/* FORMA RECIENTE */}

<div className="bg-white p-4 rounded mb-6">
  <h2 className="text-xl font-bold mb-4">
    Forma últimos 5 oficiales
  </h2>

  <div className="text-2xl flex gap-2">
    {formaReciente.length === 0 && (
      <span className="text-gray-500 text-sm">
        Sin partidos oficiales
      </span>
    )}

    {formaReciente.map((f, i) => (
      <span key={i}>{f}</span>
    ))}
  </div>
</div>

      {/* GOLEADORAS */}

      <div className="bg-white p-4 rounded">
        <h2 className="text-xl font-bold mb-4">
          Goleadoras (Oficiales)
        </h2>

        {ranking.map((j: any, i: number) => (
          <div key={i} className="flex justify-between border-b py-2">
            <div>
              {i + 1}. {j.nombre}
            </div>

            <div className="text-right">
              <div>
                🏆 Oficiales: <strong>{j.oficiales}</strong>
              </div>
              <div>
                🤝 Amistosos: {j.amistosos}
              </div>
              <div>
                🔥 Racha activa oficial: {j.rachaActiva}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HISTORIAL OFICIAL */}

      <div className="bg-white p-4 rounded">
        <h2 className="text-xl font-bold mb-4 text-green-600">
          Historial vs Rivales (Oficiales)
        </h2>

        {historialOficial.map((h: any, i: number) => (
          <div key={i} className="border-b py-2">
            <div className="font-semibold">{h.rival}</div>
            <div className="text-sm">
              PJ: {h.pj} | PG: {h.pg} | PE: {h.pe} | PP: {h.pp}
            </div>
            <div className="text-sm">
              GF: {h.gf} | GC: {h.gc}
            </div>
          </div>
        ))}
      </div>

      {/* HISTORIAL AMISTOSO */}

      <div className="bg-white p-4 rounded">
        <h2 className="text-xl font-bold mb-4 text-blue-600">
          Historial vs Rivales (Amistosos)
        </h2>

        {historialAmistoso.map((h: any, i: number) => (
          <div key={i} className="border-b py-2">
            <div className="font-semibold">{h.rival}</div>
            <div className="text-sm">
              PJ: {h.pj} | PG: {h.pg} | PE: {h.pe} | PP: {h.pp}
            </div>
            <div className="text-sm">
              GF: {h.gf} | GC: {h.gc}
            </div>
          </div>
        ))}
      </div>

      {/* TABLA DE TARJETAS */}

      <div className="bg-white p-4 rounded">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Tabla de Tarjetas (Temporada)
        </h2>

        {tablaTarjetas.map((t: any, i: number) => (
          <div key={i} className="flex justify-between border-b py-2">
            <div>
              {i + 1}. {t.nombre}
            </div>

            <div>
              🟩 {t.verde} | 🟨 {t.amarilla} | 🟥 {t.roja}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}