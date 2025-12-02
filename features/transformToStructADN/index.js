export class transformToStructureADN {
  constructor() {}


  async propietario_origen_method(propietarioTexto){
        //Voy a hacer 
       // console.log(propietarioTexto)
  }

  async transform(data) {


    for (let i = 0; i < data.length; i++) {
      const dato = data[i];
//console.log(dato);


//Dejame evaluar inconsistencias
const splitted = dato.propietario_origen.split(" ")
if(splitted.length > 1){
    console.log("Posiblemente deba corregir esto:")
    console.log(splitted)
    console.log(` en ${dato.source_file}`)

  
}else{
      if(dato.propietario_origen === "??"){
            console.log(dato)
      }
console.log(`Propietario: ${dato.propietario_origen} en ${dato.source_file}`)

if(dato.nombre_base_datos =="Reporte de Denuncias Ambientales"){
    console.log(dato)
}
}
  console.log("============Voy a ver todos los datos==========")
  console.log(dato)

      const nuevo = {
        nombre_base_datos: dato.nombre_base_de_datos,
        descripcion_dato:dato.descripcion_del_dato,
        id_propietario_origen: await this.propietario_origen_method(dato.propietario_origen) , //AQUI VAMOS A HACER ALGO
        id_direccion_responsable: "...", //Aqui tambien vamos a hacer algo
        id_empleado_responsable: "...", // Aqui vamos a hacer algo (Traer el director)
        id_frecuencia_actualizacion: "...", //Aqui vamos a hacer algo también (Vamos a hacer una comparación)
        es_publica: dato.data_publica_privada.toLowerCase()==="publica" || "pública"? true:false,
        id_nivel_calidad_data: 3, //Aqui siempre la calidad de la data sera baja

        enlace_link: dato.enlace_link,
        id_formato_origen: "...", //Aqui vamos a hacer algo
        id_formato_publicacion: "...", //Aqui vamos a hacer algo
        id_tipo_datos: "...", //Aqui vamos a hacer algo
        agregado_por: "SYSTEM 2",
        estado: "activo",
      };

      //console.log(nuevo)
    }

  

 
  }
}
