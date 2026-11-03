import { courses } from '../../../lib/academy-data';
import type { PublicMentor } from '../../../lib/platform-types';
import { getDb } from '../../../lib/server/db';
import { handleError,json } from '../../../lib/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';

export function GET(){try{
 const rows=getDb().prepare(`SELECT u.id,u.name,l.course_id FROM users u JOIN lessons l ON l.mentor_id=u.id WHERE l.published=1 AND u.role IN ('mentor','admin') ORDER BY u.name,l.created_at`).all() as {id:string;name:string;course_id:string}[];
 const mentors=new Map<string,PublicMentor>();
 for(const row of rows){
  const mentor=mentors.get(row.id)||{id:row.id,name:row.name,role:'App development mentor',teaches:[],yearsExperience:null,teachingStyle:null,portraitUrl:null};
  const course=courses[Number(row.course_id)];const teaches=course?.title||`Course ${row.course_id}`;
  if(!mentor.teaches.includes(teaches))mentor.teaches.push(teaches);
  mentors.set(row.id,mentor);
 }
 return json({mentors:Array.from(mentors.values())});
}catch(error){return handleError(error);}}
