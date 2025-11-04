import Contacto from "../models/contacto.js"

export async function nuevoContacto({nombre,edad}){
	const contacto = new Contacto({nombre, edad})
	const respuestaMongo = await contacto.save()
	return respuestaMongo
}

export async function mostrarContactos(){
	const contactoBD = await Contacto.find()
	return contactoBD
}

export async function buscarContactoPorID(id){
	const contactoBD = await Contacto.findById(id)
	return contactoBD
}

export async function editarContacto({id,nombre,edad}){
	const respuestaMongo= await Contacto.findByIdAndUpdate(id,{nombre,edad})
	return respuestaMongo
}

export async function borrarContacto(id){
	const contactoBD = await Contacto.findByIdAndDelete(id)
	return contactoBD
}

export async function buscarContactoPorNombre(nombre){
	const contactosBD = await Contacto.find({nombre})
	return contactosBD 
}