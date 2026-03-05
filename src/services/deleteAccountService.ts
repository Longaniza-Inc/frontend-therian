import api from "./api";

const USER_PREFIX = "/usuario";

export const deleteAccountService = {
  async deleteAccount(userId: number): Promise<void> {
    console.log("📡 deleteAccountService.deleteAccount - Eliminando cuenta...", { userId });
    try {
      await api.delete(`${USER_PREFIX}/delete_account/${userId}`);
      console.log("✅ Cuenta eliminada correctamente");
    } catch (error: any) {
      console.error("❌ Error eliminando cuenta:", error);
      throw error;
    }
  },
};
