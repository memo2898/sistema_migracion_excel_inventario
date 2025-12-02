
import { DireccionClass } from "./classes/direccionClass.js";
import { FormatosClass } from "./classes/formatosClass.js";
import { FrecuenciaClass } from "./classes/frecuenciaClass.js";
import { PropietarioOrigenClass } from "./classes/propietario_origenClass.js";
export class transformToStructureADN {




  async transform(data) {
    const propietarioOrigenHandler = new PropietarioOrigenClass;
    const direccionResponsableHandler = new DireccionClass
    const frecuenciaHandler = new FrecuenciaClass
    const formatosHandler = new FormatosClass

    const resultados = [];
    const errores = [];

    for (let i = 0; i < data.length; i++) {
      const dato = data[i];
      
      try {
        // Obtener información del propietario
        const propietarioInfo = await propietarioOrigenHandler.propietario_origen_method(
          dato.propietario_origen,
          dato.source_file
        );
        const direccion_responsable = await direccionResponsableHandler.direccion_responsable_method(
          dato.direccion_responsable,
          dato.source_file
        )
       
        const frecuencia_actualizacion = await frecuenciaHandler.frecuenciaMethod(
           dato.frecuencia_actualizacion,
          dato.source_file
        )

        const formatoPublicacion = await formatosHandler.formatoMethod(
          dato.formato_origen,
          dato.source_file
        )
        

         
        // GENERAR UN SQL NUEVO:
        const nuevo = {
          nombre_base_datos: dato.nombre_base_de_datos,
          descripcion_dato: dato.descripcion_del_dato,
          
          // Información del propietario procesada
          propietario_info: propietarioInfo,

          
          direccion_responsable:direccion_responsable, // Aquí también vamos a hacer algo
          empleado_responsable: "SE DEBE SELECCIONAR AL DIRECTOR", // Aquí vamos a hacer algo (Traer el director)
          frecuencia_actualizacion: frecuencia_actualizacion, // Aquí vamos a hacer algo también (Vamos a hacer una comparación)
          
          // Corrección del bug en es_publica
          es_publica: 
            dato.data_publica_privada.toLowerCase() === "publica" || 
            dato.data_publica_privada.toLowerCase() === "pública",
          
          id_nivel_calidad_data: 3, // Aquí siempre la calidad de la data será baja

          enlace_link: dato.enlace_link,
          id_formato_origen: formatoPublicacion, // Aquí vamos a hacer algo
          id_formato_publicacion: formatoPublicacion, // Aquí vamos a hacer algo
          id_tipo_datos: 1, // Aquí vamos a hacer algo
          agregado_por: "SYSTEM 2",
          estado: "activo",
          
          // Metadata adicional
          source_file: dato.source_file,
          row_number: dato.row_number
        };

        resultados.push(nuevo);

      } catch (error) {
        // Capturar errores y continuar procesando para ver todos los problemas
        errores.push({
          indice: i,
          dato: dato,
          error: error.message
        });
        
        console.error(`  Error en registro ${i + 1}:`, error.message);
      }
    }

    // Resumen final
    console.log(`\n RESUMEN DE TRANSFORMACIÓN`);
    console.log(`    Registros procesados exitosamente: ${resultados.length}`);
    console.log(`    Registros con errores: ${errores.length}`);
    
    if (errores.length > 0) {
      console.log(`\n  ERRORES ENCONTRADOS:`);
      errores.forEach((err, idx) => {
        console.log(`   ${idx + 1}. [Línea ${err.indice + 1}] ${err.error}`);
      });
      
      // Si hay errores, puedes decidir si lanzar excepción o solo advertir
      throw new Error(
        `Se encontraron ${errores.length} propietarios no identificados. ` +
        `Revisa los logs anteriores y agrega los faltantes a responsablesIdentificados.`
      );
    }

    return resultados;
  }





}