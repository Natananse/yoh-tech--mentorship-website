import { readFile } from 'node:fs/promises';
import path from 'node:path';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument,PDFString,PageSizes,rgb,type PDFFont,type PDFPage,type RGB } from 'pdf-lib';
import type { Certificate } from '../platform-types';
import { ApiError } from './http';

type Typeface={font:PDFFont;characters:Set<number>};
type Fonts={heading:Typeface;body:Typeface;mono:Typeface;ethiopic:Typeface};
let fontBytes:Promise<Buffer[]>|undefined;

function familyFor(text:string,primary:Typeface,fonts:Fonts):Typeface{
 const supports=(face:Typeface)=>Array.from(text).every(character=>face.characters.has(character.codePointAt(0)!));
 for(const face of [primary,fonts.body,fonts.ethiopic])if(supports(face))return face;
 throw new ApiError(422,'The certificate name includes characters outside the installed font coverage. Ask the academy to add the matching font.');
}
function graphemes(text:string):string[]{
 return Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text),part=>part.segment);
}
function spaceAdvance(size:number,primary:Typeface):number{
 return Math.max(primary.font.widthOfTextAtSize(' ',size),size*0.28);
}
function textWidth(text:string,size:number,primary:Typeface,fonts:Fonts):number{
 return graphemes(text).reduce((total,part)=>total+(/^\s+$/.test(part)?spaceAdvance(size,primary):familyFor(part,primary,fonts).font.widthOfTextAtSize(part,size)),0);
}
function paintText(page:PDFPage,text:string,x:number,y:number,size:number,primary:Typeface,fonts:Fonts,color:RGB){
 let cursor=x;let pending='';let current:Typeface|undefined;
 const flush=()=>{if(!current||!pending)return;page.drawText(pending,{x:cursor,y,size,font:current.font,color});cursor+=current.font.widthOfTextAtSize(pending,size);pending='';};
 for(const part of graphemes(text)){
  // Position word spaces explicitly so a font switch cannot collapse them.
  if(/^\s+$/.test(part)){flush();current=undefined;cursor+=spaceAdvance(size,primary);continue;}
  const face=familyFor(part,primary,fonts);
  if(current!==face){flush();current=face;}
  pending+=part;
 }
 flush();
}
function wrap(text:string,size:number,width:number,primary:Typeface,fonts:Fonts):string[]{
 const lines:string[]=[];let line='';
 for(const word of text.trim().split(/\s+/)){
  const candidate=line?`${line} ${word}`:word;
  if(textWidth(candidate,size,primary,fonts)<=width){line=candidate;continue;}
  if(line){lines.push(line);line='';}
  for(const part of graphemes(word)){
   if(line&&textWidth(line+part,size,primary,fonts)>width){lines.push(line);line='';}
   line+=part;
  }
 }
 if(line)lines.push(line);return lines;
}
function fittedLines(text:string,width:number,startSize:number,minSize:number,maximumLines:number,primary:Typeface,fonts:Fonts){
 let size=startSize;let lines=wrap(text,size,width,primary,fonts);
 while(lines.length>maximumLines&&size>minSize){size-=1;lines=wrap(text,size,width,primary,fonts);}
 if(lines.length>maximumLines)throw new ApiError(422,'The certificate text is too long to fit this page. Ask the academy to adjust the display name.');
 return{size,lines};
}

