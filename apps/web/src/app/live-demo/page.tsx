/**
 * /live-demo → /live-demo/maths
 *
 * The per-subject implementation lives in [subject]/page.tsx so the route is
 * always parameterised; this index just picks a sensible default landing.
 */
import { redirect } from 'next/navigation';

export default function LiveDemoIndex(): never {
  redirect('/live-demo/maths');
}
