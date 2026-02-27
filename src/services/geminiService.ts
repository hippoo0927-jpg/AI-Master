import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key Priority: User Input > Environment Variable
const getFinalApiKey = (customApiKey?: string) => {
  // 사용자 입력 키가 존재하면 환경변수를 완전히 무시
  if (customApiKey?.trim()) {
    const finalKey = customApiKey.trim();
    console.log(`[Gemini Auth] 사용 중인 키 소스: 사용자 직접 입력 (키 앞 4자리: ${finalKey.substring(0, 4)}****)`);
    return finalKey;
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  const finalKey = envKey.trim();
  
  // Debug Logging
  const maskedKey = finalKey ? `${finalKey.substring(0, 4)}****` : "없음";
  console.log(`[Gemini Auth] 사용 중인 키 소스: Vercel 환경변수 (키 앞 4자리: ${maskedKey})`);
  
  return finalKey;
};

// 인스턴스 생성을 위한 헬퍼 함수 (Instance Refresh 강제)
const getAIInstance = (customApiKey?: string) => {
  const apiKey = getFinalApiKey(customApiKey);
  if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");
  return new GoogleGenerativeAI(apiKey);
};

// 모델을 가져오는 헬퍼 함수 (표준 형식 강제)
const getModel = (genAI: GoogleGenerativeAI, _modelName: string) => {
  // 현재 계정에서 활성화된 'gemini-2.5-flash'를 기본값으로 강제 사용
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

/**
 * 표준 fetch를 사용한 직접 연결 테스트 (SDK 404 에러 대비 Fallback)
 */
export async function testDirectConnection(apiKey: string) {
  const finalKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${finalKey}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }]
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log("[Gemini Direct] 연결 성공:", data);
      return true;
    } else {
      console.error("[Gemini Direct] 연결 실패:", data);
      throw new Error(data.error?.message || `HTTP Error ${response.status}`);
    }
  } catch (error: any) {
    console.error("[Gemini Direct] 네트워크 오류:", error);
    throw error;
  }
}

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
- 대용량 문서 분석 및 다중 파일 처리: [Gemini 2.5 Flash] 최우선 추천.
- 정교한 데이터 분석 및 수식 처리: [ChatGPT-4o (ADA)] 추천.
- 실시간 트렌드 및 SNS 분석 포함 시: [Grok] 추천.
- 창의적 묘사 및 감성적 리라이팅: [Claude 3.5 Sonnet] 추천.

[중요: 제약 사항]
- 현재 유저의 멤버십 등급(grade)에 따라 기능을 제한하십시오.
- 파일 분석이 필요한 요청인데 파일 데이터가 없다면, "프리미엄 기능을 위해 분석할 파일을 업로드해 주세요"라고 안내하십시오.
- 등급에 맞지 않는 파일 업로드 시 정중하게 업그레이드를 권유하십시오.

