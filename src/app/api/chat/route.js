import OpenAI from 'openai';
import { supabase } from "../../lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { messages, questionCount, topic } = await req.json();

  try {
    // Determine the phase based on questionCount
    const phase =
      questionCount <= 2
        ? "Exploration"
        : questionCount <= 5
        ? "Probing"
        : questionCount <=8
        "Reflection";

    // Phase-specific instruction for OpenAI
    let phaseInstruction =
    phase === "Exploration"
      ? "Ask a broad, open-ended question to set the context."
      : phase === "Probing"
      ? "Ask a specific question to dive deeper into the topic based on the user's responses."
      : phase === "Reflection"
      ? "Ask a reflective question to validate or expand on earlier responses."
      : "Default instruction if phase is not recognized."; // Optional fallback if phase doesn't match  

    // Generate the follow-up question
    const prompt = `
      You are a researcher asking a Singaporean 10 questions about the topic: "${topic}". 
      The user has already responded to some of your questions.

      Based on the user's previous responses:
      ${messages.map((msg) => `${msg.role}: ${msg.content}`).join("\n")}

      Phase: ${phase}.
      Instruction: ${phaseInstruction}.
      Please ask the next question. 
      
      Ensure that you are not asking the following:
      Leading questions
      Closed 'yes' or 'no' questions
      Double-barrelled questions, i.e. two questions in one

      
      Generate only one question at a time.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 150,
    });

    const question = response.choices[0]?.message?.content.trim() || "No question generated.";

    return Response.json({ result: question });
  } catch (error) {
    console.error("Error generating follow-up question:", error);
    return Response.json({ error: "Failed to generate question." }, { status: 500 });
  }
}
