from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1];media=root/'public/media';tmp=Path('/workspace/scratch/yoh-video-frames');tmp.mkdir(exist_ok=True)
for i in range(6):
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',str(media/f'course-{i}.webp'),'-vf',"zoompan=z='1+0.00035*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=72:s=640x360:fps=24",'-t','3','-c:v','libx264','-preset','fast','-crf','27','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(media/f'course-{i}.mp4')],check=True)
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';mono='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def f(n,b=False):return ImageFont.truetype(bold if b else font,n)
steps=[('01 / START WITH A COMPONENT','Import View and Text from React Native. A component is a function that returns UI.'),('02 / GIVE IT A JOB','TaskCard receives a title prop. Reuse the same component with different text.'),('03 / GROUP THE CONTENT','View groups the content. Add padding and a background to make a readable card.'),('04 / SHOW THE TITLE','Text renders the title. Braces insert a JavaScript value into the JSX.'),('05 / REUSE THE CARD','Render TaskCard twice with different titles. One component, two tasks.'),('06 / TRY IT YOURSELF','Add a third TaskCard. Change its title, then adjust the padding and background.')]
lines=["import { View, Text } from 'react-native';",'',"function TaskCard({ title }: { title: string }) {","  return (","    <View style={{ padding: 16,","      backgroundColor: '#FFF0E6' }}>","      <Text>{title}</Text>","    </View>","  );","}",'',"export default function App() {","  return <View>","    <TaskCard title=\"Sketch the first screen\" />","    <TaskCard title=\"Build a reusable card\" />","  </View>;","}"]
for idx,(title,caption) in enumerate(steps):
 im=Image.new('RGB',(1280,720),'#fafaf8');d=ImageDraw.Draw(im)
 d.text((50,34),'YO TECH ACADEMY  /  FREE MICRO LESSON',font=f(15),fill='#8d6d51');d.text((50,76),'Build a reusable task card',font=f(35,True),fill='#222522')
 d.rounded_rectangle((50,145,850,590),16,fill='#29332c');d.text((75,165),'TaskCard.tsx',font=f(13),fill='#c2d2b4')
 limit=[1,3,6,10,17,17][idx]
 for n,line in enumerate(lines[:limit]):
  d.text((72,205+n*20),f'{n+1:02}',font=ImageFont.truetype(mono,12),fill='#82907d')
  d.text((108,205+n*20),line,font=ImageFont.truetype(mono,13),fill='#e8dfca' if n<12 else '#c8dcae')
 d.rounded_rectangle((905,145,1215,590),25,fill='#fffdf9',outline='#d7dfca',width=2);d.text((930,178),'YOUR APP',font=f(12),fill='#7c886b')
 for j,t in enumerate(['Sketch the first screen','Build a reusable card'][:0 if idx<3 else (1 if idx==3 else 2)]):
  d.rounded_rectangle((928,228+j*90,1193,300+j*90),10,fill='#fff0e6');d.text((945,252+j*90),t,font=f(16),fill='#835634')
 d.text((50,616),title,font=f(15,True),fill='#c74717')
 import textwrap
 for n,line in enumerate(textwrap.wrap(caption,105)):d.text((50,650+n*25),line,font=f(17),fill='#59634f')
 im.save(tmp/f'slide-{idx}.png')
with open(tmp/'list.txt','w') as o:
 for idx in range(6):o.write(f"file '{tmp}/slide-{idx}.png'\nduration 8\n")
 o.write(f"file '{tmp}/slide-5.png'\n")
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(tmp/'list.txt'),'-t','48','-vf','fps=24','-c:v','libx264','-crf','24','-preset','fast','-pix_fmt','yuv420p','-an','-movflags','+faststart',str(media/'task-card-lesson.mp4')],check=True)
Image.open(tmp/'slide-4.png').save(media/'lesson-poster.webp',quality=90)
with open(media/'lesson-captions.vtt','w') as o:
 o.write('WEBVTT\n\n')
 for i,(t,c) in enumerate(steps):o.write(f'{i+1}\n00:00:{i*8:02}.000 --> 00:00:{(i+1)*8:02}.000\n{c}\n\n')
print('Created six 3-second loops and the 48-second sample lesson.')
