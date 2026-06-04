/**
 * Anime SVG portraits for all six teachers.
 *
 * Render <TeacherPortraitDefs /> ONCE near the root layout, then anywhere
 * else use <TeacherPortrait slug="vihaan" className="w-12 h-12" />.
 */
import * as React from 'react';

export type TeacherSlug = 'praketa' | 'vihaan' | 'adhvara' | 'harini' | 'anika' | 'amita';

export const TEACHER_META: Record<TeacherSlug, { name: string; subject: string; day: string; color: string; tint: string }> = {
  praketa: { name: 'Praketa', subject: 'Mathematics', day: 'Mon', color: '#D97706', tint: '#FEF3C7' },
  vihaan:  { name: 'Vihaan',  subject: 'Science',     day: 'Tue', color: '#059669', tint: '#D1FAE5' },
  adhvara: { name: 'Adhvara', subject: 'Social',      day: 'Wed', color: '#B45309', tint: '#FED7AA' },
  harini:  { name: 'Harini',  subject: 'Kannada',     day: 'Thu', color: '#B8860B', tint: '#FEF3C7' },
  anika:   { name: 'Anika',   subject: 'English',     day: 'Fri', color: '#65A30D', tint: '#ECFCCB' },
  amita:   { name: 'Amita',   subject: 'Hindi',       day: 'Sat', color: '#92400E', tint: '#FED7AA' },
};

export function TeacherPortraitDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <radialGradient id="skin" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFE6CF" />
          <stop offset="100%" stopColor="#F4C49B" />
        </radialGradient>

        <symbol id="face-praketa" viewBox="0 0 120 120">
          <ellipse cx="60" cy="65" rx="38" ry="42" fill="url(#skin)" />
          <path d="M22 60 Q24 20 60 18 Q96 20 98 60 Q96 38 80 36 Q70 56 60 38 Q50 56 40 36 Q24 38 22 60Z" fill="#3F2418" />
          <ellipse cx="22" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <ellipse cx="98" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <g className="blink-eye"><ellipse cx="46" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="46" cy="69" rx="4" ry="6" fill="#1F1611" /></g>
          <g className="blink-eye" style={{ animationDelay: '.2s' }}><ellipse cx="74" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="74" cy="69" rx="4" ry="6" fill="#1F1611" /></g>
          <path d="M52 92 Q60 98 68 92" stroke="#9F1239" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>

        <symbol id="face-vihaan" viewBox="0 0 120 120">
          <ellipse cx="60" cy="65" rx="38" ry="42" fill="url(#skin)" />
          <path d="M20 56 Q24 18 60 16 Q96 18 100 56 Q90 32 78 38 L84 22 L74 36 L66 18 L60 36 L52 18 L46 36 L36 22 L42 38 Q30 32 20 56Z" fill="#2B1410" />
          <ellipse cx="22" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <ellipse cx="98" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <g className="blink-eye"><ellipse cx="46" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="46" cy="69" rx="4" ry="6" fill="#059669" /></g>
          <g className="blink-eye" style={{ animationDelay: '.2s' }}><ellipse cx="74" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="74" cy="69" rx="4" ry="6" fill="#059669" /></g>
          <path d="M52 92 Q60 98 68 92" stroke="#9F1239" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>

        <symbol id="face-adhvara" viewBox="0 0 120 120">
          <ellipse cx="60" cy="65" rx="38" ry="42" fill="url(#skin)" />
          <path d="M22 56 Q22 20 60 18 Q96 18 100 56 Q102 44 96 38 Q70 30 50 38 Q44 28 36 34 Q26 38 22 56Z" fill="#1F1611" />
          <ellipse cx="22" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <ellipse cx="98" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <g className="blink-eye"><ellipse cx="46" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="46" cy="69" rx="4" ry="6" fill="#B45309" /></g>
          <g className="blink-eye" style={{ animationDelay: '.2s' }}><ellipse cx="74" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="74" cy="69" rx="4" ry="6" fill="#B45309" /></g>
          <path d="M52 92 Q60 98 68 92" stroke="#9F1239" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>

        <symbol id="face-harini" viewBox="0 0 120 120">
          <path d="M18 58 Q14 110 60 112 Q106 110 102 58 Q102 18 60 16 Q18 18 18 58Z" fill="#3F2418" />
          <ellipse cx="60" cy="65" rx="36" ry="40" fill="url(#skin)" />
          <ellipse cx="22" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <ellipse cx="98" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <g className="blink-eye"><ellipse cx="46" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="46" cy="69" rx="4" ry="6" fill="#B8860B" /></g>
          <g className="blink-eye" style={{ animationDelay: '.2s' }}><ellipse cx="74" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="74" cy="69" rx="4" ry="6" fill="#B8860B" /></g>
          <path d="M52 92 Q60 98 68 92" stroke="#9F1239" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="48" r="2" fill="#9F1239" />
        </symbol>

        <symbol id="face-anika" viewBox="0 0 120 120">
          <path d="M18 56 Q14 92 60 98 Q106 92 102 56 Q102 16 60 14 Q18 16 18 56Z" fill="#2B1410" />
          <ellipse cx="60" cy="65" rx="36" ry="40" fill="url(#skin)" />
          <ellipse cx="22" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <ellipse cx="98" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <g className="blink-eye"><ellipse cx="46" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="46" cy="69" rx="4" ry="6" fill="#65A30D" /></g>
          <g className="blink-eye" style={{ animationDelay: '.2s' }}><ellipse cx="74" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="74" cy="69" rx="4" ry="6" fill="#65A30D" /></g>
          <circle cx="46" cy="69" r="10" fill="none" stroke="#B8860B" strokeWidth="1.6" />
          <circle cx="74" cy="69" r="10" fill="none" stroke="#B8860B" strokeWidth="1.6" />
          <line x1="56" y1="69" x2="64" y2="69" stroke="#B8860B" strokeWidth="1.6" />
          <path d="M52 96 Q60 102 68 96" stroke="#9F1239" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </symbol>

        <symbol id="face-amita" viewBox="0 0 120 120">
          <ellipse cx="60" cy="14" rx="14" ry="10" fill="#3F2418" />
          <path d="M22 56 Q22 22 60 22 Q98 22 98 56 Q88 36 60 34 Q32 36 22 56Z" fill="#3F2418" />
          <ellipse cx="60" cy="65" rx="38" ry="42" fill="url(#skin)" />
          <ellipse cx="22" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <ellipse cx="98" cy="68" rx="5" ry="8" fill="url(#skin)" />
          <g className="blink-eye"><ellipse cx="46" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="46" cy="69" rx="4" ry="6" fill="#92400E" /></g>
          <g className="blink-eye" style={{ animationDelay: '.2s' }}><ellipse cx="74" cy="68" rx="6" ry="8" fill="#fff" /><ellipse cx="74" cy="69" rx="4" ry="6" fill="#92400E" /></g>
          <path d="M52 92 Q60 98 68 92" stroke="#9F1239" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <circle cx="60" cy="48" r="1.6" fill="#9F1239" />
        </symbol>
      </defs>
    </svg>
  );
}

interface PortraitProps extends React.HTMLAttributes<HTMLDivElement> {
  slug: TeacherSlug;
  size?: number;
}

export function TeacherPortrait({ slug, size = 48, className, style, ...rest }: PortraitProps) {
  const meta = TEACHER_META[slug];
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: meta.tint,
        ...style,
      }}
      aria-label={`${meta.name}, ${meta.subject} teacher`}
      {...rest}
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <use href={`#face-${slug}`} />
      </svg>
    </div>
  );
}
