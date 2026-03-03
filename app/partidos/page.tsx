"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Partidos() {
  const [partidos, setPartidos] = useState<any[]>([]);
  const [jugadoras, setJugadoras] = useState<any[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);

  const [modo, setModo] = useState<
    "lista" | "editar" | "convocatoria" | "verconvocatoria" | "stats" | "verstats"
  >("lista");

  const [form, setForm] = useState({
    fecha: "",
    rival: "",
    condicion: "Local",
    tipo: "Amistoso",
  });

  const [convocatoria, setConvocatoria] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [golesRival, setGolesRival] = useState(0);

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    const { data: p } = await supabase
      .from("partidos")
      .select("*")
      .order("fecha", { ascending: false });

    const { data: j } = await supabase
      .from("jugadoras")
      .select("*")
      .eq("activa", true);

    setPartidos(p || []);
    setJugadoras(j || []);
  }

  function resultadoColor(p: any) {
    if (p.goles_favor > p.goles_contra) return "text-green-600 font-bold";
    if (p.goles_favor < p.goles_contra) return "text-red-600 font-bold";
    return "text-gray-600 font-bold";
  }

  function resultadoTexto(p: any) {
    if (p.goles_favor > p.goles_contra) return "Ganado";
    if (p.goles_favor < p.goles_contra) return "Perdido";
    return "Empate";
  }

  async function eliminarPartido(p: any) {
    if (!confirm("¿Eliminar partido y todas sus estadísticas?")) return;

    await supabase.from("partido_jugadoras").delete().eq("partido_id", p.id);
    await supabase.from("goles").delete().eq("partido_id", p.id);
    await supabase.from("tarjetas").delete().eq("partido_id", p.id);
    await supabase.from("partidos").delete().eq("id", p.id);

    setModo("lista");
    cargarTodo();
  }

  function abrirEditar(p?: any) {
    if (p) {
      setSeleccionado(p);
      setForm({
        fecha: p.fecha,
        rival: p.rival,
        condicion: p.condicion,
        tipo: p.tipo,
      });
    } else {
      setSeleccionado(null);
      setForm({
        fecha: "",
        rival: "",
        condicion: "Local",
        tipo: "Amistoso",
      });
    }
    setModo("editar");
  }

  async function guardarPartido() {
    if (!form.fecha || !form.rival) {
      alert("Completar fecha y rival");
      return;
    }

    if (seleccionado) {
      await supabase.from("partidos").update(form).eq("id", seleccionado.id);
    } else {
      await supabase.from("partidos").insert({
        ...form,
        goles_favor: 0,
        goles_contra: 0,
      });
    }

    setModo("lista");
    cargarTodo();
  }

  async function abrirConvocatoria(p: any) {
    setSeleccionado(p);

    const { data } = await supabase
      .from("partido_jugadoras")
      .select("*, jugadoras(*)")
      .eq("partido_id", p.id);

    setConvocatoria(data || []);
    setModo("convocatoria");
  }

  async function abrirVerConvocatoria(p: any) {
    setSeleccionado(p);

    const { data } = await supabase
      .from("partido_jugadoras")
      .select("*, jugadoras(*)")
      .eq("partido_id", p.id);

    setConvocatoria(data || []);
    setModo("verconvocatoria");
  }

  async function toggleConvocada(jugadora_id: number) {
    const existe = convocatoria.find(c => c.jugadora_id === jugadora_id);

    if (existe) {
      await supabase
        .from("partido_jugadoras")
        .delete()
        .eq("partido_id", seleccionado.id)
        .eq("jugadora_id", jugadora_id);
    } else {
      await supabase.from("partido_jugadoras").insert({
        partido_id: seleccionado.id,
        jugadora_id,
        titular: false,
      });
    }

    abrirConvocatoria(seleccionado);
  }

  async function toggleTitular(jugadora_id: number, actual: boolean) {
    await supabase
      .from("partido_jugadoras")
      .update({ titular: !actual })
      .eq("partido_id", seleccionado.id)
      .eq("jugadora_id", jugadora_id);

    abrirConvocatoria(seleccionado);
  }

  async function abrirStats(p: any) {
    setSeleccionado(p);

    const { data: convocadas } = await supabase
      .from("partido_jugadoras")
      .select("*, jugadoras(*)")
      .eq("partido_id", p.id);

    const { data: goles } = await supabase
      .from("goles")
      .select("*")
      .eq("partido_id", p.id);

    const { data: tarjetas } = await supabase
      .from("tarjetas")
      .select("*")
      .eq("partido_id", p.id);

    const estructura: any = {};

    (convocadas || []).forEach((c: any) => {
      estructura[c.jugadora_id] = {
        goles: (goles || []).filter(g => g.jugadora_id === c.jugadora_id).length,
        verde: (tarjetas || []).filter(t => t.jugadora_id === c.jugadora_id && t.tipo === "Verde").length,
        amarilla: (tarjetas || []).filter(t => t.jugadora_id === c.jugadora_id && t.tipo === "Amarilla").length,
        roja: (tarjetas || []).filter(t => t.jugadora_id === c.jugadora_id && t.tipo === "Roja").length,
      };
    });

    setConvocatoria(convocadas || []);
    setStats(estructura);
    setGolesRival(p.goles_contra || 0);
    setModo("stats");
  }

  async function abrirVerStats(p: any) {
    setSeleccionado(p);

    const { data: goles } = await supabase
      .from("goles")
      .select("*, jugadoras(*)")
      .eq("partido_id", p.id);

    const { data: tarjetas } = await supabase
      .from("tarjetas")
      .select("*, jugadoras(*)")
      .eq("partido_id", p.id);

    setStats({
      goles: goles || [],
      tarjetas: tarjetas || [],
    });

    setModo("verstats");
  }

  async function guardarStats() {
  if (!seleccionado) return;

  // 1️⃣ Borramos registros anteriores
  await supabase
    .from("goles")
    .delete()
    .eq("partido_id", seleccionado.id);

  await supabase
    .from("tarjetas")
    .delete()
    .eq("partido_id", seleccionado.id);

  let totalGoles = 0;

  // 2️⃣ Insertamos nuevamente todo
  for (const jugadora_id in stats) {
    const s = stats[jugadora_id];

    // GOLES
    for (let i = 0; i < s.goles; i++) {
      await supabase.from("goles").insert({
        partido_id: seleccionado.id,
        jugadora_id: Number(jugadora_id),
      });
    }

    // TARJETAS VERDES
    for (let i = 0; i < s.verde; i++) {
      await supabase.from("tarjetas").insert({
        partido_id: seleccionado.id,
        jugadora_id: Number(jugadora_id),
        tipo: "Verde",
      });
    }

    // TARJETAS AMARILLAS
    for (let i = 0; i < s.amarilla; i++) {
      await supabase.from("tarjetas").insert({
        partido_id: seleccionado.id,
        jugadora_id: Number(jugadora_id),
        tipo: "Amarilla",
      });
    }

    // TARJETAS ROJAS
    for (let i = 0; i < s.roja; i++) {
      await supabase.from("tarjetas").insert({
        partido_id: seleccionado.id,
        jugadora_id: Number(jugadora_id),
        tipo: "Roja",
      });
    }

    totalGoles += s.goles;
  }

  // 3️⃣ Actualizamos marcador
  await supabase
    .from("partidos")
    .update({
      goles_favor: totalGoles,
      goles_contra: golesRival,
    })
    .eq("id", seleccionado.id);

  setModo("lista");
  cargarTodo();
}

  return (
  <main className="min-h-screen bg-gray-100 p-8">
    <h1 className="text-3xl font-bold mb-6">Gestión de Partidos</h1>

    {modo === "lista" && (
  <>
    <button
      onClick={() => abrirEditar()}
      className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
    >
      Nuevo Partido
    </button>

    {partidos.length === 0 && (
      <div className="text-gray-500">
        No hay partidos cargados.
      </div>
    )}

    {partidos.map(p => (
      <div
  key={p.id}
  className="bg-white p-4 rounded-xl shadow-md mb-3 flex justify-between items-center hover:shadow-lg transition"
>
  <div>
    <div className="text-sm text-gray-500">
      {p.fecha}
    </div>

    <div className="text-lg font-semibold">
      vs {p.rival}
    </div>

    <div className="text-sm text-gray-600 flex items-center gap-2">
      <span>{p.condicion}</span>

      <span
        className={`px-2 py-1 rounded text-xs ${
          p.tipo === "Oficial"
            ? "bg-red-100 text-red-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {p.tipo}
      </span>
    </div>

    <div className={`mt-1 ${resultadoColor(p)}`}>
      {p.goles_favor} - {p.goles_contra} ({resultadoTexto(p)})
    </div>
  </div>

  <div className="flex flex-wrap gap-2 text-xs">
    <button
      onClick={() => abrirEditar(p)}
      className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
    >
      Editar
    </button>

    <button
      onClick={() => abrirConvocatoria(p)}
      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
    >
      Convocar
    </button>

    <button
      onClick={() => abrirVerConvocatoria(p)}
      className="px-3 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
    >
      Ver Conv.
    </button>

    <button
      onClick={() => abrirStats(p)}
      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
    >
      Editar Stats
    </button>

    <button
      onClick={() => abrirVerStats(p)}
      className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
    >
      Ver Stats
    </button>

    <button
      onClick={() => eliminarPartido(p)}
      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
    >
      Eliminar
    </button>
  </div>
</div>
    ))}
  </>
)}

    {modo === "editar" && (
  <div className="bg-white p-6 rounded shadow space-y-4 max-w-xl">
    <h2 className="text-xl font-bold">
      {seleccionado ? "Editar Partido" : "Nuevo Partido"}
    </h2>

    <div>
      <label className="block font-semibold mb-1">Fecha</label>
      <input
        type="date"
        value={form.fecha}
        onChange={(e) =>
          setForm({ ...form, fecha: e.target.value })
        }
        className="border p-2 w-full rounded"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">Rival</label>
      <input
        type="text"
        value={form.rival}
        onChange={(e) =>
          setForm({ ...form, rival: e.target.value })
        }
        className="border p-2 w-full rounded"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">Condición</label>
      <select
        value={form.condicion}
        onChange={(e) =>
          setForm({ ...form, condicion: e.target.value })
        }
        className="border p-2 w-full rounded"
      >
        <option value="Local">Local</option>
        <option value="Visitante">Visitante</option>
      </select>
    </div>

    <div>
      <label className="block font-semibold mb-1">Tipo</label>
      <select
        value={form.tipo}
        onChange={(e) =>
          setForm({ ...form, tipo: e.target.value })
        }
        className="border p-2 w-full rounded"
      >
        <option value="Amistoso">Amistoso</option>
        <option value="Oficial">Oficial</option>
      </select>
    </div>

    <div className="flex gap-3">
      <button
        onClick={guardarPartido}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Guardar
      </button>

      <button
        onClick={() => setModo("lista")}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

    {modo === "convocatoria" && seleccionado && (
  <div className="bg-white p-6 rounded shadow space-y-4 max-w-2xl">
    <h2 className="text-xl font-bold">
      Convocatoria - {seleccionado.rival}
    </h2>

    {jugadoras.map((j) => {
      const registro = convocatoria.find(
        (c) => c.jugadora_id === j.id
      );

      return (
        <div
          key={j.id}
          className="flex justify-between items-center border-b pb-2"
        >
          <span>{j.nombre}</span>

          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleConvocada(j.id)}
              className={`px-3 py-1 rounded ${
                registro
                  ? "bg-green-500 text-white"
                  : "bg-gray-300"
              }`}
            >
              {registro ? "Convocada" : "No convocada"}
            </button>

            {registro && (
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={registro.titular}
                  onChange={() =>
                    toggleTitular(
                      j.id,
                      registro.titular
                    )
                  }
                />
                <span>Titular</span>
              </label>
            )}
          </div>
        </div>
      );
    })}

    <div className="flex gap-3 pt-4">
      <button
        onClick={() => setModo("lista")}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Confirmar
      </button>

      <button
        onClick={() => setModo("lista")}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

    {modo === "verconvocatoria" && seleccionado && (
  <div className="bg-white p-6 rounded shadow space-y-4 max-w-2xl">
    <h2 className="text-xl font-bold">
      Convocatoria - {seleccionado.rival}
    </h2>

    {convocatoria.length === 0 && (
      <div className="text-gray-500">
        No hay jugadoras convocadas.
      </div>
    )}

    {convocatoria.map((c: any) => (
      <div
        key={c.jugadora_id}
        className="flex justify-between border-b pb-2"
      >
        <span>{c.jugadoras?.nombre}</span>

        {c.titular && (
          <span className="text-green-600 font-semibold">
            Titular
          </span>
        )}
      </div>
    ))}

    <button
      onClick={() => setModo("lista")}
      className="bg-gray-500 text-white px-4 py-2 rounded"
    >
      Volver
    </button>
  </div>
)}

    {modo === "stats" && seleccionado && (
  <div className="bg-white p-6 rounded shadow space-y-6 max-w-3xl">
    <h2 className="text-xl font-bold">
      Editar Estadísticas - {seleccionado.rival}
    </h2>

    <div>
      <label className="font-semibold mr-2">
        Goles del rival:
      </label>
      <input
        type="number"
        value={golesRival}
        onChange={(e) =>
          setGolesRival(Number(e.target.value))
        }
        className="border p-2 w-20 rounded"
      />
    </div>

    {convocatoria.length === 0 && (
      <div className="text-gray-500">
        No hay jugadoras convocadas.
      </div>
    )}

    {convocatoria.map((c: any) => {
      const datos = stats[c.jugadora_id] || {
        goles: 0,
        verde: 0,
        amarilla: 0,
        roja: 0,
      };

      return (
        <div
          key={c.jugadora_id}
          className="border p-4 rounded space-y-2"
        >
          <strong>{c.jugadoras?.nombre}</strong>

          <div className="flex flex-wrap gap-6 mt-2">
            {["goles", "verde", "amarilla", "roja"].map((campo) => (
              <div key={campo}>
                <label className="capitalize mr-2">
                  {campo}:
                </label>
                <input
                  type="number"
                  value={datos[campo]}
                  onChange={(e) =>
                    setStats({
                      ...stats,
                      [c.jugadora_id]: {
                        ...datos,
                        [campo]: Number(e.target.value),
                      },
                    })
                  }
                  className="border p-1 w-16 rounded"
                />
              </div>
            ))}
          </div>
        </div>
      );
    })}

    <div className="flex gap-3">
      <button
        onClick={guardarStats}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Guardar
      </button>

      <button
        onClick={() => setModo("lista")}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Cancelar
      </button>
    </div>
  </div>
)}

    {modo === "verstats" && seleccionado && (
  <div className="bg-white p-6 rounded shadow space-y-6 max-w-2xl">
    <h2 className="text-xl font-bold">
      Estadísticas - {seleccionado.rival}
    </h2>

    <div>
      <strong>Resultado:</strong>{" "}
      {seleccionado.goles_favor} - {seleccionado.goles_contra}
    </div>

    <div>
      <h3 className="font-semibold mt-4">Goles</h3>

      {stats.goles?.length === 0 && (
        <div className="text-gray-500">
          No se registraron goles.
        </div>
      )}

      {stats.goles?.map((g: any) => (
        <div key={g.id}>
          ⚽ {g.jugadoras?.nombre}
        </div>
      ))}
    </div>

    <div>
      <h3 className="font-semibold mt-4">Tarjetas</h3>

      {stats.tarjetas?.length === 0 && (
        <div className="text-gray-500">
          No se registraron tarjetas.
        </div>
      )}

      {stats.tarjetas?.map((t: any) => (
        <div key={t.id}>
          {t.tipo} — {t.jugadoras?.nombre}
        </div>
      ))}
    </div>

    <button
      onClick={() => setModo("lista")}
      className="bg-gray-500 text-white px-4 py-2 rounded"
    >
      Volver
    </button>
  </div>
)}
  </main>
);

}