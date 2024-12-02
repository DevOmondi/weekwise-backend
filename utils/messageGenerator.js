const OpenAI = require("openai");

class MessageGenerator {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.tokenBucket = { tokens: 10000, lastRefill: Date.now(), refillRate: 1000 };
    this.fallbackTemplates = {
      encouraging: ["You're off to a great start! Keep going, and you'll reach your goal in no time."],
      analytical: ["Studies show consistent effort leads to success. You're on the right track!"],
    };
  }

  async waitForTokens(requiredTokens) {
    while (this.tokenBucket.tokens < requiredTokens) {
      const now = Date.now();
      const elapsedTime = (now - this.tokenBucket.lastRefill) / 1000;
      this.tokenBucket.tokens += elapsedTime * this.tokenBucket.refillRate;
      this.tokenBucket.tokens = Math.min(this.tokenBucket.tokens, 10000);
      this.tokenBucket.lastRefill = now;

      if (this.tokenBucket.tokens < requiredTokens) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    this.tokenBucket.tokens -= requiredTokens;
  }

  async generateMessage(context, index) {
    try {
      await this.waitForTokens(100); // Adjust tokens required per API call
      const systemPrompt = this.createSystemPrompt(context, index);
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate Week ${index + 1}'s message for ${context.userName}, who wants to ${context.goal}.` },
        ],
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error generating message:", error);
      return this.generateFallbackMessage(context, index);
    }
  }

  async generateAllMessages(context) {
    const batchSize = 12; 
    const messages = [];

    for (let i = 0; i < 52; i += batchSize) {
      const batchPromises = Array.from({ length: batchSize }, (_, index) => {
        const actualIndex = i + index;
        return actualIndex < 52
          ? this.generateMessage(context, actualIndex)
          : null;
      }).filter(Boolean);

      const batchMessages = await Promise.all(batchPromises);
      messages.push(...batchMessages);
    }

    return messages;
  }

  generateFallbackMessage(context, index) {
    const style = this.getMessageStyle(index);
    const templates = this.fallbackTemplates[style] || [];
    return templates.length > 0
      ? templates[index % templates.length]
      : "Keep going! You're doing great.";
  }

  createSystemPrompt(context, index) {
    const phase = this.getWeekPhase(index);
    const style = this.getMessageStyle(index);
    const weekNumber = index + 1;

    return `You are a supportive coach for Weekwise. 
    Week: ${weekNumber}, Goal: ${context.goal}, Phase: ${phase}, Style: ${style}`;
  }

  getWeekPhase(index) {
    const weekNumber = index + 1;
    if (weekNumber <= 4) return "initial";
    if (weekNumber <= 12) return "building";
    if (weekNumber <= 36) return "maintaining";
    if (weekNumber <= 48) return "accelerating";
    return "concluding";
  }

  getMessageStyle(index) {
    const styles = ["encouraging", "analytical", "storytelling", "humorous", "challenging", "reflective"];
    return styles[index % styles.length];
  }
}

const messageGenerator = new MessageGenerator();

async function generateAllMessagesHandler(context) {
  return await messageGenerator.generateAllMessages(context);
}

module.exports = generateAllMessagesHandler;

// const OpenAI = require("openai");

// class MessageGenerator {
//   constructor() {
//     this.openai = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//   }

//   getWeekPhase(index) {
//     const weekNumber = index + 1; // Convert index to 1-based week number
//     if (weekNumber <= 4) return "initial";
//     if (weekNumber <= 12) return "building";
//     if (weekNumber <= 36) return "maintaining";
//     if (weekNumber <= 48) return "accelerating";
//     return "concluding";
//   }

//   getMessageStyle(index) {
//     const styles = [
//       "encouraging",
//       "analytical",
//       "storytelling",
//       "humorous",
//       "challenging",
//       "reflective",
//     ];
//     return styles[index % styles.length]; // Cycle through styles
//   }

//   async generateMessage(context, index) {
//     const phase = this.getWeekPhase(index);
//     const style = this.getMessageStyle(index);
//     const weekNumber = index + 1;

//     const systemPrompt = `You are a supportive wellness coach and behavioral change expert at Weekwise, known for creating personalized, encouraging messages that combine empathy, expertise, and practical guidance.

// KEY CONTEXT:
// - This is Week ${weekNumber} of 52 in ${context.userName}'s journey
// - Their goal: ${context.goal}
// - Current phase: ${phase}
// - ${context.similarGoalUsers} others are working on similar goals
// - This week's message style: ${style}

// ${this.getPhaseGuidance(phase)}
// ${this.getStyleGuidance(style)}

// Write a message that embodies all these elements while feeling natural and personally crafted for ${
//       context.userName
//     }.`;

