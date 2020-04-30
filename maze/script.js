const cwidth = 700;
const cheight = 400;
const width = 1000;
const height = width / cwidth * cheight;
const fps = 10;

const maze_width = 400;
const maze_height = maze_width;

const maze_dim_max_value = 2;
const maze_cols  = maze_dim_max_value;
const maze_rows  = maze_dim_max_value;
const maze_depth = maze_dim_max_value;
const maze_4dim  = maze_dim_max_value;

class MazeGenerator {
  static isReachable(narr, a) {
    const mas = [narr.map(x => 0)];
    const was = a.map(x => false);
    was[0] = true;
    while (mas.length) {
      const coords = mas.pop();
      for (let d = 0; d < narr.length; ++d)
      for (let k = -1; k < 2; k = k + 2) {
        const ncoords = coords.slice();
        ncoords[d] += k;
        if (ncoords[d] >= 0 && ncoords[d] < narr[d]) {
          const nIndex = MazeGenerator.coords2index(narr, ncoords);
          if (was[nIndex]) continue;
          const isWall = (a[k > 0 ? MazeGenerator.coords2index(narr, coords) : nIndex] & (1 << d)) > 0;
          if (!isWall) {
            mas.push(ncoords);
            was[nIndex] = true;
          }
        }
      }
    }
    return was.filter(x => x).length == narr.reduce((acc, curr) => acc * curr);
  }

  // narr = [n1, n2, .., nk]
  static generate(narr) {
    const total = narr.reduce((acc, curr) => acc * curr);
    const a = new Array(total).fill(0);

    const mas = [];
    for (let i = 0; i < total * narr.length; ++i) mas.push([Math.floor(i / narr.length), i % narr.length]);
    
    while (mas.length) {
      const [index, direction] = mas.splice(Math.floor(Math.random() * mas.length), 1)[0];
      a[index] = a[index] | (1 << direction)
      if (!MazeGenerator.isReachable(narr, a)) a[index] = a[index] & (~(1 << direction));
    }

    return a;
  }
  
  static index2coords(narr, index) {
    let mul = [], x = [];
    let m = 1;
    for (let i = narr.length - 1; i >= 0; --i) {
      mul.unshift(m);
      m *= narr[i];
    }
    for (let i = 0; i < narr.length; ++i) {
      const d = Math.floor(index / mul[i]);
      x.push(d);
      index -= d*mul[i];
    }
    return x;
  }
  static coords2index(narr, x) {
    let m = 1, s = 0;
    for (let i = x.length - 1; i >= 0; i--) {
      s = x[i]*m + s;
      if (i > 0) m = m * narr[i];
    }
    return s;
  }
}

