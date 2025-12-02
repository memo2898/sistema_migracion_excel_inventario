import https from "https";
import * as cheerio from "cheerio";

const URL_HTML = "https://map.gob.do/datos_abiertos";

function descargarHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

async function extraerDatos() {
  try {
    console.log("📥 Descargando HTML del MAP...");
    const html = await descargarHTML(URL_HTML);

    console.log("📄 Parseando HTML...");
    const $ = cheerio.load(html);

    const datos = [];

    $("table tbody tr").each((i, row) => {
      const celdas = $(row).find("td").map((i, el) => $(el).text().trim()).get();

      if (celdas.length > 0) {
        datos.push({
          item: celdas[0],
          nombre: celdas[1],
          descripcion: celdas[2],
          propietario: celdas[3],
          direccion_responsable: celdas[4],
          contacto_responsable: celdas[5],
          frecuencia: celdas[6]
        });
      }
    });

    console.log(`✅ Extraídos ${datos.length} registros`);
    return datos;

  } catch (error) {
    console.error("❌ Error al extraer datos:", error);
    return [];
  }
}

function buscarInstitucion(datos, texto) {
  const t = texto.toLowerCase();
  return datos.filter(row =>
    JSON.stringify(row).toLowerCase().includes(t)
  );
}

async function main() {
  const datos = await extraerDatos();

  console.log("\n🔍 Buscando 'junta'...");
  console.log(buscarInstitucion(datos, "junta").slice(0, 5));

  console.log("\n🔍 Buscando 'ayuntamiento'...");
  console.log(buscarInstitucion(datos, "ayuntamiento").slice(0, 5));
}

main();
