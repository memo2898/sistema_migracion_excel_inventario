import { formatos } from "../functions/formatos.js";

export class FormatosClass {
  
  normalizeText(text) {
    if (!text) return "";

    return text
      .toString()
      .toLowerCase()
      .normalize("NFD") // Descompone caracteres con tildes
      .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes
      .replace(/[^\w\s.]/g, "") // Elimina caracteres especiales excepto espacios y puntos
      .split(/\s+/) // Divide por espacios
      .map((word) => word.trim()) // Trim a cada palabra
      .filter((word) => word.length > 0) // Elimina strings vacíos
      .join(" "); // Une con un solo espacio
  }

  /**
   * Busca un formato por nombre, extensión o alias
   */
  findFormato(textoNormalizado) {
  for (const formato of formatos) {
    const nombreNormalizado = this.normalizeText(formato.nombre_formato);
    const extensionNormalizada = this.normalizeText(formato.extension);
    
    // 1. Comparar con nombre completo exacto
    if (textoNormalizado === nombreNormalizado) {
      return { 
        formato, 
        matchType: 'nombre_completo',
        id: formato.id 
      };
    }
    
    // 2. Comparar con extensión (con o sin punto)
    const textoSinPunto = textoNormalizado.replace(/\./g, '');
    const extensionSinPunto = extensionNormalizada.replace(/\./g, '');
    
    if (textoNormalizado === extensionNormalizada || textoSinPunto === extensionSinPunto) {
      return { 
        formato, 
        matchType: 'extension_exacta',
        id: formato.id 
      };
    }
    
    // 3. Comparar si el texto contiene la extensión
    if (textoNormalizado.includes(extensionNormalizada) || textoNormalizado.includes(extensionSinPunto)) {
      return { 
        formato, 
        matchType: 'extension_contenida',
        id: formato.id 
      };
    }
    
    // 4. Comparar si el texto está contenido en el nombre
    if (nombreNormalizado.includes(textoNormalizado)) {
      return { 
        formato, 
        matchType: 'nombre_parcial',
        id: formato.id 
      };
    }
    
    // 5. Comparar con alias (ahora desde el objeto formato)
    if (formato.alias && Array.isArray(formato.alias) && formato.alias.length > 0) {
      for (let i = 0; i < formato.alias.length; i++) {
        const aliasNormalizado = this.normalizeText(formato.alias[i]);
        
        // Comparación exacta con alias
        if (textoNormalizado === aliasNormalizado) {
          return { 
            formato, 
            matchType: 'alias_exacto',
            aliasMatched: formato.alias[i],
            id: formato.id
          };
        }
        
        // Comparación parcial: si el texto contiene el alias
        if (textoNormalizado.includes(aliasNormalizado)) {
          return { 
            formato, 
            matchType: 'alias_contenido',
            aliasMatched: formato.alias[i],
            id: formato.id
          };
        }
        
        // Comparación parcial: si el alias contiene el texto
        if (aliasNormalizado.includes(textoNormalizado)) {
          return { 
            formato, 
            matchType: 'alias_parcial',
            aliasMatched: formato.alias[i],
            id: formato.id
          };
        }
      }
    }
  }
  
  return null;
}

