// Offline public-reference audit. Video and landmark arrays never reach the app backend.
import {writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium} from '../../frontend/node_modules/playwright/index.mjs';

const [videoArg, outputArg] = process.argv.slice(2);
if (!videoArg || !outputArg) throw new Error('Usage: node AI_model/vsl_v2/compare-video.mjs public.mp4 report.json');
const video = resolve(videoArg);
const legacyRun = spawnSync('AI_model/extractor-runtime/.venv/bin/python',
  ['-m','AI_model.vsl_v2.legacy_extract','--video',video],
  {encoding:'utf8',maxBuffer:100*1024*1024});
if (legacyRun.status!==0) throw new Error(legacyRun.stderr);
const legacy=JSON.parse(legacyRun.stdout);
const browser=await chromium.launch({executablePath:process.env.SIGNLY_CHROMIUM_PATH});
try {
  const page=await browser.newPage();
  await page.goto('http://localhost:5173/');
  const frames=await page.evaluate(async ({fps,images})=>{
    const {TasksHolisticDetector}=await import('/src/services/vsl/TasksHolisticDetector.ts');
    const detector=new TasksHolisticDetector();
    const frames=[];
    try {
      await detector.initialize();
      for(let i=0;i<images.length;i++){
        const bytes=Uint8Array.from(atob(images[i]),c=>c.charCodeAt(0));
        const image=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
        try {frames.push(detector.detectFrame(image,i*1000/fps).frame.landmarks);}
        finally {image.close();}
      }
      return frames;
    } finally {detector.close();}
  },{fps:legacy.fps,images:legacy.source_images});

  const legacyPage=await browser.newPage();
  await legacyPage.goto('http://localhost:5173/');
  const legacyWebFrames=await legacyPage.evaluate(async ({images,fps})=>{
    const {HolisticDetector}=await import('/src/services/vsl/HolisticDetector.ts');
    const detector=new HolisticDetector();
    const frames=[];
    try {
      await detector.initialize();
      for(let i=0;i<images.length;i++){
        const bytes=Uint8Array.from(atob(images[i]),c=>c.charCodeAt(0));
        const image=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
        try {frames.push((await detector.detectFrame(image,i*1000/fps)).frame.landmarks);}
        finally {image.close();}
      }
      return frames;
    } finally {detector.close();}
  },{images:legacy.source_images,fps:legacy.fps});
  delete legacy.source_images;
  const {mkdtemp,rm}=await import('node:fs/promises');
  const directory=await mkdtemp('/tmp/signly-extractor-');
  try {
    const input=resolve(directory,'public-input.json');
    await writeFile(input,JSON.stringify({legacy,browser:{frames,video_sha256:legacy.video_sha256},
      legacy_web:{frames:legacyWebFrames,video_sha256:legacy.video_sha256}}));
    const result=spawnSync('AI_model/runtime/.venv/bin/python',
      ['-m','AI_model.vsl_v2.compare_extractors','--input',input,'--output',resolve(outputArg)],
      {encoding:'utf8'});
    if(result.status!==0) throw new Error(result.stderr);
  } finally {await rm(directory,{recursive:true,force:true});}
} finally {await browser.close();}
