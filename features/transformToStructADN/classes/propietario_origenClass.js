import { responsablesIdentificados } from "../functions/responsablesIdentificados.js";

export class PropietarioOrigenClass {
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
   * Busca un responsable por nombre, siglas o alias
   */
  findResponsable(textoNormalizado) {
    for (const resp of responsablesIdentificados) {
      const nombreNormalizado = this.normalizeText(resp.nombre_organizacion);
      const siglasNormalizado = this.normalizeText(resp.siglas);
      
      // 1. Comparar con nombre completo
      if (textoNormalizado === nombreNormalizado) {
        return { responsable: resp, matchType: 'nombre_completo' };
      }
      
      // 2. Comparar con siglas
      if (textoNormalizado === siglasNormalizado) {
        return { responsable: resp, matchType: 'siglas' };
      }
      
      // 3. Comparar con alias (si existen)
      if (resp.alias && Array.isArray(resp.alias)) {
        for (let i = 0; i < resp.alias.length; i++) {
          const aliasNormalizado = this.normalizeText(resp.alias[i]);
          
          // Comparación exacta
          if (textoNormalizado === aliasNormalizado) {
            return { 
              responsable: resp, 
              matchType: 'alias',
              aliasMatched: resp.alias[i]
            };
          }
          
          // Comparación parcial: si el texto contiene el alias o viceversa
          if (textoNormalizado.includes(aliasNormalizado) || 
              aliasNormalizado.includes(textoNormalizado)) {
            return { 
              responsable: resp, 
              matchType: 'alias_parcial',
              aliasMatched: resp.alias[i]
            };
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Verifica si el propietario es ADN y retorna información estructurada
   */
  async propietario_origen_method(propietarioTexto, ubicacionFile) {
    // Validar entrada
    if (!propietarioTexto || propietarioTexto.trim().length === 0) {
      propietarioTexto = "ADN"
     // throw new Error(` Propietario vacío en archivo: ${ubicacionFile}`);
    }

    const textoOriginal = propietarioTexto.trim();
    const textoNormalizado = this.normalizeText(propietarioTexto);
    
    // PASO 1: Verificar si es ADN
    const esADN = textoNormalizado.startsWith("adn");
    
    if (esADN) {
      //console.log(` ADN detectado: "${textoOriginal}" en ${ubicacionFile}`);
      return {
        info_propietario: {
          nombre_organizacion: "ALCALDIA DEL DISTRITO NACIONAL",
          siglas: "ADN"
        },
        es_adn: true,
        texto_original: textoOriginal,
        match_type: 'adn_directo'
      };
    }

    // PASO 2: Si NO es ADN, buscar en responsables identificados
    const match = this.findResponsable(textoNormalizado);
    
    if (match) {
      const { responsable, matchType, aliasMatched } = match;
      
      let logMessage = ` Responsable identificado: "${textoOriginal}" → ${responsable.siglas}`;
      
      switch(matchType) {
        case 'nombre_completo':
          logMessage += ` (coincidencia: nombre completo)`;
          break;
        case 'siglas':
          logMessage += ` (coincidencia: siglas)`;
          break;
        case 'alias':
          logMessage += ` (coincidencia: alias "${aliasMatched}")`;
          break;
        case 'alias_parcial':
          logMessage += ` (coincidencia parcial: alias "${aliasMatched}")`;
          break;
      }
      
      logMessage += ` en ${ubicacionFile}`;
      //console.log(logMessage);
      
      return {
        info_propietario: {
          nombre_organizacion: responsable.nombre_organizacion,
          siglas: responsable.siglas
        },
        es_adn: false,
        texto_original: textoOriginal,
        match_type: matchType,
        alias_matched: aliasMatched || null
      };
    }

    // PASO 3: Si NO está identificado, DETENER el proceso
    console.error(`\n ========================================`);
    console.error(` PROPIETARIO NO IDENTIFICADO`);
    console.error(` ========================================`);
    console.error(`   Texto original: "${textoOriginal}"`);
    console.error(`   Texto normalizado: "${textoNormalizado}"`);
    console.error(`   Archivo: ${ubicacionFile}`);
    console.error(` ========================================\n`);
    
    throw new Error(
      `Propietario no identificado: "${textoOriginal}" en archivo ${ubicacionFile}. ` +
      `Debe agregarse a la lista de responsablesIdentificados antes de continuar.`
    );
  }
}