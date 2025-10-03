import express from "express"
import rutas from "./routes/rutas.js"

const app = express()
app.set("view engine", "ejs")
app.use("/", rutas)


const PORT = process.env.PORT || 3000

app.listen(PORT, function(){
	console.log("http://localhost:"+PORT)
})