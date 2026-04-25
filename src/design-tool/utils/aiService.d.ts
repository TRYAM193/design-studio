// Type declaration for the JS AI service module
declare module "@/design-tool/utils/aiService" {
  export function warmUpAIBackend(): Promise<void>;

  export function generateDesignJsonFromPrompt(
    prompt: string,
    style: string,
    canvasWidth: number,
    canvasHeight: number,
    productInfo: string,
    imageBase64?: string | null
  ): Promise<{ objects: any[]; suggestedBg: string }>;
}
