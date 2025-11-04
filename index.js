import express from "express"
import rutas from "./routes/rutas.js"
import conectarBD from "./bd/bd.js"

async function conexion(){
	await conectarBD();
}

conexion()

const app = express()
app.set("view engine", "ejs")
app.use(express.urlencoded({extended:true}))
app.use("/", rutas)

const PORT = process.env.PORT || 3000

app.listen(PORT, function(){
	console.log("http://localhost:"+PORT)
})
