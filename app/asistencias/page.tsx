"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Entrenamiento = {
  id: number;
  fecha: string;
  tipo: string;
};

export default function Asistencias() {
  const [tabla, setTabla] = useState<any[]>([]);
  const [entrenamientosMes, setEntrenamientosMes] =
    useState<Entrenamiento[]>([]);
  const [totalesPorDia, setTotalesPorDia] =
    useState<Record<number, number>>({});
  const [mesSeleccionado, setMesSeleccionado] =
    useState<string>(
      new Date().toISOString().slice(0, 7)
    );

  useEffect(() => {
    cargarEstadisticas();
  }, [mesSeleccionado]);

  const cargarEstadisticas = async () => {
    const { data } = await supabase
      .from("asistencias")
      .select(`
        presente,
        jugadora:jugadoras(id,nombre,numero_camiseta,activa),
        entrenamiento:entrenamiento(id,fecha,tipo)
      `);

    if (!data) return;

    const mapa: any = {};
    const entrenosSet: any = {};
    const contadorDias: Record<number, number> =
      {};

    data.forEach((a: any) => {
      if (!a.jugadora.activa) return;
      if (a.entrenamiento.tipo === "Libre")
        return;

      const fecha = a.entrenamiento.fecha;
      const mesEntreno = fecha.slice(0, 7);
      const esMesActual =
        mesEntreno === mesSeleccionado;

      const id = a.jugadora.id;

      if (!mapa[id]) {
        mapa[id] = {
          id,
          nombre: a.jugadora.nombre,
          numero_camiseta:
            a.jugadora.numero_camiseta,
          presentesMes: 0,
          totalMes: 0,
          presentesGeneral: 0,
          totalGeneral: 0,
          dias: {},
        };
      }

      // GENERAL
      mapa[id].totalGeneral++;
      if (a.presente)
        mapa[id].presentesGeneral++;

      // MES
      if (esMesActual) {
        mapa[id].totalMes++;
        if (a.presente)
          mapa[id].presentesMes++;

        mapa[id].dias[a.entrenamiento.id] =
          a.presente;

        entrenosSet[a.entrenamiento.id] =
          a.entrenamiento;

        if (a.presente) {
          contadorDias[
            a.entrenamiento.id
          ] =
            (contadorDias[
              a.entrenamiento.id
            ] || 0) + 1;
        }
      }
    });

    const entrenosOrdenados = Object.values(
      entrenosSet
    ).sort((a: any, b: any) =>
      a.fecha.localeCompare(b.fecha)
    );

    const resultado = Object.values(mapa).map(
      (r: any) => ({
        ...r,
        porcentajeMes:
  entrenosOrdenados.length > 0
    ? Math.round((r.presentesMes / entrenosOrdenados.length) * 100)
    : 0,
        porcentajeGeneral:
          r.totalGeneral > 0
            ? Math.round(
                (r.presentesGeneral /
                  r.totalGeneral) *
                  100
              )
            : 0,
      })
    );

    resultado.sort(
      (a: any, b: any) =>
        b.porcentajeGeneral -
        a.porcentajeGeneral
    );

    setTabla(resultado);
    setEntrenamientosMes(
      entrenosOrdenados as Entrenamiento[]
    );
    setTotalesPorDia(contadorDias);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-6">
        Asistencias por Mes
      </h1>

      <div className="mb-6">
        <label className="mr-3 font-semibold">
          Seleccionar mes:
        </label>
        <input
          type="month"
          value={mesSeleccionado}
          onChange={(e) =>
            setMesSeleccionado(
              e.target.value
            )
          }
          className="border p-2 rounded"
        />
      </div>

      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">#</th>
              <th className="p-2 border">
                Jugadora
              </th>

              {entrenamientosMes.map(
                (e) => (
                  <th
                    key={e.id}
                    className="p-2 border"
                  >
                    {e.fecha.slice(8)}
                  </th>
                )
              )}

              <th className="p-2 border">
                % Mes
              </th>
              <th className="p-2 border">
                % General
              </th>
            </tr>
          </thead>

          <tbody>
            {tabla.map((j, index) => (
              <tr key={j.id}>
                <td className="p-2 border text-center">
                  {index + 1}
                </td>

                <td className="p-2 border">
                  {j.numero_camiseta &&
                    `#${j.numero_camiseta} `}
                  {j.nombre}
                </td>

                {entrenamientosMes.map(
                  (e) => (
                    <td
                      key={e.id}
                      className="p-2 border text-center"
                    >
                      {j.dias[e.id] === true
                        ? "✅"
                        : j.dias[e.id] === false
                        ? "❌"
                        : "-"}
                    </td>
                  )
                )}

                <td className="p-2 border text-center">
                  {j.porcentajeMes}%
                </td>

                <td className="p-2 border text-center font-semibold">
                  {j.porcentajeGeneral}%
                </td>
              </tr>
            ))}

            {/* FILA TOTALES */}
            <tr className="bg-gray-100 font-semibold">
              <td
                colSpan={2}
                className="p-2 border text-right"
              >
                Total presentes:
              </td>

              {entrenamientosMes.map(
                (e) => (
                  <td
                    key={e.id}
                    className="p-2 border text-center"
                  >
                    {totalesPorDia[e.id] || 0}
                  </td>
                )
              )}

              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}