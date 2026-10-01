      <BvPPicker
        homeHitters={data.homeHitters}
        awayHitters={data.awayHitters}
        homePitcherId={data.homePitcher?.id}
        awayPitcherId={data.awayPitcher?.id}
        homePitcherName={data.homePitcher?.name}
        awayPitcherName={data.awayPitcher?.name}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
      />
      {data.bvp?.length > 0 && (
        <div className="card p-4 overflow-x-auto">
          <h3 className="font-semibold text-sm mb-2">Batter vs this starter (career)</h3>
          <table className="w-full text-xs">
            <thead className="text-muted">
              <tr className="text-left">
                <th className="pb-2">Batter</th><th>AB</th><th>H</th><th>HR</th><th>SO</th><th>AVG</th><th>OPS</th>
              </tr>
            </thead>
            <tbody>
              {data.bvp.map((r) => (
                <tr key={r.batterId} className="border-t border-card-border font-mono">
                  <td className="py-1.5 pr-2 font-sans font-medium">{r.batter}</td>
                  <td>{r.ab}</td><td>{r.h}</td><td>{r.hr}</td><td>{r.so}</td><td>{r.avg}</td><td>{r.ops}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <HitterForm rows={data.form || []} />
      <StealBoard edges={data.steals || []} />
