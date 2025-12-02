import { direcciones } from "../functions/frecuencias.js";

export class FrecuenciaClass {
  
  normalizeText(text) {
    if (!text) return "";

    return text
      .toString()
      .toLowerCase()
      .normalize("NFD") // Descompone caracteres con tildes
      .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes
      .replace(/[^\w\s]/g, "") // Elimina caracteres especiales excepto espacios
      .split(/\s+/) // Divide por espacios
      .map((word) => word.trim()) // Trim a cada palabra
      .filter((word) => word.length > 0) // Elimina strings vacíos
      .join(" "); // Une con un solo espacio
  }

  /**
   * Busca una frecuencia por nombre, código o alias
   */
  findFrecuencia(textoNormalizado) {
    for (const frecuencia of direcciones) {
      const nombreNormalizado = this.normalizeText(frecuencia.nombre);
      const codigoNormalizado = this.normalizeText(frecuencia.codigo);
      
      // 1. Comparar con nombre completo exacto
      if (textoNormalizado === nombreNormalizado) {
        return { 
          frecuencia, 
          matchType: 'nombre_completo',
          id: frecuencia.id 
        };
      }
      
      // 2. Comparar con código exacto
      if (textoNormalizado === codigoNormalizado) {
        return { 
          frecuencia, 
          matchType: 'codigo_exacto',
          id: frecuencia.id 
        };
      }
      
      // 3. Comparar si el texto está contenido en el nombre
      if (nombreNormalizado.includes(textoNormalizado)) {
        return { 
          frecuencia, 
          matchType: 'nombre_parcial',
          id: frecuencia.id 
        };
      }
      
      // 4. Comparar si el texto está contenido en la descripción
      if (frecuencia.descripcion) {
        const descripcionNormalizada = this.normalizeText(frecuencia.descripcion);
        if (descripcionNormalizada.includes(textoNormalizado)) {
          return { 
            frecuencia, 
            matchType: 'descripcion_parcial',
            id: frecuencia.id 
          };
        }
      }
      
      // 5. Comparar con alias comunes (definidos localmente)
      const aliasMap = {
        1: ["cada hora", "por hora", "hora", "hourly"],
        2: ["diario", "cada dia", "todos los dias", "daily"],
        3: ["semanal", "cada semana", "semanalmente", "weekly"],
        4: ["quincena", "cada 15 dias", "15 dias"],
        5: ["mes", "cada mes", "mensualmente", "monthly"],
        6: ["cada 2 meses", "dos meses", "bimensual"],
        7: ["trimestre", "cada 3 meses", "quarterly"],
        8: ["cada 4 meses", "cuatro meses"],
        9: ["semestre", "cada 6 meses", "6 meses"],
        10: ["año", "cada año", "anualmente", "yearly", "annual"],
        11: ["cada 2 años", "dos años", "cada dos anos"],
        12: ["sin frecuencia", "variable", "no definida", "indefinida"],
        13: ["una vez", "solo una vez", "historico", "sin actualizacion"]
      };
      
      const alias = aliasMap[frecuencia.id];
      if (alias && Array.isArray(alias)) {
        for (let i = 0; i < alias.length; i++) {
          const aliasNormalizado = this.normalizeText(alias[i]);
          
          // Comparación exacta con alias
          if (textoNormalizado === aliasNormalizado) {
            return { 
              frecuencia, 
              matchType: 'alias_exacto',
              aliasMatched: alias[i],
              id: frecuencia.id
            };
          }
          
          // Comparación parcial: si el texto contiene el alias
          if (textoNormalizado.includes(aliasNormalizado)) {
            return { 
              frecuencia, 
              matchType: 'alias_contenido',
              aliasMatched: alias[i],
              id: frecuencia.id
            };
          }
          
          // Comparación parcial: si el alias contiene el texto
          if (aliasNormalizado.includes(textoNormalizado)) {
            return { 
              frecuencia, 
              matchType: 'alias_parcial',
              aliasMatched: alias[i],
              id: frecuencia.id
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Método principal para procesar la frecuencia de actualización
   */
  async frecuenciaMethod(frecuenciaTexto, ubicacionFile) {
    // Validar entrada - si está vacío, asignar MENSUAL por defecto
    if (!frecuenciaTexto || frecuenciaTexto.trim().length === 0) {
      console.warn(`⚠️  Frecuencia vacía en archivo: ${ubicacionFile} - Asignando "Mensual" por defecto`);
      
      const frecuenciaDefault = direcciones.find(f => f.codigo === "MENSUAL");
      
      return {
        id_frecuencia: frecuenciaDefault.id,
        info_frecuencia: {
          id: frecuenciaDefault.id,
          codigo: frecuenciaDefault.codigo,
          nombre: frecuenciaDefault.nombre,
          descripcion: frecuenciaDefault.descripcion,
          orden_frecuencia: frecuenciaDefault.orden_frecuencia,
          dias_aproximados: frecuenciaDefault.dias_aproximados
        },
        texto_original: "(vacío)",
        match_type: 'default_vacio'
      };
    }

    const textoOriginal = frecuenciaTexto.trim();
    const textoNormalizado = this.normalizeText(frecuenciaTexto);
    
    // Buscar la frecuencia
    const match = this.findFrecuencia(textoNormalizado);
    
    if (match) {
      const { frecuencia, matchType, aliasMatched, id } = match;
      
      let logMessage = `✅ Frecuencia identificada: "${textoOriginal}" → ${frecuencia.nombre}`;
      
      switch(matchType) {
        case 'nombre_completo':
          logMessage += ` (coincidencia: nombre completo)`;
          break;
        case 'codigo_exacto':
          logMessage += ` (coincidencia: código "${frecuencia.codigo}")`;
          break;
        case 'nombre_parcial':
          logMessage += ` (coincidencia: nombre parcial)`;
          break;
        case 'descripcion_parcial':
          logMessage += ` (coincidencia: descripción)`;
          break;
        case 'alias_exacto':
          logMessage += ` (coincidencia: alias exacto "${aliasMatched}")`;
          break;
        case 'alias_contenido':
          logMessage += ` (coincidencia: alias contenido "${aliasMatched}")`;
          break;
        case 'alias_parcial':
          logMessage += ` (coincidencia: alias parcial "${aliasMatched}")`;
          break;
      }
      
      logMessage += ` en ${ubicacionFile}`;
      console.log(logMessage);
      
      return {
        id_frecuencia: id,
        info_frecuencia: {
          id: frecuencia.id,
          codigo: frecuencia.codigo,
          nombre: frecuencia.nombre,
          descripcion: frecuencia.descripcion,
          orden_frecuencia: frecuencia.orden_frecuencia,
          dias_aproximados: frecuencia.dias_aproximados
        },
        texto_original: textoOriginal,
        match_type: matchType,
        alias_matched: aliasMatched || null
      };
    }

    // ✅ SI NO ENCUENTRA COINCIDENCIA: Asignar MENSUAL por defecto
    console.warn(`⚠️  Frecuencia no identificada: "${textoOriginal}" en ${ubicacionFile}`);
    console.warn(`⚠️  Asignando "Mensual" por defecto`);
    
    const frecuenciaDefault = direcciones.find(f => f.codigo === "MENSUAL");
    
    return {
      id_frecuencia: frecuenciaDefault.id,
      info_frecuencia: {
        id: frecuenciaDefault.id,
        codigo: frecuenciaDefault.codigo,
        nombre: frecuenciaDefault.nombre,
        descripcion: frecuenciaDefault.descripcion,
        orden_frecuencia: frecuenciaDefault.orden_frecuencia,
        dias_aproximados: frecuenciaDefault.dias_aproximados
      },
      texto_original: textoOriginal,
      match_type: 'default_no_encontrado',
      nota: `Frecuencia "${textoOriginal}" no identificada, asignada MENSUAL por defecto`
    };
  }

  /**
   * Método helper para listar todas las frecuencias
   */
  listarFrecuencias() {
    console.log(`\n📋 FRECUENCIAS DISPONIBLES (${direcciones.length}):`);
    direcciones
      .sort((a, b) => a.orden_frecuencia - b.orden_frecuencia)
      .forEach((freq) => {
        console.log(`   ${freq.orden_frecuencia}. [ID: ${freq.id}] ${freq.codigo} - ${freq.nombre}`);
        console.log(`      Descripción: ${freq.descripcion}`);
        if (freq.dias_aproximados !== null) {
          console.log(`      Días aprox: ${freq.dias_aproximados}`);
        }
        console.log('');
      });
  }

  /**
   * Método helper para probar coincidencias sin procesar todo
   */
  testMatch(textoProbar) {
    const textoNormalizado = this.normalizeText(textoProbar);
    console.log(`\n🔍 Probando frecuencia: "${textoProbar}"`);
    console.log(`   Normalizado: "${textoNormalizado}"`);
    
    const match = this.findFrecuencia(textoNormalizado);
    
    if (match) {
      const { frecuencia, matchType, aliasMatched } = match;
      console.log(`✅ MATCH ENCONTRADO:`);
      console.log(`   ID: ${frecuencia.id}`);
      console.log(`   Código: ${frecuencia.codigo}`);
      console.log(`   Frecuencia: ${frecuencia.nombre}`);
      console.log(`   Descripción: ${frecuencia.descripcion}`);
      console.log(`   Tipo de coincidencia: ${matchType}`);
      if (aliasMatched) {
        console.log(`   Alias coincidente: "${aliasMatched}"`);
      }
      if (frecuencia.dias_aproximados !== null) {
        console.log(`   Días aproximados: ${frecuencia.dias_aproximados}`);
      }
    } else {
      console.log(`❌ NO SE ENCONTRÓ COINCIDENCIA`);
      console.log(`⚠️  Se asignaría MENSUAL por defecto`);
      console.log(`\n💡 Frecuencias disponibles:`);
      direcciones.forEach(f => {
        console.log(`   - ${f.nombre} (${f.codigo})`);
      });
    }
    
    return match;
  }

  /**
   * Método para obtener una frecuencia por ID
   */
  getFrecuenciaById(id) {
    return direcciones.find(freq => freq.id === id);
  }

  /**
   * Método para obtener una frecuencia por código
   */
  getFrecuenciaByCodigo(codigo) {
    const codigoNormalizado = this.normalizeText(codigo);
    return direcciones.find(freq => 
      this.normalizeText(freq.codigo) === codigoNormalizado
    );
  }

  /**
   * Método para obtener frecuencias ordenadas por días
   */
  getFrecuenciasOrdenadas() {
    return [...direcciones].sort((a, b) => {
      // Poner las que tienen dias_aproximados null al final
      if (a.dias_aproximados === null) return 1;
      if (b.dias_aproximados === null) return -1;
      return a.dias_aproximados - b.dias_aproximados;
    });
  }

  /**
   * Validar integridad de datos de frecuencias
   */
  validarIntegridad() {
    console.log(`\n🔍 VALIDANDO INTEGRIDAD DE FRECUENCIAS...`);
    
    const problemas = [];
    
    direcciones.forEach((freq, idx) => {
      // Verificar campos obligatorios
      if (!freq.id) {
        problemas.push(`Frecuencia ${idx + 1}: Falta ID`);
      }
      if (!freq.codigo || freq.codigo.trim().length === 0) {
        problemas.push(`Frecuencia ${idx + 1} (ID: ${freq.id}): Falta código`);
      }
      if (!freq.nombre || freq.nombre.trim().length === 0) {
        problemas.push(`Frecuencia ${idx + 1} (ID: ${freq.id}): Falta nombre`);
      }
      if (!freq.orden_frecuencia) {
        problemas.push(`Frecuencia ${idx + 1} (ID: ${freq.id}): Falta orden_frecuencia`);
      }
      
      // Verificar duplicados de ID
      const duplicadosId = direcciones.filter(f => f.id === freq.id);
      if (duplicadosId.length > 1) {
        problemas.push(`ID duplicado: ${freq.id} (${freq.nombre})`);
      }
      
      // Verificar duplicados de código
      const duplicadosCodigo = direcciones.filter(f => 
        this.normalizeText(f.codigo) === this.normalizeText(freq.codigo)
      );
      if (duplicadosCodigo.length > 1) {
        problemas.push(`Código duplicado: ${freq.codigo}`);
      }
      
      // Verificar duplicados de orden
      const duplicadosOrden = direcciones.filter(f => 
        f.orden_frecuencia === freq.orden_frecuencia
      );
      if (duplicadosOrden.length > 1) {
        problemas.push(`Orden duplicado: ${freq.orden_frecuencia} (${freq.nombre})`);
      }
    });
    
    if (problemas.length === 0) {
      console.log(`✅ Todas las frecuencias tienen datos válidos`);
    } else {
      console.log(`⚠️  Se encontraron ${problemas.length} problemas:`);
      problemas.forEach((problema, idx) => {
        console.log(`   ${idx + 1}. ${problema}`);
      });
    }
    
    return problemas;
  }

  /**
   * Método para sugerir frecuencias similares
   */
  sugerirFrecuenciasSimilares(textoProbar, limite = 3) {
    const textoNormalizado = this.normalizeText(textoProbar);
    const sugerencias = [];
    
    direcciones.forEach(freq => {
      const nombreNormalizado = this.normalizeText(freq.nombre);
      const codigoNormalizado = this.normalizeText(freq.codigo);
      const descripcionNormalizada = this.normalizeText(freq.descripcion || '');
      
      // Calcular similitud simple basada en palabras comunes
      const palabrasTexto = textoNormalizado.split(' ');
      
      let similitud = 0;
      
      // Verificar en nombre
      const palabrasNombre = nombreNormalizado.split(' ');
      similitud += palabrasTexto.filter(palabra => 
        palabrasNombre.includes(palabra)
      ).length;
      
      // Verificar en descripción
      const palabrasDescripcion = descripcionNormalizada.split(' ');
      similitud += palabrasTexto.filter(palabra => 
        palabrasDescripcion.includes(palabra)
      ).length * 0.5; // Peso menor para descripción
      
      if (similitud > 0) {
        sugerencias.push({
          frecuencia: freq,
          similitud: similitud
        });
      }
    });
    
    // Ordenar por similitud y retornar las top N
    return sugerencias
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, limite);
  }
}