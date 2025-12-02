import { excelHandler } from "./features/excelClass/index.js";
import { transformDataToSQL } from "./features/sqlClass/index.js";
import { transformToStructureADN } from "./features/transformToStructADN/index.js";

class migracionInventario {
  constructor() {}

  async init() {
    const EXCEL_HANDLER = new excelHandler();
    //Obtener:
    const rows = await EXCEL_HANDLER.getRows();
    //transformar los datos a la estructura de la BD de ADN:
    const TRANSFORM_DATA_HANDLER = new transformToStructureADN();
    const dataTransformada = await TRANSFORM_DATA_HANDLER.transform(rows);
    
    //Transformar la data a SQL 
    const TRANSFORM_TO_SQL_HANDLER = new transformDataToSQL()
    TRANSFORM_TO_SQL_HANDLER.convertToSql(dataTransformada)

  }
}

new migracionInventario().init();
