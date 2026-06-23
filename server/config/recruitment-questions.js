/**
 * Role-specific question definitions for the recruitment system.
 * Each role has an array of question objects rendered dynamically in the multi-step form.
 * Questions are code-defined and versioned with deploys (not stored in DB).
 */

export const ROLES = {
  'DSA Trainer': {
    label: 'DSA Trainer',
    icon: 'Code',
    description:
      'Teach and mentor students in Data Structures & Algorithms. Conduct practice sessions, create problem sets, and guide competitive programming aspirants.',
    color: 'emerald',
    questions: [
      {
        id: 'javaCppConfidence',
        type: 'range',
        label: 'Rate your Java programming skills (1-10)',
        required: true,
        min: 1,
        max: 10,
      },
      {
        id: 'strongTopics',
        type: 'checkbox',
        label: 'Which DSA topics are you strongest in?',
        required: true,
        options: [
          'Arrays & Strings',
          'Linked Lists',
          'Trees & Graphs',
          'Dynamic Programming',
          'Recursion & Backtracking',
          'Sorting & Searching',
          'Greedy Algorithms',
          'Tries & Segment Trees',
        ],
      },
      {
        id: 'teachingExperience',
        type: 'textarea',
        label: 'Have you mentored or taught students before? Share your experience.',
        required: false,
        placeholder: 'Describe any teaching, mentoring, or workshop experience...',
      },
      {
        id: 'whyDsaTrainer',
        type: 'textarea',
        label: 'Why do you want to be a DSA Trainer at Coding Nexus?',
        required: true,
        placeholder: 'Share your motivation and what you hope to contribute...',
      },
    ],
  },

  'Content Team': {
    label: 'Content Team',
    icon: 'Camera',
    description:
      'Create engaging content for Coding Nexus — video editing, photography, social media management, and event coverage.',
    color: 'pink',
    questions: [
      {
        id: 'contentTools',
        type: 'checkbox',
        label: 'What content creation tools are you proficient in?',
        required: true,
        options: [
          'Adobe Premiere Pro',
          'Final Cut Pro',
          'DaVinci Resolve',
          'Canva',
          'Photoshop',
          'Lightroom',
          'After Effects',
          'CapCut',
        ],
      },
      {
        id: 'portfolioLinks',
        type: 'text',
        label: 'Share links to your previous work (Instagram, YouTube, portfolio, etc.)',
        required: false,
        placeholder: 'Paste links separated by commas...',
      },
      {
        id: 'promotionIdeas',
        type: 'textarea',
        label: 'How would you promote Coding Nexus events and activities?',
        required: true,
        placeholder: 'Share your ideas for promoting events...',
      },
      {
        id: 'socialMediaExp',
        type: 'textarea',
        label: 'Do you have experience managing social media pages or channels?',
        required: false,
        placeholder: 'Describe any social media management experience...',
      },
      {
        id: 'contentTypeInterest',
        type: 'select',
        label: 'What type of content interests you most?',
        required: true,
        options: [
          'Short-form Reels/Shorts',
          'Long-form Videos',
          'Posters & Graphics',
          'Blogs & Articles',
          'Photography',
          'All of the above',
        ],
      },
      {
        id: 'whyContentTeam',
        type: 'textarea',
        label: 'Why do you want to join the Content Team?',
        required: true,
        placeholder: 'Share your motivation...',
      },
    ],
  },

  'Cinematography Team': {
    label: 'Cinematography Team',
    icon: 'Video',
    description:
      'Capture and produce high-quality video content for events, workshops, and promotional material.',
    color: 'violet',
    questions: [
      {
        id: 'equipment',
        type: 'checkbox',
        label: 'What equipment do you have access to?',
        required: true,
        options: [
          'DSLR Camera',
          'Mirrorless Camera',
          'Smartphone (High-end)',
          'Gimbal/Stabilizer',
          'Tripod',
          'External Mic',
          'Lighting Kit',
          'Drone',
        ],
      },
      {
        id: 'workLinks',
        type: 'text',
        label: 'Share links to your cinematography/videography work',
        required: true,
        placeholder: 'YouTube, Vimeo, Google Drive links...',
      },
      {
        id: 'editingSkills',
        type: 'range',
        label: 'Rate your video editing skills (1-10)',
        required: true,
        min: 1,
        max: 10,
      },
      {
        id: 'editingSoftware',
        type: 'checkbox',
        label: 'What editing software do you use?',
        required: true,
        options: ['Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'CapCut', 'After Effects', 'Other'],
      },
      {
        id: 'eventExperience',
        type: 'textarea',
        label: 'Do you have experience shooting events? Describe.',
        required: false,
        placeholder: 'Tell us about events you have covered...',
      },
      {
        id: 'whyCinematography',
        type: 'textarea',
        label: 'Why do you want to join the Cinematography Team?',
        required: true,
        placeholder: 'Share your motivation...',
      },
    ],
  },

  'Design Team': {
    label: 'Design Team',
    icon: 'Palette',
    description:
      'Create stunning visuals — UI/UX for the platform, posters, banners, and branding materials for Coding Nexus.',
    color: 'indigo',
    questions: [
      {
        id: 'designTools',
        type: 'checkbox',
        label: 'What design tools are you proficient in?',
        required: true,
        options: [
          'Figma',
          'Adobe Photoshop',
          'Adobe Illustrator',
          'Canva',
          'Adobe XD',
          'Sketch',
          'Affinity Designer',
          'Other',
        ],
      },
      {
        id: 'portfolioLink',
        type: 'text',
        label: 'Share your design portfolio / Behance / Dribbble link',
        required: true,
        placeholder: 'https://...',
      },
      {
        id: 'designRating',
        type: 'range',
        label: 'Rate your design skills (1-10)',
        required: true,
        min: 1,
        max: 10,
      },
      {
        id: 'collegeDesignExp',
        type: 'textarea',
        label: 'Have you created designs for college events or clubs before? Describe.',
        required: false,
        placeholder: 'Share examples of college-related design work...',
      },
      {
        id: 'designFocus',
        type: 'select',
        label: 'Which area interests you more?',
        required: true,
        options: ['UI/UX Design', 'Graphic Design', 'Both', 'Branding & Identity'],
      },
      {
        id: 'whyDesignTeam',
        type: 'textarea',
        label: 'Why do you want to join the Design Team?',
        required: true,
        placeholder: 'Share your motivation...',
      },
    ],
  },

  'Technical Team': {
    label: 'Technical Team',
    icon: 'Terminal',
    description:
      'Build and maintain the Coding Nexus platform. Work on full-stack features, automation, and technical infrastructure.',
    color: 'cyan',
    questions: [
      {
        id: 'programmingSkills',
        type: 'checkbox',
        label: 'What programming languages/frameworks do you know?',
        required: true,
        options: [
          'JavaScript',
          'Python',
          'Java',
          'C++',
          'React',
          'Node.js',
          'TypeScript',
          'SQL',
          'MongoDB',
          'Tailwind CSS',
          'Next.js',
          'Other',
        ],
      },
      {
        id: 'githubProfile',
        type: 'text',
        label: 'Share your GitHub profile link',
        required: true,
        placeholder: 'https://github.com/yourusername',
      },
      {
        id: 'techRating',
        type: 'range',
        label: 'Rate your technical skills (1-10)',
        required: true,
        min: 1,
        max: 10,
      },
      {
        id: 'projectLinks',
        type: 'textarea',
        label: 'Share links to your projects (GitHub repos, live demos)',
        required: false,
        placeholder: 'Paste links separated by commas...',
      },
      {
        id: 'techChallenge',
        type: 'textarea',
        label: "Describe a technical challenge you've overcome and what you learned.",
        required: true,
        placeholder: 'Describe the problem, your approach, and the outcome...',
      },
      {
        id: 'whyTechnicalTeam',
        type: 'textarea',
        label: 'Why do you want to join the Technical Team?',
        required: true,
        placeholder: 'Share your motivation...',
      },
    ],
  },
};

/** Returns the question set for a given role key, or null if not found. */
export function getRoleQuestions(roleKey) {
  return ROLES[roleKey]?.questions || null;
}

/** Returns just the list of role keys that exist. */
export function getRoleKeys() {
  return Object.keys(ROLES);
}

/** Common fields shared across ALL roles. */
export const COMMON_FIELDS = [
  { id: 'fullName', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
  { id: 'moodleId', type: 'text', label: 'Moodle ID', required: true, placeholder: 'e.g., 12345' },
  { id: 'whatsappNo', type: 'tel', label: 'WhatsApp Number', required: true, placeholder: '+91 98765 43210' },
  { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' },
  { id: 'branch', type: 'text', label: 'Branch', required: true, placeholder: 'e.g., Computer Engineering' },
  { id: 'year', type: 'select', label: 'Year', required: true, options: ['FE', 'SE', 'TE', 'BE'] },
];