class Maze {
  constructor(ctx, word_coords) {
    this.ctx = ctx;
    this.word_coords = word_coords;
    this.narr = [maze_rows, maze_cols, maze_depth, maze_4dim];
    this.panel = new MazePanel(ctx, word_coords, this.narr.length);
    this.a = MazeGenerator.generate(this.narr);
    this.s = Math.floor(Math.random() * this.a.length)
    this.t = Math.floor(Math.random() * this.a.length)
    console.log("walls for each cell array >>>", this.a, "; start position in wall array >>>", this.s, "; winner position in wall array >>> ", this.t, "; dimensions to choose >>> ", this.narr);
    /*
    // uncomment for 3d cub visualization, if exactly 3 dimensions selected, in console
    for (let i = 0; i < this.narr[0]; ++i) {
      let str = '';
      for (let k = 0; k < this.narr[2]; ++k) {
        for (let j = 0; j < this.narr[1]; ++j) {
          str = str + ' ' + this.a[i*this.narr[0] * this.narr[2] + j*this.narr[2] + k];
        };
        str = str + '    ';
      };
      console.log(str);
    };
    */
  }
  draw() {
    const ctx = this.ctx;
    const word_coords = this.word_coords;
    const fieldx = word_coords.width / 2 - maze_width / 2;
    const fieldy = word_coords.height / 2 - maze_height / 2;
    const n1 = this.panel.n1;
    const n2 = this.panel.n2;
    const narr = this.narr;

    // draw help text
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("use arrow keys to move", word_coords.width / 2, fieldy); 
    ctx.restore();

    ctx.strokeStyle = '#ffeeee';
    ctx.beginPath();
    for (let i = 0; i <= narr[n2]; ++i) {
      ctx.moveTo(fieldx + i * maze_width / narr[n2], fieldy);  
      ctx.lineTo(fieldx + i * maze_width / narr[n2], fieldy + maze_height);
    }
    for (let i = 0; i <= narr[n1]; ++i) {
      ctx.moveTo(fieldx, i * maze_height / narr[n1] + fieldy);  
      ctx.lineTo(fieldx + maze_width, i * maze_height / narr[n1] + fieldy);
    }
    ctx.stroke();
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.rect(fieldx, fieldy, maze_width, maze_height);
    ctx.stroke();
    const a = this.a;
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    const scoords = MazeGenerator.index2coords(this.narr, this.s);
    const freedims = Array.from(new Array(this.narr.length),(val,index) => index).filter(x => ![n1, n2].includes(x));
    a.forEach((x, ind) => {
      const coords = MazeGenerator.index2coords(this.narr, ind);
      const coordsInSPlain = coords.filter((e, eind) => freedims.includes(eind) && e == scoords[eind]).length == this.narr.length - 2;
      if (coordsInSPlain) {
        if (x & 1 << n1) {
          ctx.moveTo(fieldx +       coords[n2] * maze_width / this.narr[n2], fieldy + (coords[n1] + 1) * maze_height / this.narr[n1]);
          ctx.lineTo(fieldx + (coords[n2] + 1) * maze_width / this.narr[n2], fieldy + (coords[n1] + 1) * maze_height / this.narr[n1]);
        }
        if (x & 1 << n2) {
          ctx.moveTo(fieldx + (coords[n2] + 1) * maze_width / this.narr[n2], fieldy +       coords[n1] * maze_height / this.narr[n1]);
          ctx.lineTo(fieldx + (coords[n2] + 1) * maze_width / this.narr[n2], fieldy + (coords[n1] + 1) * maze_height / this.narr[n1]);
        }
      }
    });
    ctx.stroke();
    const tcoords = MazeGenerator.index2coords(this.narr, this.t);
    const tCoordsInSPlain = tcoords.filter((e, eind) => freedims.includes(eind) && e == scoords[eind]).length == this.narr.length - 2;
    if (tCoordsInSPlain) {
      ctx.save();
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = maze_width / this.narr[n2] * 20 / 133;
      ctx.strokeRect(fieldx + (tcoords[n2] + 0.2) * maze_width / this.narr[n2],
                     fieldy + (tcoords[n1] + 0.2) * maze_height / this.narr[n1],
                     maze_width / this.narr[n2] * 0.6,
                     maze_height / this.narr[n1] * 0.6);
      ctx.restore();
    }
    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(fieldx + (scoords[n2] + 0.5) * maze_width / this.narr[n2],
            fieldy + (scoords[n1] + 0.5) * maze_height / this.narr[n1],
            maze_width  / this.narr[n2] * (0.1 + (this.s == this.t ? 0 : 0.2)),
            0, Math.PI * 2);
    ctx.fill();
    if (this.s == this.t) {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#ff0000';
      ctx.font = "100px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Won", word_coords.width / 2, word_coords.height / 2); 
      ctx.restore();
    }
    this.panel.draw();
  }
  move(course) {
    const scoords = MazeGenerator.index2coords(this.narr, this.s);
    const dimN1orN2 = Math.floor(course / 2);
    const realDim = dimN1orN2 ? this.panel.n2 : this.panel.n1;
    const delta = (course % 2) * 2 - 1;
    const scoords_from = scoords.slice();
    scoords[realDim] += delta;
    if (scoords[realDim] >= 0 &&
        scoords[realDim] < this.narr[realDim] &&
        !(this.a[MazeGenerator.coords2index(this.narr, delta > 0 ? scoords_from : scoords)] & (1<<realDim))) {
      this.s = MazeGenerator.coords2index(this.narr, scoords);
    }
  }
  moveUp() { this.move(0); }
  moveDown() { this.move(1); }
  moveLeft() { this.move(2); }
  moveRight() { this.move(3); }
  click(x, y) { this.panel.click(x, y); }
}

