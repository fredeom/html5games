const cwidth = 700;
const cheight = 400;
const width = 1000;
const height = width / cwidth * cheight;
const fps = 10;
const w = Math.PI * 2 / 20;
const acc = 5;
const cool_down_max = 0.5 * fps;
const max_bullets_on_field = 5;

class VisualObject {
  cross(other) { return !(Math.abs(this.x - other.x) > 100 && Math.abs(this.y - other.y) > 100); }
}

class Ship extends VisualObject {
  constructor(ctx, world_coords) {
    super();
    this.ctx = ctx;
    this.world_coords = world_coords;
    this.x = 0;
    this.y = 0;
    this.ssa = - Math.PI / 2;
    this.a = - Math.PI / 2;
    this.v = 0;
    this.isDestroyed = false;
  }
  draw() {
    const ctx = this.ctx;
    const world_coords = this.world_coords;
    const sx = world_coords.x + this.x;
    const sy = world_coords.y + this.y;
    const dx = 30 * Math.cos(this.ssa);
    const dy = 30 * Math.sin(this.ssa);
    if (this.isDestroyed) {
      ctx.beginPath();
      ctx.moveTo(sx + 30 * Math.cos(0 / 5 * 2 * Math.PI + this.ssa), sy + 30 * Math.sin(0 / 5 * 2 * Math.PI + this.ssa));
      for (let i = 0; i < 6; i++) ctx.lineTo(sx + 30 * Math.cos(i / 5 * 4 * Math.PI + this.ssa), sy + 30 * Math.sin(i / 5 * 4 * Math.PI + this.ssa));
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.moveTo(sx+3, sy);
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.moveTo(sx - dy / 2, sy + dx / 2);
      ctx.lineTo(sx + dx, sy + dy);
      ctx.lineTo(sx + dy / 2, sy - dx / 2);
      ctx.stroke();
    }
  }
  move() {
    this.x += this.v * Math.cos(this.a);
    this.y += this.v * Math.sin(this.a);
    if (this.x < - this.world_coords.width / 2) this.x += this.world_coords.width;
    if (this.x > this.world_coords.width / 2) this.x -= this.world_coords.width;
    if (this.y < - this.world_coords.height / 2) this.y += this.world_coords.height;
    if (this.y > this.world_coords.height / 2) this.y -= this.world_coords.height;

    if (this.v > 30) this.v = this.v * 0.9;
    if (this.v < 10) this.v = this.v * 0.9;

    this.draw();
  }
  acceleration(acc) {
    if (this.isDestroyed) return;
    const dvx = Math.cos(this.ssa) * acc;
    const dvy = Math.sin(this.ssa) * acc;
    const vx = Math.cos(this.a) * this.v;
    const vy = Math.sin(this.a) * this.v;
    const vx1 = vx + dvx;
    const vy1 = vy + dvy;
    this.v = Math.sqrt(vx1*vx1 + vy1*vy1);
    this.a = Math.atan2(vy1, vx1);
  }
  forward() {
    this.acceleration(acc);
  }
  backward() { 
    this.acceleration(-acc);
  }
  turn(angle) {
    if (this.isDestroyed) return;
    this.ssa += angle;
    while (this.ssa >= Math.PI ) this.ssa -= Math.PI * 2;
    while (this.ssa <= -Math.PI) this.ssa += Math.PI * 2;
    this.draw(); 
  }
  left() {
    this.turn(-w);
  }
  right() {
    this.turn(+w);
  }
  fire(bullets) {
    if (this.isDestroyed) return;
    bullets.push(new Bullet(this.ctx, this.world_coords, {x: this.x, y: this.y, v: 30, a: this.ssa}));
    while (bullets.length > max_bullets_on_field) bullets.splice(0, 1);    
  }
  crossAsteroids(asteroids) {
    let isCross = false;
    asteroids.forEach(a => {
      if (super.cross(a)) {
        if ((this.x - a.x)*(this.x - a.x) + (this.y - a.y)*(this.y - a.y) <= (30 + a.size * 10)*(30 + a.size * 10)) {
          this.destroy();
        }
      }
    })
  }
  destroy() {
    this.isDestroyed = true;
  }
  teleport(asteroids) {
    if (this.isDestroyed) return;
    const w = this.world_coords.width, h = this.world_coords.height;
    let left = - w / 2, right = w / 2, top = - h / 2, bottom = h / 2;
    this.x = (Math.random() - 0.5) * w;
    this.y = (Math.random() - 0.5) * h;
    let periods = 10;
    while (periods--) {
      const middlevertical = (left + right) / 2;
      const middlehorizontal = (top + bottom) / 2;
      let countleft = 0, countright = 0, counttop = 0, countbottom = 0;
      asteroids.forEach(a => {
        if (a.x >= left && a.x <= middlevertical) countleft++;
        if (a.x >= middlevertical && a.x <= right) countright++;
        if (a.y >= top && a.y <= middlehorizontal) counttop++;
        if (a.y >= middlehorizontal && a.y <= bottom) countbottom++;
      });
      if (!countleft && !countright && !counttop && !countbottom) {
        this.x = middlevertical;
        this.y = middlehorizontal;
        break;
      }
      if (countleft < countright) right = middlevertical; else left = middlevertical;
      if (countbottom < counttop) top = middlehorizontal; else bottom = middlehorizontal;
    }
  }
}

