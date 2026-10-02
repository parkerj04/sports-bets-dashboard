  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2",
    { next: { revalidate: 300 } }
  );
