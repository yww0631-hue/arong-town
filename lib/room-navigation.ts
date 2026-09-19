export type Point = { x: number; y: number };
export type Obstacle = { x: number; y: number; w: number; h: number };
export const furniture: Obstacle[] = [
  { x: 120, y: 200, w: 200, h: 240 },
  { x: 400, y: 200, w: 200, h: 240 },
  { x: 680, y: 200, w: 200, h: 240 },
];
// 每个房间使用独立家具轮廓与可到达的互动站位，坐标范围 0—1000。
export const roomLayouts:{obstacles:Obstacle[];spots:Point[]}[]=[
 {obstacles:[{x:90,y:220,w:285,h:375},{x:645,y:370,w:255,h:275},{x:85,y:640,w:310,h:220}],spots:[{x:425,y:500},{x:600,y:575},{x:425,y:775}]},
 {obstacles:[{x:85,y:375,w:215,h:270},{x:330,y:285,w:330,h:310},{x:705,y:185,w:220,h:310}],spots:[{x:325,y:700},{x:500,y:650},{x:800,y:550}]},
 {obstacles:[{x:70,y:180,w:250,h:480},{x:585,y:460,w:340,h:300},{x:700,y:180,w:215,h:225}],spots:[{x:375,y:475},{x:550,y:650},{x:650,y:325}]},
 {obstacles:[{x:80,y:200,w:280,h:420},{x:645,y:260,w:260,h:190},{x:650,y:475,w:250,h:150},{x:75,y:650,w:130,h:170},{x:790,y:680,w:130,h:170}],spots:[{x:425,y:500},{x:600,y:375},{x:600,y:550}]},
 {obstacles:[{x:90,y:175,w:265,h:255},{x:315,y:430,w:390,h:310},{x:700,y:160,w:215,h:285},{x:835,y:465,w:90,h:195}],spots:[{x:250,y:500},{x:500,y:800},{x:775,y:500}]},
];
// 脚底碰撞留出身体半径，寻路沿四邻格移动，不从家具角上穿过。
export const canWalk = (p: Point, obstacles:Obstacle[]=furniture) => p.x >= 80 && p.x <= 920 && p.y >= 140 && p.y <= 900 &&
  !obstacles.some(r => p.x > r.x - 28 && p.x < r.x + r.w + 28 && p.y > r.y - 22 && p.y < r.y + r.h + 22);
export function findRoute(start: Point, goal: Point, obstacles:Obstacle[]=furniture): Point[] {
  const cell = (p: Point) => ({ x: Math.round(p.x / 25), y: Math.round(p.y / 25) });
  const source = cell(start), target = cell(goal);
  const key = (p: Point) => `${p.x},${p.y}`;
  const queue = [source], previous = new Map<string, Point | null>([[key(source), null]]);
  let found: Point | null = null;
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === target.x && p.y === target.y) { found = p; break; }
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const next = { x: p.x + dx, y: p.y + dy };
      if (!previous.has(key(next)) && canWalk({x:next.x*25,y:next.y*25},obstacles)) {
        previous.set(key(next), p); queue.push(next);
      }
    }
  }
  if (!found) return [];
  const result: Point[] = [];
  while (found) { result.push({x:found.x*25,y:found.y*25}); found = previous.get(key(found)) ?? null; }
  return result.reverse();
}
