/**
 * Unified Client-Side Gemini AI Service
 * Supports:
 * 1. Direct Google Gemini REST API using user-configured API key (Mandatory for Android APK)
 * 2. Automatic fallback to local server /api/ai proxy when running on dev/web server
 * 3. Instant API key validation and connectivity test
 */

export const GEMINI_API_KEY_STORAGE = 'pydroid_gemini_api_key';

/**
 * Danh sách model thử lần lượt. Nếu model đầu không còn (lỗi 404 / "no longer available")
 * thì tự động thử model kế tiếp. Có thể đổi/thêm tên model ở đây khi Google ngừng model cũ.
 */
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];

type GeminiResult = { ok: boolean; status: number; data: any; model: string };

async function geminiGenerate(apiKey: string, body: unknown): Promise<GeminiResult> {
  let last: GeminiResult = { ok: false, status: 0, data: {}, model: '' };
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    last = { ok: res.ok, status: res.status, data, model };
    if (res.ok) return last;

    const msg = String(data?.error?.message || '').toLowerCase();
    const modelUnavailable =
      res.status === 404 ||
      msg.includes('no longer available') ||
      msg.includes('is not found') ||
      msg.includes('not supported for generatecontent');
    if (!modelUnavailable) return last; // lỗi khác (khóa sai, hết hạn mức...) thì dừng luôn
  }
  return last;
}

function extractText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p: any) => typeof p?.text === 'string' && !p?.thought)
    .map((p: any) => p.text)
    .join('');
}

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
  } catch (_) {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    const clean = key.trim();
    if (clean) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, clean);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    }
  } catch (_) {}
}

export function removeStoredApiKey(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
  } catch (_) {}
}

/**
 * Test connectivity and validity of a Gemini API key
 */
