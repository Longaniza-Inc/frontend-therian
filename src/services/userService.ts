import api from "./api";
import type { UserProfile, FeedCard, PaginatedResponse } from "@/types";

const USER_PREFIX = "/usuario";

export const userService = {
  /** Get current user profile */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>(`${USER_PREFIX}/perfil`);
    return response.data;
  },

  /** Update user profile */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await api.put<UserProfile>(`${USER_PREFIX}/perfil`, data);
    return response.data;
  },

  /** Get feed cards */
  async getFeed(page = 1): Promise<PaginatedResponse<FeedCard>> {
    const response = await api.get<PaginatedResponse<FeedCard>>(`${USER_PREFIX}/feed`, { params: { page } });
    return response.data;
  },

  /** Swipe action */
  async swipe(targetUserId: string, action: string): Promise<void> {
    await api.post(`${USER_PREFIX}/swipe`, { targetUserId, action });
  },

  /** Report user */
  async report(targetUserId: string, reason: string): Promise<void> {
    await api.post(`${USER_PREFIX}/reportar`, { targetUserId, reason });
  },
};
