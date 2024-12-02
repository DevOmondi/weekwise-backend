const OpenAI = require('openai');

class TrialMessageGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateTrialMessage(context) {
    const trialSystemPrompt = `You are an expert AI coach creating a personalized trial message to demonstrate the value of a year-long coaching service. Your goal is to create one compelling message that showcases the potential of ongoing support.

CONTEXT:
- User Name: ${context.userName}
- User Goal: ${context.goal}
- Purpose: Demonstrate value and encourage full subscription

MESSAGE STRUCTURE:
1. Opening: Address the user directly by their name and acknowledge their goal.
2. Core: Provide one powerful, immediately actionable insight customized to their goal.
3. Community: Mention how others with similar goals benefit.
4. Future Hook: Offer a subtle hint at the journey ahead.

REQUIREMENTS:
- Write the entire message in plain text suitable for direct use in an email body.
- Begin with "Dear [userName]," as the first line.
- Length: 100-150 words.
- Sign as "Your coach".
- Focus on one specific, achievable action.
- Use psychology principles (Growth Mindset/Implementation Intentions).
- Maintain a warm, personal tone while being direct.
- End with subtle forward momentum and a call to action, encouraging them to look forward to the journey.

FORMAT:
Do NOT include a subject line or any JSON formatting. Return only the plain text message starting with "Dear [userName],".

TONE:
- Professional yet conversational.
- Insightful but accessible.
- Encouraging without being pushy.
- Show expertise through specificity.

Write a message that embodies all these elements while feeling natural and personally crafted for ${context.userName}.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: trialSystemPrompt },
        {
          role: "user",
          content: `Create a trial email message for ${context.userName} who wants to ${context.goal}.`,
        },
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content;
  }
}

module.exports = new TrialMessageGenerator();
