"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Entrenamiento = {
  id: number;
  fecha: string;
  tipo: string | null;
};

type Jugadora = {
  id: number;
  nombre: string;
};

export default function Entrenamientos() {
  const [entrenamientos, setEntrenamientos] = useState<Entrenamiento[]>([]);
  const [jugadoras, setJugadoras] = useState<Jugadora[]>([]);
  const [seleccionado, setSeleccionado] = useState<Entrenamiento | null>(null);
  const [asistencias, setAsistencias] = useState<Record<number, boolean>>({});

  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("Entrenamiento normal");

  useEffect(() => {
    cargarEntrenamientos();
    cargarJugadoras();
  }, []);

  const cargarEntrenamientos = async () => {
    const { data } = await supabase
      .from("entrenamiento")
      .select("*")
      .order("fecha", { ascending: false });

    if (data) setEntrenamientos(data);
  };

  const cargarJugadoras = async () => {
    const { data } = await supabase
      .from("jugadoras")
      .select("*")
      .eq("activa", true);

    if (data) setJugadoras(data);
  };

  const cargarAsistencias = async (entrenamientoId: number) => {
    const { data } = await supabase
      .from("asistencias")
      .select("*")
      .eq("entrenamiento_id", entrenamientoId);

    const mapa: Record<number, boolean> = {};
    data?.forEach((a) => {
      mapa[a.jugadora_id] = a.presente;
    });

    setAsistencias(mapa);
  };

  // =========================
  // CREAR ENTRENAMIENTO
  // =========================
const crearEntrenamiento = async () => {
  if (!nuevaFecha) return;

  const { data: nuevoEntreno, error } = await supabase
    .from("entrenamiento")
    .insert({
      fecha: nuevaFecha,
      tipo: nuevoTipo,
    })
    .select()
    .single();

  if (error || !nuevoEntreno) {
    console.error("Error creando entrenamiento:", error);
    return;
  }

  const { data: jugadoras } = await supabase
    .from("jugadoras")
    .select("id")
    .eq("activa", true);

  // SI no hay jugadoras, usar array vacío
  const asistenciasIniciales = (jugadoras ?? []).map((j) => ({
    jugadora_id: j.id,
    entrenamiento_id: nuevoEntreno.id,
    presente: false,
  }));

  // insertar asistencias solo si hay algo
  if (asistenciasIniciales.length > 0) {
    await supabase
      .from("asistencias")
      .insert(asistenciasIniciales);
  }

  setNuevaFecha("");
  cargarEntrenamientos();
};

  // =========================
  // GENERAR SEMANA
  // =========================
  const generarSemana = async () => {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1);

    const dias = [0, 1, 3, 5]; // lunes, martes, jueves, sábado

    for (let d of dias) {
      const fecha = new Date(inicioSemana);
      fecha.setDate(inicioSemana.getDate() + d);

      const fechaISO = fecha.toISOString().split("T")[0];

      await supabase.from("entrenamiento").upsert({
        fecha: fechaISO,
        tipo: "Entrenamiento normal",
      });
    }

    cargarEntrenamientos();
  };

  const seleccionarEntrenamiento = async (e: any) => {
    const id = Number(e.target.value);
    const ent = entrenamientos.find((x) => x.id === id) || null;

    setSeleccionado(ent);
    setAsistencias({});

    if (ent) await cargarAsistencias(ent.id);
  };

  const cambiarTipo = async (nuevoTipo: string) => {
    if (!seleccionado) return;

    await supabase
      .from("entrenamiento")
      .update({ tipo: nuevoTipo })
      .eq("id", seleccionado.id);

    setSeleccionado({ ...seleccionado, tipo: nuevoTipo });
    cargarEntrenamientos();
  };

  const toggleAsistencia = async (jugadoraId: number) => {
  if (!seleccionado) return;
  if (seleccionado.tipo === "Libre") return;

  const actual = asistencias[jugadoraId] ?? false;

  await supabase.from("asistencias").upsert({
    jugadora_id: jugadoraId,
    entrenamiento_id: seleccionado.id,
    presente: !actual,
  });

  cargarAsistencias(seleccionado.id);
};

  // =========================
  // ELIMINAR ENTRENAMIENTO
  // =========================
  const eliminarEntrenamiento = async () => {
    if (!seleccionado) return;

    if (!confirm("¿Eliminar entrenamiento y sus asistencias?")) return;

    // borrar asistencias relacionadas
    await supabase
      .from("asistencias")
      .delete()
      .eq("entrenamiento_id", seleccionado.id);

    // borrar entrenamiento
    await supabase
      .from("entrenamiento")
      .delete()
      .eq("id", seleccionado.id);

    setSeleccionado(null);
    setAsistencias({});
    cargarEntrenamientos();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6">
        Registro de Asistencias
      </h1>

      {/* CREAR */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">
          Crear entrenamiento
        </h2>

        <div className="flex gap-3 flex-wrap">
          <input
            type="date"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            className="border p-2 rounded"
          />

          <select
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value)}
            className="border p-2 rounded"
          >
            <option>Entrenamiento normal</option>
            <option>Libre</option>
            <option>Virtual</option>
            <option>Partido amistoso</option>
            <option>Partido oficial</option>
          </select>

          <button
            onClick={crearEntrenamiento}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Crear
          </button>

          <button
            onClick={generarSemana}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Generar semana
          </button>
        </div>
      </div>

      {/* SELECTOR */}
      <select
        onChange={seleccionarEntrenamiento}
        className="p-2 border rounded mb-6"
        defaultValue=""
      >
        <option value="">Seleccionar entrenamiento</option>
        {entrenamientos.map((e) => (
          <option key={e.id} value={e.id}>
            {e.fecha} - {e.tipo ?? "Sin tipo"}
          </option>
        ))}
      </select>

      {seleccionado && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Editar tipo de entrenamiento
          </h2>

          <select
            value={seleccionado.tipo ?? ""}
            onChange={(e) => cambiarTipo(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="">Seleccionar tipo</option>
            <option value="Entrenamiento normal">
              Entrenamiento normal
            </option>
            <option value="Libre">Libre</option>
            <option value="Virtual">Virtual</option>
            <option value="Partido amistoso">
              Partido amistoso
            </option>
            <option value="Partido oficial">
              Partido oficial
            </option>
          </select>

          <button
            onClick={eliminarEntrenamiento}
            className="bg-red-600 text-white px-4 py-2 rounded mb-6"
          >
            Eliminar entrenamiento
          </button>

          {seleccionado.tipo === "Libre" && (
            <p className="text-red-600 mb-4">
              No se registran asistencias en entrenamientos libres.
            </p>
          )}

          <div className="bg-white rounded shadow p-4">
            {jugadoras.map((j) => (
              <div
                key={j.id}
                className="flex justify-between items-center border-b py-2"
              >
                <span>{j.nombre}</span>

                <button
  disabled={seleccionado.tipo === "Libre"}
  onClick={() => toggleAsistencia(j.id)}
  className={`px-4 py-1 rounded text-white transition ${
    asistencias[j.id] === true
  ? "bg-green-600 hover:bg-green-700"
  : "bg-red-600 hover:bg-red-700"
  }`}
>
  {asistencias[j.id] === true ? "Presente" : "Ausente"}
</button>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}