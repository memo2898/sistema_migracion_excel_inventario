import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const INPUT_DIR = "./input";
const OUTPUT_DIR = "./output";

export class excelHandler {
  INPUT_DIR = "../../input";
  OUTPUT_DIR = "./output";

  constructor() {}

  async haveFiles(dir) {
    try {
      const files = await fs.promises.readdir(dir);
      return files.length > 0;
    } catch (error) {
      console.error("Error al leer el directorio:", error);
      return false;
    }
  }

  async readFilesXLSX() {
    const allUnits = []; //Vamos a guardar todo el bundle

    try {
      const files = fs.readdirSync(INPUT_DIR);
      const ExcelFiles = files.filter(
        (file) =>
          file.toLowerCase().endsWith(".xlsx") ||
          file.toLowerCase().endsWith(".xls")
      );

      if (ExcelFiles.length === 0) {
        console.log("No se encontraron archivos Excel en el directorio input");
        return [];
      }

      const dataExtratedFromFiles = [];
      
      //Por cada archivo de Excel realizar:
      for (let fileIndex = 0; fileIndex < ExcelFiles.length; fileIndex++) {
        const file = ExcelFiles[fileIndex];

        try {
          const filePath = path.join(INPUT_DIR, file);
          const fileBuffer = fs.readFileSync(filePath);
          const workbook = XLSX.read(fileBuffer, { type: "buffer" });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            console.log(`  El archivo no contiene hojas`);
            continue;
          }

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const arrayRows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            raw: false,
          });

          let headerRowIndex = -1;

          // Buscar la fila de encabezados
          for (let i = 0; i < Math.min(20, arrayRows.length); i++) {
            const row = arrayRows[i];
            if (Array.isArray(row)) {
              const rowStr = row.join("").toLowerCase();
              if (
                rowStr.toLowerCase().includes("item") ||
                rowStr.toLowerCase().includes("nombre de la base") ||
                rowStr.toLowerCase().includes("propietario / origen") ||
                rowStr.toLowerCase().includes("direccion responsable")
              ) {
                headerRowIndex = i;
                console.log(`  Encabezados encontrados en fila ${i}`);
                break;
              }
            }
          }

          if (headerRowIndex === -1) {
            console.log(
              `  No se encontraron encabezados, asumiendo estructura estándar`
            );
            headerRowIndex = 0;
          }

          let processedCount = 0;
          let duplicateHeaderCount = 0;

          const dataFromOneFile = [];
          const encabezado = arrayRows[headerRowIndex];
          
          // Normalizar función para comparación
          const normalizeText = (text) => {
            if (!text) return '';
            return text.toString().trim().toLowerCase().replace(/\s+/g, ' ');
          };
          
          // Debug: mostrar cabecera detectada
          console.log(`\n  📋 Cabecera detectada:`);
          console.log(`     [0]: "${encabezado[0]}" -> normalizado: "${normalizeText(encabezado[0])}"`);
          console.log(`     [1]: "${encabezado[1]}" -> normalizado: "${normalizeText(encabezado[1])}"`);
          console.log(`     [2]: "${encabezado[2]}" -> normalizado: "${normalizeText(encabezado[2])}"`);
          console.log(`     [3]: "${encabezado[3]}" -> normalizado: "${normalizeText(encabezado[3])}"`);
          
          // Procesar desde la siguiente fila después de los encabezados
          for (let i = headerRowIndex + 1; i < arrayRows.length; i++) {
            const row = arrayRows[i];
            if (!Array.isArray(row) || row.length < 2) continue;

            // Verificar si es una fila de cabecera duplicada con comparación normalizada
            const match0 = normalizeText(row[0]) === normalizeText(encabezado[0]);
            const match1 = normalizeText(row[1]) === normalizeText(encabezado[1]);
            const match2 = normalizeText(row[2]) === normalizeText(encabezado[2]);
            const match3 = normalizeText(row[3]) === normalizeText(encabezado[3]);
            
            const isDuplicateHeader = match0 && match1 && match2 && match3;

            // Debug detallado cuando hay coincidencias parciales
            if (match0 && match1) {
              console.log(`\n  🔍 Posible cabecera en fila ${i + 1}:`);
              console.log(`     [0] "${row[0]}" vs "${encabezado[0]}" -> ${match0 ? '✓' : '✗'}`);
              console.log(`     [1] "${row[1]}" vs "${encabezado[1]}" -> ${match1 ? '✓' : '✗'}`);
              console.log(`     [2] "${row[2]}" vs "${encabezado[2]}" -> ${match2 ? '✓' : '✗'}`);
              console.log(`     [3] "${row[3]}" vs "${encabezado[3]}" -> ${match3 ? '✓' : '✗'}`);
              console.log(`     Es duplicado: ${isDuplicateHeader}`);
            }

            if (isDuplicateHeader) {
              duplicateHeaderCount++;
              console.log(`  ⚠️  Cabecera duplicada ignorada en fila ${i + 1}`);
              continue; // Saltar esta fila
            }

            // Solo armar el body siempre y cuando ciertas posiciones estén llenas
            if (
              row[0].trim().length > 0 && 
              row[1].trim().length > 0 && // Nombre de la base de datos
              row[2].trim().length > 0 && // Descripcion del dato
              row[4].trim().length > 0    // Direccion responsable
            ) {
              const body = {
                item: row[0].trim(),
                nombre_base_de_datos: row[1].trim(),
                descripcion_del_dato: row[2].trim(),
                propietario_origen: row[3].trim(),
                direccion_responsable: row[4].trim(),
                contacto_responsable: row[5].trim(),
                frecuencia_actualizacion: row[6].trim(),
                data_publica_privada: row[7].trim(),
                nivel_calidad_data: row[8].trim(),
                fuente_ie: row[9].trim(),
                actualizado_fecha: row[10].trim(),
                enlace_link: row[11].trim(),
                formato_origen: row[12].trim(),
                formato_publicacion: row[13].trim(),
                tipo_datos: row[14].trim(),
              };

              dataFromOneFile.push(body);
              processedCount++;
            }
          }

          console.log(`  ✓ Procesadas ${processedCount} filas válidas`);
          if (duplicateHeaderCount > 0) {
            console.log(`  ✓ Ignoradas ${duplicateHeaderCount} cabeceras duplicadas`);
          }

          dataExtratedFromFiles.push({
            fileName: ExcelFiles[fileIndex],
            dataExtracted: dataFromOneFile
          });

        } catch (fileError) {
          console.error(`Error procesando archivo ${file}:`);
          console.error(`   Mensaje: ${fileError.message}`);
          continue;
        }
      }

      return dataExtratedFromFiles;

    } catch (error) {
      console.log(error);
    }
  }

  async transformData(data) {
    // Arreglo consolidado sin duplicados
    const consolidatedData = [];
    
    // Set para rastrear combinaciones únicas de nombre_base_de_datos + descripcion_del_dato
    const uniqueEntries = new Set();
    
    // Recorrer cada archivo
    for (const fileData of data) {
      const { fileName, dataExtracted } = fileData;
      
      console.log(`\nProcesando archivo: ${fileName}`);
      console.log(`Registros encontrados: ${dataExtracted.length}`);
      
      // Recorrer cada registro extraído del archivo
      for (const record of dataExtracted) {
        const nombreBase = record.nombre_base_de_datos?.trim().toLowerCase() || '';
        const descripcion = record.descripcion_del_dato?.trim().toLowerCase() || '';
        
        // Crear una clave única combinando nombre_base_de_datos + descripcion_del_dato
        const uniqueKey = `${nombreBase}|||${descripcion}`;
        
        // Verificar si ya existe esta combinación
        if (!uniqueEntries.has(uniqueKey)) {
          // Si no existe, agregar al conjunto consolidado
          uniqueEntries.add(uniqueKey);
          consolidatedData.push({
            ...record,
            source_file: fileName // Opcional: agregar el archivo de origen
          });
        } else {
          console.log(`  Duplicado encontrado: ${record.nombre_base_de_datos} - ${record.descripcion_del_dato}`);
        }
      }
    }
    
    console.log(`\n✓ Consolidación completa:`);
    console.log(`   Total de registros únicos: ${consolidatedData.length}`);
    console.log(`   Duplicados eliminados: ${
      data.reduce((sum, file) => sum + file.dataExtracted.length, 0) - consolidatedData.length
    }`);
    
    return consolidatedData;
  }

  async getRows() {
    // Verificamos si tiene archivos:
    const haveFiles = await this.haveFiles(INPUT_DIR);

    if (!haveFiles) {
      console.log("No hay archivos en el directorio input");
      return [];
    }

    // Si tiene archivos entonces vamos a proceder a extraer su composición:
    const dataReaded = await this.readFilesXLSX();
    
    // Consolidar y limpiar los datos
    const consolidatedData = await this.transformData(dataReaded);

    return consolidatedData;
  }
}