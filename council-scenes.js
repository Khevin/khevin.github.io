/* Final-state SVGs with authored entrance cues. Every scene remains a
   complete illustration with motion disabled. Coordinates share 240 × 120. */
window.CouncilScenes = (() => {
  const move = (body, x, y, delay = 0, turn = 0) => `<g data-motion="assemble" data-x="${x}" data-y="${y}" data-delay="${delay}" data-turn="${turn}">${body}</g>`;
  const line = (d, delay = 0, cls = 'scene-accent') => `<path class="${cls}" data-motion="draw" data-delay="${delay}" d="${d}"/>`;
  const ghost = (body, x, delay = 0) => `<g class="scene-ghost" data-motion="remove" data-x="${x}" data-delay="${delay}">${body}</g>`;
  return {
    rams: {
      label: 'Subtract the unnecessary',
      art: ghost('<rect x="14" y="32" width="48" height="64" rx="3"/><path d="M23 44h30m-30 10h20m-20 10h26"/>', -34, 350)
        + ghost('<rect x="177" y="18" width="48" height="64" rx="3"/><path d="M187 31h28m-28 10h17m-17 10h25"/>', 34, 530)
        + move('<rect class="scene-paper" x="78" y="9" width="84" height="102" rx="3"/><circle class="scene-accent" cx="93" cy="26" r="3"/><path class="scene-ink" d="M90 43h59m-59 10h41"/><path class="scene-muted" d="M90 65h53m-53 6h47"/>', -9, 7, 500, -7)
        + line('M90 91h59', 1300) + line('m137 86 6 5-6 5', 1450)
    },
    vignelli: {
      label: 'Find a common rhythm',
      art: [18, 92, 166].map((x, i) => move(`<rect class="scene-paper" x="${x}" y="17" width="56" height="86" rx="2"/><path class="scene-ink" d="M${x+8} 36h40m-40 9h27"/><path class="scene-muted" d="M${x+8} 64h40m-40 7h33m-33 7h37"/>`, (i-1)*12, [14,-12,8][i], 330+i*160, [-10,8,-6][i])).join('')
        + line('M10 36h220M10 87h220', 200, 'scene-guide')
        + [26,100,174].map((x,i) => line(`M${x} 87h24`, 1200+i*160)).join('')
    },
    kare: {
      label: 'Make meaning recognizable',
      art: '<rect class="scene-muted" x="80" y="7" width="80" height="80" rx="3"/>'
        + [[2,2],[3,2],[6,2],[7,2],[2,3],[3,3],[6,3],[7,3],[1,5],[2,6],[3,7],[4,7],[5,7],[6,7],[7,6],[8,5]].map(([x,y],i) => move(`<rect class="scene-solid" x="${87+x*6}" y="${14+y*7}" width="5" height="5"/>`, Math.cos(i*2.4)*65, Math.sin(i*2.4)*38, 180+i*48, (i%2?1:-1)*45)).join('')
        + '<g data-motion="reveal" data-delay="1350"><text class="scene-label" x="120" y="108" text-anchor="middle">A familiar face.</text></g>'
    },
    itten: {
      label: 'Give attention a destination',
      art: Array.from({length:12},(_,i) => {const a=i*Math.PI/6;return move(`<circle cx="${120+Math.cos(a)*94}" cy="${58+Math.sin(a)*48}" r="4" fill="oklch(72% .13 ${i*30})" stroke="none"/>`,Math.cos(a)*-35,Math.sin(a)*-25,i*45);}).join('')
        + move('<rect class="scene-paper" x="70" y="23" width="100" height="73" rx="3"/><path class="scene-ink" d="M82 38h49m-49 9h70"/><path class="scene-muted" d="M82 57h56"/>',0,10,300)
        + '<g data-motion="reveal" data-delay="1100"><rect class="scene-solid" x="82" y="70" width="76" height="15" rx="2"/><path class="scene-knockout" d="M112 77h16m-4-4 4 4-4 4"/></g>'
        + ghost('<circle class="scene-accent" cx="120" cy="6" r="7"/>',0,900)
    },
    tufte: {
      label: 'Let the evidence emerge',
      art: ghost('<path d="M18 14h193v88H18zM18 36h193M18 58h193M18 80h193M57 14v88M95 14v88M133 14v88M171 14v88"/>',0,500)
        + line('M22 84 54 66 85 72 118 42 153 50 190 21',400,'scene-ink')
        + line('M22 54 54 59 85 45 118 72 153 67 190 67',650,'scene-muted')
        + '<g data-motion="reveal" data-delay="1500"><circle class="scene-solid" cx="190" cy="21" r="3"/><text class="scene-value" x="202" y="25">84</text><text class="scene-label" x="202" y="71">42</text></g>'
        + line('M22 105h168',1000,'scene-guide')
    },
    'muller-brockmann': {
      label: 'Let structure settle the argument',
      art: line('M30 3v114M90 3v114M150 3v114M210 3v114M18 15h204M18 65h204M18 105h204',0,'scene-guide')
        + move('<rect class="scene-paper" x="30" y="15" width="50" height="40"/>',-19,16,400,-12)
        + move('<path class="scene-ink" d="M90 15h120m-120 10h85m-85 10h105"/>',12,17,650,5)
        + move('<path class="scene-muted" d="M30 65h100m-100 8h110m-110 8h78m-78 8h105"/>',-12,10,800,-6)
        + move('<rect class="scene-solid" x="150" y="65" width="60" height="40"/>',18,-15,1000,9)
        + line('m173 85 5 5 12-14',1600,'scene-knockout')
    }
  };
})();
