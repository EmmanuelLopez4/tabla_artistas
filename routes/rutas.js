import {Router} from "express" //destructuracion

const router = Router()

var artistas = ["Van gog", "Bethoven", "Mozart", "Da Vinci"]

router.get("/", (req, res)=>{
	res.render("home", {artistas})
})

router.get("/info/:c/:texto",(req,res)=>{

	var c = req.params.c
	var texto = req.params.texto
	console.log(c)
	res.render("info",{c,texto})

})

export default router