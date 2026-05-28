export interface SkillLevel {
  id: number;
  code: string;
  name: string;
  description: string;
}

export type RepairStatus = "in_progress" | "success" | "failed" | "cancelled";

export interface SkillLevelStat {
  skillLevelId: number;
  code: string;
  name: string;
  usersCount: number;
}

export interface TopUser {
  id: number;
  fullName: string;
  email: string;
  skillLevelName: string;
  chatsCount: number;
  messagesCount: number;
  repairHistoryCount: number;
  successfulRepairsCount: number;
}

export interface AdminStats {
  users: {
    total: number;
    last7Days: number;
    bySkillLevel: SkillLevelStat[];
  };
  chats: {
    total: number;
    activeLast7Days: number;
    messagesTotal: number;
    avgMessagesPerChat: number;
  };
  repairHistory: {
    total: number;
    byStatus: Record<RepairStatus, number>;
    successRate: number;
  };
  devices: {
    total: number;
  };
  topUsers: TopUser[];
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  skillLevelId: number;
  skillLevelCode: string;
  skillLevelName: string;
  devicesCount: number;
  chatsCount: number;
  messagesCount: number;
  repairHistoryCount: number;
  successfulRepairsCount: number;
  createdAt: string;
  updatedAt: string;
}
