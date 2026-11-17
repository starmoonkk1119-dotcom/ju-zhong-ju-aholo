import "node:process";
import http from "node:http";

const port = Number(process.env.PORT || 8787);
const apiKey = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

const topicGuidance = {
  food: "长辈给玩家夹菜。玩家可能接受，也可能说吃饱了、不要了。拒绝后反馈应是多夹一块、劝多吃点和轻微的身体边界压力，不要恐怖化。",
  work: "饭桌询问工作。公务员、考公、考编、老师、教师、医生、国企等传统稳定职业更容易被接受；自由职业、独立创作、创业等答案触发对稳定性的闲话，但不要辱骂玩家。",
  marriage: "饭桌询问婚恋。还在考虑、正在了解、顺其自然等高情商回答暂时让话题平稳；丁克、不婚、同性伴侣等真实答案触发替玩家解释、劝说或闲话。不要把身份或选择写成错误。",
};

const systemPrompt = `你是一个卡通化3D互动故事中的饭桌对话导演。
故事主题是日常家庭饭局里的隐性社会压力，不是恐怖游戏，也不是说教。
你必须尊重玩家，不攻击任何性别、性取向、婚育选择或职业。
你只生成饭桌人物的自然、克制、略带压力的回应，不使用侮辱、仇恨、威胁、血腥或惊吓内容。
输出必须是严格JSON，不要Markdown，不要代码围栏：
{
  "label": "不超过10个字的状态标签",
  "npcLine": "不超过35个字的饭桌人物回应",
  "observation": "不超过55个字的玩家观察反馈",
  "gossip": "可选，不超过35个字；没有就空字符串",
  "pressure": 0到2之间的数字
}`;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function respondToPlayer(request, response) {
  const body = await readBody(request);
  const topic = body.topic || "food";
  const answer = String(body.answer || "").trim();

  if (!answer) {
    return sendJson(response, 400, { error: "answer is required" });
  }

  if (!apiKey) {
    return sendJson(response, 503, {
      error: "DEEPSEEK_API_KEY is not configured",
      fallback: true,
    });
  }

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `当前话题：${topicGuidance[topic] || topicGuidance.food}
玩家输入：${answer}
请判断这句话在饭桌上会造成怎样的轻微社会反馈，并严格按照JSON格式返回。`,
        },
      ],
      response_format: { type: "json_object" },
      thinking: { type: "disabled" },
      temperature: 0.6,
      max_tokens: 220,
    }),
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    return sendJson(response, upstream.status, {
      error: data.error?.message || "DeepSeek request failed",
    });
  }

  const content = data.choices?.[0]?.message?.content || "{}";
  let result;
  try {
    result = JSON.parse(content);
  } catch {
    return sendJson(response, 502, { error: "DeepSeek returned invalid JSON" });
  }

  return sendJson(response, 200, {
    label: String(result.label || "饭桌反应"),
    npcLine: String(result.npcLine || "大家停了一下，又继续吃饭。"),
    observation: String(result.observation || "你注意到，回答本身也会改变饭桌的空气。"),
    gossip: String(result.gossip || ""),
    pressure: Math.max(0, Math.min(2, Number(result.pressure) || 0)),
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    });
    return response.end();
  }

  if (request.method === "GET" && request.url === "/api/health") {
    return sendJson(response, 200, {
      ok: true,
      deepseekConfigured: Boolean(apiKey),
      model,
    });
  }

  if (request.method === "POST" && request.url === "/api/respond") {
    try {
      return await respondToPlayer(request, response);
    } catch (error) {
      return sendJson(response, 500, { error: error.message });
    }
  }

  return sendJson(response, 404, { error: "not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AI server listening on http://127.0.0.1:${port}`);
});
