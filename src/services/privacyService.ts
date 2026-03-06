import api from "./api";

const PRIVACY_PREFIX = "/legal";

export interface PrivacyPolicy {
  Titulo: string;
  Descripcion: string;
  "Tipo de datos obtenidos": string;
  "Utilización de datos": string;
  "Proteccion de datos": string;
}

export interface CSAEPolicy {
  Titulo: string;
  "Prohibicion explicitas": string;
  Reporte: string;
  Final: string;
}

export const privacyService = {
  async getPoliticaPrivacidad(): Promise<PrivacyPolicy> {
    console.log("📡 privacyService.getPoliticaPrivacidad - Obteniendo políticas...");
    try {
      const response = await api.get<PrivacyPolicy>(
        `${PRIVACY_PREFIX}/politica_privacidad`
      );
      console.log("✅ Privacy policy obtenida:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error obteniendo política de privacidad:", error);
      return getDefaultPrivacyPolicy();
    }
  },

  async getCSAE(): Promise<CSAEPolicy> {
    console.log("📡 privacyService.getCSAE - Obteniendo CSAE...");
    try {
      const response = await api.get<CSAEPolicy>(
        `${PRIVACY_PREFIX}/CSAE`
      );
      console.log("✅ CSAE obtenida:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error obteniendo CSAE:", error);
      return getDefaultCSAE();
    }
  },
};

export const getDefaultPrivacyPolicy = (): PrivacyPolicy => ({
  Titulo: "Política de privacidad de PawTalk y cómo se utilizan los datos de usuario",
  Descripcion:
    "En PawTalk y LonganizaInc, asumimos el compromiso de informarle de manera clara y transparente qué datos personales recopilamos y cómo los utilizamos, con el objetivo de mejorar su experiencia como usuario. Estos datos son obtenidos de forma legal de acuerdo a la Ley Argentina 25.326.",
  "Tipo de datos obtenidos":
    "- Datos obtenidos explícitamente por el usuario: Nombre, Dirección Email, Ubicación relativa, Ubicación por GPS, Contraseña, Nombre de usuario, Gustos\n" +
    "- Datos obtenidos por Google: Dirección Email, Identificador de Google (ID)\n" +
    "- Datos obtenidos por solicitud web: Dirección IP pública",
  "Utilización de datos":
    "Todos los datos que nosotros solicitamos son usados por y para una mejor experiencia al momento de usar nuestra aplicación. El nombre, Gmail, contraseña y cualquier dato de creación de cuenta nos sirve no solo para comunicarnos con el usuario, sino también como variables de seguridad para no darle su cuenta a nadie que no sea el usuario propietario. La información de ubicación (Ubicación relativa, Ubicación por GPS) nos sirve para mejorar el emparejamiento y poder mostrar personas que estén cerca del usuario propietario de esos datos. Con la dirección de IP pública solo se solicita y usa en caso que el usuario niegue el uso de su ubicación por GPS. Esta IP Pública solamente da un aproximado de dónde pueda estar el usuario y de igual manera no se es mostrada en ninguna parte.",
  "Proteccion de datos":
    "En PawTalk y LonganizaInc juramos no mostrar ni vender su información personal bajo motivos monetarios o de interés mutuo a ningún tercero que la solicite. Pero debemos informarle que, si ese tercero solicitante es el Gobierno de la Nación, o cualquier organismo público de seguridad, no tendremos otra que acatar a lo que se nos diga bajo toda legalidad.",
});

export const getDefaultCSAE = (): CSAEPolicy => ({
  Titulo:
    "Nuestra aplicación es usable para personas desde la edad de la adolescencia en adelante. Por eso mismo es que tenemos una sección de Estándares contra la explotación y abuso sexual infantil (CSAE).",
  "Prohibicion explicitas":
    "Se prohíbe compartir y/o mostrar contenido sexual o servicios destinados a brindar placer de carácter sexual a ningún menor de 18 años. En caso de suceder eso, se eliminará ese contenido y cualquier cuenta que lo suba será inmediatamente baneada. Lo mismo se dice de cualquier contenido de carácter sangriento, peligroso, con incitación a la violencia, que tenga que ver con drogas y su distribución, o que sea de carácter de productos violentos (Venta y/o muestra de armas de cualquier tipo).",
  Reporte:
    "Siempre va existir un botón de reporte de mensaje para cualquier mensaje indebido que rompa con lo dicho anteriormente. Ese informe de reporte será revisado por algún administrador a cargo y de ser cierto el reporte, la cuenta del usuario que lo envió será inmediatamente eliminada del sistema. Además, de acuerdo con la ley 27.436 (2018), si el contenido reportado es de carácter de abuso sexual infantil, se reportará al usuario con la policía.",
  Final:
    "Para más información sobre este tema puede revisar las páginas de:\n" +
    "- Ley 27.436: https://servicios.infoleg.gob.ar/infolegInternet/anexos/305000-309999/309201/norma.htm\n" +
    "- Ley 26.061: https://servicios.infoleg.gob.ar/infolegInternet/anexos/110000-114999/110778/norma.htm",
});
