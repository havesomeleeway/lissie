import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Aggregate conversation content
    const conversationContent = messages.map((msg) => msg.content).join('\n');

    // Prepare prompt for sentiment analysis
    const prompt = `
      Analyze the sentiment of the following conversation:
      ${conversationContent}

      Provide the following information:
      1. Overall Sentiment (Positive, Negative, Neutral): 
      2. A short summary of the conversation.
      3. Positive elements from the conversation (or "none identified").
      4. Negative elements from the conversation (or "none identified").
      5. Neutral elements from the conversation (or "none identified").
      6. Key themes identified in the conversation (or "none identified").

      Respond in JSON format with the keys: "overallSentiment", "summary", "positiveElements", "negativeElements", "neutralElements", "keyThemes".
    `;

    // Call OpenAI API to analyze sentiment
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    // Parse AI response
    const result = JSON.parse(response.choices[0].message.content);''

    console.log(result)

    // Return response
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error in sentiment analysis:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to analyze sentiment.' }), { status: 500 });
  }
}