export async function testGeminiApiKey(apiKey: string): Promise<{ ok: boolean; message: string; model?: string }> {
  const clean = apiKey.trim();
  if (!clean) {
    return { ok: false, message: 'Vui lòng nhập API Key để kiểm tra.' };
  }

  try {
    const r = await geminiGenerate(clean, {
      contents: [{ parts: [{ text: 'Ping' }] }],
    });

    if (!r.ok) {
      const errMsg = r.data?.error?.message || `Lỗi HTTP ${r.status}`;
      const low = String(errMsg).toLowerCase();
      if (low.includes('api_key_invalid') || low.includes('key not valid')) {
        return { ok: false, message: 'Khóa API không hợp lệ. Vui lòng kiểm tra lại mã khóa từ Google AI Studio.' };
      }
      return { ok: false, message: `Lỗi kết nối Gemini (${r.model || 'không rõ model'}, mã ${r.status}): ${errMsg}` };
    }

    return {
      ok: true,
      message: `Kết nối thành công! Khóa API hợp lệ, đang dùng model ${r.model}.`,
      model: r.model,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Không thể kết nối đến máy chủ Google Gemini: ${err.message || String(err)}`,
    };
  }
}

/**
 * Client-Side AI Assistant Chat (supports streaming / direct response)
 */
export async function sendGeminiChat(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  customPrompt?: string
): Promise<string> {
  const apiKey = getStoredApiKey();

  // If user provided a key, call Google Gemini directly (Works in APK standalone!)
  if (apiKey) {
    const formattedContents = messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (customPrompt) {
      formattedContents.push({
        role: 'user',
        parts: [{ text: customPrompt }],
      });
    }

    const r = await geminiGenerate(apiKey, {
      systemInstruction: {
        parts: [
          {
            text: 'Bạn là Pydroid AI Assistant - Trợ lý gia sư lập trình Python chuyên nghiệp cho người dùng trên điện thoại di động Android. Trả lời bằng tiếng Việt thân thiện, súc tích, giải thích rõ ràng và cung cấp mã nguồn Python chuẩn PEP 8.',
          },
        ],
      },
      contents: formattedContents,
    });

    if (!r.ok) {
      throw new Error(r.data?.error?.message || `Lỗi Gemini API: ${r.status}`);
    }

    const text = extractText(r.data);
    if (!text) {
      throw new Error('Gemini không phản hồi văn bản.');
    }
    return text;
  }

  // Fallback to server proxy route when running on Web / Dev Server
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, prompt: customPrompt }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Vui lòng nhập API Key Gemini trong mục Cài đặt (Bánh răng ⚙️) để sử dụng tính năng này trên APK Android.');
  }

  const data = await res.json();
  return data.text || '';
}

/**
 * Client-Side AI Code Debugger
 */
export async function sendGeminiDebug(code: string, errorText: string): Promise<any> {
  const apiKey = getStoredApiKey();

  if (apiKey) {
    const prompt = `Phân tích lỗi Python sau và sửa mã nguồn hoàn chỉnh:
MÃ PYTHON:
\`\`\`python
${code}
\`\`\`

THÔNG BÁO LỖI:
${errorText || 'Không có log lỗi cụ thể, hãy phân tích logic hoặc cú pháp tiềm ẩn.'}

Yêu cầu trả về đúng định dạng JSON:
{
  "errorType": "Tên loại lỗi (SyntaxError, NameError, Logic...)",
  "vietnameseSummary": "Tóm tắt ngắn gọn lỗi bằng tiếng Việt (1 câu)",
  "rootCause": "Nguyên nhân gốc rễ và dòng lỗi",
  "tips": ["Mẹo 1", "Mẹo 2"],
  "fixedCode": "Toàn bộ mã Python đã sửa chuẩn PEP 8",
  "diffExplanation": "Giải thích ngắn các điểm đã sửa"
}`;

    const r = await geminiGenerate(apiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    if (!r.ok) {
      throw new Error(r.data?.error?.message || `Lỗi Gemini API: ${r.status}`);
    }

    const rawText = extractText(r.data);
    if (!rawText) throw new Error('Không nhận được dữ liệu phân tích từ Gemini.');
    return JSON.parse(rawText);
  }

  // Fallback to server proxy
  const res = await fetch('/api/ai/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, errorText }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Vui lòng nhập API Key Gemini trong mục Cài đặt (Bánh răng ⚙️) để sử dụng tính năng sửa lỗi trên APK Android.');
  }
  return data;
}

/**
 * Client-Side Lesson Generator
 */
export async function sendGeminiLessons(topic: string, level: string = 'cơ bản'): Promise<any> {
  const apiKey = getStoredApiKey();

  if (apiKey) {
    const prompt = `Tạo danh sách 3 bài tập lập trình Python về chủ đề "${topic}" với cấp độ "${level}".
Trả về đúng định dạng JSON danh sách mảng:
[
  {
    "title": "Tiêu đề bài tập ngắn",
    "description": "Mô tả yêu cầu chi tiết",
    "level": "basic" | "intermediate" | "advanced",
    "starterCode": "Mã Python gợi ý khung",
    "solutionCode": "Mã Python giải hoàn chỉnh",
    "explanation": "Giải thích chi tiết thuật toán",
    "sampleInput": "Dữ liệu nhập mẫu nếu có",
    "sampleOutput": "Kết quả in ra mong đợi"
  }
]`;

    const r = await geminiGenerate(apiKey, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    if (!r.ok) {
      throw new Error(r.data?.error?.message || `Lỗi Gemini API: ${r.status}`);
    }

    const rawText = extractText(r.data);
    if (!rawText) throw new Error('Không nhận được phản hồi bài tập từ Gemini.');
    return JSON.parse(rawText);
  }

  // Fallback to server
  const res = await fetch('/api/ai/generate-lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, level }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Vui lòng nhập API Key Gemini trong mục Cài đặt (Bánh răng ⚙️) để tạo bài học trên APK Android.');
  }
  return data.lessons || [];
}
