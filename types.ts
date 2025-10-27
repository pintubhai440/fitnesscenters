
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DailyMealPlan {
    day: string;
    meals: {
        breakfast: string;
        lunch: string;
        dinner: string;
        snacks: string;
    };
    notes?: string;
}

export interface DietPlan {
    title: string;
    summary: string;
    daily_plans: DailyMealPlan[];
}
