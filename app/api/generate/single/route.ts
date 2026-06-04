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

    // 2. CASUAL, NO-AI-VIBE HUMANIZED PROMPT MATRIX
    const systemPrompt = `
      Role: You are a senior engineer and technical architect sending a quick, casual, peer-to-peer connection note on LinkedIn to another developer or tech operator.
      
      Goal: 
      Write exactly 1 short, ultra-casual message (around 3-4 sentences max, well under 1500 characters). Speak like a real human being who is relaxed, down-to-earth, and directly messaging a peer. Completely strip away all fake sales enthusiasm, marketing pitches, or formal corporate networking fluff.

      IRONCLAD RULE - BANNED AI-VIBE WORDS:
      Do NOT use any of the following robotic words or phrases: "blend", "truly", "inspiring", "fascinated", "impressive", "seamless", "delve", "dive deep", "testament", "adventures in tech", "journey", "valuable knowledge", "excited", "passionate", "pioneering", "more than just", "uncover", "look no further".

      CONTEXT & SCRAPED DATA ENRICHMENT OBJECT (RAW DATA INTAKE):
      \"\"\"
      ${JSON.stringify(scrapedDataPayload, null, 2)}
      \"\"\"

      INSTRUCTIONS FOR HUMAN TONE:
      1. Casual Opening: Start simply with "Hey [Name]," or just "[Name] -". No over-the-top pleasantries.
      2. Casual Background Reference: Reference a real detail from their background text object (like shifting from one domain to another, or working on frontend/AI at their specific company) but say it plainly. (e.g., "Saw you moved from chemistry over to building frontends at Calda.")
      3. Ask an Honest Technical Question: Pose a low-key, real-world question about what they are dealing with operationally. Skip corporate jargon. (e.g., "Curious how you guys are handling infrastructure costs with all the new LLM components or token spikes?")
      4. Low-Pressure Signoff: End with a simple invite to connect or exchange ideas over a chat. Do not sound desperate or pitch services. (e.g., "Down to connect and talk shop sometime if you're open to it.")
      5. Strict Length Check: Keep it concise. Real people write short messages. No headers, no markdown bolding templates inside the text, and no meta labels. Output the raw text message only.
    `;

    // 3. Dual-Engine Failover Stream Execution
    if (process.env.GROQ_API_KEY) {
      try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const tokenStream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemPrompt }],
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