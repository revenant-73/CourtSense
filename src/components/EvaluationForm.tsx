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
  { value: 0, label: "Not Observed", color: "bg-gray-100 text-gray-600" },
  { value: 1, label: "Emerging", color: "bg-blue-100 text-blue-700" },
  { value: 2, label: "Consistent", color: "bg-green-100 text-green-700" },
  { value: 3, label: "Standout", color: "bg-yellow-100 text-yellow-800" },
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
    <div className="space-y-8 pb-12">
      {/* Standout Tags */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
          <TagIcon className="h-4 w-4 mr-2" />
          Standout Skill Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {STANDOUT_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTags.includes(tag) 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Ecological Categories */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center">
          <Star className="h-4 w-4 mr-2" />
          Ecological Assessment
        </h3>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="mb-3">
              <h4 className="font-bold text-gray-900">{cat.label}</h4>
              <p className="text-xs text-gray-500">{cat.desc}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SCORES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setScores({ ...scores, [cat.id]: s.value })}
                  className={`py-3 px-1 rounded-xl text-[10px] font-bold text-center leading-tight transition-all border-2 ${
                    scores[cat.id] === s.value 
                      ? "border-indigo-600 shadow-inner" 
                      : "border-transparent bg-gray-50 text-gray-500"
                  }`}
                >
                  <div className={`mx-auto mb-1 h-2 w-2 rounded-full ${s.value > 0 && scores[cat.id] === s.value ? "bg-indigo-600" : "bg-gray-300"}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Evaluator Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Evidence for assessment..."
          className="w-full h-32 p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
        />
      </section>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowFlagModal(true)}
          className="flex-1 flex items-center justify-center py-4 bg-red-50 text-red-700 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-colors"
        >
          <Flag className="h-5 w-5 mr-2" />
          Add Flag
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : <><Check className="h-5 w-5 mr-2" /> Save Draft</>}
        </button>
      </div>

      {/* Flag Modal Simplified */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4">Select Flag Type</h3>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto mb-4">
              {FLAG_TYPES.map(type => (
                <button
                  key={type}
                  onClick={async () => {
                    await saveFlag(athlete.id, { type });
                    setShowFlagModal(false);
                    alert(`Flag added: ${type}`);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-xl text-gray-700 font-medium"
                >
                  {type}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowFlagModal(false)}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
