import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen, CalendarDays, Check, CheckCheck, ClipboardCheck, FileText,
  GraduationCap, LayoutDashboard, Megaphone, ShieldCheck, Users,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { getPublicSiteOrigin, SITE_DESCRIPTION } from "@/lib/site";
import styles from "./home.module.css";

// The public origin is supplied at container runtime, after the image is built.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const origin = getPublicSiteOrigin();
  return {
    title: { absolute: "E-LearningLKA | A home for teaching and learning" },
    description: SITE_DESCRIPTION,
    alternates: { canonical: origin },
    openGraph: {
      title: "E-LearningLKA | A home for teaching and learning",
      description: SITE_DESCRIPTION,
      url: origin,
      siteName: "E-LearningLKA",
      type: "website",
      locale: "en_LK",
    },
    twitter: { card: "summary", title: "E-LearningLKA", description: SITE_DESCRIPTION },
  };
}

const features = [
  { icon: CalendarDays, title: "Know what’s next", text: "Keep your class timetable, upcoming sessions, and recurring lessons together." },
  { icon: BookOpen, title: "Keep learning close", text: "Find teacher-shared notes, lesson materials, and class announcements in one place." },
  { icon: ClipboardCheck, title: "Make progress visible", text: "Take quizzes, submit assignments, and review results when your teacher publishes them." },
];

const questions = [
  { question: "Who is E-LearningLKA for?", answer: "Students and teachers who want a shared place to organise classes, learning materials, assessments, and updates. You choose your role when you register." },
  { question: "How do I join a teacher’s class?", answer: "Create a student account, browse the available classes, and send an enrollment request. Your teacher reviews the request before you can access the class content." },
  { question: "Can I manage my own classes as a teacher?", answer: "Yes. Register as a teacher to create classes, manage student access, organise schedules, share materials, and create and grade assessments." },
  { question: "Can I use it on my phone?", answer: "Yes. Open the website in your mobile browser to access your account. There is no separate app to install." },
];

