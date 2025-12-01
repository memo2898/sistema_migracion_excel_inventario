import { excelHandler } from "./features/excelClass/index.js";

class migracionInventario{
    constructor(){

    }

   async init(){
        const EXCEL_HANDLER = new excelHandler()
       const rows = await EXCEL_HANDLER.getRows()
   }
}

new migracionInventario().init()
