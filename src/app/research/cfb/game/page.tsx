  const list = catchers.filter((l) => l.team === side);
  const plus = [...list].sort((a, b) => b.yards - a.yards)[0];
  const star = [...list].sort((a, b) => b.td - a.td || b.yards - a.yards)[0];
  const active = list.find((l) => l.name === picked) || list[0];