function WorkspacePreview() {
  return (
    <div className={styles.previewStage} role="img" aria-label="Example classroom workspace with upcoming lessons, a timetable, and learning materials. Sample content, not live class data.">
      <div className={styles.previewWindow}>
        <div className={styles.previewBar}>
          <span className={styles.windowDots} aria-hidden="true"><i /><i /><i /></span>
          <span>YOUR LEARNING SPACE</span>
          <span className={styles.exampleBadge}>Example</span>
        </div>
        <div className={styles.previewBody}>
          <div className={styles.previewSidebar} aria-hidden="true">
            <span className={styles.previewBrand}><GraduationCap size={22} /></span>
            <span className={styles.previewNavActive}><LayoutDashboard size={18} /></span>
            <BookOpen size={18} /><CalendarDays size={18} /><ClipboardCheck size={18} />
          </div>
          <div className={styles.previewContent}>
            <div className={styles.previewGreeting}><div><span>LET’S KEEP MOVING</span><h2>A good day to learn.</h2></div><span className={styles.previewAvatar}>S</span></div>
            <div className={styles.previewSummary}><span><BookOpen size={16} /> My classes</span><span><CalendarDays size={16} /> My schedule</span></div>
            <div className={styles.previewHeading}><strong>Coming up next</strong><span>Your week, organised</span></div>
            <div className={styles.lesson}>
              <div className={styles.lessonDate}><span>MON</span><strong>04</strong></div>
              <div><strong>Combined Mathematics</strong><span>Functions &amp; graphs</span><small>4:00 PM – 6:00 PM</small></div>
              <span className={styles.lessonMode}>Online</span>
            </div>
            <div className={styles.lesson}>
              <div className={`${styles.lessonDate} ${styles.lessonDateGreen}`}><span>WED</span><strong>06</strong></div>
              <div><strong>Physics</strong><span>Motion in a straight line</span><small>3:30 PM – 5:30 PM</small></div>
              <span className={styles.lessonMode}>Physical</span>
            </div>
            <div className={styles.previewMaterial}><span className={styles.fileIcon}><FileText size={19} /></span><div><strong>Your next chapter starts here</strong><span>Notes, lessons, and assignments. Together.</span></div></div>
          </div>
        </div>
      </div>
      <div className={styles.floatingNote}><span><CheckCheck size={21} /></span><div><strong>A little more organised.</strong><small>A lot more room to grow.</small></div></div>
      <span className={styles.previewCaption}>A glimpse of your classroom. Sample content shown.</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className={styles.home}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <LandingHeader />
      <main id="main-content">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><span className={styles.eyebrowLine} /> FOR SRI LANKAN CLASSROOMS</span>
            <h1 id="hero-title">A clearer space<br />to teach.<br /><em>And to learn.</em></h1>
            <p>Bring your classes, materials, and assignments together. E-LearningLKA gives teachers and students a shared place to move forward.</p>
            <div className={styles.actions}><Link className={styles.primaryButton} href="/register">Create an account</Link><a className={styles.secondaryButton} href="#platform">Explore the platform</a></div>
            <div className={styles.heroFootnote}><ShieldCheck size={17} /><span>Your classroom. Teacher-approved access.</span></div>
          </div>
          <WorkspacePreview />
        </section>

        <div className={styles.benefitStrip}><div className={`${styles.container} ${styles.benefitInner}`}><span>A place for every part<br /><strong>of your learning day.</strong></span><span><CalendarDays size={21} /> Class schedules</span><span><BookOpen size={21} /> Learning materials</span><span><ClipboardCheck size={21} /> Assessments &amp; results</span></div></div>

        <section id="platform" className={`${styles.container} ${styles.section}`} aria-labelledby="platform-title">
          <div className={styles.sectionIntro}><div><span className={styles.eyebrow}>LESS SEARCHING. MORE LEARNING.</span><h2 id="platform-title">Everything has<br /><em>its place.</em></h2></div><p>From your next lesson to your latest result, keep the details that matter connected to your classroom.</p></div>
          <div className={styles.featureGrid}>{features.map(({ icon: Icon, title, text }) => <article key={title} className={styles.feature}><span className={styles.featureIcon}><Icon size={25} strokeWidth={1.6} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className={`${styles.container} ${styles.audienceSection}`} aria-label="For students and teachers">
          <article id="students" className={`${styles.audienceCard} ${styles.studentCard}`}>
            <span className={styles.audienceIcon}><GraduationCap size={29} strokeWidth={1.5} /></span>
            <span className={styles.eyebrow}>FOR STUDENTS</span><h2>Your next step,<br /><em>all in one place.</em></h2>
            <p>Spend more time understanding the lesson, with your classroom essentials close at hand.</p>
            <ul><li><Check size={18} /> Find classes and request to join</li><li><Check size={18} /> Access notes and class updates</li><li><Check size={18} /> Submit work and view published results</li></ul>
            <Link className={styles.outlineButton} href="/register">Start learning</Link>
          </article>
          <article id="teachers" className={`${styles.audienceCard} ${styles.teacherCard}`}>
            <span className={styles.audienceIcon}><Users size={29} strokeWidth={1.5} /></span>
            <span className={styles.eyebrow}>FOR TEACHERS</span><h2>More space for<br /><em>what you teach.</em></h2>
            <p>Give every class a home, from the first enrollment request to the final piece of feedback.</p>
            <ul><li><Check size={18} /> Create classes and manage student access</li><li><Check size={18} /> Share materials and schedule lessons</li><li><Check size={18} /> Set assessments, grade, and publish results</li></ul>
            <Link className={styles.outlineButton} href="/register">Start teaching</Link>
          </article>
        </section>

        <section id="how-it-works" className={`${styles.container} ${styles.section} ${styles.stepsSection}`} aria-labelledby="steps-title">
          <div className={styles.centerIntro}><span className={styles.eyebrow}>A SIMPLE START</span><h2 id="steps-title">From hello to <em>your classroom.</em></h2><p>Choose your role. Find your space. Make it yours.</p></div>
          <ol className={styles.steps}><li><span className={styles.stepIcon}><GraduationCap size={25} /></span><h3>Create your account</h3><p>Register as a student or teacher and complete your profile.</p></li><li><span className={styles.stepIcon}><BookOpen size={25} /></span><h3>Connect with your class</h3><p>Teachers create a class. Students request access and join after approval.</p></li><li><span className={styles.stepIcon}><Megaphone size={25} /></span><h3>Keep moving together</h3><p>Follow your schedule, share resources, and stay on top of your work.</p></li></ol>
        </section>

        <section className={styles.faqSection} aria-labelledby="faq-title"><div className={`${styles.container} ${styles.faqLayout}`}><div><span className={styles.eyebrow}>A FEW THINGS TO KNOW</span><h2 id="faq-title">Good questions.<br /><em>Clear answers.</em></h2><p>Getting started should feel simple.</p></div><div className={styles.faqList}>{questions.map(({ question, answer }) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>

        <section className={`${styles.container} ${styles.closing}`} aria-labelledby="closing-title"><span className={styles.closingMark}><GraduationCap size={35} strokeWidth={1.4} /></span><span className={styles.eyebrow}>YOUR CLASSROOM IS WAITING</span><h2 id="closing-title">Good things start<br /><em>with a little curiosity.</em></h2><p>Take the next step in your teaching or learning journey.</p><Link className={styles.primaryButton} href="/register">Join E-LearningLKA</Link><span className={styles.closingLogin}>Already part of the classroom? <Link href="/login">Log in</Link></span></section>
      </main>
      <LandingFooter />
    </div>
  );
}
