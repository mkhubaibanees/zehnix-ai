import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure your API key is properly read from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
    try {
        const body = await req.json();
        const { messages, model } = body;

        // Map frontend roles to Gemini API strict requirements
        const formattedHistory = messages.slice(0, -1).map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
        }));

        const currentMessage = messages[messages.length - 1].content;

        // Dynamically fetch the current date to keep the AI updated
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Define the core instructions and personality for the AI
        const systemInstruction = `You are Zehnix AI, a helpful, professional, and smart assistant.
    Current Date: ${currentDate}
    
    Language & Communication Rules:
    1. DYNAMIC LANGUAGE MATCHING: You must detect and reply in the EXACT language the user is speaking. 
    2. If the user writes in English, reply STRICTLY in professional English.
    3. If the user writes in Roman Urdu/Hindi, reply naturally in Roman Urdu/Hindi.
    4. NEVER use Arabic, Urdu, or Devanagari scripts. If writing in Urdu or Hindi, strictly use the Roman alphabet (English letters).
    5. If asked about current events or dates, rely on the Current Date provided above to ground your answers.`;

        // Initialize the model with the system instructions
        const geminiModel = genAI.getGenerativeModel({
            model: model || "gemini-3.5-flash-lite",
            systemInstruction: systemInstruction,
        });

        const chat = geminiModel.startChat({
            history: formattedHistory,
        });

        const result = await chat.sendMessageStream(currentMessage);

        // Convert the Gemini stream to a standard web stream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        controller.enqueue(new TextEncoder().encode(chunkText));
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}