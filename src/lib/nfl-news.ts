import news from "@/data/nfl-news.json";

export type NflNews = {
  id: string;
  teams: string[];
  date: string;
  headline: string;
  detail: string;
  desk: string;
};

export function newsFor(away: string, home: string): NflNews[] {
  return (news as NflNews[]).filter((n) => n.teams.includes(away) || n.teams.includes(home));
}

export function newsLine(away: string, home: string) {
  const rows = newsFor(away, home);
  if (!rows.length) return "";
  return rows.map((n) => `News: ${n.headline}. ${n.desk}`).join(" ");
}
