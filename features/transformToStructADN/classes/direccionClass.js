import { ListaDirecciones } from "../functions/direccionesLista.js";

export class DireccionClass {
  
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD") // Descompone caracteres con tildes
      .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes
      .replace(/[^\w\s]/g, "") // Elimina caracteres especiales excepto espacios
      .split(/\s+/) // Divide por espacios
      .map(word => word.trim()) // Trim a cada palabra
      .filter(word => word.length > 0) // Elimina strings vacíos
      .join(" "); // Une con un solo espacio
  }

  /**
   * Busca una dirección por nombre o alias
   */
  findDireccion(textoNormalizado) {
    for (const direccion of ListaDirecciones) {
      const nombreNormalizado = this.normalizeText(direccion.nombre_direccion);
      
      // 1. Comparar con nombre completo exacto
      if (textoNormalizado === nombreNormalizado) {
        return { 
          direccion, 
          matchType: 'nombre_completo',
          id: direccion.id 
        };
      }
      
      // 2. Comparar si el texto está contenido en el nombre de la dirección
      if (nombreNormalizado.includes(textoNormalizado)) {
        return { 
          direccion, 
          matchType: 'nombre_parcial',
          id: direccion.id 
        };
      }
      
      // 3. Comparar si el nombre de la dirección está contenido en el texto
      if (textoNormalizado.includes(nombreNormalizado)) {
        return { 
          direccion, 
          matchType: 'nombre_contenido',
          id: direccion.id 
        };
      }
      
      // 4. Comparar con alias (si existen)
      if (direccion.alias && Array.isArray(direccion.alias) && direccion.alias.length > 0) {
        for (let i = 0; i < direccion.alias.length; i++) {
          const aliasNormalizado = this.normalizeText(direccion.alias[i]);
          
          // Comparación exacta con alias
          if (textoNormalizado === aliasNormalizado) {
            return { 
              direccion, 
              matchType: 'alias_exacto',
              aliasMatched: direccion.alias[i],
              id: direccion.id
            };
          }
          
          // Comparación parcial: si el texto contiene el alias
          if (textoNormalizado.includes(aliasNormalizado)) {
            return { 
              direccion, 
              matchType: 'alias_contenido',
              aliasMatched: direccion.alias[i],
              id: direccion.id
            };
          }
          
          // Comparación parcial: si el alias contiene el texto
          if (aliasNormalizado.includes(textoNormalizado)) {
            return { 
              direccion, 
              matchType: 'alias_parcial',
              aliasMatched: direccion.alias[i],
              id: direccion.id
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Método principal para procesar la dirección responsable
   */
  async direccion_responsable_method(direccion_responsable, ubicacionFile) {
    // Validar entrada
    if (!direccion_responsable || direccion_responsable.trim().length === 0) {
      console.error(`⚠️  Dirección responsable vacía en archivo: ${ubicacionFile}`);
      throw new Error(`Dirección responsable vacía en archivo: ${ubicacionFile}`);
    }

    const textoOriginal = direccion_responsable.trim();
    const textoNormalizado = this.normalizeText(direccion_responsable);
    
    // Buscar la dirección
    const match = this.findDireccion(textoNormalizado);
    
    if (match) {
      const { direccion, matchType, aliasMatched, id } = match;
      
      let logMessage = `responsablesIdentificados Dirección identificada: "${textoOriginal}" → ${direccion.nombre_direccion}`;
      
      switch(matchType) {
        case 'nombre_completo':
          logMessage += ` (coincidencia: nombre completo)`;
          break;
        case 'nombre_parcial':
          logMessage += ` (coincidencia: nombre parcial)`;
          break;
        case 'nombre_contenido':
          logMessage += ` (coincidencia: nombre contenido en texto)`;
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
        id_direccion: id,
        info_direccion: {
          id: direccion.id,
          nombre_direccion: direccion.nombre_direccion,
          codigo: direccion.descripcion,
          id_director: direccion.id_director,
          director: direccion.director ? {
            id: direccion.director.id,
            nombre_completo: direccion.director.nombre_completo,
            cargo: direccion.director.cargo,
            email: direccion.director.email,
            codigo_empleado: direccion.director.codigo_empleado
          } : null,
          sede: direccion.sede ? {
            id: direccion.sede.id,
            nombre_sede: direccion.sede.nombre_sede,
            direccion_fisica: direccion.sede.direccion_fisica
          } : null
        },
        texto_original: textoOriginal,
        match_type: matchType,
        alias_matched: aliasMatched || null
      };
    }

    // Si NO está identificada, DETENER el proceso
    console.error(`\n🛑 ========================================`);
    console.error(`🛑 DIRECCIÓN NO IDENTIFICADA`);
    console.error(`🛑 ========================================`);
    console.error(`   Texto original: "${textoOriginal}"`);
    console.error(`   Texto normalizado: "${textoNormalizado}"`);
    console.error(`   Archivo: ${ubicacionFile}`);
    console.error(`🛑 ========================================\n`);
    
    throw new Error(
      `Dirección no identificada: "${textoOriginal}" en archivo ${ubicacionFile}. ` +
      `Debe agregarse a la lista de direcciones o crear un alias apropiado.`
    );
  }

  /**
   * Método helper para listar todas las direcciones
   */
  listarDirecciones() {
    console.log(`\n📋 DIRECCIONES IDENTIFICADAS (${ListaDirecciones.length}):`);
    ListaDirecciones.forEach((dir, idx) => {
      console.log(`   ${idx + 1}. [ID: ${dir.id}] ${dir.nombre_direccion}`);
      console.log(`      Código: ${dir.descripcion}`);
      if (dir.director) {
        console.log(`      Director: ${dir.director.nombre_completo} (${dir.director.cargo})`);
      }
      if (dir.alias && dir.alias.length > 0) {
        console.log(`      Alias: ${dir.alias.join(', ')}`);
      }
      console.log('');
    });
  }

  /**
   * Método helper para probar coincidencias sin procesar todo
   */
  testMatch(textoProbar) {
    const textoNormalizado = this.normalizeText(textoProbar);
    console.log(`\n🔍 Probando dirección: "${textoProbar}"`);
    console.log(`   Normalizado: "${textoNormalizado}"`);
    
    const match = this.findDireccion(textoNormalizado);
    
    if (match) {
      const { direccion, matchType, aliasMatched } = match;
      console.log(`responsablesIdentificados MATCH ENCONTRADO:`);
      console.log(`   ID: ${direccion.id}`);
      console.log(`   Dirección: ${direccion.nombre_direccion}`);
      console.log(`   Código: ${direccion.descripcion}`);
      console.log(`   Tipo de coincidencia: ${matchType}`);
      if (aliasMatched) {
        console.log(`   Alias coincidente: "${aliasMatched}"`);
      }
      if (direccion.director) {
        console.log(`   Director: ${direccion.director.nombre_completo}`);
      }
    } else {
      console.log(`❌ NO SE ENCONTRÓ COINCIDENCIA`);
      console.log(`\n💡 Sugerencia: Agregar alias a una dirección existente o verificar el nombre`);
    }
    
    return match;
  }

  /**
   * Método para obtener direcciones por criterios específicos
   */
  getDireccionesPorDirector(nombreDirector) {
    const nombreNormalizado = this.normalizeText(nombreDirector);
    return ListaDirecciones.filter(dir => {
      if (!dir.director) return false;
      const directorNormalizado = this.normalizeText(dir.director.nombre_completo);
      return directorNormalizado.includes(nombreNormalizado);
    });
  }

  /**
   * Método para obtener una dirección por ID
   */
  getDireccionById(id) {
    return ListaDirecciones.find(dir => dir.id === id);
  }

  /**
   * Validar integridad de datos de direcciones
   */
  validarIntegridad() {
    console.log(`\n🔍 VALIDANDO INTEGRIDAD DE DIRECCIONES...`);
    
    const problemas = [];
    
    ListaDirecciones.forEach((dir, idx) => {
      // Verificar campos obligatorios
      if (!dir.id) {
        problemas.push(`Dirección ${idx + 1}: Falta ID`);
      }
      if (!dir.nombre_direccion || dir.nombre_direccion.trim().length === 0) {
        problemas.push(`Dirección ${idx + 1} (ID: ${dir.id}): Falta nombre_direccion`);
      }
      if (!dir.director) {
        problemas.push(`Dirección ${idx + 1} (ID: ${dir.id}): Sin director asignado`);
      } else {
        if (!dir.director.nombre_completo) {
          problemas.push(`Dirección ${idx + 1} (ID: ${dir.id}): Director sin nombre_completo`);
        }
        if (!dir.director.email) {
          problemas.push(`Dirección ${idx + 1} (ID: ${dir.id}): Director sin email`);
        }
      }
      
      // Verificar duplicados de ID
      const duplicados = ListaDirecciones.filter(d => d.id === dir.id);
      if (duplicados.length > 1) {
        problemas.push(`ID duplicado: ${dir.id} (${dir.nombre_direccion})`);
      }
    });
    
    if (problemas.length === 0) {
      console.log(`responsablesIdentificados Todas las direcciones tienen datos válidos`);
    } else {
      console.log(`⚠️  Se encontraron ${problemas.length} problemas:`);
      problemas.forEach((problema, idx) => {
        console.log(`   ${idx + 1}. ${problema}`);
      });
    }
    
    return problemas;
  }
}