        {Array.from({ length: 11 }, (_, i) => {
          const x = fieldX + (i / 10) * fieldW;
          const label = i <= 5 ? i * 10 : (10 - i) * 10;
          return (
            <g key={i}>
              <line x1={x} y1="228" x2={x} y2="238" stroke="#fff" strokeWidth="1.2" />
              <text x={x} y="256" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">{label}</text>
            </g>
          );
        })}
