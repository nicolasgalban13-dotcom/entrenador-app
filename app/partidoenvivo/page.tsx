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

setTimeline([
...timeline,
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

}

function sumarCornerRival(){

const copia=[...cornersRival]
copia[cuarto-1]++
setCornersRival(copia)

}

function sumarAreaPropia(){

const copia=[...areasPropias]
copia[cuarto-1]++
setAreasPropias(copia)

}

function sumarAreaRival(){

const copia=[...areasRival]
copia[cuarto-1]++
setAreasRival(copia)

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

}

function agregarGolRival(){

setGolesRival([
...golesRival,
{
cuarto,
tipo:"jugada"
}
])

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

let y=20

pdf.setFontSize(18)
pdf.text("Informe del Partido",20,y)

y+=10

pdf.setFontSize(14)
pdf.text(`Equipo: ${equipo}`,20,y)
y+=8
pdf.text(`Rival: ${rival}`,20,y)
y+=8
pdf.text(`Tipo: ${tipo}`,20,y)

y+=15

pdf.setFontSize(14)
pdf.text("Corners Cortos",20,y)

y+=8

for(let i=0;i<4;i++){

pdf.text(`Cuarto ${i+1}: ${cornersPropios[i]} - ${cornersRival[i]}`,20,y)
y+=6

}

y+=10

pdf.text("Ingresos al Área",20,y)

y+=8

for(let i=0;i<4;i++){

pdf.text(`Cuarto ${i+1}: ${areasPropias[i]} - ${areasRival[i]}`,20,y)
y+=6

}

y+=10

pdf.text("Goles",20,y)

y+=8

goles.forEach(g=>{

const nombre = jugadoras.find(j=>j.id===g.jugadora)?.nombre || ""

pdf.text(`Q${g.cuarto} - ${nombre} (${g.tipo})`,20,y)

y+=6

})

y+=10

pdf.text("Goles Rival",20,y)

y+=8

golesRival.forEach(g=>{

pdf.text(`Q${g.cuarto} - (${g.tipo})`,20,y)

y+=6

})

y+=10

pdf.text("Tarjetas",20,y)

y+=8

tarjetas.forEach(t=>{

const nombre = jugadoras.find(j=>j.id===t.jugadora)?.nombre || ""

pdf.text(`Q${t.cuarto} - ${nombre} ${t.tipo}`,20,y)

y+=6

})

y+=10

pdf.text("Tarjetas Rival",20,y)

y+=8

tarjetasRival.forEach(t=>{

pdf.text(`Q${t.cuarto} - ${t.tipo}`,20,y)

y+=6

})

pdf.save("informe_partido.pdf")

}

async function finalizarPartido(){

const {data:partido} = await supabase
.from("partidos")
.insert({

fecha:new Date(),
rival,
tipo,
equipo,
goles_favor:goles.length,
goles_contra:golesRival.length

})
.select()
.single()

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

await supabase
.from("goles")
.insert({

partido_id,
jugadora_id:g.jugadora

})

}

// guardar tarjetas

for(const t of tarjetas){

await supabase
.from("tarjetas")
.insert({

partido_id,
jugadora_id:t.jugadora,
tipo:t.tipo

})

}

// generar informe

generarInforme()

}
return(

<main className="min-h-screen bg-gray-100 p-8 space-y-6">

<h1 className="text-3xl font-bold">
Partido en Vivo
</h1>

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