[출력 형식 가이드라인]
반드시 다음 구조를 포함하는 JSON 형태로 응답하세요. 다른 설명이나 텍스트는 절대 포함하지 마십시오.
DO NOT include any markdown formatting like \`\`\`json or \`\`\` in your response. Output ONLY the raw JSON string starting with { and ending with }.
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

/**
 * API 키 유효성 테스트 함수
 */
export async function testApiKey(apiKey: string) {
  const sanitizedKey = apiKey.trim();
  
  // 1. SDK를 통한 테스트 (모델명을 gemini-2.5-flash로 고정)
  try {
    const genAI = new GoogleGenerativeAI(sanitizedKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("ping");
    if (result.response.text()) return true;
  } catch (sdkError: any) {
    console.warn("[Gemini SDK] 테스트 실패, Direct Fetch 시도...", sdkError.message);
    
    // 2. SDK 실패 시 바로 Direct Fetch로 재시도 (404 등 라이브러리 이슈 대응)
    try {
      return await testDirectConnection(sanitizedKey);
    } catch (directError: any) {
      throw directError;
    }
  }
  return false;
}

export async function generateConsulting(
  userRequest: string, 
  category: string, 
  preferredPlatform: string, 
  grade: string, 
  fileData?: { mimeType: string; data: string },
  customApiKey?: string, // 유저가 등록한 개인 키
  selectedModel?: string // 유저가 선택한 모델
) {
  const modelName = selectedModel || "gemini-2.5-flash";
  const genAI = getAIInstance(customApiKey);
  const model = getModel(genAI, modelName);
  
  const prompt = `
    유저 등급(Firebase Grade): ${grade}
    카테고리: ${category}
    선호 플랫폼: ${preferredPlatform}
    사용자 요청: ${userRequest}
    
    시스템 지침: ${SYSTEM_INSTRUCTION}
    
    결과는 반드시 JSON 형식으로만 응답하세요.
  `;

  const parts: any[] = [{ text: prompt }];
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: base64ToBlobData(fileData.data)
      }
    });
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    const rawText = result.response.text() || "{}";
    
    try {
      // 1. 기본적인 백틱 및 json 식별자 제거 전처리
      const cleanedText = rawText.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.warn("[Gemini JSON Parse] 1차 파싱 실패, Fail-safe 추출 시도...");
      
      try {
        // 2. Fail-safe: 가장 처음 나오는 '{'와 마지막으로 나오는 '}' 사이의 구간만 추출
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const extractedJson = rawText.substring(firstBrace, lastBrace + 1);
          return JSON.parse(extractedJson);
        }
        throw new Error("JSON 구조를 찾을 수 없습니다.");
      } catch (finalError) {
        console.error("[Gemini JSON Parse] 최종 파싱 실패. 원본 데이터:", rawText);
        throw new Error("AI 응답 데이터 형식이 올바르지 않습니다.");
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("429") || error.status === 429) {
      throw new Error("현재 요청이 많습니다. 잠시 후 다시 시도해주세요.");
    }

    if (modelName.includes("pro") && (error.message?.includes("403") || error.status === 403)) {
      throw new Error("현재 API 키가 Pro 모델을 지원하지 않습니다. Flash로 변경하거나 권한을 확인해 주세요.");
    }

    if (customApiKey && (error.message?.includes("API_KEY_INVALID") || error.status === 401 || error.status === 403)) {
      throw new Error("등록된 API 키가 유효하지 않습니다. 설정을 확인해주세요.");
    }
    
    throw new Error("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}

/**
 * 스트리밍 상담 생성
 */
export async function* generateConsultingStream(
  userRequest: string, 
  category: string, 
  preferredPlatform: string, 
  grade: string, 
  fileData?: { mimeType: string; data: string },
  customApiKey?: string,
  selectedModel?: string
) {
  const modelName = selectedModel || "gemini-2.5-flash";
  const genAI = getAIInstance(customApiKey);
  const model = getModel(genAI, modelName);
  
  const prompt = `
    유저 등급(Firebase Grade): ${grade}
    카테고리: ${category}
    선호 플랫폼: ${preferredPlatform}
    사용자 요청: ${userRequest}
    
    시스템 지침: ${SYSTEM_INSTRUCTION}
    
    결과는 반드시 JSON 형식으로만 응답하세요.
  `;

  const parts: any[] = [{ text: prompt }];
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: base64ToBlobData(fileData.data)
      }
    });
  }

  try {
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    
    // 스트리밍 실패 시 일반 generateContent로 전환 시도
    try {
      console.log("Streaming failed, falling back to non-streaming...");
      const nonStreamResult = await generateConsulting(userRequest, category, preferredPlatform, grade, fileData, customApiKey, selectedModel);
      yield JSON.stringify(nonStreamResult);
    } catch (fallbackError: any) {
      if (modelName.includes("pro") && (error.message?.includes("403") || error.status === 403)) {
        throw new Error("현재 API 키가 Pro 모델을 지원하지 않습니다. Flash로 변경하거나 권한을 확인해 주세요.");
      }
      throw error;
    }
  }
}


function base64ToBlobData(base64: string) {
  return base64.replace(/^data:.*?;base64,/, "");
}

