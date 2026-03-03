"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Jugadora = {
  id: number;
  nombre: string;
  numero_camiseta: number | null;
  edad: number | null;
  activa: boolean;
};

export default function Jugadoras() {
  const [jugadoras, setJugadoras] = useState<Jugadora[]>([]);
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [edad, setEdad] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [errorMensaje, setErrorMensaje] = useState("");

  useEffect(() => {
    cargarJugadoras();
  }, []);

  const cargarJugadoras = async () => {
    const { data } = await supabase
      .from("jugadoras")
      .select("*")
      .order("numero_camiseta", { ascending: true });

    if (data) setJugadoras(data);
  };

  const limpiarFormulario = () => {
    setNombre("");
    setNumero("");
    setEdad("");
    setEditandoId(null);
  };

  const guardarJugadora = async () => {
    setErrorMensaje("");

    if (!nombre.trim()) return;

    const datos = {
      nombre: nombre.trim(),
      numero_camiseta: numero !== "" ? Number(numero) : null,
      edad: edad !== "" ? Number(edad) : null,
    };

    let response;

    if (editandoId) {
      response = await supabase
        .from("jugadoras")
        .update(datos)
        .eq("id", editandoId);
    } else {
      response = await supabase
        .from("jugadoras")
        .insert({ ...datos, activa: true });
    }

    if (response.error) {
      if (response.error.message.includes("duplicate")) {
        setErrorMensaje("Ese número de camiseta ya está asignado.");
      } else {
        setErrorMensaje(response.error.message);
      }
      return;
    }

    limpiarFormulario();
    cargarJugadoras();
  };

  const iniciarEdicion = (j: Jugadora) => {
    setNombre(j.nombre);
    setNumero(j.numero_camiseta !== null ? String(j.numero_camiseta) : "");
    setEdad(j.edad !== null ? String(j.edad) : "");
    setEditandoId(j.id);
  };

  const toggleActiva = async (j: Jugadora) => {
    await supabase
      .from("jugadoras")
      .update({ activa: !j.activa })
      .eq("id", j.id);

    cargarJugadoras();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Plantel</h1>
        <p className="text-gray-500">Gestión y administración del equipo</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md max-w-xl mb-8">
        <h2 className="text-xl font-bold mb-4">
          {editandoId ? "Editar Jugadora" : "Nueva Jugadora"}
        </h2>

        <div className="space-y-3">
          <input
            placeholder="Nombre y apellido"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            placeholder="Número de camiseta"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <input
            placeholder="Edad"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {errorMensaje && (
          <div className="text-red-600 text-sm mt-2">{errorMensaje}</div>
        )}

        <button
          onClick={guardarJugadora}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {editandoId ? "Guardar cambios" : "Agregar jugadora"}
        </button>

        {editandoId && (
          <button
            onClick={limpiarFormulario}
            className="ml-3 mt-4 bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="space-y-3">
        {jugadoras.map((j) => (
          <div
            key={j.id}
            className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center hover:shadow-md transition mb-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center">
                {j.numero_camiseta || "?"}
              </div>

              <div>
                <div className="font-semibold text-lg">{j.nombre}</div>

                {j.edad && (
                  <div className="text-sm text-gray-500">
                    {j.edad} años
                  </div>
                )}

                {!j.activa && (
                  <div className="text-xs text-red-500">Inactiva</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <button
                onClick={() => iniciarEdicion(j)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Editar
              </button>

              <button
                onClick={() => toggleActiva(j)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                {j.activa ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}