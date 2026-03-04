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

const [equipoTab, setEquipoTab] = useState<"Primera" | "Intermedia">("Primera");

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
(p) => (p.equipo || "Primera") === equipoTab
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

</main>

);
}