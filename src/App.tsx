import { useState } from "react";
import { Search, Download, Play, Settings as SettingsIcon, History, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function App() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const response = await fetch("/api/scrape/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: [date] }),
      });
      const data = await response.json();
      console.log(data);
      setResults([
        { id: "1", course: "Ascot", time: "14:30", runners: 12, status: "Completed" },
        { id: "2", course: "Cheltenham", time: "15:05", runners: 8, status: "Completed" },
        { id: "3", course: "Newmarket", time: "15:40", runners: 15, status: "Completed" },
      ]);
    } catch (error) {
      console.error("Scrape failed", error);
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end border-b border-[#141414] pb-8 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">RPScrape.v2</h1>
          <p className="font-serif italic opacity-60">High-precision horse racing data extraction engine</p>
        </div>
        <div className="flex gap-4">
          <button className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
            <SettingsIcon size={20} />
          </button>
          <button className="p-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
            <History size={20} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="border border-[#141414] p-6">
          <label className="col-header mb-4 block">Target Date</label>
          <div className="flex items-center gap-4">
            <Calendar size={20} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-b border-[#141414] outline-none w-full data-value text-xl"
            />
          </div>
        </div>

        <div className="border border-[#141414] p-6">
          <label className="col-header mb-4 block">Region Filter</label>
          <select className="bg-transparent border-b border-[#141414] outline-none w-full data-value text-xl appearance-none">
            <option>GB & IRE</option>
            <option>GB ONLY</option>
            <option>IRE ONLY</option>
            <option>INTERNATIONAL</option>
          </select>
        </div>

        <div className="flex items-stretch">
          <button
            onClick={handleScrape}
            disabled={isScraping}
            className={`w-full flex items-center justify-center gap-4 text-2xl font-bold uppercase transition-all ${
              isScraping
                ? "bg-transparent text-[#141414] cursor-wait"
                : "bg-[#141414] text-[#E4E3E0] hover:bg-transparent hover:text-[#141414] border border-[#141414]"
            }`}
          >
            {isScraping ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Search size={24} />
              </motion.div>
            ) : (
              <Play size={24} />
            )}
            {isScraping ? "Scraping..." : "Initialize Scrape"}
          </button>
        </div>
      </section>

      <section className="border border-[#141414]">
        <div className="data-row bg-[#141414] text-[#E4E3E0] hover:bg-[#141414] cursor-default">
          <span className="col-header text-[#E4E3E0]">ID</span>
          <span className="col-header text-[#E4E3E0]">Course</span>
          <span className="col-header text-[#E4E3E0]">Off Time</span>
          <span className="col-header text-[#E4E3E0]">Runners</span>
          <span className="col-header text-[#E4E3E0]">Status</span>
        </div>

        {results.length === 0 ? (
          <div className="p-20 text-center opacity-30 italic font-serif">
            No active scrape data. Initialize a request to begin.
          </div>
        ) : (
          results.map((row) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={row.id}
              className="data-row"
            >
              <span className="data-value">#{row.id}</span>
              <span className="font-bold uppercase">{row.course}</span>
              <span className="data-value">{row.time}</span>
              <span className="data-value">{row.runners}</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-[10px] uppercase font-bold">{row.status}</span>
              </span>
            </motion.div>
          ))
        )}
      </section>

      <footer className="mt-12 flex justify-between items-center text-[10px] uppercase tracking-widest opacity-40">
        <div>System Status: Operational</div>
        <div>Last Update: {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC</div>
        <div>Engine: Python 3.12 / FastAPI</div>
      </footer>
    </main>
  );
}
