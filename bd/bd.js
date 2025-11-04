import mongoose from "mongoose"
import "dotenv/config"

async function conectarBD(){
	try{
		const repuestaMongo=await mongoose.connect(process.env.SECRET_MONGO)
		//mongoose.conect("mongodb://user:/contraseña")
		console.log("Conexion con MongoDB Atlas")
	}
	catch(err){
		console.log("Error en: "+err)
	}
}

export default conectarBD;