//     const completion = await this.openai.chat.completions.create({
//       model: "gpt-4",
//       messages: [
//         { role: "system", content: systemPrompt },
//         {
//           role: "user",
//           content: `Generate Week ${weekNumber}'s message for ${context.userName}, who wants to ${context.goal}.`,
//         },
//       ],
//       temperature: 0.7,
//     });

//     return completion.choices[0].message.content;
//   }

//   // async generateAllMessages(context) {
//   //   const messages = [];

//   //   for (let i = 0; i < 52; i++) {
//   //     const message = await this.generateMessage(context, i);
//   //     messages.push(message);
//   //   }

//   //   return messages;
//   // }

//   async generateAllMessages(context, batchSize = 10) {
//     const messages = [];

//     for (let i = 0; i < 52; i += batchSize) {
//       const batchPromises = Array.from({ length: batchSize }, (_, index) => {
//         const actualIndex = i + index;
//         return actualIndex < 52
//           ? this.generateMessage(context, actualIndex)
//           : null;
//       }).filter(Boolean);

//       const batchMessages = await Promise.all(batchPromises);
//       messages.push(...batchMessages);
//     }

//     return messages;
//   }

//   getPhaseGuidance(phase) {
//     const phaseGuidance = {
//       initial: `EARLY PHASE (Weeks 1-4): Focus on small, achievable wins.`,
//       building: `BUILDING PHASE (Weeks 5-12): Deepen habit formation.`,
//       maintaining: `MAINTAINING PHASE (Weeks 13-36): Focus on consistency over intensity.`,
//       accelerating: `ACCELERATION PHASE (Weeks 37-48): Push comfortable boundaries.`,
//       concluding: `CONCLUDING PHASE (Weeks 49-52): Celebrate progress and growth.`,
//     };
//     return phaseGuidance[phase];
//   }

//   getStyleGuidance(style) {
//     const styleGuidance = {
//       encouraging: `Encouraging Style: Emphasize progress and potential.`,
//       analytical: `Analytical Style: Share relevant research insights.`,
//       storytelling: `Storytelling Style: Share relevant success stories.`,
//       humorous: `Humorous Style: Use gentle, appropriate humor.`,
//       challenging: `Challenging Style: Present thoughtful stretch goals.`,
//       reflective: `Reflective Style: Encourage self-examination.`,
//     };
//     return styleGuidance[style];
//   }
// }

// module.exports = new MessageGenerator();

// const OpenAI = require('openai');

// class MessageGenerator {
//   constructor() {
//     this.openai = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//   }

//   getWeekPhase(weekNumber) {
//     if (weekNumber <= 4) return 'initial';
//     if (weekNumber <= 12) return 'building';
//     if (weekNumber <= 36) return 'maintaining';
//     if (weekNumber <= 48) return 'accelerating';
//     return 'concluding';
//   }

//   getMessageStyle(weekNumber) {
//     const styles = [
//       'encouraging', 'analytical', 'storytelling',
//       'humorous', 'challenging', 'reflective'
//     ];
//     return styles[weekNumber % styles.length];
//   }

//   async generateMessage(context) {
//     const phase = this.getWeekPhase(context.weekNumber);
//     const style = this.getMessageStyle(context.weekNumber);

//     const systemPrompt = `You are a supportive wellness coach and behavioral change expert at Weekwise, known for creating personalized, encouraging messages that combine empathy, expertise, and practical guidance.

// KEY CONTEXT:
// - This is Week ${context.weekNumber} of 52 in ${context.userName}'s journey
// - Their goal: ${context.goal}
// - Current phase: ${phase}
// - ${context.similarGoalUsers} others are working on similar goals
// - This week's message style: ${style}

// PSYCHOLOGICAL FRAMEWORK:
// 1. Self-Determination Theory: Support autonomy, competence, and relatedness
// 2. Growth Mindset: Emphasize learning and progress over perfection
// 3. Implementation Intentions: Help bridge intention-action gap
// 4. Social Proof: Leverage community progress appropriately
// 5. Behavioral Activation: Focus on small, achievable actions

// PHASE-SPECIFIC GUIDANCE:
// ${this.getPhaseGuidance(phase)}

// STYLE GUIDANCE:
// ${this.getStyleGuidance(style)}

// SUBJECT LINE REQUIREMENTS:
// - Keep it personal yet intriguing
// - Reflect the week's message style and phase
// - Use action words and emotional appeal
// - Length: 3-7 words
// - Examples based on styles:
//   - Encouraging: "Your Yoga Journey Begins Today! 🌟"
//   - Analytical: "The Science Behind Your First Steps 📊"
//   - Storytelling: "Time to Write Your Yoga Story 📖"
//   - Humorous: "Ready to Get Bendy? Let's Go! 🧘‍♂️"
//   - Challenging: "Your Week 1 Challenge Awaits 💪"
//   - Reflective: "Your Path to Flexibility Starts Here ✨"

