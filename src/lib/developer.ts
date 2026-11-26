// Public profile content only. Add contact details here only if you want them
// visible to everyone; never put account credentials or private keys here.
type ProfileLink = {
  label: string;
  href: string;
  kind: "github" | "linkedin" | "website";
};

type DeveloperProfile = {
  name: string;
  initials: string;
  role: string;
  introduction: string;
  bio: string;
  email: string | null;
  links: ProfileLink[];
};

export const developerProfile: DeveloperProfile = {
  name: "Pasindu Sri Induwara",
  initials: "PSI",
  role: "Project creator & full-stack developer",
  introduction:
    "I build the interfaces, APIs, and systems that bring E-LearningLKA together — a shared learning space for students and teachers.",
  bio:
    "E-LearningLKA is my individual full-stack project. My work covers the student and teacher experience, backend services, database design, testing, and deployment.",
  email: "ipasindusri@gmail.com",
  links: [
    {
      label: "My portfolio",
      href: "https://pasindu-portfolio-gamma.vercel.app/",
      kind: "website",
    },
  ],
};