class Bullet extends VisualObject {
  constructor(ctx, world_coords, start_props) {
    super();
    this.ctx = ctx;
    this.world_coords = world_coords;
    this.x = start_props.x;
    this.y = start_props.y;
    this.v = start_props.v;
    this.a = start_props.a;
    this.ttl = fps * 5;
  }
  draw() {
    const ctx = this.ctx;
    const world_coords = this.world_coords;
    ctx.beginPath();
    const sx = world_coords.x + this.x;
    const sy = world_coords.y + this.y;
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  move() {
    this.x += this.v * Math.cos(this.a);
    this.y += this.v * Math.sin(this.a);
    if (this.x < - this.world_coords.width / 2) this.x += this.world_coords.width;
    if (this.x > this.world_coords.width / 2) this.x -= this.world_coords.width;
    if (this.y < - this.world_coords.height / 2) this.y += this.world_coords.height;
    if (this.y > this.world_coords.height / 2) this.y -= this.world_coords.height;

    this.ttl -= 1;

    this.draw();

    return this;
  }
  crossAsteroids(asteroids) {
    asteroids.forEach((a, aind) => {
      if (super.cross(a) && this.ttl > 0) {
        if ((this.x - a.x)*(this.x - a.x) + (this.y - a.y)*(this.y - a.y) <= (3 + a.size * 10)*(3 + a.size * 10)) {
          this.ttl = 0;
          a.crack(asteroids, aind);
        }
      }
    })

    return this;
  }
}

class Asteroid extends VisualObject {
  constructor(ctx, world_coords, start_props) {
    super();
    this.ctx = ctx;
    this.world_coords = world_coords;
    this.x = start_props.x;
    this.y = start_props.y;
    this.v = start_props.v;
    this.a = start_props.a;
    this.size = start_props.size;
  }
  draw() {
    const ctx = this.ctx;
    const world_coords = this.world_coords;
    ctx.beginPath();
    const sx = world_coords.x + this.x;
    const sy = world_coords.y + this.y;
    ctx.arc(sx, sy, this.size * 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  move() {
    this.x += this.v * Math.cos(this.a);
    this.y += this.v * Math.sin(this.a);
    if (this.x < - this.world_coords.width / 2) this.x += this.world_coords.width;
    if (this.x > this.world_coords.width / 2) this.x -= this.world_coords.width;
    if (this.y < - this.world_coords.height / 2) this.y += this.world_coords.height;
    if (this.y > this.world_coords.height / 2) this.y -= this.world_coords.height;

    this.draw();

    return this;
  }
  crack(asteroids, aind) {
    const [a] = asteroids.splice(aind, 1);
    if (a.size > 1) {
      for (let i = 0; i < 2; ++i) {
          asteroids.push(
            new Asteroid(this.ctx, this.world_coords,
                              {x : (Math.random() - 0.5) * 30 + a.x,
                               y : (Math.random() - 0.5) * 30 + a.y,
                               v: 3 + Math.random() * 10,
                               a: Math.random() * Math.PI * 2,
                               size: a.size - 1}));
      }
    }
  }
}

function fun () {
  const canvas = document.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  let asteroids = [];
  for (let i = 0; i < 5; ++i)
    asteroids.push(
      new Asteroid(ctx, {width, height, x : width / 2, y : height / 2},
                        {x : (Math.random() - 0.5) * width,
                         y : (Math.random() - 0.5) * height,
                         v: 3 + Math.random() * 10,
                         a: Math.random() * Math.PI * 2,
                         size: 1 + Math.floor(Math.random()*5)}));

  let bullets = [];
  let cool_down = cool_down_max;

  const ship = new Ship(ctx, {width, height, x : width / 2, y : height / 2});

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp": ship.forward(); break;
      case "ArrowDown": ship.backward(); break;
      case "ArrowLeft": ship.left(); break;
      case "ArrowRight": ship.right(); break;
      case " ": if (cool_down <= 0) { ship.fire(bullets); cool_down = cool_down_max; }; break;
      case "t": ship.teleport(asteroids); break;
      default: console.log(e.key);
    }
  });

  function animate(ts) {
    // animation loop
    setTimeout(() => { requestAnimationFrame(animate); }, 1000 / fps);

    // clear canvas
    ctx.clearRect(0, 0, width, height);

    // draw fps
    ctx.font = "30px Arial";
    ctx.strokeText(fps + "fps " + (Math.floor(ts / 10) / 100) + " seconds", 30, 30); 

    // move and draw ship
    ship.move();
    
    // move and draw bullets
    bullets = bullets.map(b => b.move()).filter(b => b.ttl > 0);

    // gun cool down
    cool_down--;

    // move and draw asteroids
    asteroids = asteroids.map(a => a.move()).filter(a => a.size > 0);

    // check if ship bumps asteroids
    ship.crossAsteroids(asteroids);

    // check if bullets bump asteroids
    bullets = bullets.map(b => b.crossAsteroids(asteroids)).filter(b => b.ttl > 0);
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
