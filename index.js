import { excelHandler } from "./features/excelClass/index.js";
import { transformToStructureADN } from "./features/transformToStructADN/index.js";

class migracionInventario {
  constructor() {}

  async init() {
    const EXCEL_HANDLER = new excelHandler();
    //Obtener:
    const rows = await EXCEL_HANDLER.getRows();
    //transformar los datos a la estructura de la BD de ADN:
    const TRANSFORM_DATA_HANDLER = new transformToStructureADN();
    TRANSFORM_DATA_HANDLER.transform(rows);
  }
}

new migracionInventario().init();
