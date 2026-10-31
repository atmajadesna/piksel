const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const assert=require('node:assert/strict');
const url=process.env.TEST_URL||'file://'+process.cwd()+'/index.html';
async function gambar(p,dx){await p.locator('#kanvas').scrollIntoViewIfNeeded();const box=await p.locator('#kanvas').boundingBox();const x=box.x+box.width/2,y=box.y+box.height/2;
await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dx,{steps:6});await p.mouse.up();await p.waitForTimeout(120);}
const isi=(p)=>p.evaluate(()=>{const c=document.querySelector('#kanvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n;});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
for(const w of [320,375,414,768,1280]){const p=await b.newPage({viewport:{width:w,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForTimeout(300);
const awal=await isi(p);
await p.locator('[data-alat="pensil"]').click();await gambar(p,60);
const afterDraw=await isi(p);assert(afterDraw>awal,'pencil paints pixels');
await p.locator('#urungkan').click();await p.waitForTimeout(150);
assert.equal(await isi(p),awal,'undo restores the previous state');
await p.locator('#ulangi').click();await p.waitForTimeout(150);
assert.equal(await isi(p),afterDraw,'redo restores the stroke');
await p.locator('[data-alat="penghapus"]').click();await gambar(p,60);
assert((await isi(p))<afterDraw,'eraser removes pixels');
await p.locator('#bersihkan').click();await p.waitForTimeout(150);
assert.equal(await isi(p),0,'clear empties the canvas');
await p.locator('[data-ukuran="16"]').click();await p.waitForTimeout(200);
assert.equal(await p.locator('#kanvas').evaluate(c=>c.width),16,'canvas resizes to 16px');
await p.locator('[data-alat="pensil"]').click();await gambar(p,6);
await p.locator('#simpan').click();await p.waitForTimeout(300);
const jumlah=await p.locator('#galeri .galeri__item').count();
assert(jumlah>0,'saving adds a gallery entry');
if(w<=560){const bar=await p.locator('.tindakan__utama').boundingBox();assert(bar&&bar.y+bar.height<=900,'mobile action bar stays in the viewport');assert.equal(Math.round(bar.x),12,'action bar respects page padding');}
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.equal(errors.length,0);
console.log(w,'PASS draw/undo/redo/eraser/clear/resize/save');await p.close();}
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
