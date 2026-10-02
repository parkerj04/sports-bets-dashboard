  async function togglePublic(id: string, current: boolean) {
    const res = await fetch("/api/picks/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublic: !current }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Could not share that pick.");
      return;
    }
    load();
  }
