import { useState } from "react";

const API = import.meta.env.VITE_BACKEND_URL || "";
import { Play, Download, Calendar, ChevronDown, ChevronRight, Loader } from "lucide-react";
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
    <div className="border-b border-[#141414]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="data-value text-lg w-16">{offTime}</span>
        <span className="font-bold uppercase flex-1">{race.race_name}</span>
        <span className="col-header normal-case opacity-60">{race.race_type}</span>
        <span className="col-header normal-case opacity-60">{race.distance}</span>
        <span className="col-header normal-case opacity-60">{race.going}</span>
        {race.pattern && (
          <span className="text-[10px] font-bold border border-current px-1">{race.pattern}</span>
        )}
        <span className="col-header normal-case opacity-60">{activeRunners.length} runners</span>
        {race.prize && <span className="col-header normal-case opacity-60">{race.prize}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <table className="w-full text-sm border-t border-[#141414]">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0]">
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">#</th>
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">Horse</th>
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">Form</th>
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">Draw</th>
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">Wgt</th>
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">Jockey</th>
                  <th className="col-header text-left px-3 py-2 text-[#E4E3E0]">Trainer</th>
                  <th className="col-header text-right px-3 py-2 text-[#E4E3E0]">RPR</th>
                  <th className="col-header text-right px-3 py-2 text-[#E4E3E0]">TS</th>
                  <th className="col-header text-right px-3 py-2 text-[#E4E3E0]">OFR</th>
                </tr>
              </thead>
              <tbody>
                {race.runners.map((runner, i) => (
                  <tr
                    key={i}
                    className={`border-t border-[#141414] hover:bg-[#f0efec] transition-colors ${
                      runner.non_runner ? "opacity-30 line-through" : ""
                    }`}
                  >
                    <td className="data-value px-3 py-2">{runner.number}</td>
                    <td className="px-3 py-2 font-bold uppercase">{runner.name}</td>
                    <td className="data-value px-3 py-2 tracking-wider">{runner.form || "—"}</td>
                    <td className="data-value px-3 py-2">{runner.draw ?? "—"}</td>
                    <td className="data-value px-3 py-2">{runner.lbs ?? "—"}</td>
                    <td className="px-3 py-2">{runner.jockey}</td>
                    <td className="px-3 py-2 opacity-70">{runner.trainer}</td>
                    <td className="data-value px-3 py-2 text-right">{runner.rpr ?? "—"}</td>
                    <td className="data-value px-3 py-2 text-right">{runner.ts ?? "—"}</td>
                    <td className="data-value px-3 py-2 text-right">{runner.ofr ?? "—"}</td>
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
    <div className="border border-[#141414] mb-6">
      <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2">
        <h3 className="font-bold uppercase tracking-widest text-sm">{course}</h3>
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
          acc +
          Object.values(racecards[r]).reduce((a, c) => a + Object.keys(c).length, 0),
        0
      )
    : 0;

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end border-b border-[#141414] pb-8 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">RPScrape.v2</h1>
          <p className="font-serif italic opacity-60">
            High-precision horse racing data extraction engine
          </p>
        </div>
        {racecards && (
          <div className="text-right">
            <div className="data-value text-2xl">{totalRaces}</div>
            <div className="col-header normal-case">races loaded</div>
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="border border-[#141414] p-6">
          <label className="col-header mb-4 block">Date</label>
          <div className="flex items-center gap-3">
            <Calendar size={18} />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-b border-[#141414] outline-none w-full data-value text-lg"
            />
          </div>
        </div>

        <div className="border border-[#141414] p-6">
          <label className="col-header mb-4 block">Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-transparent border-b border-[#141414] outline-none w-full data-value text-lg appearance-none"
          >
            <option value="">All Regions</option>
            <option value="gb">GB</option>
            <option value="ire">IRE</option>
            <option value="eur">EUR</option>
            <option value="usa">USA</option>
            <option value="aus">AUS</option>
          </select>
        </div>

        <button
          onClick={loadRacecards}
          disabled={loading}
          className={`border border-[#141414] p-6 flex items-center justify-center gap-3 font-bold uppercase text-lg transition-all ${
            loading
              ? "opacity-50 cursor-wait"
              : "bg-[#141414] text-[#E4E3E0] hover:bg-transparent hover:text-[#141414]"
          }`}
        >
          {loading ? <Loader size={20} className="animate-spin" /> : <Play size={20} />}
          {loading ? "Loading..." : "Load Racecards"}
        </button>

        <button
          onClick={scrapeRaces}
          disabled={scraping}
          className={`border border-[#141414] p-6 flex items-center justify-center gap-3 font-bold uppercase text-lg transition-all ${
            scraping
              ? "opacity-50 cursor-wait"
              : "hover:bg-[#141414] hover:text-[#E4E3E0]"
          }`}
        >
          {scraping ? <Loader size={20} className="animate-spin" /> : <Download size={20} />}
          {scraping ? "Scraping..." : "Scrape Results"}
        </button>
      </section>

      {error && (
        <div className="border border-red-600 text-red-600 p-4 mb-8 font-mono text-sm">
          {error}
        </div>
      )}

      {scrapeStatus && (
        <div className="border border-[#141414] p-4 mb-8 font-mono text-sm">
          {scrapeStatus}
        </div>
      )}

      {racecards && regions.length > 0 && (
        <div>
          {regions.map((reg) => (
            <div key={reg} className="mb-10">
              <h2 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4 border-b border-[#141414] pb-2">
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

      {!loading && !racecards && !error && (
        <div className="p-20 text-center opacity-30 italic font-serif">
          Select a date and load racecards to begin.
        </div>
      )}

      <footer className="mt-12 flex justify-between items-center text-[10px] uppercase tracking-widest opacity-40 border-t border-[#141414] pt-6">
        <div>System Status: Operational</div>
        <div>Engine: Python 3.12 / FastAPI</div>
      </footer>
    </main>
  );
}
