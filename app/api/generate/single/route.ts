import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApifyClient } from "apify-client";

const apifyClient = new ApifyClient({ token: process.env.APIFY_TOKEN });

export async function POST(req: NextRequest) {
  try {
    const { profileUrl, rawContent } = await req.json();

    if (!process.env.APIFY_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing APIFY_TOKEN key inside your env file." }), { status: 500 });
    }

    let scrapedDataPayload: any = null;

    // 1. Live Web Scrape using the working Zero-Cookie Apify Actor
    if (profileUrl && profileUrl.includes("linkedin.com")) {
      try {
        const run = await apifyClient.actor("atomus/linkedin-profile-scraper").call({
          profileUrls: [profileUrl]
        });

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
          scrapedDataPayload = items[0]; 
        } else {
          return new Response(
            JSON.stringify({ error: "Apify returned an empty dataset []. Please re-verify target link profile visibility." }), 
            { status: 500 }
          );
        }
      } catch (apifyError: any) {
        return new Response(JSON.stringify({ error: `Apify Cloud Execution Fault: ${apifyError.message}` }), { status: 500 });
      }
    }

    // Determine the active data stream context (Use scraped payload or fallback to manually pasted context text)
    const finalTargetContext = scrapedDataPayload 
      ? JSON.stringify(scrapedDataPayload, null, 2) 
      : (rawContent || "No target data stream or manual profile context provided.");

    // 2. HOOK-FIRST COGNITIVE PROMPT MATRIX (STRIPS AI FLUFF & FORCES STEP-BY-STEP LOGGING)
    const systemPrompt = `
      Role: You are an Elite Tier-1 B2B Cold Outreach Architect and Data Analyst running an advanced terminal analysis engine.
      
      Goal: Dissect the raw target profile context provided below, isolate the single most compelling and unique "Spike Point" (such as a recent custom post, a specific business strategy, an unorthodox career shift, or an operational problem they face), and generate a high-signal, peer-to-peer connection note.
      
      IRONCLAD RULE - BANNED AI-VIBE WORDS:
      Do NOT use any of the following robotic words or phrases: "blend", "truly", "inspiring", "fascinated", "impressive", "seamless", "delve", "dive deep", "testament", "adventures in tech", "journey", "valuable knowledge", "excited", "passionate", "pioneering", "more than just", "uncover", "look no further". Do NOT use generic openings like "I noticed your profile" or "Congrats on your background".

      TARGET PROFILE PAYLOAD DATA:
      \"\"\"
      ${finalTargetContext}
      \"\"\"

      OUTPUT STRUCTURE COMPLIANCE:
      You must return your complete response using the exact visual format below. Do not add markdown bold prefixes inside the pitch stream itself.

      [SYSTEM LOG: COGNITIVE HOOK ANALYSIS]
      ➔ TARGET IDENTIFIED: [Extract the prospect's actual core focus area, company, or technical title]
      ➔ ISOLATED SPIKE POINT: [Pinpoint the exact unique thing they talked about, posted, or executed from the data stream context]
      ➔ HOOK STRATEGY: [Explain in one short sentence why this point opens a natural peer-to-peer discussion]

      ========================================================================
      [PRECISION PEER PITCH STREAM]
      [Draft an ultra-casual, peer-to-peer message here. Speak like a real human being who is relaxed, down-to-earth, and directly messaging an industry peer. Keep it short and direct, around 3-4 sentences max. Start directly with "Hey [Name]," or "[Name] -". Drop all formal sign-offs like "Best regards" or "Sincerely". Just state the contextual spike point hook, tie it to a real-world technical or operational question, and leave it open.]
    `;

    // 3. Dual-Engine Failover Stream Execution
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const tokenStream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.2, // Kept low to keep analysis ultra-focused and prevent robotic hallucinations
          stream: true,
        });

        const responseStream = new ReadableStream({
          async start(controller) {
            for await (const chunk of tokenStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              controller.enqueue(new TextEncoder().encode(content));
            }
            controller.close();
          },
        });
        return new Response(responseStream, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
      } catch (e) {
        console.warn("Groq line limit reached; shifting processing task to Gemini...");
      }
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const resultStream = await model.generateContentStream(systemPrompt);

        const responseStream = new ReadableStream({
          async start(controller) {
            for await (const chunk of resultStream.stream) {
              const chunkText = chunk.text();
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
          },
        });
        return new Response(responseStream, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } });
      } catch (geminiError: any) {
        return new Response(JSON.stringify({ error: `Inference matrix failure: ${geminiError.message}` }), { status: 500 });
      }
    }

    return new Response(JSON.stringify({ error: "Missing configuration backend keys." }), { status: 500 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}