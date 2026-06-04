"use client";
import React, { useState, useEffect, useRef } from "react";

// Massive pool of over 40 distinct tech, engineering, and leadership mindset quotes
const MINDSET_QUOTES = [
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Make it simple, but significant.", author: "Don Draper" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "Move fast and break things. If you are not breaking things, you are not moving fast enough.", author: "Mark Zuckerberg" },
  { text: "Quality means doing it right when no one is looking.", author: "Henry Ford" },
  { text: "The clear line between engineering and art is elegant execution.", author: "Systems Architect" },
  { text: "Be miserable. Or motivate yourself. Whatever has to be done, it's always your choice.", author: "Wayne Dyer" },
  { text: "The cross-section of data and stubborn persistence is where products win.", author: "Founder Logic" },
  { text: "Premature optimization is the root of all evil.", author: "Donald Knuth" },
  { text: "Software is a great combination between artistry and engineering.", author: "Bill Gates" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "The values of an architectural layer depend entirely on structural integrity.", author: "Dev Blueprint" },
  { text: "It’s not a faith in technology. It’s faith in people.", author: "Steve Jobs" },
  { text: "The critical factor in scaling systems is minimizing cognitive overhead.", author: "Principal Engineer" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "If you cannot measure it, you cannot improve it.", author: "Lord Kelvin" },
  { text: "Code never lies, comments sometimes do.", author: "Ron Jeffries" },
  { text: "A user interface is like a joke. If you have to explain it, it’s not that good.", author: "Martin LeBlanc" },
  { text: "Choose a job you love, and you will never have to work a day in your life.", author: "Confucius" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The metric that matters most is time to value.", author: "Product Strategy" },
  { text: "Do not compromise on the margins of performance.", author: "Infrastructure Core" },
  { text: "Optimism is the faith that leads to achievement.", author: "Helen Keller" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "The true measure of an elite tool is how cleanly it vanishes into your workflow.", author: "UX Principle" },
  { text: "Keep your eyes on the stars, and your feet on the ground.", author: "Theodore Roosevelt" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "An unexamined bottleneck will multiply across production pipelines.", author: "Site Reliability Log" },
  { text: "Nurture your mind with great thoughts, for you will never go any higher than you think.", author: "Benjamin Disraeli" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Complex systems evolve from functional simple architectures.", author: "Gall's Law" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" }
];

export default function AirbridgeDashboard() {
  const [currentQuote, setCurrentQuote] = useState({ text: "", author: "" });
  const [isSliding, setIsSliding] = useState(false);
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);
  
  // Intake State Structures
  const [profileUrl, setProfileUrl] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemFault, setSystemFault] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MINDSET_QUOTES.length);
    setCurrentQuote(MINDSET_QUOTES[randomIndex]);

    // 3-Second crisp quote presentation window
    const startSlideTimeout = setTimeout(() => {
      setIsSliding(true);
    }, 3000);

    const completeRevealTimeout = setTimeout(() => {
      setIsFullyRevealed(true);
    }, 4000);

    return () => {
      clearTimeout(startSlideTimeout);
      clearTimeout(completeRevealTimeout);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      // Optional: Automatically extract data parameters or feed context log notices
      console.log(`Target CSV mapped successfully: ${file.name}`);
    }
  };

  const triggerFileSelection = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSystemFault(null);
    setGeneratedOutput("");

    try {
      const response = await fetch("/api/generate/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl, rawContent }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Server pipeline execution fault encountered.";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText.length > 250 ? `${errorText.substring(0, 250)}... [HTML Stack trace]` : errorText;
        }
        throw new Error(errorMessage);
      }

      if (!response.body) throw new Error("Readable stream not supported by engine endpoint.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value);
        setGeneratedOutput((prev) => prev + chunkText);
      }
    } catch (err: any) {
      setSystemFault(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-neutral-200 selection:text-neutral-900 antialiased overflow-x-hidden transition-colors duration-300">
      
      {/* ==================== STARK WHITE BI-DIRECTIONAL SPLIT OVERLAY ==================== */}
      {!isFullyRevealed && (
        <div className="fixed inset-0 z-50 flex pointer-events-none select-none">
          {/* Left Panel */}
          <div 
            className={`w-1/2 h-full bg-white border-r border-neutral-200 transition-transform duration-[1000ms] ease-in-out transform pointer-events-auto ${
              isSliding ? "-translate-x-full" : "translate-x-0"
            }`} 
          />
          {/* Right Panel */}
          <div 
            className={`w-1/2 h-full bg-white border-l border-neutral-200 transition-transform duration-[1000ms] ease-in-out transform pointer-events-auto ${
              isSliding ? "translate-x-full" : "translate-x-0"
            }`} 
          />
          
          {/* Central Quote Vector */}
          <div 
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-500 ease-out ${
              isSliding ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="max-w-xl space-y-5">
              <span className="text-[10px] tracking-[0.35em] text-neutral-400 uppercase font-mono block">
                SYSTEM INTAKE // LOGGING ENGINE DATA
              </span>
              <p className="text-xl md:text-2xl text-neutral-800 font-light italic leading-relaxed">
                "{currentQuote.text}"
              </p>
              <p className="text-xs tracking-wider text-neutral-500 font-mono">
                — {currentQuote.author}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CONTROL INTERFACE LAYOUT HUB (LIGHT MODE) ==================== */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-20">
        
        {/* Navigation / Header Ribbon */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-neutral-200 rounded-none shadow-sm space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-neutral-900 animate-pulse rounded-none" />
            <h1 className="text-xs font-mono tracking-[0.25em] text-neutral-800 uppercase font-bold">
              AIRBRIDGE OUTBOUND OPTIMIZATION HUB
            </h1>
          </div>
          <div className="flex items-center space-x-2 border border-neutral-200 bg-neutral-50 px-3 py-1 font-mono text-[10px] text-neutral-500 rounded-none">
            <span className="text-neutral-400">ENGINE STATUS:</span>
            <span className="text-neutral-900 uppercase tracking-wider font-bold">ACTIVE</span>
          </div>
        </header>

        {/* Workspace Matrix Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Input Control Configuration Column */}
          <form onSubmit={handleGenerate} className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-neutral-200 p-6 space-y-5 rounded-none shadow-sm">
              
              <div className="flex items-center space-x-2 pb-2 border-b border-neutral-100">
                <span className="font-mono text-xs text-neutral-500 font-bold">⚡ LEAD DATA INTAKE CONFIGURATION</span>
              </div>

              {/* LinkedIn URL Input Parameter */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono tracking-wider text-neutral-500 uppercase font-medium">
                  Target Profile Link (LinkedIn URL)
                </label>
                <input 
                  type="url"
                  placeholder="https://www.linkedin.com/in/username/"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900 tracking-wide font-mono rounded-none placeholder:text-neutral-300 transition-colors"
                />
              </div>

              {/* Raw Text Input Workspace Context Area */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono tracking-wider text-neutral-500 uppercase font-medium">
                  Or Paste Profile Raw Context Text
                </label>
                <textarea 
                  rows={6}
                  placeholder="Paste profile descriptions, titles, or operational contexts directly..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 p-3 text-sm text-neutral-800 focus:outline-none focus:border-neutral-900 tracking-wide font-mono rounded-none placeholder:text-neutral-300 resize-none transition-colors"
                />
              </div>

              {/* High Contrast Execution Button */}
              <button 
                type="submit"
                disabled={isLoading || (!profileUrl && !rawContent)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs tracking-[0.2em] uppercase font-bold py-4 px-6 transition-all rounded-none disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-none" />
                ) : (
                  <span>GENERATE PRECISION MESSAGE</span>
                )}
              </button>
            </div>

            {/* Hidden Native File Input Handler Trigger Block */}
            <input 
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Fully Activated High-Volume Automation Segment Area */}
            <div className="bg-white border border-neutral-200 p-5 space-y-3 rounded-none shadow-sm">
              <span className="block text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
                🗂️ HIGH-VOLUME AUTOMATION TIERS
              </span>
              <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                {/* Clickable File Trigger Label Container Card */}
                <div 
                  onClick={triggerFileSelection}
                  className={`border p-3 rounded-none cursor-pointer transition-all ${
                    uploadedFile 
                      ? "border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/50" 
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70"
                  }`}
                >
                  <span className="block font-bold text-neutral-700">
                    {uploadedFile ? "✓ FILE ATTACHED" : "1. LOAD TARGET CSV"}
                  </span>
                  <span className={`text-[10px] block truncate ${uploadedFile ? "text-emerald-700 font-medium" : "text-neutral-400"}`}>
                    {uploadedFile ? uploadedFile.name : "Select local file array"}
                  </span>
                </div>
                
                <div className="border border-neutral-200 bg-neutral-50/40 p-3 rounded-none opacity-40 select-none">
                  <span className="block text-neutral-400 font-bold">2. EXECUTE BATCH</span>
                  <span className="text-[10px] text-neutral-400">Begin automated loop</span>
                </div>
              </div>
            </div>
          </form>

          {/* Generated Precision Pitch Output Terminal Column Container */}
          <div className="lg:col-span-7 bg-white border border-neutral-200 p-6 space-y-4 h-full min-h-[480px] flex flex-col justify-between rounded-none shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="font-mono text-xs text-neutral-500 font-bold">
                  {`>_ GENERATED PITCH OUTPUT (MAX 1500 CHARS)`}
                </span>
              </div>

              {/* Core Fault Error UI Box */}
              {systemFault && (
                <div className="bg-red-50 border border-red-200 p-5 space-y-3 font-mono text-xs rounded-none">
                  <div className="flex items-center space-x-2 text-red-600 font-bold">
                    <span>❌ SYSTEM FAULT DETECTED</span>
                  </div>
                  <p className="text-red-800 leading-relaxed bg-white p-3 border border-red-100 text-[11px] overflow-x-auto whitespace-pre-wrap font-mono">
                    Reason: {systemFault}
                  </p>
                  <p className="text-[10px] text-neutral-400 italic">
                    Review your backend VS Code server console logs to check exact environment key structures.
                  </p>
                </div>
              )}

              {/* Main Content Render Display Block Text Box Area */}
              {!systemFault && (
                <div className="w-full bg-neutral-50 border border-neutral-200 p-5 font-mono text-sm leading-relaxed tracking-wide text-neutral-800 min-h-[320px] rounded-none whitespace-pre-wrap selection:bg-neutral-200">
                  {generatedOutput ? (
                    generatedOutput
                  ) : isLoading ? (
                    <span className="text-neutral-400 animate-pulse font-medium">Running live profile extraction via Apify proxy network...</span>
                  ) : (
                    <span className="text-neutral-300 font-medium">Awaiting target system parameter pipeline initiation. Outreach stream output will render here...</span>
                  )}
                </div>
              )}
            </div>

            {/* Structural Usage Help Ribbon Notice */}
            <div className="flex items-center space-x-2 text-[10px] font-mono text-neutral-400 pt-4 border-t border-neutral-100">
              <span className="w-1.5 h-1.5 bg-neutral-300 rounded-none" />
              <span>Click inside the text terminal area to select the message array seamlessly.</span>
            </div>
          </div>

        </div>
      </div>

      {/* ==================== HARDCODED CLEAN SIGNATURE DESIGNER MARK ==================== */}
      <div className="fixed bottom-4 right-4 z-40 font-mono text-[10px] tracking-[0.25em] text-neutral-400 select-none pointer-events-auto group uppercase transition-colors">
        <span className="text-neutral-300 transition-colors duration-300 group-hover:text-neutral-500">// DESIGNED BY </span>
        <span className="bg-white border border-neutral-200 text-neutral-500 px-2 py-1 font-bold rounded-none transition-all duration-300 group-hover:text-neutral-900 group-hover:border-neutral-400 ml-1 shadow-sm">
          Ahsan
        </span>
      </div>

    </div>
  );
}