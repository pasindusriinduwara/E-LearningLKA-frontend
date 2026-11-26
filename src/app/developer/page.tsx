import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen, Braces, Check, Cloud, CodeXml, Database,
  Globe, GraduationCap, Layers3, Mail, Server, ShieldCheck, UserRound,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { developerProfile } from "@/lib/developer";
import { getPublicSiteOrigin } from "@/lib/site";
import shared from "../home.module.css";
import styles from "./developer.module.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = `${developerProfile.name} | Developer of E-LearningLKA`;
  const description = `Meet ${developerProfile.name}, the developer behind E-LearningLKA. Explore the design, engineering, and technologies behind this individual full-stack project.`;
  const url = `${getPublicSiteOrigin()}/developer`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "E-LearningLKA", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

const responsibilities = [
  {
    icon: CodeXml,
    title: "The experience",
    text: "Student and teacher workspaces, recurring schedules, learning materials, and a responsive interface that brings the classroom together.",
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    icon: Database,
    title: "The system behind it",
    text: "REST APIs, enrollment approvals, timed assessments, grading, and persistent data, with access checks for each student and teacher.",
    tags: ["Java", "Spring Boot", "PostgreSQL", "Flyway"],
  },
  {
    icon: Cloud,
    title: "From code to classroom",
    text: "Containerised services, HTTPS deployment, automated checks, and persistent storage to take the application beyond local development.",
    tags: ["Docker", "AWS EC2", "Caddy", "GitHub Actions"],
  },
];

export default function DeveloperPage() {
  const hasContact = Boolean(developerProfile.email || developerProfile.links.length);

  return (
    <div className={`${shared.home} ${styles.page}`}>
      <a className={shared.skipLink} href="#developer-content">Skip to content</a>
      <LandingHeader activePage="developer" />

      <main id="developer-content">
        <section className={`${shared.container} ${styles.hero}`} aria-labelledby="developer-name">
          <div className={styles.heroCopy}>
            <span className={shared.eyebrow}><span className={shared.eyebrowLine} /> MEET THE DEVELOPER</span>
            <p className={styles.hello}>Behind every classroom, there’s a builder.</p>
            <h1 id="developer-name">Hi, I’m<br /><em>{developerProfile.name}.</em></h1>
            <p className={styles.introduction}>{developerProfile.introduction}</p>
            <div className={shared.actions}>
              <a className={shared.primaryButton} href="#the-project">Explore my work</a>
              <Link className={shared.secondaryButton} href="/">Visit the classroom</Link>
            </div>
          </div>

          <aside className={styles.profile} aria-label="Developer profile">
            <div className={styles.profileTop}><span>THE PERSON BEHIND THE PROJECT</span><CodeXml size={20} aria-hidden="true" /></div>
            <div className={styles.monogram} aria-hidden="true">{developerProfile.initials}<span><Braces size={22} /></span></div>
            <p className={styles.profileName}>{developerProfile.name}</p>
            <p className={styles.profileRole}>{developerProfile.role}</p>
            <div className={styles.profileProject}><span><GraduationCap size={22} /></span><div><strong>E-LearningLKA</strong><small>Individual full-stack project</small></div></div>
            {hasContact && (
              <nav className={styles.profileLinks} aria-label="Developer contact links">
                {developerProfile.email && <a href={`mailto:${developerProfile.email}`}><Mail size={18} /> Email me</a>}
                {developerProfile.links.map((link) => {
                  const Icon = link.kind === "github" ? CodeXml : link.kind === "linkedin" ? UserRound : Globe;
                  return <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"><Icon size={18} />{link.label}<span className={styles.srOnly}> (opens in a new tab)</span></a>;
                })}
              </nav>
            )}
          </aside>
        </section>

        <section id="the-project" className={styles.projectSection} aria-labelledby="project-title">
          <div className={`${shared.container} ${styles.projectLayout}`}>
            <div>
              <span className={shared.eyebrow}>THE PROJECT</span>
              <h2 id="project-title">One platform.<br /><em>Both sides of the classroom.</em></h2>
            </div>
            <div className={styles.projectCopy}>
              <p>{developerProfile.bio}</p>
              <p>The platform connects class management, learning resources, assignments, and results, giving students and teachers a shared place to organise their work.</p>
              <dl className={styles.facts}>
                <div><dt>Project</dt><dd>Learning management system</dd></div>
                <div><dt>Built for</dt><dd>Students &amp; teachers</dd></div>
                <div><dt>My contribution</dt><dd>Design, development &amp; deployment</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className={`${shared.container} ${styles.workSection}`} aria-labelledby="work-title">
          <div className={styles.sectionHeading}><div><span className={shared.eyebrow}>MY WORK ON E-LEARNINGLKA</span><h2 id="work-title">From the first screen<br /><em>to the running system.</em></h2></div><p>One connected project, with care for the details at every layer.</p></div>
          <div className={styles.workGrid}>
            {responsibilities.map(({ icon: Icon, title, text, tags }) => (
              <article key={title} className={styles.workItem}>
                <span className={styles.workIcon}><Icon size={27} strokeWidth={1.6} /></span>
                <h3>{title}</h3><p>{text}</p>
                <ul className={styles.tags} aria-label={`${title} technologies`}>{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className={`${shared.container} ${styles.craft}`} aria-labelledby="craft-title">
          <div className={styles.craftIntro}><span className={shared.eyebrow}>MORE THAN THE INTERFACE</span><h2 id="craft-title">The details<br /><em>behind the experience.</em></h2><p>A useful application also needs clear access rules, reliable data, and a way to verify that the pieces work together.</p></div>
          <ul className={styles.craftList}>
            <li><ShieldCheck size={24} strokeWidth={1.5} /><div><h3>Access with intention</h3><p>Role-based permissions, teacher-approved enrollment, and authenticated access to private answer files.</p></div></li>
            <li><Layers3 size={24} strokeWidth={1.5} /><div><h3>A connected learning workflow</h3><p>From joining a class to submitting an assessment and receiving a published result.</p></div></li>
            <li><Server size={24} strokeWidth={1.5} /><div><h3>Built to run beyond my machine</h3><p>Docker services, persistent volumes, database migrations, and an AWS deployment with HTTPS.</p></div></li>
            <li><Check size={24} strokeWidth={1.5} /><div><h3>Checked across the stack</h3><p>Frontend and backend tests, browser acceptance checks, and GitHub Actions workflows.</p></div></li>
          </ul>
        </section>

        <section className={`${shared.container} ${styles.closing}`} aria-labelledby="explore-title"><BookOpen size={32} strokeWidth={1.5} /><h2 id="explore-title">See the project<br /><em>from the classroom.</em></h2><p>Explore the platform built for students and teachers.</p><Link className={shared.primaryButton} href="/">Explore E-LearningLKA</Link></section>
      </main>
      <LandingFooter />
    </div>
  );
}
