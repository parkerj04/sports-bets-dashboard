        {plays.map((p, i) => {
          const lane = p.loc === "left" ? 58 : p.loc === "right" ? 188 : 123;
          const y = lane + ((i % 5) - 2) * 10;
          const spot = p.x == null ? 8 + ((i * 17) % 84) : Number(p.x);
          const x = fieldX + (spot / 100) * fieldW;
          const on = open === i;
          return (
            <g key={i} onClick={() => setOpen(i)} style={{ cursor: "pointer" }}>
              <circle cx={x} cy={y} r={on ? 15 : 11} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={on ? 3 : 1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">{i + 1}</text>
            </g>
          );
        })}
