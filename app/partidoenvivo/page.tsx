"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"

export default function PartidoEnVivo(){

const [equipo,setEquipo] = useState("Primera")
const [rival,setRival] = useState("")
const [tipo,setTipo] = useState("Oficial")
const [segundos,setSegundos] = useState(0)
const [corriendo,setCorriendo] = useState(false)
const [cuarto,setCuarto] = useState(1)
const [timeline,setTimeline] = useState<any[]>([])
const [condicion,setCondicion] = useState("Local")

const [jugadoras,setJugadoras] = useState<any[]>([])
const [convocadas,setConvocadas] = useState<number[]>([])
const [titulares,setTitulares] = useState<number[]>([])

const [cornersPropios,setCornersPropios] = useState([0,0,0,0])
const [cornersRival,setCornersRival] = useState([0,0,0,0])

const [areasPropias,setAreasPropias] = useState([0,0,0,0])
const [areasRival,setAreasRival] = useState([0,0,0,0])

const [goles,setGoles] = useState<any[]>([])
const [golesRival,setGolesRival] = useState<any[]>([])

const [tarjetas,setTarjetas] = useState<any[]>([])
const [tarjetasRival,setTarjetasRival] = useState<any[]>([])

useEffect(()=>{

cargarJugadoras()

},[])
useEffect(()=>{

let intervalo:any

if(corriendo){

intervalo = setInterval(()=>{

setSegundos(s=>s+1)

},1000)

}

return ()=>clearInterval(intervalo)

},[corriendo])

async function eliminarPartido(id:number){

if(!confirm("Eliminar partido?")) return

await supabase
.from("partido_jugadoras")
.delete()
.eq("partido_id",id)

await supabase
.from("goles")
.delete()
.eq("partido_id",id)

await supabase
.from("tarjetas")
.delete()
.eq("partido_id",id)

await supabase
.from("partidos")
.delete()
.eq("id",id)

}

async function cargarJugadoras(){

const {data} = await supabase
.from("jugadoras")
.select("*")
.eq("activa",true)

setJugadoras(data || [])

}

function registrarEvento(texto:string){

setTimeline(t=>[
...t,
{
minuto: Math.floor(segundos/60),
evento:texto
}
])

}

function sumarCornerPropio(){

const copia=[...cornersPropios]
copia[cuarto-1]++
setCornersPropios(copia)
registrarEvento("Corner corto a favor")
}

function sumarCornerRival(){

const copia=[...cornersRival]
copia[cuarto-1]++
setCornersRival(copia)
registrarEvento("Corner corto en contra")
}

function sumarAreaPropia(){

const copia=[...areasPropias]
copia[cuarto-1]++
setAreasPropias(copia)
registrarEvento("Ingreso area")
}

function sumarAreaRival(){

const copia=[...areasRival]
copia[cuarto-1]++
setAreasRival(copia)
registrarEvento("ingresos area rival")
}

function agregarGol(){

setGoles([
...goles,
{
cuarto,
jugadora:null,
tipo:"jugada"
}
])

registrarEvento("Gol BDSC")

}

function agregarGolRival(){

setGolesRival([
...golesRival,
{
cuarto,
tipo:"jugada"
}
])

registrarEvento("Gol RIVAL")

}

function agregarTarjeta(){

setTarjetas([
...tarjetas,
{
cuarto,
jugadora:null,
tipo:"verde",
minutos:0
}
])

}

function agregarTarjetaRival(){

setTarjetasRival([
...tarjetasRival,
{
cuarto,
tipo:"verde",
minutos:0
}
])

}

function generarInforme(){

const pdf = new jsPDF()
const golesFavor = goles.length
const golesContra = golesRival.length

let y = 20

pdf.setFont("Helvetica","bold")
pdf.setFontSize(14)

pdf.text("GOLES",20,y)
pdf.line(20,y+1,50,y+1)

y += 8

pdf.setFont("Helvetica","normal")

goles.forEach(g=>{

const nombre = jugadoras.find(j=>j.id===g.jugadora)?.nombre || ""

pdf.text(`${nombre} (${g.tipo})`,20,y)

y+=6

})
// HEADER COLOR

pdf.setFillColor(30,64,175)
pdf.rect(0,0,210,35,"F")

pdf.setTextColor(255,255,255)
pdf.setFontSize(20)
pdf.text(`BDSC vs ${rival}`,105,15,{align:"center"})

pdf.setFontSize(36)
pdf.text(`${golesFavor} - ${golesContra}`,105,30,{align:"center"})


y = 50

pdf.setTextColor(0,0,0)


// GOLES

pdf.setFillColor(230,240,255)
pdf.rect(15,y-6,180,10,"F")

pdf.setFontSize(16)
pdf.text("GOLES",20,y)

y += 10

if(goles.length===0){

pdf.text("Sin goles",20,y)
y+=6

}

goles.forEach(g=>{

const nombre = jugadoras.find(j=>j.id===g.jugadora)?.nombre || ""

pdf.text(`${nombre} (${g.tipo})`,20,y)

y+=6

})

y+=10


// TARJETAS

pdf.setFillColor(255,245,200)
pdf.rect(15,y-6,180,10,"F")

pdf.setFontSize(16)
pdf.text("TARJETAS",20,y)

y+=10

if(tarjetas.length===0){

pdf.text("Sin tarjetas",20,y)
y+=6

}

tarjetas.forEach(t=>{

const nombre = jugadoras.find(j=>j.id===t.jugadora)?.nombre || ""

pdf.text(`${nombre} (${t.tipo})`,20,y)

y+=6

})

y+=10


// CORNERS

pdf.setFillColor(230,255,230)
pdf.rect(15,y-6,180,10,"F")

pdf.text("Corners Cortos",20,y)

y+=10

let cornersFavor = cornersPropios.reduce((a,b)=>a+b,0)
let cornersContra = cornersRival.reduce((a,b)=>a+b,0)

pdf.text(`BDSC ${cornersFavor} - ${cornersContra} Rival`,20,y)

y+=10


// INGRESOS AREA

pdf.setFillColor(240,240,240)
pdf.rect(15,y-6,180,10,"F")

pdf.text("Ingresos al Área",20,y)

y+=10

let areasFavor = areasPropias.reduce((a,b)=>a+b,0)
let areasContra = areasRival.reduce((a,b)=>a+b,0)

pdf.text(`BDSC ${areasFavor} - ${areasContra} Rival`,20,y)


pdf.save(`BDSC_vs_${rival}.pdf`)

}

async function finalizarPartido(){

try{

const { data:partido, error } = await supabase
.from("partidos")
.insert({
fecha:new Date().toISOString().split("T")[0],
rival,
tipo,
equipo,
condicion,
goles_favor:goles.length,
goles_contra:golesRival.length

})

.select()
.single()

if(error){
console.log("ERROR SUPABASE:",error)
alert("Error guardando partido: " + error.message)
return

}

if(!partido){

alert("No se pudo crear el partido")
return

}

const partido_id = partido.id


// guardar convocadas

for(const j of convocadas){

await supabase
.from("partido_jugadoras")
.insert({

partido_id,
jugadora_id:j,
titular:titulares.includes(j)

})

}


// guardar goles

for(const g of goles){

if(!g.jugadora) continue

await supabase
.from("goles")
.insert({

partido_id,
jugadora_id:g.jugadora

})

}


// guardar tarjetas

for(const t of tarjetas){

if(!t.jugadora) continue

await supabase
.from("tarjetas")
.insert({

partido_id,
jugadora_id:t.jugadora,
tipo:t.tipo

})

}


// generar informe

setTimeout(()=>{
generarInforme()
},300)


// REINICIAR PARTIDO

setSegundos(0)
setCorriendo(false)
setCuarto(1)

setCornersPropios([0,0,0,0])
setCornersRival([0,0,0,0])

setAreasPropias([0,0,0,0])
setAreasRival([0,0,0,0])

setGoles([])
setGolesRival([])

setTarjetas([])
setTarjetasRival([])

setTimeline([])

setRival("")
setConvocadas([])
setTitulares([])

alert("Partido guardado")

}catch(err){

console.log("Error finalizando partido",err)
alert("Error inesperado")

}

}
return(

<main className="min-h-screen bg-gray-100 p-8 space-y-6">

<h1 className="text-3xl font-bold">
Partido en Vivo
</h1>

<div className="text-center text-5xl font-bold mt-4 mb-6">

BDSC {goles.length} - {golesRival.length} {rival}

</div>

<div className="text-center text-xl text-gray-600">

Cuarto {cuarto}

</div>

<div className="text-3xl font-bold">
{Math.floor(segundos/60)}:{String(segundos%60).padStart(2,"0")}
</div>

<button
onClick={()=>setCorriendo(!corriendo)}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
{corriendo ? "Pausar":"Iniciar"}
</button>

<div className="bg-white p-4 rounded shadow">

<h2 className="font-bold mb-3">
Timeline
</h2>

{timeline.map((t,i)=>(

<div key={i}>
{t.minuto}' {t.evento}
</div>

))}

</div>

<div className="bg-white p-6 rounded shadow space-y-4">

<div>

Equipo

<select
value={equipo}
onChange={(e)=>setEquipo(e.target.value)}
className="border p-2 ml-2"
>

<option>Primera</option>
<option>Intermedia</option>

</select>

</div>

<div>

Rival

<input
value={rival}
onChange={(e)=>setRival(e.target.value)}
className="border p-2 ml-2"
/>

</div>

<div>

Tipo

<select
value={tipo}
onChange={(e)=>setTipo(e.target.value)}
className="border p-2 ml-2"
>

<option>Oficial</option>
<option>Amistoso</option>

</select>

</div>

<div>

Condición

<select
value={condicion}
onChange={(e)=>setCondicion(e.target.value)}
className="border p-2 ml-2"
>

<option>Local</option>
<option>Visitante</option>

</select>

</div>

</div>

<div className="bg-white p-6 rounded shadow">

Cuarto

<select
value={cuarto}
onChange={(e)=>setCuarto(Number(e.target.value))}
className="border p-2 ml-2"
>

<option value={1}>1°</option>
<option value={2}>2°</option>
<option value={3}>3°</option>
<option value={4}>4°</option>

</select>

</div>

<div className="bg-white p-6 rounded shadow">

<h2 className="font-bold mb-3">
Corners
</h2>

<button
onClick={sumarCornerPropio}
className="bg-blue-600 text-white px-4 py-2 rounded mr-3"
>
+ Corner Favor
</button>

<button
onClick={sumarCornerRival}
className="bg-red-600 text-white px-4 py-2 rounded"
>
+ Corner Rival
</button>

<div className="mt-2 text-sm">
Favor: {cornersPropios[cuarto-1]} | Rival: {cornersRival[cuarto-1]}
</div>

</div>

<div className="bg-white p-6 rounded shadow">

<h2 className="font-bold mb-3">
Ingresos al Área
</h2>

<button
onClick={sumarAreaPropia}
className="bg-green-600 text-white px-4 py-2 rounded mr-3"
>
+ Área Favor
</button>

<button
onClick={sumarAreaRival}
className="bg-red-600 text-white px-4 py-2 rounded"
>
+ Área Rival
</button>

<div className="mt-2 text-sm">
Favor: {areasPropias[cuarto-1]} | Rival: {areasRival[cuarto-1]}
</div>

</div>

<div className="bg-white p-6 rounded shadow">

<h2 className="font-bold mb-3">
Goles
</h2>

<button
onClick={agregarGol}
className="bg-green-700 text-white px-4 py-2 rounded mr-3"
>
+ Gol
</button>

<button
onClick={agregarGolRival}
className="bg-red-700 text-white px-4 py-2 rounded"
>
+ Gol Rival
</button>

<div className="mt-4 space-y-2">

{goles.map((g,i)=>(

<div key={i} className="flex gap-3 items-center">

<span>Q{g.cuarto}</span>

<select
value={g.jugadora || ""}
onChange={(e)=>{

const copia=[...goles]
copia[i].jugadora = Number(e.target.value)
setGoles(copia)

}}
className="border p-1"
>

<option value="">Jugadora</option>

{jugadoras.map(j=>(
<option key={j.id} value={j.id}>
{j.nombre}
</option>
))}

</select>

<select
value={g.tipo}
onChange={(e)=>{

const copia=[...goles]
copia[i].tipo = e.target.value
setGoles(copia)

}}
className="border p-1"
>

<option value="jugada">Jugada</option>
<option value="corto">Corner Corto</option>

</select>

</div>

))}

</div>

</div>

<div className="bg-white p-6 rounded shadow">

<h2 className="font-bold mb-3">
Tarjetas
</h2>

<button
onClick={agregarTarjeta}
className="bg-yellow-500 text-white px-4 py-2 rounded mr-3"
>
+ Tarjeta
</button>

<button
onClick={agregarTarjetaRival}
className="bg-red-500 text-white px-4 py-2 rounded"
>
+ Tarjeta Rival
</button>

<div className="mt-4 space-y-2">

{tarjetas.map((t,i)=>(

<div key={i} className="flex gap-3 items-center">

<span>Q{t.cuarto}</span>

<select
value={t.jugadora || ""}
onChange={(e)=>{

const copia=[...tarjetas]
copia[i].jugadora = Number(e.target.value)
setTarjetas(copia)

}}
className="border p-1"
>

<option value="">Jugadora</option>

{jugadoras.map(j=>(
<option key={j.id} value={j.id}>
{j.nombre}
</option>
))}

</select>

<select
value={t.tipo}
onChange={(e)=>{

const copia=[...tarjetas]
copia[i].tipo = e.target.value
setTarjetas(copia)

}}
className="border p-1"
>

<option value="verde">Verde</option>
<option value="amarilla">Amarilla</option>
<option value="roja">Roja</option>

</select>

</div>

))}

</div>
</div>

<div className="text-center">

<button
onClick={finalizarPartido}
className="bg-purple-700 text-white px-6 py-3 rounded text-lg"
>
Finalizar Partido
</button>

</div>

</main>

)

}