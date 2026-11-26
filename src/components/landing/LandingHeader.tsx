"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "@/app/home.module.css";

export function LandingHeader({ activePage }: { activePage?: "developer" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const dashboard = user?.role === "TEACHER" ? "/teacher/dashboard" : "/dashboard";
  function closeMenu() { setMenuOpen(false); }

  return (
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link className={styles.brand} href="/" aria-label="E-LearningLKA home" onClick={closeMenu}><span className={styles.brandMark}><GraduationCap size={24} /></span><span>classroom<span className={styles.brandDot}>.</span><small>BY E-LEARNINGLKA</small></span></Link>
        <button ref={menuButton} className={styles.menuToggle} type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        <nav id="landing-navigation" className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Main navigation" onKeyDown={(event) => { if (event.key === "Escape") { closeMenu(); menuButton.current?.focus(); } }}>
          <div className={styles.navLinks}><Link href="/#students" onClick={closeMenu}>For students</Link><Link href="/#teachers" onClick={closeMenu}>For teachers</Link><Link href="/#how-it-works" onClick={closeMenu}>How it works</Link><Link href="/developer" aria-current={activePage === "developer" ? "page" : undefined} onClick={closeMenu}>Developer</Link></div>
          <div className={styles.navActions}>{user ? <Link className={styles.smallPrimaryButton} href={dashboard} onClick={closeMenu}>Go to dashboard</Link> : <><Link className={styles.loginLink} href="/login" onClick={closeMenu}>Log in</Link><Link className={styles.smallPrimaryButton} href="/register" onClick={closeMenu}>Get started</Link></>}</div>
        </nav>
      </div>
    </header>
  );
}
