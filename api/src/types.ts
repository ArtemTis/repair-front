  // Параметры маршрута
  export interface IdParam {
    id: string; // из req.params всегда string
}

export interface IUser {
    id: number;
    full_name: string;
    email: string;
    password: string;
    skill_level_id: number;
    created_at: string;
    updated_at: string;
}

export interface ISkills {
    id: number;
    code: string;
    name: string;
    description: string;
}

export interface ITool {
    id: number;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface IDevice {
    id: number;
    user_id: number;
    device_type: string;
    brand: string | null;
    model: string;
    serial_number: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface IRepairGuide {
    id: number;
    title: string;
    user_id: number;
    problem_description: string;
    instructions: string;
    recommendation: string | null;
    min_skill_level_id: number;
    created_at: Date;
    updated_at: Date;
  }

export interface IArticle {
    id: number;
    title: string;
    excerpt: string;
    content_markdown: string;
    is_published: boolean;
    published_at: Date | null;
    created_at: Date;
    updated_at: Date;
}
  
export interface IRepairHistory {
    id: number;
    user_id: number;
    device_id: number;
    repair_guide_id: number | null;
    started_at: Date;
    finished_at: Date | null;
    status: 'in_progress' | 'success' | 'failed' | 'cancelled';
    issue_description: string;
    work_performed: string | null;
    result_notes: string | null;
    recommendation_used: string | null;
    complexity_skill_level_id: number | null;
    created_at: Date;
    updated_at: Date;
}

export interface IUserTool {
    user_id: number;
    tool_id: number;
    quantity: number;
}
  
export interface IRepairGuideTool {
    repair_guide_id: number;
    tool_id: number;
    user_id: number;
    is_required: boolean;
    notes: string | null;
}

export type AssistantMessageAuthor = 'me' | 'companion';

export interface IAssistantChatMessage {
    id: number;
    chat_id: number;
    author: AssistantMessageAuthor;
    text: string;
    created_at: Date;
}

export interface IAssistantChat {
    id: number;
    user_id: number;
    title: string;
    created_at: Date;
    updated_at: Date;
}

export interface IAssistantChatWithMessages extends IAssistantChat {
    messages: IAssistantChatMessage[];
}