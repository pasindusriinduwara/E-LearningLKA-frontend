import Link from "next/link";
import { GraduationCap } from "lucide-react";
import styles from "@/app/home.module.css";

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerInner}`}>
        <Link className={styles.brand} href="/" aria-label="E-LearningLKA home">
          <span className={styles.brandMark}><GraduationCap size={22} /></span>
          <span>classroom<span className={styles.brandDot}>.</span><small>BY E-LEARNINGLKA</small></span>
        </Link>
        <p>A home for teaching. A space for learning.</p>
        <nav aria-label="Footer navigation">
          <Link href="/developer">Developer</Link>
          <Link href="/login">Log in</Link>
          <Link href="/register">Create an account</Link>
        </nav>
      </div>
      <div className={`${styles.container} ${styles.footerBottom}`}>
        <span>© {new Date().getFullYear()} E-LearningLKA</span>
        <span>Made for the way you learn.</span>
      </div>
    </footer>
  );
}