export async function createCertificatePdf(certificate:Certificate,origin:string):Promise<Uint8Array>{
 const document=await PDFDocument.create();document.registerFontkit(fontkit);
 // Static TrueType fonts avoid variable-font composite glyph/subsetter failures.
 fontBytes ||= Promise.all(['bricolage-certificate.ttf','inter-certificate.ttf','jetbrains-certificate.ttf','noto-ethiopic-certificate.ttf'].map(name=>readFile(path.join(process.cwd(),'public','fonts',name))));
 const bytes=await fontBytes;const embedded=await Promise.all(bytes.map(value=>document.embedFont(value,{subset:false})));
 const faces=embedded.map(font=>({font,characters:new Set(font.getCharacterSet())}));
 const fonts:Fonts={heading:faces[0],body:faces[1],mono:faces[2],ethiopic:faces[3]};
 const page=document.addPage([PageSizes.A4[1],PageSizes.A4[0]]);const {width,height}=page.getSize();
 const paper=rgb(250/255,250/255,247/255),ink=rgb(14/255,15/255,19/255),muted=rgb(91/255,95/255,106/255),cobalt=rgb(43/255,80/255,1),yellow=rgb(1,228/255,92/255),hairline=rgb(228/255,228/255,223/255);
 const margin=52;const contentWidth=width-margin*2;
 page.drawRectangle({x:0,y:0,width,height,color:paper});
 page.drawRectangle({x:22,y:22,width:width-44,height:height-44,borderColor:hairline,borderWidth:1});
 page.drawRectangle({x:22,y:height-28,width:width-44,height:6,color:cobalt});
 paintText(page,'yo.',margin,height-72,29,fonts.heading,fonts,ink);
 paintText(page,'APP ACADEMY',margin+89,height-65,10,fonts.mono,fonts,muted);
 paintText(page,'YO Tech LLC',width-margin-105,height-65,12,fonts.body,fonts,muted);
 page.drawRectangle({x:margin-2,y:height-132,width:196,height:17,color:yellow});
 paintText(page,'Published lesson completion',margin,height-128,29,fonts.heading,fonts,ink);
 page.drawLine({start:{x:margin,y:height-154},end:{x:width-margin,y:height-154},color:hairline,thickness:1});
 paintText(page,'Presented to',margin,height-185,12,fonts.body,fonts,muted);
 const recipient=fittedLines(certificate.recipientName,contentWidth,38,21,2,fonts.heading,fonts);
 recipient.lines.forEach((line,index)=>paintText(page,line,margin,height-232-index*(recipient.size+6),recipient.size,fonts.heading,fonts,cobalt));
 paintText(page,'for completing the published lessons in',margin,278,12,fonts.body,fonts,muted);
 const course=fittedLines(certificate.courseTitle,contentWidth,27,19,2,fonts.heading,fonts);
 course.lines.forEach((line,index)=>paintText(page,line,margin,240-index*(course.size+5),course.size,fonts.heading,fonts,ink));
 const date=new Date(certificate.issuedAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Africa/Addis_Ababa'});
 paintText(page,`${certificate.completedLessonCount} published ${certificate.completedLessonCount===1?'lesson':'lessons'} completed as of ${date}.`,margin,169,12,fonts.body,fonts,ink);
 paintText(page,'A completion record issued by YO Tech LLC.',margin,148,11,fonts.body,fonts,muted);
 page.drawLine({start:{x:margin,y:121},end:{x:width-margin,y:121},color:hairline,thickness:1});
 paintText(page,'VERIFICATION ID',margin,97,9,fonts.mono,fonts,muted);
 paintText(page,certificate.id,margin,79,10,fonts.mono,fonts,ink);
 const verifyUrl=new URL(`/verify/${certificate.id}`,origin).href;
 paintText(page,verifyUrl,margin,52,8,fonts.mono,fonts,muted);
 const linkLabel='Verify this record';const linkSize=12;const linkWidth=textWidth(linkLabel,linkSize,fonts.body,fonts);const linkX=width-margin-linkWidth;
 paintText(page,linkLabel,linkX,85,linkSize,fonts.body,fonts,cobalt);
 const annotation=document.context.obj({Type:'Annot',Subtype:'Link',Rect:[linkX,81,linkX+linkWidth,103],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(verifyUrl)}});
 page.node.addAnnot(document.context.register(annotation));
 document.setTitle(`${certificate.recipientName} — ${certificate.courseTitle}`);document.setAuthor('YO Tech LLC');document.setSubject('Published lesson completion record');document.setCreationDate(new Date(certificate.issuedAt));
 return document.save();
}
