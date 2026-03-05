import api from "./api";

const PRIVACY_PREFIX = "/legal";

export interface PrivacyPolicy {
  Titulo: string;
  Descripcion: string;
  "Tipo de datos obtenidos": string;
  "Utilización de datos": string;
  "Proteccion de datos": string;
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
      // Retornar datos por defecto si hay error
      return getDefaultPrivacyPolicy();
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