class MazePanel {
  constructor(ctx, word_coords, dimcount) {
    this.ctx = ctx;
    this.word_coords = word_coords;
    this.dimcount = dimcount;
    this.n1 = 0;
    this.n2 = 1;
    this.selDim = -1;

    // draw conf
    this.side = 40;
    this.gap = 10;
    this.panel_width = this.side * this.dimcount + this.gap * (this.dimcount - 1);
    this.panelx = this.word_coords.width / 2 - this.panel_width / 2;
    this.panely = this.word_coords.height - this.side * 2;
  }
  draw() {
    const ctx = this.ctx;
    const word_coords = this.word_coords;

    // draw help text for panel
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    ctx.font = "30px Arial";
    ctx.textBaseline = "middle";
    ctx.fillText("use mouse to select", this.panelx + this.dimcount * (this.gap + this.side), this.panely + this.side / 2); 
    ctx.restore();

    for (let i = 0; i < this.dimcount; ++i) {
      ctx.strokeStyle = "#00aaaa";
      ctx.strokeRect(this.panelx + i * (this.gap + this.side), this.panely, this.side, this.side);
    }
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(this.panelx + this.n1 * (this.gap + this.side) + 5, this.panely + 5, this.side - 10, this.side - 10);
    ctx.fillStyle = "#ff8800";
    ctx.fillRect(this.panelx + this.n2 * (this.gap + this.side) + 5, this.panely + 5, this.side - 10, this.side - 10);
    if (this.selDim >= 0) {
      ctx.save();
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 5;
      ctx.strokeRect(this.panelx + this.selDim * (this.gap + this.side), this.panely, this.side, this.side);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#ffffff';
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Choose two dimensions for projection on 2D plane of screen", word_coords.width / 2, word_coords.height - 10); 
    ctx.restore();
  }
  click(x, y) {
    for (let i = 0; i < this.dimcount; ++i) {
      if (x >= this.panelx + i * (this.gap + this.side) && x <= this.panelx + i * (this.gap + this.side) + this.side &&
          y >= this.panely && y <= this.panely + this.side) {
        this.clickDim(i);
      }
    }
  }
  clickDim(i) {
    if (this.selDim < 0) {
      if ([this.n1, this.n2].includes(i)) this.selDim = i;
    } else {
      if (this.selDim == this.n1) { if (i == this.n2) [this.n1, this.n2] = [this.n2, this.n1]; else this.n1 = i; } else
      if (this.selDim == this.n2) { if (i == this.n1) [this.n1, this.n2] = [this.n2, this.n1]; else this.n2 = i; }
      this.selDim = -1;
    }
  }
}

function fun () {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const maze = new Maze(ctx, {width, height});

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp": maze.moveUp(); break;
      case "ArrowDown": maze.moveDown(); break;
      case "ArrowLeft": maze.moveLeft(); break;
      case "ArrowRight": maze.moveRight(); break;
      default: console.log(e.key);
    }
  });

  document.addEventListener("click", (e) => {
    const rect = e.target.getBoundingClientRect();
    maze.click((e.x - rect.left) * width / cwidth, (e.y - rect.top) * height / cheight);
  });

  function animate(ts) {
    // animation loop
    setTimeout(() => requestAnimationFrame(animate), 1000 / fps);

    // clear canvas
    ctx.clearRect(0, 0, width, height);

    // draw fps
    ctx.strokeStyle = '#000000';
    ctx.font = "30px Arial";
    ctx.strokeText(fps + "fps " + (Math.floor(ts / 10) / 100) + " seconds", 30, 30); 
    
    // draw maze
    maze.draw();
  }
  animate(0);
}

window.onload = () => {
  const canvas = document.querySelector("canvas");
  canvas.style.width = cwidth;
  canvas.style.height = cheight;
  canvas.width = width;
  canvas.height = height;

  document.querySelector("canvas").addEventListener("click", fun, {once: true});
  setTimeout(() => document.querySelector("canvas").click(), 1000);
}
