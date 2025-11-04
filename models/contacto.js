import mongoose from "mongoose"

const contactoSchema = new mongoose.Schema({
	nombre:{
		type: String,
		requiered:true,
		trim:true,
		unique:true,
	},
	edad:{
		type:Number,
		requiered:true,
		trim: true,
		unique:false,
	}

})

export default mongoose.model("contacto", contactoSchema)