'use client';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
export function Badge({ children, tone = 'orange' }: { children: ReactNode; tone?: 'orange' | 'blue' | 'muted' }) { return <span className={`badge badge-${tone}`}>{children}</span>; }
export function Progress({ value, label }: { value: number; label: string }) { const reduced=useReducedMotion();return <div className="progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><motion.span style={{width:'100%',transformOrigin:'left'}} initial={reduced?false:{scaleX:0}} whileInView={{scaleX:value/100}} viewport={{once:true}} transition={{duration:reduced?0:.45,ease:'easeOut'}} /></div>; }
export function SectionLabel({ children }: { children: ReactNode }) { return <div className="eyebrow">{children}</div>; }
