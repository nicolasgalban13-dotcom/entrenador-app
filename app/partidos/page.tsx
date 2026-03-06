"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import html2canvas from "html2canvas";

export default function Partidos() {

const [partidos, setPartidos] = useState<any[]>([]);
const [jugadoras, setJugadoras] = useState<any[]>([]);
const [seleccionado, setSeleccionado] = useState<any>(null);

const [modo, setModo] = useState<
"lista" | "editar" | "convocatoria" | "verconvocatoria" | "stats" | "verstats"
>("lista");

const [equipoTab, setEquipoTab] = useState<"Primera" | "Intermedia">("Primera");
const [tipoTab, setTipoTab] = useState<"Oficial" | "Amistoso">("Oficial");

const [form, setForm] = useState({
fecha: "",
rival: "",
condicion: "Local",
tipo: "Amistoso",
equipo: "Primera",
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

const partidosFiltrados = partidos.filter(
(p) =>
(p.equipo || "Primera") === equipoTab &&
(p.tipo || "Amistoso") === tipoTab
);

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
equipo: p.equipo || "Primera",
});
} else {
setSeleccionado(null);
setForm({
fecha: "",
rival: "",
condicion: "Local",
tipo: "Amistoso",
equipo: "Primera",
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
await supabase
.from("partidos")
.update(form)
.eq("id", seleccionado.id);
} else {
await supabase
.from("partidos")
.insert({
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

const existe = convocatoria.find(
(c) => c.jugadora_id === jugadora_id
);

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

goles: (goles || []).filter(
(g) => g.jugadora_id === c.jugadora_id
).length,

verde: (tarjetas || []).filter(
(t) => t.jugadora_id === c.jugadora_id && t.tipo === "Verde"
).length,

amarilla: (tarjetas || []).filter(
(t) => t.jugadora_id === c.jugadora_id && t.tipo === "Amarilla"
).length,

roja: (tarjetas || []).filter(
(t) => t.jugadora_id === c.jugadora_id && t.tipo === "Roja"
).length,
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

await supabase
.from("goles")
.delete()
.eq("partido_id", seleccionado.id);

await supabase
.from("tarjetas")
.delete()
.eq("partido_id", seleccionado.id);

let totalGoles = 0;

for (const jugadora_id in stats) {

const s = stats[jugadora_id];

for (let i = 0; i < s.goles; i++) {

await supabase.from("goles").insert({
partido_id: seleccionado.id,
jugadora_id: Number(jugadora_id),
});

}

for (let i = 0; i < s.verde; i++) {

await supabase.from("tarjetas").insert({
partido_id: seleccionado.id,
jugadora_id: Number(jugadora_id),
tipo: "Verde",
});

}

for (let i = 0; i < s.amarilla; i++) {

await supabase.from("tarjetas").insert({
partido_id: seleccionado.id,
jugadora_id: Number(jugadora_id),
tipo: "Amarilla",
});

}

for (let i = 0; i < s.roja; i++) {

await supabase.from("tarjetas").insert({
partido_id: seleccionado.id,
jugadora_id: Number(jugadora_id),
tipo: "Roja",
});

}

totalGoles += s.goles;
}

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

async function descargarResumenPartido(){

const elemento = document.getElementById("resumen-partido")

if(!elemento) return

const canvas = await html2canvas(elemento,{scale:3})

const imagen = canvas.toDataURL("image/png")

window.open(imagen)

}

function obtenerGoleadorasAgrupadas() {

  const conteo: any = {};

  stats.goles?.forEach((g:any)=>{

    const nombre = g.jugadoras?.nombre;

    if(!conteo[nombre]){
      conteo[nombre] = 0;
    }

    conteo[nombre]++;

  });

  return Object.entries(conteo);

}
async function descargarConvocatoria() {

  const elemento = document.getElementById("convocatoria-export");

  if (!elemento) {
    alert("No se encontró la convocatoria");
    return;
  }

  // Esperar un frame para asegurar render completo
  await new Promise((r) => requestAnimationFrame(r));

  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: "#92eb8a",
    useCORS: true,
    scrollY: -window.scrollY
  });

  const link = document.createElement("a");
  link.download = `convocatoria_${seleccionado?.rival || "partido"}.png`;
  link.href = canvas.toDataURL("image/png");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
return (

<main className="min-h-screen bg-gray-100 p-8">

<h1 className="text-3xl font-bold mb-6">
Gestión de Partidos
</h1>

{modo === "lista" && (

<>

<div className="flex gap-3 mb-6">

<button
onClick={() => setEquipoTab("Primera")}
className={`px-4 py-2 rounded ${
equipoTab === "Primera"
? "bg-blue-600 text-white"
: "bg-gray-200"
}`}
>
Primera
</button>

<button
onClick={() => setEquipoTab("Intermedia")}
className={`px-4 py-2 rounded ${
equipoTab === "Intermedia"
? "bg-blue-600 text-white"
: "bg-gray-200"
}`}
>
Intermedia
</button>

</div>

<div className="flex gap-3 mb-6">

<button
onClick={() => setTipoTab("Oficial")}
className={`px-4 py-2 rounded ${
tipoTab === "Oficial"
? "bg-red-600 text-white"
: "bg-gray-200"
}`}
>
Oficiales
</button>

<button
onClick={() => setTipoTab("Amistoso")}
className={`px-4 py-2 rounded ${
tipoTab === "Amistoso"
? "bg-blue-600 text-white"
: "bg-gray-200"
}`}
>
Amistosos
</button>

</div> 

<button
onClick={() => abrirEditar()}
className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
>
Nuevo Partido
</button>

{partidosFiltrados.map((p) => (

<div
key={p.id}
className="bg-white p-4 rounded-xl shadow-md mb-3 flex justify-between items-center"
>

<div>

<div className="text-sm text-gray-500">
{p.fecha}
</div>

<div className="text-lg font-semibold">
vs {p.rival}
</div>

<div className="text-xs bg-purple-100 text-purple-700 inline-block px-2 py-1 rounded mt-1">
{p.equipo || "Primera"}
</div>

<div className={`mt-1 ${resultadoColor(p)}`}>
{p.goles_favor} - {p.goles_contra} ({resultadoTexto(p)})
</div>

</div>

<div className="flex flex-wrap gap-2 text-xs">

<button
onClick={() => abrirEditar(p)}
className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
>
Editar
</button>

<button
onClick={() => abrirConvocatoria(p)}
className="px-3 py-1 bg-green-100 text-green-700 rounded"
>
Convocar
</button>

<button
onClick={() => abrirVerConvocatoria(p)}
className="px-3 py-1 bg-teal-100 text-teal-700 rounded"
>
Ver Conv.
</button>

<button
onClick={() => abrirStats(p)}
className="px-3 py-1 bg-red-100 text-red-700 rounded"
>
Editar Stats
</button>

<button
onClick={() => abrirVerStats(p)}
className="px-3 py-1 bg-purple-100 text-purple-700 rounded"
>
Ver Stats
</button>

<button
onClick={() => eliminarPartido(p)}
className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
>
Eliminar
</button>

</div>

</div>

))}

</>

)}

{/* CONVOCATORIA */}

{modo === "convocatoria" && seleccionado && (

<div
id="convocatoria-export"
className="bg-white p-6 rounded shadow max-w-2xl"
>

<h2 className="text-xl font-bold mb-4">
Convocatoria - {seleccionado.rival}
</h2>

{jugadoras.map((j) => {

const registro = convocatoria.find(
(c) => c.jugadora_id === j.id
);

return (

<div
key={j.id}
className="flex justify-between border-b py-2"
>

<span>{j.nombre}</span>

<div className="flex items-center gap-3">

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

<label className="flex items-center gap-1 text-sm">

<input
type="checkbox"
checked={registro.titular}
onChange={() =>
toggleTitular(j.id, registro.titular)
}
/>

Titular

</label>

)}

</div>

</div>

);

})}

<button
onClick={() => setModo("lista")}
className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
>

Volver

</button>

<button
onClick={descargarConvocatoria}
className="mt-4 ml-3 bg-blue-600 text-white px-4 py-2 rounded"
>
Descargar convocatoria
</button>

</div>

)}

{/* VER CONVOCATORIA */}

{modo === "verconvocatoria" && seleccionado && (

<div className="bg-white p-6 rounded shadow max-w-2xl">

<h2 className="text-xl font-bold mb-4">
Convocatoria - {seleccionado.rival}
</h2>

{convocatoria.map((c: any) => (

<div
key={c.jugadora_id}
className="border-b py-2 flex justify-between"
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
className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
>

Volver

</button>

</div>

)}

{/* EDITAR STATS */}

{modo === "stats" && seleccionado && (

<div className="bg-white p-6 rounded shadow max-w-3xl">

<h2 className="text-xl font-bold mb-4">
Editar Estadísticas - {seleccionado.rival}
</h2>

<div className="mb-4">

<label className="font-semibold mr-2">
Goles del rival
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
className="border p-3 rounded mb-3"
>

<strong>{c.jugadoras?.nombre}</strong>

<div className="flex gap-4 mt-2">

{[
{ key: "goles", label: "⚽ Goles" },
{ key: "verde", label: "🟩 Verde" },
{ key: "amarilla", label: "🟨 Amarilla" },
{ key: "roja", label: "🟥 Roja" }
].map((campo) => (

<div key={campo.key} className="flex flex-col items-center">

<label className="text-xs font-semibold mb-1">
{campo.label}
</label>

<input
type="number"
value={datos[campo.key]}
onChange={(e) =>
setStats({
...stats,
[c.jugadora_id]: {
...datos,
[campo.key]: Number(e.target.value)
}
})
}
className="border p-1 w-16 rounded text-center"
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

{/* VER STATS */}

{modo === "verstats" && seleccionado && (


<div
id="resumen-partido"
className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-10 rounded-2xl w-[500px] h-[500px] shadow-xl flex flex-col justify-center items-center text-center"
>

<img
src="/escudo.png"
className="w-20 mx-auto mb-4"
/>

<h2 className="text-xl font-semibold mb-2 opacity-90">
Resultado del Partido
</h2>

<div className="text-sm mb-2 opacity-80">
{seleccionado.tipo} • {seleccionado.equipo || "Primera"}
</div>

<div className="text-lg mb-2">
BDSC vs {seleccionado.rival}
</div>

<div className="text-6xl font-bold mb-6">
{seleccionado.goles_favor} - {seleccionado.goles_contra}
</div>

<div className="mb-6">

<h3 className="font-semibold mb-2 text-lg">
⚽ Goleadoras
</h3>

{obtenerGoleadorasAgrupadas().length === 0 && (
<div className="opacity-70">Sin goles</div>
)}

{obtenerGoleadorasAgrupadas().map(([nombre,cantidad]:any,i)=>(

<div key={i} className="text-lg">
{"⚽".repeat(cantidad)} {nombre}
</div>

))}

</div>

<div className="mb-6">

<h3 className="font-semibold mb-2 text-lg">
🟥 Tarjetas
</h3>

{stats.tarjetas?.length === 0 && (
<div className="opacity-70">Sin tarjetas</div>
)}

{stats.tarjetas?.map((t:any)=>(

<div key={t.id}>
{t.tipo} — {t.jugadoras?.nombre}
</div>

))}

</div>

<button
onClick={descargarResumenPartido}
className="bg-green-600 text-white px-4 py-2 rounded mt-4 w-full hover:bg-green-700"
>
Descargar resumen del partido
</button>

<button
onClick={() => setModo("lista")}
className="mt-3 bg-gray-500 text-white px-4 py-2 rounded w-full"
>

Volver

</button>

</div>

)}
{modo === "editar" && (

<div className="bg-white p-6 rounded shadow space-y-4 max-w-xl">

<h2 className="text-xl font-bold">
{seleccionado ? "Editar Partido" : "Nuevo Partido"}
</h2>

<div>
<label className="block font-semibold mb-1">
Fecha
</label>

<input
type="date"
value={form.fecha}
onChange={(e) =>
setForm({
...form,
fecha: e.target.value
})
}
className="border p-2 w-full rounded"
/>
</div>

<div>
<label className="block font-semibold mb-1">
Rival
</label>

<input
type="text"
value={form.rival}
onChange={(e) =>
setForm({
...form,
rival: e.target.value
})
}
className="border p-2 w-full rounded"
/>
</div>

<div>
<label className="block font-semibold mb-1">
Condición
</label>

<select
value={form.condicion}
onChange={(e) =>
setForm({
...form,
condicion: e.target.value
})
}
className="border p-2 w-full rounded"
>

<option value="Local">
Local
</option>

<option value="Visitante">
Visitante
</option>

</select>
</div>

<div>
<label className="block font-semibold mb-1">
Tipo
</label>

<select
value={form.tipo}
onChange={(e) =>
setForm({
...form,
tipo: e.target.value
})
}
className="border p-2 w-full rounded"
>

<option value="Amistoso">
Amistoso
</option>

<option value="Oficial">
Oficial
</option>

</select>
</div>

<div>
<label className="block font-semibold mb-1">
Equipo
</label>

<select
value={form.equipo}
onChange={(e) =>
setForm({
...form,
equipo: e.target.value
})
}
className="border p-2 w-full rounded"
>

<option value="Primera">
Primera
</option>

<option value="Intermedia">
Intermedia
</option>

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

</main>

);
}