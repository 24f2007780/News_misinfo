const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || "openai"; // 'openai' or 'gemini'

    console.log(`🤖 AI Provider: ${this.provider}`);

    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log("✅ OpenAI initialized");
    } else {
      console.log("⚠️  OpenAI API key not found");
    }

    // Initialize Gemini
    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log("✅ Gemini initialized");
    } else {
      console.log("⚠️  Gemini API key not found");
    }

    // Warn if provider is not configured
    if (this.provider === "gemini" && !this.gemini) {
      console.error(
        '❌ ERROR: AI_PROVIDER is set to "gemini" but GEMINI_API_KEY is not configured!'
      );
      console.error("📝 Add GEMINI_API_KEY to your .env file");
      console.error(
        "🔗 Get free key at: https://makersuite.google.com/app/apikey"
      );
    } else if (this.provider === "openai" && !this.openai) {
      console.error(
        '❌ ERROR: AI_PROVIDER is set to "openai" but OPENAI_API_KEY is not configured!'
      );
    }
  }

  async chat(messages, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 1000,
      model = null,
      retries = 2,
    } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (this.provider === "gemini" && this.gemini) {
          console.log("🔵 Using Gemini API...");
          return await this.chatWithGemini(messages, {
            temperature,
            maxTokens,
            model,
          });
        } else if (this.provider === "openai" && this.openai) {
          console.log("🟢 Using OpenAI API...");
          return await this.chatWithOpenAI(messages, {
            temperature,
            maxTokens,
            model,
          });
        } else {
          const errorMsg = `AI provider ${
            this.provider
          } not configured. Please add ${
            this.provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"
          } to your .env file.`;
          console.error("❌", errorMsg);
          throw new Error(errorMsg);
        }
      } catch (error) {
        const isRateLimit =
          error.message?.includes("rate limit") ||
          error.message?.includes("resource_exhausted") ||
          error.message?.includes("429") ||
          error.status === 429;

        if (isRateLimit && attempt < retries) {
          const waitTime = (attempt + 1) * 2000; // 2s, 4s
          console.log(
            `⏳ Rate limited, waiting ${waitTime / 1000}s before retry ${
              attempt + 1
            }/${retries}...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        console.error(`❌ ${this.provider} error:`, error.message);

        // Try fallback to other provider
        if (this.provider === "openai" && this.gemini) {
          console.log("⚠️  Falling back to Gemini...");
          try {
            return await this.chatWithGemini(messages, {
              temperature,
              maxTokens,
              model,
            });
          } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError.message);
          }
        } else if (this.provider === "gemini" && this.openai) {
          console.log("⚠️  Falling back to OpenAI...");
          try {
            return await this.chatWithOpenAI(messages, {
              temperature,
              maxTokens,
              model,
            });
          } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError.message);
          }
        }

        throw error;
      }
    }
  }

  async chatWithOpenAI(messages, options) {
    const { temperature, maxTokens, model } = options;

    const completion = await this.openai.chat.completions.create({
      model: model || "gpt-4o-mini",
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return completion.choices[0].message.content;
  }

  async chatWithGemini(messages, options) {
    const { temperature, maxTokens, model } = options;

    // Use fastest model first for quick responses
    const modelsToTry = [model || "gemini-2.5-flash", "gemini-2.0-flash"];

    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const geminiModel = this.gemini.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens || 2000, // Limit output for faster responses
          },
        });

        return await this._executeGeminiChat(geminiModel, messages);
      } catch (error) {
        console.log(`⚠️  ${modelName} failed: ${error.message}`);
        lastError = error;

        // Don't wait between models, try next immediately
        continue;
      }
    }

    throw lastError;
  }

  async _executeGeminiChat(geminiModel, messages) {
    // Build conversation history for Gemini
    const systemMessage =
      messages.find((m) => m.role === "system")?.content || "";
    const conversationMessages = messages.filter((m) => m.role !== "system");

    // Convert to Gemini format
    const history = [];
    for (let i = 0; i < conversationMessages.length - 1; i++) {
      const msg = conversationMessages[i];
      history.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Get the last user message
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const prompt = systemMessage
      ? `${systemMessage}\n\nUser: ${lastMessage.content}`
      : lastMessage.content;

    // Start chat with history
    const chat = geminiModel.startChat({ history });
    const result = await chat.sendMessage(prompt);

    return result.response.text();
  }

  async generateJSON(messages, options = {}) {
    const { temperature = 0.7, model = null } = options;

    try {
      if (this.provider === "openai" && this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: model || "gpt-4o-mini",
          messages,
          temperature,
          response_format: { type: "json_object" },
        });
        return JSON.parse(completion.choices[0].message.content);
      } else if (this.provider === "gemini" && this.gemini) {
        // Gemini doesn't have native JSON mode, so we add it to the prompt
        const lastMessage = messages[messages.length - 1];
        messages[messages.length - 1] = {
          ...lastMessage,
          content: `${lastMessage.content}\n\nIMPORTANT: Return ONLY valid JSON, no other text.`,
        };

        const response = await this.chatWithGemini(messages, {
          temperature,
          model,
        });
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
      }
    } catch (error) {
      console.error("JSON generation error:", error);
      return null;
    }
  }

  getProvider() {
    return this.provider;
  }

  isConfigured() {
    if (this.provider === "openai") {
      return !!this.openai;
    } else if (this.provider === "gemini") {
      return !!this.gemini;
    }
    return false;
  }
}

// Singleton instance
let aiServiceInstance = null;

function getAIService() {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

module.exports = { AIService, getAIService };
