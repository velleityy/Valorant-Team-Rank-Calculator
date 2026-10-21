import type { RankKey, Recency } from "./scoring";

export type Player = {
    ign: string;
    rankA1: RankKey; // V25 A1
    rankA5: RankKey; // V25 A5
  };  

export type TeamSubmission = {
  id: string;
  createdAt: string;
  teamName: string;
  players: Player[];
  totalPoints: number;
};

const KEY = "valorant_rankcap_teams_v1";

export function loadTeams(): TeamSubmission[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveTeams(teams: TeamSubmission[]) {
  localStorage.setItem(KEY, JSON.stringify(teams));
}

export function addTeam(team: TeamSubmission) {
  const existing = loadTeams();
  saveTeams([team, ...existing]);
}

export function clearTeams() {
  localStorage.removeItem(KEY);
}