  /**
   * Método principal para procesar el formato
   */
  async formatoMethod(formato_origen, source_file) {
    // Validar entrada - si está vacío, asignar Excel por defecto
    if (!formato_origen || formato_origen.trim().length === 0) {
      console.warn(`⚠️  Formato vacío en archivo: ${source_file} - Asignando "Excel" por defecto`);
      
      const formatoDefault = formatos.find(f => f.nombre_formato === "Excel");
      
      return {
        id_formato: formatoDefault.id,
        info_formato: {
          id: formatoDefault.id,
          nombre_formato: formatoDefault.nombre_formato,
          extension: formatoDefault.extension,
          descripcion: formatoDefault.descripcion
        },
        texto_original: "(vacío)",
        match_type: 'default_vacio'
      };
    }

    const textoOriginal = formato_origen.trim();
    const textoNormalizado = this.normalizeText(formato_origen);
    
    // Buscar el formato
    const match = this.findFormato(textoNormalizado);
    
    if (match) {
      const { formato, matchType, aliasMatched, id } = match;
      
      let logMessage = `✅ Formato identificado: "${textoOriginal}" → ${formato.nombre_formato} (${formato.extension})`;
      
      switch(matchType) {
        case 'nombre_completo':
          logMessage += ` (coincidencia: nombre completo)`;
          break;
        case 'extension_exacta':
          logMessage += ` (coincidencia: extensión exacta)`;
          break;
        case 'extension_contenida':
          logMessage += ` (coincidencia: extensión contenida)`;
          break;
        case 'nombre_parcial':
          logMessage += ` (coincidencia: nombre parcial)`;
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
      
      logMessage += ` en ${source_file}`;
      console.log(logMessage);
      
      return {
        id_formato: id,
        info_formato: {
          id: formato.id,
          nombre_formato: formato.nombre_formato,
          extension: formato.extension,
          descripcion: formato.descripcion
        },
        texto_original: textoOriginal,
        match_type: matchType,
        alias_matched: aliasMatched || null
      };
    }

    // ✅ SI NO ENCUENTRA COINCIDENCIA: Asignar Excel por defecto
    console.warn(`⚠️  Formato no identificado: "${textoOriginal}" en ${source_file}`);
    console.warn(`⚠️  Asignando "Excel" por defecto`);
    
    const formatoDefault = formatos.find(f => f.nombre_formato === "Excel");
    
    return {
      id_formato: formatoDefault.id,
      info_formato: {
        id: formatoDefault.id,
        nombre_formato: formatoDefault.nombre_formato,
        extension: formatoDefault.extension,
        descripcion: formatoDefault.descripcion
      },
      texto_original: textoOriginal,
      match_type: 'default_no_encontrado',
      nota: `Formato "${textoOriginal}" no identificado, asignado Excel por defecto`
    };
  }

  /**
   * Método helper para listar todos los formatos
   */
  listarFormatos() {
    console.log(`\n📋 FORMATOS DISPONIBLES (${formatos.length}):`);
    formatos.forEach((formato, idx) => {
      console.log(`   ${idx + 1}. [ID: ${formato.id}] ${formato.nombre_formato}`);
      console.log(`      Extensión: ${formato.extension}`);
      console.log(`      Descripción: ${formato.descripcion}`);
      console.log('');
    });
  }

  /**
   * Método helper para probar coincidencias sin procesar todo
   */
  testMatch(textoProbar) {
    const textoNormalizado = this.normalizeText(textoProbar);
    console.log(`\n🔍 Probando formato: "${textoProbar}"`);
    console.log(`   Normalizado: "${textoNormalizado}"`);
    
    const match = this.findFormato(textoNormalizado);
    
    if (match) {
      const { formato, matchType, aliasMatched } = match;
      console.log(`✅ MATCH ENCONTRADO:`);
      console.log(`   ID: ${formato.id}`);
      console.log(`   Formato: ${formato.nombre_formato}`);
      console.log(`   Extensión: ${formato.extension}`);
      console.log(`   Descripción: ${formato.descripcion}`);
      console.log(`   Tipo de coincidencia: ${matchType}`);
      if (aliasMatched) {
        console.log(`   Alias coincidente: "${aliasMatched}"`);
      }
    } else {
      console.log(`❌ NO SE ENCONTRÓ COINCIDENCIA`);
      console.log(`⚠️  Se asignaría Excel por defecto`);
      console.log(`\n💡 Formatos disponibles:`);
      formatos.forEach(f => {
        console.log(`   - ${f.nombre_formato} (${f.extension})`);
      });
    }
    
    return match;
  }

  /**
   * Método para obtener un formato por ID
   */
  getFormatoById(id) {
    return formatos.find(formato => formato.id === id);
  }

  /**
   * Método para obtener un formato por extensión
   */
  getFormatoByExtension(extension) {
    const extensionNormalizada = this.normalizeText(extension);
    return formatos.find(formato => 
      this.normalizeText(formato.extension) === extensionNormalizada ||
      this.normalizeText(formato.extension).replace(/\./g, '') === extensionNormalizada.replace(/\./g, '')
    );
  }

  /**
   * Método para obtener formatos por categoría
   */
  getFormatosPorCategoria(categoria) {
    const categorias = {
      'hojas_calculo': [1, 2, 3], // Excel, Excel Legacy, CSV
      'documentos': [6, 8], // PDF, TXT
      'datos': [4, 5, 7], // JSON, XML, SQL
      'geoespacial': [9, 10] // Shapefile, GeoJSON
    };
    
    const categoriaNormalizada = this.normalizeText(categoria);
    const ids = categorias[categoriaNormalizada] || [];
    
    return formatos.filter(f => ids.includes(f.id));
  }

  /**
   * Validar integridad de datos de formatos
   */
  validarIntegridad() {
    console.log(`\n🔍 VALIDANDO INTEGRIDAD DE FORMATOS...`);
    
    const problemas = [];
    
    formatos.forEach((formato, idx) => {
      // Verificar campos obligatorios
      if (!formato.id) {
        problemas.push(`Formato ${idx + 1}: Falta ID`);
      }
      if (!formato.nombre_formato || formato.nombre_formato.trim().length === 0) {
        problemas.push(`Formato ${idx + 1} (ID: ${formato.id}): Falta nombre_formato`);
      }
      if (!formato.extension || formato.extension.trim().length === 0) {
        problemas.push(`Formato ${idx + 1} (ID: ${formato.id}): Falta extensión`);
      }
      
      // Verificar que la extensión comience con punto
      if (formato.extension && !formato.extension.startsWith('.')) {
        problemas.push(`Formato ${idx + 1} (ID: ${formato.id}): Extensión "${formato.extension}" debe comenzar con punto`);
      }
      
      // Verificar duplicados de ID
      const duplicadosId = formatos.filter(f => f.id === formato.id);
      if (duplicadosId.length > 1) {
        problemas.push(`ID duplicado: ${formato.id} (${formato.nombre_formato})`);
      }
      
      // Verificar duplicados de extensión
      const duplicadosExt = formatos.filter(f => 
        this.normalizeText(f.extension) === this.normalizeText(formato.extension)
      );
      if (duplicadosExt.length > 1) {
        problemas.push(`Extensión duplicada: ${formato.extension}`);
      }
    });
    
    if (problemas.length === 0) {
      console.log(`✅ Todos los formatos tienen datos válidos`);
    } else {
      console.log(`⚠️  Se encontraron ${problemas.length} problemas:`);
      problemas.forEach((problema, idx) => {
        console.log(`   ${idx + 1}. ${problema}`);
      });
    }
    
    return problemas;
  }

  /**
   * Método para sugerir formatos similares
   */
  sugerirFormatosSimilares(textoProbar, limite = 3) {
    const textoNormalizado = this.normalizeText(textoProbar);
    const sugerencias = [];
    
    formatos.forEach(formato => {
      const nombreNormalizado = this.normalizeText(formato.nombre_formato);
      const extensionNormalizada = this.normalizeText(formato.extension);
      const descripcionNormalizada = this.normalizeText(formato.descripcion || '');
      
      // Calcular similitud simple basada en palabras comunes
      const palabrasTexto = textoNormalizado.split(' ');
      
      let similitud = 0;
      
      // Verificar en nombre
      const palabrasNombre = nombreNormalizado.split(' ');
      similitud += palabrasTexto.filter(palabra => 
        palabrasNombre.includes(palabra)
      ).length * 2; // Peso mayor para nombre
      
      // Verificar en extensión
      if (textoNormalizado.includes(extensionNormalizada.replace(/\./g, ''))) {
        similitud += 3; // Peso alto para extensión
      }
      
      // Verificar en descripción
      const palabrasDescripcion = descripcionNormalizada.split(' ');
      similitud += palabrasTexto.filter(palabra => 
        palabrasDescripcion.includes(palabra)
      ).length * 0.5; // Peso menor para descripción
      
      if (similitud > 0) {
        sugerencias.push({
          formato: formato,
          similitud: similitud
        });
      }
    });
    
    // Ordenar por similitud y retornar las top N
    return sugerencias
      .sort((a, b) => b.similitud - a.similitud)
      .slice(0, limite);
  }

  /**
   * Detectar formato desde nombre de archivo
   */
  detectarDesdeNombreArchivo(nombreArchivo) {
    if (!nombreArchivo) return null;
    
    const extension = nombreArchivo.substring(nombreArchivo.lastIndexOf('.')).toLowerCase();
    return this.getFormatoByExtension(extension);
  }
}