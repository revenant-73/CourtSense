"use client";

import { useState, useEffect, useCallback } from "react";
import { saveEvaluation, toggleTag, saveFlag } from "@/app/actions/evaluation";
import { Star, Flag, MessageSquare, Check, Tag as TagIcon } from "lucide-react";

const CATEGORIES = [
  { id: "perceptionScore", label: "Perception & Decision", desc: "Noticing info, recognizing opportunities, adjusting decisions" },
  { id: "adaptabilityScore", label: "Adaptability", desc: "Alternative solutions, adjusting after failure, teammate response" },
  { id: "functionalSkillScore", label: "Functional Skill", desc: "Solving game problems, control under pressure, movement solutions" },
  { id: "engagementScore", label: "Competitive Engagement", desc: "Involved between contacts, pursuing opportunities, recovery" },
  { id: "teamContributionScore", label: "Team Contribution", desc: "Making teammates effective, communicating, creating space" },
  { id: "learningBehaviorScore", label: "Learning Behavior", desc: "Exploring solutions, response to constraints, curiosity" },
];

const SCORES = [
  { value: 0, label: "Not Observed" },
  { value: 1, label: "Emerging" },
  { value: 2, label: "Consistent" },
  { value: 3, label: "Standout" },
];

const STANDOUT_TAGS = [
  "Serving", "Serve reception", "Attacking", "Setting", "Blocking", 
  "Floor defense", "Transition", "Out-of-system play", "Reading the game", 
  "Communication", "Athletic movement", "Ball control"
];

const FLAG_TYPES = [
  "Discuss", "Rewatch", "Position question", "Age-group question", 
  "Limited observation", "Possible standout", "Concern"
];

interface Athlete {
  id: string;
  name: string;
  athleteNumber: string | null;
  positionPreference: string;
  photoUrl: string | null;
  tags: { name: string }[];
}

interface Evaluation {
  perceptionScore: number;
  adaptabilityScore: number;
  functionalSkillScore: number;
  engagementScore: number;
  teamContributionScore: number;
  learningBehaviorScore: number;
  notes: string | null;
}

export default function EvaluationForm({ athlete, initialEvaluation }: { athlete: Athlete, initialEvaluation?: Evaluation }) {
  const [scores, setScores] = useState<any>({
    perceptionScore: initialEvaluation?.perceptionScore || 0,
    adaptabilityScore: initialEvaluation?.adaptabilityScore || 0,
    functionalSkillScore: initialEvaluation?.functionalSkillScore || 0,
    engagementScore: initialEvaluation?.engagementScore || 0,
    teamContributionScore: initialEvaluation?.teamContributionScore || 0,
    learningBehaviorScore: initialEvaluation?.learningBehaviorScore || 0,
  });
  const [notes, setNotes] = useState(initialEvaluation?.notes || "");
  const [saving, setSaving] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>(athlete.tags.map(t => t.name));
  const [showFlagModal, setShowFlagModal] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveEvaluation(athlete.id, { ...scores, notes });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [athlete.id, scores, notes]);

  // Auto-save logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (initialEvaluation) {
        await handleSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [handleSave, initialEvaluation]);

  const handleTagToggle = async (tag: string) => {
    try {
      const res = await toggleTag(athlete.id, tag);
      if (res.status === 'added') {
        setActiveTags([...activeTags, tag]);
      } else {
        setActiveTags(activeTags.filter(t => t !== tag));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Standout Tags */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] flex items-center">
            <TagIcon className="h-3 w-3 mr-2 text-primary" />
            Standout Indicators
          </h3>
          <span className="text-[10px] font-bold text-primary/60">{activeTags.length} active</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STANDOUT_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                activeTags.includes(tag) 
                  ? "bg-primary text-white border-primary shadow-glow scale-105" 
                  : "glass-card text-foreground/60 border-white/5 hover:border-primary/30"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Ecological Categories */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] flex items-center">
          <Star className="h-3 w-3 mr-2 text-primary" />
          Ecological Scoring Matrix
        </h3>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="glass-card p-6 rounded-[2rem] border-white/5 relative overflow-hidden group">
            <div className="mb-5 relative z-10">
              <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{cat.label}</h4>
              <p className="text-[10px] text-foreground/40 uppercase tracking-wide mt-1 leading-relaxed">{cat.desc}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 relative z-10">
              {SCORES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setScores({ ...scores, [cat.id]: s.value })}
                  className={`py-4 px-1 rounded-2xl text-[9px] font-black uppercase tracking-tighter text-center leading-tight transition-all border-2 ${
                    scores[cat.id] === s.value 
                      ? "border-primary bg-primary/10 text-primary shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]" 
                      : "border-transparent bg-background/40 text-foreground/30 hover:bg-white/5"
                  }`}
                >
                  <div className={`mx-auto mb-2 h-1.5 w-1.5 rounded-full transition-all ${scores[cat.id] === s.value ? "bg-primary shadow-glow scale-125" : "bg-white/10"}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-4 flex items-center">
          <MessageSquare className="h-3 w-3 mr-2 text-primary" />
          Scout Intelligence Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detailed observation data..."
          className="w-full h-32 p-5 glass-card rounded-[2rem] border-white/5 focus:ring-2 focus:ring-primary/50 outline-none resize-none text-foreground placeholder:text-foreground/20 transition-all shadow-xl"
        />
      </section>

      {/* Actions */}
      <div className="flex gap-4 sticky bottom-8 z-30">
        <button
          onClick={() => setShowFlagModal(true)}
          className="flex-1 flex items-center justify-center py-5 glass-card border-warning/20 text-warning rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-warning/10 transition-all active:scale-95"
        >
          <Flag className="h-4 w-4 mr-2" />
          Flag
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] flex items-center justify-center py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-glow hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {saving ? "Transmitting..." : <><Check className="h-4 w-4 mr-2" /> Save Protocol</>}
        </button>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-lg flex items-center justify-center p-6">
          <div className="glass-card rounded-[2.5rem] w-full max-w-sm p-8 border-white/10 shadow-2xl">
            <h3 className="text-2xl font-black tracking-tight mb-6 text-foreground">Scout Flag</h3>
            <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {FLAG_TYPES.map(type => (
                <button
                  key={type}
                  onClick={async () => {
                    await saveFlag(athlete.id, { type });
                    setShowFlagModal(false);
                  }}
                  className="w-full text-left p-4 hover:bg-primary/10 hover:text-primary rounded-2xl text-foreground/60 font-bold text-sm transition-all border border-transparent hover:border-primary/20"
                >
                  {type}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowFlagModal(false)}
              className="w-full py-4 bg-white/5 text-foreground/40 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
            >
              Abort
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
