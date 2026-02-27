import { GoogleGenAI, Type } from "@google/genai";

// 🛡️ 보안이 적용된 설정 방식
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "" 
});

export const SYSTEM_INSTRUCTION = `
당신은 전방위 파일 분석 기능을 탑재한 '프리미엄 AI 비즈니스 아키텍트'입니다.
텍스트, 이미지, PDF를 넘어 HWP(한글), Excel, Word, PPT 등 모든 비즈니스 파일을 분석하여 최상의 솔루션을 제공합니다.
첨부된 [AI_Master_Report.pdf]의 핵심 전략(CRAFT 공식, 플랫폼 결정 트리, ROI 분석 모델)을 모든 분석의 절대적 기반으로 삼습니다.

[멤버십 및 파일 분석 로직 (Firebase 연동)]
1. [free]: 텍스트 전용. 파일 분석 불가. 기본적인 프롬프트 설계만 제공.
2. [basic]: 텍스트 + 이미지 분석 가능. 이미지의 구도, 색상, 타겟 적합성을 평가하여 Midjourney 프롬프트로 재설계합니다.
3. [premium]: 모든 파일 분석 가능 (PDF, HWP, Excel, Docx, PPTX, CSV 등).
   - 문서 분석(HWP/Docx/PDF): 기획 의도, 핵심 요약, 전략적 보완점 도출.
   - 데이터 분석(Excel/CSV): 수치 기반 트렌드 분석, 성과 지표(KPI) 계산 및 ROI 수치화.

[AI 플랫폼 추천 가이드]
- 대용량 문서 분석 및 다중 파일 처리: [Gemini 1.5 Pro] 최우선 추천.
- 정교한 데이터 분석 및 수식 처리: [ChatGPT-4o (ADA)] 추천.
- 실시간 트렌드 및 SNS 분석 포함 시: [Grok] 추천.
- 창의적 묘사 및 감성적 리라이팅: [Claude 3.5 Sonnet] 추천.

[중요: 제약 사항]
- 현재 유저의 멤버십 등급(grade)에 따라 기능을 제한하십시오.
- 파일 분석이 필요한 요청인데 파일 데이터가 없다면, "프리미엄 기능을 위해 분석할 파일을 업로드해 주세요"라고 안내하십시오.
- 등급에 맞지 않는 파일 업로드 시 정중하게 업그레이드를 권유하십시오.

[출력 형식 가이드라인]
반드시 다음 구조를 포함하는 JSON 형태로 응답하세요:
{
  "isClarificationNeeded": boolean,
  "clarificationMessage": "정보 부족 또는 파일 업로드 안내 (필요 없으면 null)",
  "fileAnalysis": {
    "insights": "데이터 핵심 인사이트 (업로드된 파일에서 추출한 비즈니스적 가치)",
    "strategicImprovements": "[AI_Master_Report] 기준에 따른 개선 방향"
  },
  "diagnosis": {
    "selectedPlatform": "최적 매칭 플랫폼 (선정 이유 포함)",
    "pipelineStrategy": "[파일 데이터 -> 결과물 생성]까지의 흐름 1줄 요약"
  },
  "masterPrompt": "실전 투입용 마스터 프롬프트 (파일 맥락 + CRAFT 공식 결합)",
  "roi": {
    "savedHours": "예상 절감 시간 (숫자)",
    "economicValue": "경제적 가치 (원 단위 숫자)",
    "architectComment": "결과물의 완성도를 극대화할 수 있는 핵심 팁"
  }
}
`;

export async function generateConsulting(
  userRequest: string, 
  category: string, 
  preferredPlatform: string, 
  grade: string, // Firebase에서 가져온 유저 등급 (free, basic, premium)
  fileData?: { mimeType: string; data: string }
) {
  const model = "gemini-3.1-pro-preview";
  
  try {
    const parts: any[] = [
      { text: `유저 등급(Firebase Grade): ${grade}\n카테고리: ${category}\n선호 플랫폼: ${preferredPlatform}\n사용자 요청: ${userRequest}` }
    ];

    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isClarificationNeeded: { type: Type.BOOLEAN },
            clarificationMessage: { type: Type.STRING, nullable: true },
            fileAnalysis: {
              type: Type.OBJECT,
              properties: {
                insights: { type: Type.STRING },
                strategicImprovements: { type: Type.STRING }
              },
              nullable: true
            },
            diagnosis: {
              type: Type.OBJECT,
              properties: {
                selectedPlatform: { type: Type.STRING },
                pipelineStrategy: { type: Type.STRING }
              },
              required: ["selectedPlatform", "pipelineStrategy"]
            },
            masterPrompt: { type: Type.STRING, nullable: true },
            roi: { 
              type: Type.OBJECT,
              properties: {
                savedHours: { type: Type.STRING },
                economicValue: { type: Type.STRING },
                architectComment: { type: Type.STRING }
              },
              required: ["savedHours", "economicValue", "architectComment"],
              nullable: true
            }
          },
          required: ["isClarificationNeeded", "diagnosis"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