// STRUCTURAL REQUIREMENTS:
// 1. Opening: Personal, acknowledging recent progress or challenges
// 2. Body: One clear, actionable insight or technique
// 3. Social Element: Meaningful community connection
// 4. Closing: Forward-looking encouragement
// 5. Length: 150-200 words maximum
// 6. Signature: Close with "Your friends at Weekwise" instead of a personal signature

// FORMATTING REQUIREMENTS:
// - Use clear paragraph breaks for readability
// - Each main point gets its own paragraph
// - Maximum 2-3 sentences per paragraph
// - Add spacing between greeting, body, and closing
// - Use appropriate emoji sparingly for visual appeal

// TONE REQUIREMENTS:
// - Write as if you're a trusted mentor who deeply cares
// - Be conversational yet professional
// - Show genuine understanding of their journey
// - Maintain optimism while acknowledging challenges

// ESSENTIAL ELEMENTS:
// - Include one specific action for this week
// - Reference their specific goal naturally
// - Add a touch of behavioral psychology insight
// - Ensure message feels fresh and unique

// MANDATORY EXCLUSIONS:
// - No generic motivational quotes
// - No repetition from previous weeks
// - No overwhelming list of tasks
// - No dismissive positivity
// - No rigid prescriptions
// - No customer support references or directions

// Write a message that embodies all these elements while feeling natural and personally crafted for ${context.userName}.`;

//     const completion = await this.openai.chat.completions.create({
//       model: "gpt-4",
//       messages: [
//         { role: "system", content: systemPrompt },
//         { role: "user", content: `Generate Week ${context.weekNumber}'s message for ${context.userName}, who wants to ${context.goal}.` }
//       ],
//       temperature: 0.7,
//     });

//     return completion.choices[0].message.content;
//   }

//   getPhaseGuidance(phase) {
//     const phaseGuidance = {
//       initial: `EARLY PHASE (Weeks 1-4):
// - Build foundation of trust and momentum
// - Focus on small, achievable wins
// - Establish basic routines
// - Emphasize commitment over perfection
// - Help identify environmental supports`,

//       building: `BUILDING PHASE (Weeks 5-12):
// - Deepen habit formation
// - Introduce more challenging concepts
// - Address common obstacles
// - Build self-efficacy
// - Strengthen internal motivation`,

//       maintaining: `MAINTAINING PHASE (Weeks 13-36):
// - Focus on consistency over intensity
// - Address plateau feelings
// - Introduce variety and challenges
// - Deepen psychological insights
// - Celebrate accumulated progress`,

//       accelerating: `ACCELERATION PHASE (Weeks 37-48):
// - Push comfortable boundaries
// - Introduce advanced strategies
// - Connect short-term actions to long-term vision
// - Prepare for ongoing independence
// - Build resilience against setbacks`,

//       concluding: `CONCLUDING PHASE (Weeks 49-52):
// - Celebrate progress and growth
// - Solidify sustainable practices
// - Build confidence in continued progress
// - Prepare for independent journey
// - Reflect on transformation`
//     };

//     return phaseGuidance[phase];
//   }

//   getStyleGuidance(style) {
//     const styleGuidance = {
//       encouraging: `ENCOURAGING STYLE:
// - Emphasize progress and potential
// - Use warm, supportive language
// - Focus on personal growth
// - Acknowledge effort and resilience`,

//       analytical: `ANALYTICAL STYLE:
// - Share relevant research insight
// - Break down behavioral patterns
// - Explain psychological principles
// - Use data and evidence thoughtfully`,

//       storytelling: `STORYTELLING STYLE:
// - Share relevant success story
// - Use metaphors and analogies
// - Create vivid mental images
// - Connect narrative to their journey`,

//       humorous: `HUMOROUS STYLE:
// - Use gentle, appropriate humor
// - Keep tone light while respectful
// - Include playful analogies
// - Maintain professional boundaries`,

//       challenging: `CHALLENGING STYLE:
// - Present thoughtful stretch goals
// - Question limiting beliefs
// - Encourage stepping out of comfort zone
// - Maintain supportive tone`,

//       reflective: `REFLECTIVE STYLE:
// - Encourage self-examination
// - Ask thought-provoking questions
// - Foster deeper awareness
// - Guide meaningful introspection`
//     };

//     return styleGuidance[style];
//   }
// }

// module.exports = new MessageGenerator();
