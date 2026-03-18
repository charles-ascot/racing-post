import { useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL || "";
import { Play, Download, Calendar, ChevronDown, ChevronRight, Loader, FileSpreadsheet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Runner = {
  number: number;
  name: string;
  form: string;
  draw: number | null;
  jockey: string;
  trainer: string;
  rpr: number | null;
  ts: number | null;
  ofr: number | null;
  silk_url: string | null;
  non_runner: boolean;
  lbs: number | null;
};

type Race = {
  race_id: number;
  race_name: string;
  race_type: string;
  distance: string;
  going: string;
  field_size: number | null;
  pattern: string;
  race_class: number | string | null;
  age_band: string | null;
  prize: string | null;
  handicap: boolean;
  runners: Runner[];
};

type Racecards = {
  [region: string]: {
    [course: string]: {
      [off_time: string]: Race;
    };
  };
};

function RaceRow({ offTime, race }: { offTime: string; race: Race }) {
  const [open, setOpen] = useState(false);
  const activeRunners = race.runners.filter((r) => !r.non_runner);

  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-[rgba(0,212,255,0.05)] transition-colors"
      >
        {open
          ? <ChevronDown size={13} className="text-[#00D4FF] shrink-0" />
          : <ChevronRight size={13} className="text-[#9D4EDD] shrink-0" />}
        <span className="data-value text-base w-14 shrink-0 text-[#00D4FF]">{offTime}</span>
        <span className="font-bold uppercase flex-1 text-[#e0e0e0] text-sm" style={{ fontFamily: "'Lexend', sans-serif" }}>
          {race.race_name}
        </span>
        <span className="col-header normal-case hidden md:block">{race.race_type}</span>
        <span className="col-header normal-case hidden md:block">{race.distance}</span>
        <span className="col-header normal-case hidden md:block">{race.going}</span>
        {race.pattern && (
          <span className="text-[9px] font-bold border border-[#9D4EDD] text-[#9D4EDD] px-1 rounded shrink-0">
            {race.pattern}
          </span>
        )}
        <span className="col-header normal-case shrink-0">{activeRunners.length} runners</span>
        {race.prize && (
          <span className="col-header normal-case text-[#4ade80] hidden lg:block shrink-0">{race.prize}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <table className="w-full text-sm border-t border-white/5">
              <thead>
                <tr className="bg-[rgba(10,15,35,0.6)]">
                  <th className="col-header normal-case text-left px-3 py-2">#</th>
                  <th className="col-header normal-case text-left px-3 py-2">Horse</th>
                  <th className="col-header normal-case text-left px-3 py-2">Form</th>
                  <th className="col-header normal-case text-left px-3 py-2">Draw</th>
                  <th className="col-header normal-case text-left px-3 py-2">Wgt</th>
                  <th className="col-header normal-case text-left px-3 py-2">Jockey</th>
                  <th className="col-header normal-case text-left px-3 py-2">Trainer</th>
                  <th className="col-header normal-case text-right px-3 py-2">RPR</th>
                  <th className="col-header normal-case text-right px-3 py-2">TS</th>
                  <th className="col-header normal-case text-right px-3 py-2">OFR</th>
                </tr>
              </thead>
              <tbody>
                {race.runners.map((runner, i) => (
                  <tr
                    key={i}
                    className={`border-t border-white/5 hover:bg-[rgba(0,212,255,0.04)] transition-colors ${
                      runner.non_runner ? "opacity-25 line-through" : ""
                    }`}
                  >
                    <td className="data-value px-3 py-2 text-[#9D4EDD]">{runner.number}</td>
                    <td className="px-3 py-2 font-bold uppercase text-[#e0e0e0] text-xs" style={{ fontFamily: "'Lexend', sans-serif" }}>
                      {runner.name}
                    </td>
                    <td className="data-value px-3 py-2 tracking-wider text-[#888]">{runner.form || "—"}</td>
                    <td className="data-value px-3 py-2 text-[#e0e0e0]">{runner.draw ?? "—"}</td>
                    <td className="data-value px-3 py-2 text-[#e0e0e0]">{runner.lbs ?? "—"}</td>
                    <td className="px-3 py-2 text-[#e0e0e0] text-xs">{runner.jockey}</td>
                    <td className="px-3 py-2 text-[#888] text-xs">{runner.trainer}</td>
                    <td className="data-value px-3 py-2 text-right text-[#00D4FF]">{runner.rpr ?? "—"}</td>
                    <td className="data-value px-3 py-2 text-right text-[#4ade80]">{runner.ts ?? "—"}</td>
                    <td className="data-value px-3 py-2 text-right text-[#e0e0e0]">{runner.ofr ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CourseSection({ course, races }: { course: string; races: { [off_time: string]: Race } }) {
  const sortedTimes = Object.keys(races).sort();
  return (
    <div className="glass-panel mb-4 overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(0,212,255,0.15)] bg-[rgba(10,15,35,0.5)]">
        <h3
          className="font-bold uppercase tracking-widest text-xs text-[#00D4FF]"
          style={{ fontFamily: "'Lexend', sans-serif" }}
        >
          {course}
        </h3>
      </div>
      {sortedTimes.map((time) => (
        <RaceRow key={time} offTime={time} race={races[time]} />
      ))}
    </div>
  );
}

export default function App() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [racecards, setRacecards] = useState<Racecards | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<string | null>(null);

  const loadRacecards = async () => {
    setLoading(true);
    setError(null);
    setRacecards(null);
    try {
      const url = region
        ? `${API}/racecards/${date}?region=${region.toLowerCase()}`
        : `${API}/racecards/${date}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.message) {
        setError(data.message);
      } else {
        setRacecards(data);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load racecards");
    } finally {
      setLoading(false);
    }
  };

  const scrapeRaces = async () => {
    setScraping(true);
    setScrapeStatus(null);
    setOutputFile(null);
    setError(null);
    try {
      const res = await fetch(`${API}/scrape/races`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: [date],
          regions: region ? [region.toLowerCase()] : undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setScrapeStatus(data.message + (data.output_file ? ` → ${data.output_file}` : ""));
      if (data.output_file) setOutputFile(data.output_file);
    } catch (e: any) {
      setError(e.message || "Scrape failed");
    } finally {
      setScraping(false);
    }
  };

  const regions = racecards ? Object.keys(racecards).sort() : [];
  const totalRaces = racecards
    ? regions.reduce(
        (acc, r) =>
          acc + Object.values(racecards[r]).reduce((a, c) => a + Object.keys(c).length, 0),
        0
      )
    : 0;

  return (
    <main className="relative z-10 min-h-screen p-6 md:p-10 max-w-7xl mx-auto">

      {/* Header */}
      <header className="glass-panel flex justify-between items-end px-8 py-6 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-1 opacity-50" style={{ color: "#9D4EDD", fontFamily: "'Lexend', sans-serif" }}>
            Chimera
          </p>
          <h1
            className="gradient-text text-4xl font-bold tracking-tighter uppercase mb-1"
            style={{ fontFamily: "'Lexend', sans-serif" }}
          >
            RPScrape.v2
          </h1>
          <p className="text-sm italic opacity-60" style={{ color: "#00D4FF" }}>
            High-precision horse racing data extraction engine
          </p>
        </div>
        {racecards && (
          <div className="text-right">
            <div className="data-value text-2xl text-[#00D4FF]">{totalRaces}</div>
            <div className="col-header normal-case opacity-100">races loaded</div>
          </div>
        )}
      </header>

      {/* Controls */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-6">
          <label className="col-header mb-3 block">Date</label>
          <div className="flex items-center gap-3">
            <Calendar size={15} className="text-[#9D4EDD] shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-b border-[rgba(157,78,221,0.4)] outline-none w-full data-value text-base text-[#e0e0e0]"
            />
          </div>
        </div>

        <div className="glass-panel p-6">
          <label className="col-header mb-3 block">Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent border-b border-[rgba(0,212,255,0.3)] outline-none w-full data-value text-base text-[#e0e0e0] appearance-none cursor-pointer"
            style={{ background: "transparent" }}
          >
            <option value="" style={{ background: "#0d1117" }}>All Regions</option>
            <option value="gb" style={{ background: "#0d1117" }}>GB</option>
            <option value="ire" style={{ background: "#0d1117" }}>IRE</option>
            <option value="eur" style={{ background: "#0d1117" }}>EUR</option>
            <option value="usa" style={{ background: "#0d1117" }}>USA</option>
            <option value="aus" style={{ background: "#0d1117" }}>AUS</option>
          </select>
        </div>

        <button
          onClick={loadRacecards}
          disabled={loading}
          className={`glass-panel p-6 flex items-center justify-center gap-3 font-bold uppercase text-sm transition-all ${
            loading
              ? "opacity-50 cursor-wait"
              : "hover:bg-[rgba(0,212,255,0.08)] hover:border-[rgba(0,212,255,0.4)]"
          }`}
          style={{ fontFamily: "'Lexend', sans-serif", color: loading ? "#888" : "#00D4FF" }}
        >
          {loading ? <Loader size={18} className="animate-spin" /> : <Play size={18} />}
          {loading ? "Loading..." : "Load Racecards"}
        </button>

        <button
          onClick={scrapeRaces}
          disabled={scraping}
          className={`glass-panel p-6 flex items-center justify-center gap-3 font-bold uppercase text-sm transition-all ${
            scraping
              ? "opacity-50 cursor-wait"
              : "hover:bg-[rgba(157,78,221,0.08)] hover:border-[rgba(157,78,221,0.4)]"
          }`}
          style={{ fontFamily: "'Lexend', sans-serif", color: scraping ? "#888" : "#9D4EDD" }}
        >
          {scraping ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
          {scraping ? "Scraping..." : "Scrape Results"}
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="border border-[rgba(255,107,107,0.4)] bg-[rgba(255,107,107,0.08)] text-[#FF6B6B] p-4 mb-6 rounded-2xl text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Scrape status */}
      {scrapeStatus && (
        <div className="flex items-center gap-4 border border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.08)] p-4 mb-6 rounded-2xl backdrop-blur-sm">
          <span className="text-[#4ade80] text-sm font-mono flex-1">{scrapeStatus}</span>
          <a
            href={`${API}/download?path=${encodeURIComponent(outputFile || "")}`}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-xs shrink-0 transition-all hover:opacity-80"
            style={{
              fontFamily: "'Lexend', sans-serif",
              background: "linear-gradient(135deg, #00D4FF 0%, #0099FF 50%, #9D4EDD 100%)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(0,212,255,0.25)",
            }}
          >
            <FileSpreadsheet size={14} />
            Excel
          </a>
        </div>
      )}

      {/* Racecards */}
      {racecards && regions.length > 0 && (
        <div>
          {regions.map((reg) => (
            <div key={reg} className="mb-10">
              <h2
                className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[rgba(157,78,221,0.2)]"
                style={{ color: "#9D4EDD", fontFamily: "'Lexend', sans-serif" }}
              >
                {reg}
              </h2>
              {Object.keys(racecards[reg])
                .sort()
                .map((course) => (
                  <CourseSection key={course} course={course} races={racecards[reg][course]} />
                ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !racecards && !error && (
        <div className="glass-panel p-20 text-center opacity-40 italic text-sm" style={{ color: "#00D4FF", fontFamily: "'Lexend', sans-serif" }}>
          Select a date and load racecards to begin.
        </div>
      )}

      {/* Footer */}
      <footer
        className="mt-12 flex justify-between items-center text-[10px] uppercase tracking-widest border-t border-[rgba(0,212,255,0.15)] pt-6"
        style={{ color: "#00D4FF", opacity: 0.4 }}
      >
        <div>System Status: Operational</div>
        <div>Engine: Python 3.12 / FastAPI</div>
      </footer>
    </main>
  );
}
