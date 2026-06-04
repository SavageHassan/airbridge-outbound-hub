export interface IndustryStrategy {
  name: string;
  corePain: string;
  valueProp: string;
  offerStructure: string;
  keywords: string[];
}

export const GTM_PLAYBOOK: Record<string, IndustryStrategy> = {
  saas: {
    name: "SaaS / AI Startups",
    corePain: "LLM costs are scaling faster than revenue. Context window tax, model overkill, and a total lack of line-item cost attribution[cite: 1].",
    valueProp: "Position as an AI cost infrastructure specialist making AI products profitable[cite: 1]. Drop token costs by 40-70% in 48 hours without changing UX[cite: 1].",
    offerStructure: "Free 48-Hour LLM Cost Audit as a high-value entry point[cite: 1].",
    keywords: ["cto", "founder", "engineering", "ai", "ml", "saas", "software", "product manager"]
  },
  realestate: {
    name: "Real Estate",
    corePain: "Losing high-value leads due to slow follow-ups. Inbound queries go cold after 5 minutes; agents waste 40% of their day on manual tracking[cite: 1].",
    valueProp: "Automate lead routing and deliver instant AI follow-ups over SMS/WhatsApp within 60 seconds[cite: 1].",
    offerStructure: "14-Day AI Lead Automation Pilot for $2,500[cite: 1].",
    keywords: ["real estate", "broker", "realty", "property", "agency manager", "operations manager"]
  },
  healthcare: {
    name: "Healthcare",
    corePain: "Administrative overload draining clinic margins. Staff losing hours to manual scheduling, client documentation, and missed follow-up calls[cite: 1].",
    valueProp: "Automate patient communication journeys, scheduling sequences, and front-desk workflows[cite: 1].",
    offerStructure: "Patient Communication Automation Pilot starting at $3,500[cite: 1].",
    keywords: ["clinic", "practice manager", "healthcare", "telehealth", "medical", "doctor", "coo"]
  }
};

export function determineStrategy(jobTitle: string, biography: string): IndustryStrategy {
  const normalizedText = `${jobTitle} ${biography}`.toLowerCase();
  
  if (GTM_PLAYBOOK.healthcare.keywords.some(kw => normalizedText.includes(kw))) {
    return GTM_PLAYBOOK.healthcare;
  }
  if (GTM_PLAYBOOK.realestate.keywords.some(kw => normalizedText.includes(kw))) {
    return GTM_PLAYBOOK.realestate;
  }
  return GTM_PLAYBOOK.saas;
}